from flask import Blueprint, request, jsonify, g
import os
import json
import re
from datetime import datetime, timedelta
import requests
from database import get_db
from auth import jwt_required

ai_advisor_bp = Blueprint("ai_advisor", __name__, url_prefix="/api/ai")

DISCRETIONARY_CATEGORIES = {"Food", "Entertainment", "Shopping", "Other expenses"}
ESSENTIAL_CATEGORIES = {"Rent", "Groceries", "Bills", "Transportation", "Healthcare", "Education"}

def fetch_financial_context(user_id):
    """Gathers real-time metrics strictly for the authenticated user from SQLite."""
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

    # Total all-time transaction count for user
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,))
    all_time_count = cursor.fetchone()[0]

    # Current month income & expenses
    cursor.execute("""
        SELECT transaction_type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND transaction_date LIKE ?
        GROUP BY transaction_type
    """, (user_id, f"{cur_ym}-%"))
    cur_totals = {r["transaction_type"]: float(r["total"]) for r in cursor.fetchall()}
    cur_income = cur_totals.get("income", 0.0)
    cur_expense = cur_totals.get("expense", 0.0)
    cur_savings = cur_income - cur_expense
    cur_savings_rate = (cur_savings / cur_income * 100) if cur_income > 0 else 0.0

    # Previous month totals
    cursor.execute("""
        SELECT transaction_type, COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND transaction_date LIKE ?
        GROUP BY transaction_type
    """, (user_id, f"{prev_ym}-%"))
    prev_totals = {r["transaction_type"]: float(r["total"]) for r in cursor.fetchall()}
    prev_income = prev_totals.get("income", 0.0)
    prev_expense = prev_totals.get("expense", 0.0)

    # Current month category breakdown
    cursor.execute("""
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND transaction_type = 'expense' AND transaction_date LIKE ?
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
        SELECT category, amount, description, transaction_date
        FROM transactions
        WHERE user_id = ? AND transaction_type = 'expense' AND transaction_date LIKE ?
        ORDER BY amount DESC LIMIT 1
    """, (user_id, f"{cur_ym}-%"))
    top_tx = cursor.fetchone()
    top_expense_tx = dict(top_tx) if top_tx else None

    # Discretionary vs Essential spending
    discretionary_total = sum(c["total"] for c in cur_categories if c["is_discretionary"])
    essential_total = sum(c["total"] for c in cur_categories if not c["is_discretionary"])

    # Daily burn rate & expense projection
    days_passed = max(now.day, 1)
    days_in_month = 30
    daily_burn_rate = cur_expense / days_passed if cur_expense > 0 else 0.0
    projected_monthly_expense = daily_burn_rate * days_in_month
    projected_savings = cur_income - projected_monthly_expense

    # Active budgets for current month
    cursor.execute("""
        SELECT b.category, b.monthly_limit as allocated_amount, COALESCE(SUM(t.amount), 0) as spent
        FROM budgets b
        LEFT JOIN transactions t ON t.user_id = b.user_id 
            AND t.category = b.category 
            AND t.transaction_type = 'expense'
            AND t.transaction_date LIKE ?
        WHERE b.user_id = ? AND b.year = ? AND b.month = ?
        GROUP BY b.category, b.monthly_limit
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
        "has_data": all_time_count > 0,
        "all_time_count": all_time_count,
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
    Deterministic AI personal finance engine strictly scoped to actual records.
    Never invents records. If user has no data, advises adding transactions.
    """
    p_lower = prompt.lower()
    c = context["currency"]

    # If the user has zero financial records, prompt them to add records first
    if not context["has_data"]:
        return (
            f"### 📊 No Financial Records Found\n\n"
            f"Hello {context['user_name']}! You currently have zero transactions recorded in your personal ledger.\n\n"
            f"To provide accurate financial analysis, spending summaries, and predictive savings advice, "
            f"I require your actual transaction numbers.\n\n"
            f"👉 **Next Step:** Go to the **Transactions** page and record your first income or expense to get started!"
        )

    # 1. "Where did I spend the most money?" / "What are my biggest expenses?"
    if any(q in p_lower for q in ["where did i spend the most", "biggest expense", "highest spending", "top spending", "most money", "biggest expenses"]):
        if not context["categories"]:
            return f"You do not have any recorded expenses for the current month yet. Add your recent expenses in the Transactions section."

        top_cat = context["categories"][0]
        top_tx = context["top_expense_tx"]

        res = f"### 📊 Spending Analysis for {datetime.now().strftime('%B %Y')}\n\n"
        res += f"**[ACTUAL DATA - Verified]**\n"
        res += f"- **Highest Spending Category:** **{top_cat['category']}** at **{c}{top_cat['total']:,.2f}** "
        if context['current_expense'] > 0:
            res += f"({round(top_cat['total'] / context['current_expense'] * 100, 1)}% of your total expenses).\n"

        if top_tx:
            desc = top_tx.get('description') or top_tx['category']
            res += f"- **Largest Single Transaction:** **{c}{top_tx['amount']:,.2f}** for *'{desc}'* on {top_tx.get('transaction_date', 'this month')}.\n\n"

        if len(context["categories"]) > 1:
            res += f"**Top Spending Categories:**\n"
            for i, cat in enumerate(context["categories"][:3], 1):
                pct = round((cat['total'] / context['current_expense'] * 100), 1) if context['current_expense'] > 0 else 0
                res += f"{i}. **{cat['category']}**: {c}{cat['total']:,.2f} ({pct}%)\n"

        if top_cat["is_discretionary"]:
            res += f"\n💡 **Optimization Tip:** Your highest spending is in **{top_cat['category']}** (discretionary). Capping this category can help you build your reserve faster."
        return res

    # 2. "How much did I spend this month?"
    if any(q in p_lower for q in ["how much did i spend", "what did i spend", "my expenses this month", "total spending this month", "how much spent"]):
        exp = context["current_expense"]
        inc = context["current_income"]
        res = f"### 💳 Monthly Expenditure Report\n\n"
        res += f"**[ACTUAL DATA - Verified]**\n"
        res += f"- **Total Expenses This Month:** **{c}{exp:,.2f}**\n"
        res += f"- **Total Income Received:** **{c}{inc:,.2f}**\n"
        if exp > 0 and inc > 0:
            res += f"- **Expense-to-Income Ratio:** {round(exp / inc * 100, 1)}%\n"
        res += f"\n**[PROJECTED ESTIMATE - Forecast]**\n"
        res += f"- **Estimated Month-End Outflow:** ~{c}{context['projected_monthly_expense']:,.2f} (based on {c}{context['daily_burn_rate']:,.2f}/day burn rate)."
        return res

    # 3. "How much income did I receive?"
    if any(q in p_lower for q in ["how much income", "total income", "income received", "my earnings"]):
        inc = context["current_income"]
        res = f"### 💵 Inflow & Income Report\n\n"
        res += f"**[ACTUAL DATA - Verified]**\n"
        res += f"- **Total Income Received This Month:** **{c}{inc:,.2f}**\n"
        if context["prev_income"] > 0:
            diff = inc - context["prev_income"]
            res += f"- **Previous Month Income:** {c}{context['prev_income']:,.2f} ({'+' if diff >= 0 else ''}{diff:,.2f} change)\n"
        return res

    # 4. "How much did I save this month?"
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
            res += f"- **Current Savings Rate:** **{rate:.1f}%** (Healthy benchmark: > 20%)\n\n"
        else:
            res += f"- **Current Deficit:** **-{c}{abs(sav):,.2f}**\n\n"

        res += f"**[PROJECTED ESTIMATE - Forecast]**\n"
        res += f"- **Projected Month-End Savings:** ~{c}{context['projected_savings']:,.2f}"
        return res

    # 5. "Am I exceeding my monthly budget?"
    if any(q in p_lower for q in ["exceeding my monthly budget", "over budget", "budget status", "exceed budget", "am i over budget"]):
        if not context["budgets"]:
            return f"You have not configured any monthly category budgets yet. Visit the **Budgets & Limits** page to establish spending caps."

        exceeded = [b for b in context["budgets"] if b["status"] == "exceeded"]
        res = f"### 🎯 Budget Adherence Check\n\n"
        res += f"**[ACTUAL DATA - Verified]**\n"
        if exceeded:
            res += f"⚠️ **Attention:** You have exceeded your limit in {len(exceeded)} category(s):\n"
            for b in exceeded:
                res += f"- **{b['category']}**: Spent {c}{b['spent']:,.2f} of {c}{b['allocated']:,.2f} (Over by {c}{(b['spent'] - b['allocated']):,.2f})\n"
        else:
            res += f"✅ **All categories are currently within your allocated monthly limits!**\n"
        return res

    # 6. "How can I save ₹5,000 next month?" or target amount
    target_match = re.search(r'(?:save|target)\s*(?:₹|\$|€|rs\.?|inr)?\s*([0-9,]+)', p_lower)
    if "save" in p_lower and ("next month" in p_lower or "target" in p_lower or target_match):
        target_amt = 5000.0
        if target_match:
            try:
                target_amt = float(target_match.group(1).replace(",", ""))
            except ValueError:
                target_amt = 5000.0

        inc = context["current_income"] if context["current_income"] > 0 else context["prev_income"]
        cur_sav = context["current_savings"]
        disc_spending = context["discretionary_total"]

        res = f"### 🎯 Savings Feasibility Analysis: Target {c}{target_amt:,.2f}\n\n"
        if cur_sav >= target_amt:
            res += f"✅ **Yes, absolutely!** You are already on track.\n\n"
            res += f"**[ACTUAL DATA - Current Baseline]**\n"
            res += f"- Current Monthly Income: **{c}{inc:,.2f}**\n"
            res += f"- Current Net Savings: **{c}{cur_sav:,.2f}**\n\n"
            res += f"**[ACTION PLAN]**\n"
            res += f"1. Maintain your current non-essential spending caps.\n"
            res += f"2. Allocate {c}{target_amt:,.2f} directly into your savings account at the start of next month."
        elif (cur_sav + disc_spending) >= target_amt:
            deficit = target_amt - cur_sav
            res += f"⚠️ **Yes, with disciplined adjustments to non-essential spending.**\n\n"
            res += f"**[ACTUAL DATA - Current Baseline]**\n"
            res += f"- Current Net Savings: **{c}{cur_sav:,.2f}**\n"
            res += f"- Shortfall to Target: **{c}{deficit:,.2f}**\n"
            res += f"- Identified Discretionary Outflow: **{c}{disc_spending:,.2f}**\n\n"
            res += f"**[PROJECTED ESTIMATE - Required Cut]**\n"
            res += f"Trim non-essential expenses (Shopping, Dining, Entertainment) by ~{c}{deficit:,.2f} to hit your goal."
        else:
            res += f"❌ **Target requires increasing income or reducing fixed expenses.**\n"
        return res

    # 7. "Predict my next month's expenses based on my history."
    if any(q in p_lower for q in ["predict", "forecast", "projection", "next month's expenses", "future expense"]):
        res = f"### 📈 Predictive Expense Modeling\n\n"
        res += f"**[ACTUAL DATA - Current Outflow]**\n"
        res += f"- Verified Outflow to Date: **{c}{context['current_expense']:,.2f}**\n"
        res += f"- Daily Burn Rate: **{c}{context['daily_burn_rate']:,.2f}/day**\n\n"
        res += f"**[PROJECTED ESTIMATE - Algorithmic Forecast]**\n"
        res += f"- **Estimated Month-End Total Expenses:** ~**{c}{context['projected_monthly_expense']:,.2f}**\n"
        res += f"- **Projected Next Month Baseline:** ~**{c}{context['projected_monthly_expense']:,.2f}**\n"
        res += f"*(Estimate assumes normal daily transaction pace without unexpected one-off purchases.)*"
        return res

    # 8. "Identify unnecessary spending"
    if any(q in p_lower for q in ["unnecessary", "cut cost", "wasteful", "discretionary", "reduce expense"]):
        disc = [c for c in context["categories"] if c["is_discretionary"]]
        total_disc = context["discretionary_total"]

        res = f"### 🔍 Discretionary Spending Audit\n\n"
        res += f"**[ACTUAL DATA - Non-Essential Outflows]**\n"
        res += f"Total recorded discretionary spending this month: **{c}{total_disc:,.2f}**\n\n"
        for item in disc:
            res += f"- **{item['category']}**: {c}{item['total']:,.2f}\n"

        res += f"\n**[PROJECTED ESTIMATE - Potential Savings]**\n"
        res += f"Targeting a 25% reduction in these categories can yield ~**{c}{(total_disc * 0.25):,.2f}** in monthly savings."
        return res

    # Default overview
    res = f"### 🤖 FinAI Financial Copilot\n\n"
    res += f"Hello {context['user_name']}! Here is your verified financial overview:\n\n"
    res += f"**[ACTUAL DATA]**\n"
    res += f"- **Income:** {c}{context['current_income']:,.2f}\n"
    res += f"- **Expenses:** {c}{context['current_expense']:,.2f}\n"
    res += f"- **Net Savings:** {c}{context['current_savings']:,.2f}\n\n"
    res += f"You can ask me questions like:\n"
    res += f"- *\"Where did I spend the most money?\"*\n"
    res += f"- *\"How much did I spend this month?\"*\n"
    res += f"- *\"How can I save ₹5,000 next month?\"*\n"
    res += f"- *\"Am I exceeding my monthly budget?\"*"
    return res

def call_gemini_api(prompt, context):
    """Calls Gemini API with strict context injection if key is available."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or not context["has_data"]:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    system_instruction = f"""
    You are FinAI, an expert financial analyst.
    Rules:
    1. Base all facts strictly on the provided authenticated user data.
    2. If user has no transactions, state so and do not invent records.
    3. Clearly distinguish between [ACTUAL DATA] and [PROJECTED ESTIMATE].
    4. Currency: {context['currency']}.
    
    Data:
    - User: {context['user_name']}
    - Income: {context['currency']}{context['current_income']}
    - Expense: {context['currency']}{context['current_expense']}
    - Savings: {context['currency']}{context['current_savings']}
    - Top Categories: {json.dumps(context['categories'][:5])}
    """

    payload = {
        "contents": [{"role": "user", "parts": [{"text": f"{system_instruction}\n\nQuestion: {prompt}"}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800}
    }

    try:
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            candidates = resp.json().get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"]
    except Exception:
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

    context = fetch_financial_context(user_id)

    ai_response = call_gemini_api(message, context)
    mode = "gemini_llm"
    if not ai_response:
        ai_response = generate_heuristic_response(message, context)
        mode = "heuristic_ai"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ai_messages (user_id, role, content, metadata_json)
        VALUES (?, 'user', ?, ?)
    """, (user_id, message, json.dumps({"source": "user_input"})))

    metadata = {
        "mode": mode,
        "currency": context["currency"],
        "savings": context["current_savings"]
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
