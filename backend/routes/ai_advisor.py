from flask import Blueprint, request, jsonify, g
import os
import json
import re
from datetime import datetime, timedelta
import requests
from database import get_db
from auth import jwt_required

ai_advisor_bp = Blueprint("ai_advisor", __name__, url_prefix="/api/ai")

DISCRETIONARY_CATEGORIES = {"Food & Dining", "Entertainment", "Shopping", "Subscriptions", "Personal Care", "Miscellaneous"}
ESSENTIAL_CATEGORIES = {"Housing", "Groceries", "Utilities", "Transportation", "Healthcare", "Education"}

def fetch_financial_context(user_id):
    """Gathers comprehensive, real-time metrics from the database for contextual reasoning."""
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now()
    cur_ym = f"{now.year:04d}-{now.month:02d}"
    prev_m = 12 if now.month == 1 else now.month - 1
    prev_y = now.year - 1 if now.month == 1 else now.year
    prev_ym = f"{prev_y:04d}-{prev_m:02d}"

    # User profile
    cursor.execute("SELECT currency, full_name, alert_threshold FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    currency = user["currency"] if user else "₹"
    user_name = user["full_name"] if user else "User"

    # Current month income & expenses
    cursor.execute("""
        SELECT type, COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND date LIKE ?
        GROUP BY type
    """, (user_id, f"{cur_ym}-%"))
    cur_totals = {r["type"]: float(r["total"]) for r in cursor.fetchall()}
    cur_income = cur_totals.get("income", 0.0)
    cur_expense = cur_totals.get("expense", 0.0)
    cur_savings = cur_income - cur_expense
    cur_savings_rate = (cur_savings / cur_income * 100) if cur_income > 0 else 0.0

    # Previous month totals
    cursor.execute("""
        SELECT type, COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND date LIKE ?
        GROUP BY type
    """, (user_id, f"{prev_ym}-%"))
    prev_totals = {r["type"]: float(r["total"]) for r in cursor.fetchall()}
    prev_income = prev_totals.get("income", 0.0)
    prev_expense = prev_totals.get("expense", 0.0)

    # Current month category breakdown
    cursor.execute("""
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        GROUP BY category
        ORDER BY total DESC
    """, (user_id, f"{cur_ym}-%"))
    cur_cat_rows = cursor.fetchall()
    cur_categories = [{
        "category": r["category"],
        "total": float(r["total"]),
        "count": r["count"],
        "is_discretionary": r["category"] in DISCRETIONARY_CATEGORIES
    } for r in cur_cat_rows]

    # Highest individual transaction this month
    cursor.execute("""
        SELECT category, amount, description, date
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        ORDER BY amount DESC LIMIT 1
    """, (user_id, f"{cur_ym}-%"))
    top_tx = cursor.fetchone()
    top_expense_tx = dict(top_tx) if top_tx else None

    # Discretionary vs Essential spending
    discretionary_total = sum(c["total"] for c in cur_categories if c["is_discretionary"])
    essential_total = sum(c["total"] for c in cur_categories if not c["is_discretionary"])

    # Daily burn rate & expense projection
    days_passed = max(now.day, 1)
    # Estimate days in month roughly 30
    days_in_month = 30
    daily_burn_rate = cur_expense / days_passed
    projected_monthly_expense = daily_burn_rate * days_in_month
    projected_savings = cur_income - projected_monthly_expense

    # Active budgets
    cursor.execute("""
        SELECT b.category, b.allocated_amount, COALESCE(SUM(t.amount), 0) as spent
        FROM budgets b
        LEFT JOIN transactions t ON t.user_id = b.user_id 
            AND t.category = b.category 
            AND t.type = 'expense'
            AND t.date LIKE ?
        WHERE b.user_id = ? AND b.year = ? AND b.month = ?
        GROUP BY b.category, b.allocated_amount
    """, (f"{cur_ym}-%", user_id, now.year, now.month))
    budgets = [{
        "category": r["category"],
        "allocated": float(r["allocated_amount"]),
        "spent": float(r["spent"]),
        "status": "exceeded" if float(r["spent"]) > float(r["allocated_amount"]) else "normal"
    } for r in cursor.fetchall()]

    conn.close()

    return {
        "user_name": user_name,
        "currency": currency,
        "period": cur_ym,
        "current_income": cur_income,
        "current_expense": cur_expense,
        "current_savings": cur_savings,
        "current_savings_rate": cur_savings_rate,
        "prev_income": prev_income,
        "prev_expense": prev_expense,
        "categories": cur_categories,
        "top_expense_tx": top_expense_tx,
        "discretionary_total": discretionary_total,
        "essential_total": essential_total,
        "daily_burn_rate": daily_burn_rate,
        "projected_monthly_expense": projected_monthly_expense,
        "projected_savings": projected_savings,
        "budgets": budgets
    }

def generate_heuristic_response(prompt, context):
    """
    Intelligent deterministic financial assistant engine.
    Accurately and dynamically parses user intentions, queries live financial stats,
    clearly differentiates ACTUAL DATA from PROJECTED ESTIMATES, and provides actionable recommendations.
    """
    p_lower = prompt.lower()
    c = context["currency"]
    
    # 1. "Where did I spend the most money?"
    if any(q in p_lower for q in ["where did i spend the most", "biggest expense", "highest spending", "top spending", "most money"]):
        if not context["categories"]:
            return f"You don't have any recorded expenses for the current month yet."
        
        top_cat = context["categories"][0]
        top_tx = context["top_expense_tx"]

        res = f"### 📊 Spending Analysis for {datetime.now().strftime('%B %Y')}\n\n"
        res += f"**[ACTUAL DATA - Verified]**\n"
        res += f"- **Highest Spending Category:** **{top_cat['category']}** at **{c}{top_cat['total']:,.2f}** "
        if context['current_expense'] > 0:
            res += f"({round(top_cat['total'] / context['current_expense'] * 100, 1)}% of your total expenses).\n"
        
        if top_tx:
            res += f"- **Largest Single Transaction:** **{c}{top_tx['amount']:,.2f}** for *'{top_tx['description']}'* ({top_tx['category']}) on {top_tx['date']}.\n\n"

        if len(context["categories"]) > 1:
            res += f"**Top 3 Spending Categories:**\n"
            for i, cat in enumerate(context["categories"][:3], 1):
                pct = round((cat['total'] / context['current_expense'] * 100), 1) if context['current_expense'] > 0 else 0
                res += f"{i}. **{cat['category']}**: {c}{cat['total']:,.2f} ({pct}%)\n"

        if top_cat["is_discretionary"]:
            res += f"\n💡 **Optimization Tip:** Your highest spending is in **{top_cat['category']}**, which is a discretionary category. Setting a strict monthly cap could save you up to {c}{round(top_cat['total'] * 0.2, 0):,.0f}!"
        return res

    # 2. "How much did I save this month?" / "Savings"
    if any(q in p_lower for q in ["how much did i save", "savings this month", "my savings", "saved this month", "what is my saving"]):
        inc = context["current_income"]
        exp = context["current_expense"]
        sav = context["current_savings"]
        rate = context["current_savings_rate"]

        res = f"### 💰 Savings Report for {datetime.now().strftime('%B %Y')}\n\n"
        res += f"**[ACTUAL DATA - Verified]**\n"
        res += f"- **Total Inflow (Income):** {c}{inc:,.2f}\n"
        res += f"- **Total Outflow (Expenses):** {c}{exp:,.2f}\n"
        if sav >= 0:
            res += f"- **Net Savings:** **+{c}{sav:,.2f}**\n"
            res += f"- **Current Savings Rate:** **{rate:.1f}%** (Target healthy benchmark: 20-30%)\n\n"
        else:
            res += f"- **Deficit:** **-{c}{abs(sav):,.2f}** (Expenses exceed income by {c}{abs(sav):,.2f})\n\n"

        res += f"**[PROJECTED ESTIMATE - Forecast]**\n"
        proj_exp = context["projected_monthly_expense"]
        proj_sav = context["projected_savings"]
        res += f"- **Projected Month-End Expenses:** ~{c}{proj_exp:,.2f}\n"
        res += f"- **Projected Net Savings:** ~{c}{proj_sav:,.2f}\n\n"

        if sav > 0:
            res += "🎯 **Verdict:** Great job staying positive this month! Keep your discretionary spending controlled to hit your month-end goal."
        else:
            res += "⚠️ **Alert:** You are currently in a cash flow deficit. Review non-essential expenses like Shopping and Dining to restore positive cash flow."
        return res

    # 3. "Can I save ₹5,000 next month?" or target amount saving feasibility
    target_match = re.search(r'(?:save|target)\s*(?:₹|\$|€|rs\.?|inr)?\s*([0-9,]+)', p_lower)
    if "save" in p_lower and ("next month" in p_lower or "can i" in p_lower or "target" in p_lower or target_match):
        target_amt = 5000.0
        if target_match:
            try:
                target_amt = float(target_match.group(1).replace(",", ""))
            except ValueError:
                target_amt = 5000.0

        inc = context["current_income"] if context["current_income"] > 0 else context["prev_income"]
        cur_exp = context["current_expense"]
        disc_spending = context["discretionary_total"]
        cur_sav = context["current_savings"]

        max_allowable_expense = max(0, inc - target_amt)

        res = f"### 🎯 Savings Feasibility Analysis: Target {c}{target_amt:,.2f}\n\n"
        
        # Check feasibility
        if cur_sav >= target_amt:
            res += f"✅ **Yes, absolutely!** You are already on track.\n\n"
            res += f"**[ACTUAL DATA - Current Baseline]**\n"
            res += f"- Current Monthly Income: **{c}{inc:,.2f}**\n"
            res += f"- Current Net Savings: **{c}{cur_sav:,.2f}**\n"
            res += f"- Required Buffer: You already exceed your target by **+{c}{(cur_sav - target_amt):,.2f}**.\n\n"
            res += f"**[ACTION PLAN]**\n"
            res += f"1. Keep total monthly expenses capped below **{c}{max_allowable_expense:,.2f}**.\n"
            res += f"2. Automate a transfer of **{c}{target_amt:,.2f}** to your savings/investment account on the 1st of the month."
        elif (cur_sav + disc_spending) >= target_amt:
            deficit = target_amt - cur_sav
            res += f"⚠️ **Yes, with disciplined adjustments.**\n\n"
            res += f"**[ACTUAL DATA - Current Baseline]**\n"
            res += f"- Current Net Savings: **{c}{cur_sav:,.2f}**\n"
            res += f"- Target Savings: **{c}{target_amt:,.2f}** (Shortfall: {c}{deficit:,.2f})\n"
            res += f"- Discretionary Spending Identified: **{c}{disc_spending:,.2f}** (Dining, Shopping, Entertainment)\n\n"
            res += f"**[PROJECTED ESTIMATE - Path to Goal]**\n"
            cut_pct = min(100, round((deficit / disc_spending * 100), 1)) if disc_spending > 0 else 50
            res += f"To save **{c}{target_amt:,.2f}**, you need to trim **{cut_pct}%** ({c}{deficit:,.2f}) from discretionary categories:\n"
            for cat in [c for c in context["categories"] if c["is_discretionary"]][:3]:
                rec_cut = round(cat['total'] * 0.25, 0)
                res += f"- Cut **{cat['category']}** by ~{c}{rec_cut:,.0f}\n"
        else:
            res += f"❌ **Not realistically feasible with current income and fixed expenses.**\n\n"
            res += f"- Target: {c}{target_amt:,.2f}\n"
            res += f"- Income: {c}{inc:,.2f} | Essential Living Expenses: {c}{context['essential_total']:,.2f}\n"
            res += f"- Recommendation: Increase income through freelance work or renegotiate fixed costs."

        return res

    # 4. "Identify unnecessary spending" / "Where can I cut costs?"
    if any(q in p_lower for q in ["unnecessary", "cut cost", "wasteful", "discretionary", "reduce expense", "spend less", "cut spending"]):
        disc = [c for c in context["categories"] if c["is_discretionary"]]
        total_disc = context["discretionary_total"]

        res = f"### 🔍 Discretionary Spending Audit\n\n"
        res += f"**[ACTUAL DATA - Non-Essential Outflows]**\n"
        res += f"You have spent a total of **{c}{total_disc:,.2f}** on discretionary categories this month:\n\n"

        potential_monthly_savings = 0.0
        for item in disc:
            savings_potential = round(item["total"] * 0.30, 2)
            potential_monthly_savings += savings_potential
            res += f"- **{item['category']}**: {c}{item['total']:,.2f} (Potential 30% reduction: ~{c}{savings_potential:,.2f})\n"

        res += f"\n**[PROJECTED ESTIMATE - Potential Savings]**\n"
        res += f"- **Immediate Monthly Savings:** ~**{c}{potential_monthly_savings:,.2f}**\n"
        res += f"- **Projected Annual Wealth Creation:** ~**{c}{(potential_monthly_savings * 12):,.2f}**\n\n"
        res += f"💡 **Recommended Actions:**\n"
        res += f"1. Audit recurring subscriptions (Netflix, gym, cloud) for unused services.\n"
        res += f"2. Set a weekend dining cap using the FinAI Budgeting tool.\n"
        res += f"3. Implement a 48-hour cooling rule for non-essential online shopping."
        return res

    # 5. "Predict monthly expenses" / "Forecast"
    if any(q in p_lower for q in ["predict", "forecast", "projection", "estimate", "future expense", "how much will i spend"]):
        res = f"### 📈 Predictive Expense Forecast for {datetime.now().strftime('%B %Y')}\n\n"
        res += f"**[ACTUAL DATA - Current Month to Date]**\n"
        res += f"- Verified Outflow: **{c}{context['current_expense']:,.2f}**\n"
        res += f"- Current Daily Burn Rate: **{c}{context['daily_burn_rate']:,.2f}/day**\n\n"

        res += f"**[PROJECTED ESTIMATE - Algorithmic Forecast]**\n"
        res += f"- **Projected Total Month-End Expenses:** **{c}{context['projected_monthly_expense']:,.2f}**\n"
        res += f"- **Estimated Month-End Net Savings:** **{c}{context['projected_savings']:,.2f}**\n"
        
        if context['prev_expense'] > 0:
            diff = context['projected_monthly_expense'] - context['prev_expense']
            diff_pct = (diff / context['prev_expense']) * 100
            dir_str = "higher" if diff > 0 else "lower"
            res += f"- **Comparison to Last Month:** Projected to be **{abs(diff_pct):.1f}% {dir_str}** than previous month ({c}{context['prev_expense']:,.2f}).\n\n"

        res += f"*(Note: Estimates assume consistent daily expenditure patterns for the remainder of the calendar month.)*"
        return res

    # 6. Default comprehensive financial summary and recommendations
    res = f"### 🤖 FinAI Financial Health Analysis\n\n"
    res += f"Hello {context['user_name']}! Here is an overview of your current financial standing:\n\n"
    res += f"**[ACTUAL DATA]**\n"
    res += f"- **Total Income:** {c}{context['current_income']:,.2f}\n"
    res += f"- **Total Expenses:** {c}{context['current_expense']:,.2f}\n"
    res += f"- **Net Savings:** {c}{context['current_savings']:,.2f} ({context['current_savings_rate']:.1f}% savings rate)\n"
    if context["categories"]:
        res += f"- **Top Spending Area:** {context['categories'][0]['category']} ({c}{context['categories'][0]['total']:,.2f})\n"

    res += f"\n**[PROJECTED ESTIMATES]**\n"
    res += f"- Projected Monthly Total Outflow: ~{c}{context['projected_monthly_expense']:,.2f}\n"
    res += f"- Projected End-of-Month Reserve: ~{c}{context['projected_savings']:,.2f}\n\n"

    res += f"💬 **Quick questions you can ask me:**\n"
    res += f"- *\"Where did I spend the most money?\"*\n"
    res += f"- *\"How much did I save this month?\"*\n"
    res += f"- *\"Can I save ₹5,000 next month?\"*\n"
    res += f"- *\"Identify unnecessary spending\"*\n"
    res += f"- *\"Predict my monthly expenses\"*"
    return res

def call_gemini_api(prompt, context):
    """Calls Gemini API using standard REST endpoint when GEMINI_API_KEY is supplied."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    system_instruction = f"""
    You are FinAI, an expert senior financial advisor and personal finance assistant.
    You analyze the user's actual financial data provided in the context below.
    Rules:
    1. Base all facts and numbers strictly on the provided financial context.
    2. ALWAYS clearly distinguish between ACTUAL DATA (verified transactions in database) and PROJECTED ESTIMATES (forecasts or hypothetical goals) by explicitly tagging them e.g. [ACTUAL DATA] and [PROJECTED ESTIMATE].
    3. User currency is: {context['currency']}.
    4. Provide actionable, supportive, clear, and realistic advice.
    
    Current User Context:
    - User Name: {context['user_name']}
    - Current Month Income: {context['currency']}{context['current_income']}
    - Current Month Expenses: {context['currency']}{context['current_expense']}
    - Current Month Net Savings: {context['currency']}{context['current_savings']} (Rate: {context['current_savings_rate']}%)
    - Discretionary Outflow: {context['currency']}{context['discretionary_total']}
    - Essential Outflow: {context['currency']}{context['essential_total']}
    - Top Categories: {json.dumps(context['categories'][:5])}
    - Daily Burn Rate: {context['currency']}{context['daily_burn_rate']:.2f}
    - Projected Month-End Expenses: {context['currency']}{context['projected_monthly_expense']:.2f}
    - Active Budgets: {json.dumps(context['budgets'])}
    """

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"Context: {system_instruction}\n\nUser Question: {prompt}"}]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as e:
        # Fallback to deterministic engine
        print(f"Gemini API request error: {e}")
        return None

    return None

@ai_advisor_bp.route("/chat", methods=["POST"])
@jwt_required
def chat():
    user_id = g.user_id
    data = request.get_json() or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    # 1. Fetch live contextual data
    context = fetch_financial_context(user_id)

    # 2. Try Gemini API first if configured; fallback to intelligent deterministic engine
    ai_response = call_gemini_api(message, context)
    mode = "gemini_llm"
    if not ai_response:
        ai_response = generate_heuristic_response(message, context)
        mode = "heuristic_ai"

    # 3. Store messages in database
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ai_messages (user_id, role, content, metadata_json)
        VALUES (?, 'user', ?, ?)
    """, (user_id, message, json.dumps({"source": "user_input"})))
    
    metadata = {
        "mode": mode,
        "currency": context["currency"],
        "savings": context["current_savings"],
        "projected_expense": round(context["projected_monthly_expense"], 2)
    }
    cursor.execute("""
        INSERT INTO ai_messages (user_id, role, content, metadata_json)
        VALUES (?, 'assistant', ?, ?)
    """, (user_id, ai_response, json.dumps(metadata)))
    conn.commit()
    conn.close()

    return jsonify({
        "response": ai_response,
        "metadata": metadata,
        "timestamp": datetime.now().isoformat()
    }), 200

@ai_advisor_bp.route("/messages", methods=["GET"])
@jwt_required
def get_messages():
    user_id = g.user_id
    limit = request.args.get("limit", default=50, type=int)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, role, content, metadata_json, created_at
        FROM ai_messages
        WHERE user_id = ?
        ORDER BY created_at ASC, id ASC
        LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()

    messages = []
    for r in rows:
        meta = {}
        try:
            meta = json.loads(r["metadata_json"]) if r["metadata_json"] else {}
        except Exception:
            pass
        messages.append({
            "id": r["id"],
            "role": r["role"],
            "content": r["content"],
            "metadata": meta,
            "created_at": r["created_at"]
        })

    return jsonify({"messages": messages}), 200

@ai_advisor_bp.route("/messages", methods=["DELETE"])
@jwt_required
def clear_messages():
    user_id = g.user_id
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ai_messages WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Conversation history cleared successfully"}), 200
