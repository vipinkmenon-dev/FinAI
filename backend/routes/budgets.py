from flask import Blueprint, request, jsonify, g
from datetime import datetime
from database import get_db
from auth import jwt_required

budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")

@budgets_bp.route("", methods=["GET"])
@jwt_required
def get_budgets():
    user_id = g.user_id
    now = datetime.now()
    year = request.args.get("year", default=now.year, type=int)
    month = request.args.get("month", default=now.month, type=int)

    conn = get_db()
    cursor = conn.cursor()

    # Get user's custom alert threshold
    cursor.execute("SELECT alert_threshold FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    threshold = user_row["alert_threshold"] if user_row else 80.0

    # Get budgets for month/year
    cursor.execute("""
        SELECT id, category, allocated_amount, updated_at
        FROM budgets
        WHERE user_id = ? AND year = ? AND month = ?
        ORDER BY category ASC
    """, (user_id, year, month))
    budget_rows = cursor.fetchall()

    # Get actual spending per category for this month/year
    month_pattern = f"{year:04d}-{month:02d}-%"
    cursor.execute("""
        SELECT category, SUM(amount) as total_spent
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date LIKE ?
        GROUP BY category
    """, (user_id, month_pattern))
    spent_by_cat = {row["category"]: float(row["total_spent"]) for row in cursor.fetchall()}

    conn.close()

    budget_items = []
    total_allocated = 0.0
    total_budgeted_spent = 0.0

    for b in budget_rows:
        cat = b["category"]
        allocated = float(b["allocated_amount"])
        spent = spent_by_cat.get(cat, 0.0)
        remaining = allocated - spent
        percent = (spent / allocated * 100) if allocated > 0 else 0.0

        if percent >= 100.0:
            status = "exceeded"
        elif percent >= threshold:
            status = "warning"
        else:
            status = "safe"

        total_allocated += allocated
        total_budgeted_spent += spent

        budget_items.append({
            "id": b["id"],
            "category": cat,
            "allocated_amount": allocated,
            "spent_amount": round(spent, 2),
            "remaining_amount": round(remaining, 2),
            "percentage_used": round(percent, 1),
            "status": status,
            "updated_at": b["updated_at"]
        })

    # Total actual expenses for this month across all categories (budgeted or unbudgeted)
    all_spent = sum(spent_by_cat.values())
    unbudgeted_spent = max(0.0, all_spent - total_budgeted_spent)

    return jsonify({
        "year": year,
        "month": month,
        "threshold": threshold,
        "total_allocated": round(total_allocated, 2),
        "total_spent": round(total_budgeted_spent, 2),
        "all_expenses": round(all_spent, 2),
        "unbudgeted_spent": round(unbudgeted_spent, 2),
        "overall_percentage": round((total_budgeted_spent / total_allocated * 100), 1) if total_allocated > 0 else 0.0,
        "budgets": budget_items
    }), 200

@budgets_bp.route("", methods=["POST"])
@jwt_required
def set_budget():
    user_id = g.user_id
    data = request.get_json() or {}

    now = datetime.now()
    year = data.get("year", now.year)
    month = data.get("month", now.month)
    category = data.get("category", "").strip()
    allocated_amount = data.get("allocated_amount")

    if not category:
        return jsonify({"error": "Category is required"}), 400

    try:
        allocated_amount = float(allocated_amount)
        if allocated_amount <= 0:
            return jsonify({"error": "Allocated amount must be greater than zero"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Valid numeric allocated amount is required"}), 400

    try:
        year = int(year)
        month = int(month)
        if not (1 <= month <= 12):
            return jsonify({"error": "Month must be between 1 and 12"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Valid year and month are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO budgets (user_id, year, month, category, allocated_amount, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, year, month, category)
        DO UPDATE SET allocated_amount = excluded.allocated_amount, updated_at = CURRENT_TIMESTAMP
    """, (user_id, year, month, category, allocated_amount))
    conn.commit()

    cursor.execute("""
        SELECT * FROM budgets WHERE user_id = ? AND year = ? AND month = ? AND category = ?
    """, (user_id, year, month, category))
    budget_row = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "message": "Budget limit set successfully",
        "budget": budget_row
    }), 201

@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@jwt_required
def delete_budget(budget_id):
    user_id = g.user_id
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Budget entry not found"}), 404

    cursor.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", (budget_id, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Budget deleted successfully"}), 200

@budgets_bp.route("/alerts", methods=["GET"])
@jwt_required
def get_alerts():
    user_id = g.user_id
    now = datetime.now()
    year = now.year
    month = now.month

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT alert_threshold FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    threshold = user_row["alert_threshold"] if user_row else 80.0

    cursor.execute("""
        SELECT b.category, b.allocated_amount, COALESCE(SUM(t.amount), 0) as spent_amount
        FROM budgets b
        LEFT JOIN transactions t ON t.user_id = b.user_id 
            AND t.category = b.category 
            AND t.type = 'expense' 
            AND t.date LIKE ?
        WHERE b.user_id = ? AND b.year = ? AND b.month = ?
        GROUP BY b.category, b.allocated_amount
    """, (f"{year:04d}-{month:02d}-%", user_id, year, month))

    alerts = []
    for row in cursor.fetchall():
        allocated = float(row["allocated_amount"])
        spent = float(row["spent_amount"])
        percent = (spent / allocated * 100) if allocated > 0 else 0.0

        if percent >= 100:
            alerts.append({
                "type": "danger",
                "category": row["category"],
                "allocated": allocated,
                "spent": spent,
                "percent": round(percent, 1),
                "message": f"Over budget! You spent ₹{spent:,.0f} of ₹{allocated:,.0f} ({round(percent, 1)}%) in {row['category']}."
            })
        elif percent >= threshold:
            alerts.append({
                "type": "warning",
                "category": row["category"],
                "allocated": allocated,
                "spent": spent,
                "percent": round(percent, 1),
                "message": f"Nearing limit: {row['category']} is at {round(percent, 1)}% of budget (₹{spent:,.0f}/₹{allocated:,.0f})."
            })

    conn.close()
    return jsonify({"alerts": alerts}), 200
