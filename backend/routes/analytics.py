from flask import Blueprint, request, jsonify, g
from datetime import datetime
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

    # Current month metrics for authenticated user
    current_month_prefix = f"{year:04d}-{month:02d}-%"
    cursor.execute("""
        SELECT transaction_type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND transaction_date LIKE ?
        GROUP BY transaction_type
    """, (user_id, current_month_prefix))
    cur_data = {row["transaction_type"]: float(row["total"]) for row in cursor.fetchall()}
    cur_income = cur_data.get("income", 0.0)
    cur_expense = cur_data.get("expense", 0.0)
    cur_savings = cur_income - cur_expense
    cur_savings_rate = (cur_savings / cur_income * 100) if cur_income > 0 else 0.0

    # Previous month metrics for comparison
    prev_month = 12 if month == 1 else month - 1
    prev_year = year - 1 if month == 1 else year
    prev_month_prefix = f"{prev_year:04d}-{prev_month:02d}-%"
    cursor.execute("""
        SELECT transaction_type, COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ? AND transaction_date LIKE ?
        GROUP BY transaction_type
    """, (user_id, prev_month_prefix))
    prev_data = {row["transaction_type"]: float(row["total"]) for row in cursor.fetchall()}
    prev_income = prev_data.get("income", 0.0)
    prev_expense = prev_data.get("expense", 0.0)

    income_change_pct = ((cur_income - prev_income) / prev_income * 100) if prev_income > 0 else 0.0
    expense_change_pct = ((cur_expense - prev_expense) / prev_expense * 100) if prev_expense > 0 else 0.0

    # Days in month and daily average expense
    days_in_month = calendar.monthrange(year, month)[1]
    days_passed = now.day if (year == now.year and month == now.month) else days_in_month
    daily_avg_expense = cur_expense / max(days_passed, 1)

    # All-time metrics for authenticated user
    cursor.execute("""
        SELECT transaction_type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ?
        GROUP BY transaction_type
    """, (user_id,))
    all_time_rows = cursor.fetchall()
    all_time = {row["transaction_type"]: {"total": float(row["total"]), "count": row["count"]} for row in all_time_rows}

    total_all_income = all_time.get("income", {}).get("total", 0.0)
    total_all_expense = all_time.get("expense", {}).get("total", 0.0)
    total_balance = total_all_income - total_all_expense
    total_tx_count = all_time.get("income", {}).get("count", 0) + all_time.get("expense", {}).get("count", 0)

    conn.close()

    return jsonify({
        "period": {"year": year, "month": month},
        "total_balance": round(total_balance, 2),
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
            "total_income": round(total_all_income, 2),
            "total_expense": round(total_all_expense, 2),
            "total_balance": round(total_balance, 2),
            "total_transactions": total_tx_count
        }
    }), 200

@analytics_bp.route("/monthly-trend", methods=["GET"])
@jwt_required
def get_monthly_trend():
    user_id = g.user_id
    months_count = request.args.get("months", default=6, type=int)

    conn = get_db()
    cursor = conn.cursor()

    # Query aggregates grouped by YYYY-MM for THIS user
    cursor.execute("""
        SELECT 
            strftime('%Y-%m', transaction_date) as ym,
            transaction_type,
            SUM(amount) as total
        FROM transactions
        WHERE user_id = ?
        GROUP BY ym, transaction_type
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
        trend_map[ym][row["transaction_type"]] = float(row["total"])
        trend_map[ym]["savings"] = round(trend_map[ym]["income"] - trend_map[ym]["expense"], 2)

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
    tx_type = request.args.get("type", request.args.get("transaction_type", "expense")).strip().lower()

    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        WHERE user_id = ? AND transaction_type = ?
    """
    params = [user_id, tx_type]

    if year and month:
        query += " AND transaction_date LIKE ?"
        params.append(f"{year:04d}-{month:02d}-%")
    elif year:
        query += " AND transaction_date LIKE ?"
        params.append(f"{year:04d}-%")

    query += " GROUP BY category ORDER BY total DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    total_sum = sum(float(r["total"]) for r in rows)
    categories = []

    # Monochrome shades for sleek minimalist UI: black, charcoal, graphite, medium grey, light grey
    monochrome_shades = [
        "#111111", "#333333", "#555555", "#777777", "#999999",
        "#AAAAAA", "#CCCCCC", "#444444", "#666666", "#888888"
    ]

    for idx, r in enumerate(rows):
        cat_amount = float(r["total"])
        pct = (cat_amount / total_sum * 100) if total_sum > 0 else 0.0
        categories.append({
            "name": r["category"],
            "value": round(cat_amount, 2),
            "count": r["count"],
            "percentage": round(pct, 1),
            "color": monochrome_shades[idx % len(monochrome_shades)]
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
        WHERE user_id = ? AND transaction_type = 'expense' AND transaction_date LIKE ?
        GROUP BY payment_method
        ORDER BY total DESC
    """, (user_id, f"{year:04d}-{month:02d}-%"))
    rows = cursor.fetchall()
    conn.close()

    total_expense = sum(float(r["total"]) for r in rows)
    methods = []
    shades = ["#111111", "#444444", "#777777", "#999999", "#BBBBBB"]

    for idx, r in enumerate(rows):
        amt = float(r["total"])
        pct = (amt / total_expense * 100) if total_expense > 0 else 0.0
        methods.append({
            "name": r["payment_method"],
            "amount": round(amt, 2),
            "count": r["count"],
            "percentage": round(pct, 1),
            "color": shades[idx % len(shades)]
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
            strftime('%m', transaction_date) as m_str,
            transaction_type,
            SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND transaction_date LIKE ?
        GROUP BY m_str, transaction_type
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
            monthly_summary[m_str][row["transaction_type"]] = float(row["total"])
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
