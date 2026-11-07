from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import calendar
from database import get_db
from auth import jwt_required

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/overview", methods=["GET"])
@jwt_required
def get_overview():
    user_id = g.user_id
    now = datetime.now()
    year = request.args.get("year", default=now.year, type=int)
    month = request.args.get("month", default=now.month, type=int)

    conn = get_db()
    cursor = conn.cursor()

    # Current month metrics
    current_month_prefix = f"{year:04d}-{month:02d}-%"
    cursor.execute("""
        SELECT type, COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND date LIKE ?
        GROUP BY type
    """, (user_id, current_month_prefix))
    cur_data = {row["type"]: float(row["total"]) for row in cursor.fetchall()}
    cur_income = cur_data.get("income", 0.0)
    cur_expense = cur_data.get("expense", 0.0)
    cur_savings = cur_income - cur_expense
    cur_savings_rate = (cur_savings / cur_income * 100) if cur_income > 0 else 0.0

    # Previous month metrics for comparison
    prev_month = 12 if month == 1 else month - 1
    prev_year = year - 1 if month == 1 else year
    prev_month_prefix = f"{prev_year:04d}-{prev_month:02d}-%"
    cursor.execute("""
        SELECT type, COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND date LIKE ?
        GROUP BY type
    """, (user_id, prev_month_prefix))
    prev_data = {row["type"]: float(row["total"]) for row in cursor.fetchall()}
    prev_income = prev_data.get("income", 0.0)
    prev_expense = prev_data.get("expense", 0.0)

    income_change_pct = ((cur_income - prev_income) / prev_income * 100) if prev_income > 0 else 0.0
    expense_change_pct = ((cur_expense - prev_expense) / prev_expense * 100) if prev_expense > 0 else 0.0

    # Days in month and daily average expense
    days_in_month = calendar.monthrange(year, month)[1]
    days_passed = now.day if (year == now.year and month == now.month) else days_in_month
    daily_avg_expense = cur_expense / max(days_passed, 1)

    # All-time metrics
    cursor.execute("""
        SELECT type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ?
        GROUP BY type
    """, (user_id,))
    all_time_rows = cursor.fetchall()
    all_time = {row["type"]: {"total": float(row["total"]), "count": row["count"]} for row in all_time_rows}

    conn.close()

    return jsonify({
        "period": {"year": year, "month": month},
        "current_month": {
            "income": round(cur_income, 2),
            "expense": round(cur_expense, 2),
            "savings": round(cur_savings, 2),
            "savings_rate": round(cur_savings_rate, 1),
            "daily_avg_expense": round(daily_avg_expense, 2),
            "days_passed": days_passed,
            "days_in_month": days_in_month
        },
        "comparison": {
            "prev_income": round(prev_income, 2),
            "prev_expense": round(prev_expense, 2),
            "income_change_pct": round(income_change_pct, 1),
            "expense_change_pct": round(expense_change_pct, 1)
        },
        "all_time": {
            "total_income": round(all_time.get("income", {}).get("total", 0.0), 2),
            "total_expense": round(all_time.get("expense", {}).get("total", 0.0), 2),
            "total_transactions": (all_time.get("income", {}).get("count", 0) + all_time.get("expense", {}).get("count", 0))
        }
    }), 200

@analytics_bp.route("/monthly-trend", methods=["GET"])
@jwt_required
def get_monthly_trend():
    user_id = g.user_id
    months_count = request.args.get("months", default=6, type=int)

    conn = get_db()
    cursor = conn.cursor()

    # Query aggregates grouped by YYYY-MM
    cursor.execute("""
        SELECT 
            strftime('%Y-%m', date) as ym,
            type,
            SUM(amount) as total
        FROM transactions
        WHERE user_id = ?
        GROUP BY ym, type
        ORDER BY ym ASC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    trend_map = {}
    for row in rows:
        ym = row["ym"]
        if ym not in trend_map:
            y, m = ym.split("-")
            month_name = calendar.month_abbr[int(m)]
            trend_map[ym] = {
                "period": ym,
                "label": f"{month_name} {y[-2:]}",
                "income": 0.0,
                "expense": 0.0,
                "savings": 0.0
            }
        trend_map[ym][row["type"]] = float(row["total"])
        trend_map[ym]["savings"] = round(trend_map[ym]["income"] - trend_map[ym]["expense"], 2)

    # Sort and take last N months
    trend_list = sorted(trend_map.values(), key=lambda x: x["period"])
    if len(trend_list) > months_count:
        trend_list = trend_list[-months_count:]

    return jsonify({"trend": trend_list}), 200

@analytics_bp.route("/category-breakdown", methods=["GET"])
@jwt_required
def get_category_breakdown():
    user_id = g.user_id
    now = datetime.now()
    year = request.args.get("year", default=now.year, type=int)
    month = request.args.get("month", default=now.month, type=int)
    tx_type = request.args.get("type", default="expense")

    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND type = ?
    """
    params = [user_id, tx_type]

    if year and month:
        query += " AND date LIKE ?"
        params.append(f"{year:04d}-{month:02d}-%")
    elif year:
        query += " AND date LIKE ?"
        params.append(f"{year:04d}-%")

    query += " GROUP BY category ORDER BY total DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    total_sum = sum(float(r["total"]) for r in rows)
    categories = []

    # Assign distinct colors for charts
    palette = [
        "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
        "#ec4899", "#06b6d4", "#84cc16", "#14b8a6", "#6366f1",
        "#f97316", "#a855f7", "#64748b"
    ]

    for idx, r in enumerate(rows):
        cat_amount = float(r["total"])
        pct = (cat_amount / total_sum * 100) if total_sum > 0 else 0.0
        categories.append({
            "name": r["category"],
            "value": round(cat_amount, 2),
            "count": r["count"],
            "percentage": round(pct, 1),
            "color": palette[idx % len(palette)]
        })

    return jsonify({
        "total": round(total_sum, 2),
        "categories": categories
    }), 200

@analytics_bp.route("/payment-methods", methods=["GET"])
@jwt_required
def get_payment_methods():
    user_id = g.user_id
    now = datetime.now()
    year = request.args.get("year", default=now.year, type=int)
    month = request.args.get("month", default=now.month, type=int)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT payment_method, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        GROUP BY payment_method
        ORDER BY total DESC
    """, (user_id, f"{year:04d}-{month:02d}-%"))
    rows = cursor.fetchall()
    conn.close()

    total_expense = sum(float(r["total"]) for r in rows)
    methods = []
    palette = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6"]

    for idx, r in enumerate(rows):
        amt = float(r["total"])
        pct = (amt / total_expense * 100) if total_expense > 0 else 0.0
        methods.append({
            "name": r["payment_method"],
            "amount": round(amt, 2),
            "count": r["count"],
            "percentage": round(pct, 1),
            "color": palette[idx % len(palette)]
        })

    return jsonify({
        "total": round(total_expense, 2),
        "methods": methods
    }), 200

@analytics_bp.route("/report", methods=["GET"])
@jwt_required
def get_financial_report():
    user_id = g.user_id
    now = datetime.now()
    year = request.args.get("year", default=now.year, type=int)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            strftime('%m', date) as m_str,
            type,
            SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND date LIKE ?
        GROUP BY m_str, type
        ORDER BY m_str ASC
    """, (user_id, f"{year:04d}-%"))
    rows = cursor.fetchall()

    monthly_summary = {}
    for m in range(1, 13):
        m_str = f"{m:02d}"
        monthly_summary[m_str] = {
            "month": calendar.month_name[m],
            "month_num": m,
            "income": 0.0,
            "expense": 0.0,
            "savings": 0.0,
            "savings_rate": 0.0
        }

    for row in rows:
        m_str = row["m_str"]
        if m_str in monthly_summary:
            monthly_summary[m_str][row["type"]] = float(row["total"])
            inc = monthly_summary[m_str]["income"]
            exp = monthly_summary[m_str]["expense"]
            sav = inc - exp
            monthly_summary[m_str]["savings"] = round(sav, 2)
            monthly_summary[m_str]["savings_rate"] = round((sav / inc * 100), 1) if inc > 0 else 0.0

    total_year_income = sum(m["income"] for m in monthly_summary.values())
    total_year_expense = sum(m["expense"] for m in monthly_summary.values())
    total_year_savings = total_year_income - total_year_expense

    conn.close()

    return jsonify({
        "year": year,
        "yearly_totals": {
            "income": round(total_year_income, 2),
            "expense": round(total_year_expense, 2),
            "savings": round(total_year_savings, 2),
            "savings_rate": round((total_year_savings / total_year_income * 100), 1) if total_year_income > 0 else 0.0
        },
        "monthly_breakdown": list(monthly_summary.values())
    }), 200
