from flask import Blueprint, request, jsonify, g
from datetime import datetime
from database import get_db
from auth import jwt_required

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

DEFAULT_EXPENSE_CATEGORIES = [
    "Housing", "Food & Dining", "Groceries", "Utilities",
    "Transportation", "Entertainment", "Shopping", "Healthcare",
    "Subscriptions", "Education", "Travel", "Personal Care", "Miscellaneous"
]

DEFAULT_INCOME_CATEGORIES = [
    "Salary", "Freelance", "Investment Returns", "Bonus",
    "Rental Income", "Business", "Gifts", "Other"
]

DEFAULT_PAYMENT_METHODS = [
    "UPI / Net Banking", "Credit Card", "Debit Card", "Cash", "Bank Transfer", "Digital Wallet"
]

@transactions_bp.route("", methods=["GET"])
@jwt_required
def get_transactions():
    user_id = g.user_id
    search = request.args.get("search", "").strip()
    tx_type = request.args.get("type", "").strip()
    category = request.args.get("category", "").strip()
    payment_method = request.args.get("payment_method", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    limit = request.args.get("limit", default=200, type=int)
    offset = request.args.get("offset", default=0, type=int)

    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM transactions WHERE user_id = ?"
    params = [user_id]

    if search:
        query += " AND (description LIKE ? OR category LIKE ? OR payment_method LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if tx_type in ("income", "expense"):
        query += " AND type = ?"
        params.append(tx_type)

    if category:
        query += " AND category = ?"
        params.append(category)

    if payment_method:
        query += " AND payment_method = ?"
        params.append(payment_method)

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    if year and month:
        prefix = f"{year:04d}-{month:02d}-%"
        query += " AND date LIKE ?"
        params.append(prefix)
    elif year:
        prefix = f"{year:04d}-%"
        query += " AND date LIKE ?"
        params.append(prefix)

    # Count total matching
    count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]

    # Order and paginate
    query += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    transactions = [dict(row) for row in rows]
    return jsonify({
        "transactions": transactions,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }), 200

@transactions_bp.route("", methods=["POST"])
@jwt_required
def create_transaction():
    user_id = g.user_id
    data = request.get_json() or {}

    tx_type = data.get("type", "").strip().lower()
    amount = data.get("amount")
    category = data.get("category", "").strip()
    payment_method = data.get("payment_method", "").strip()
    description = data.get("description", "").strip()
    date_str = data.get("date", "").strip()

    if tx_type not in ("income", "expense"):
        return jsonify({"error": "Type must be 'income' or 'expense'"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than zero"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Valid numeric amount is required"}), 400

    if not category:
        return jsonify({"error": "Category is required"}), 400

    if not payment_method:
        payment_method = "UPI / Net Banking"

    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    else:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transactions (user_id, type, amount, category, payment_method, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, tx_type, amount, category, payment_method, description, date_str))
    tx_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    new_tx = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "message": "Transaction created successfully",
        "transaction": new_tx
    }), 201

@transactions_bp.route("/<int:tx_id>", methods=["PUT"])
@jwt_required
def update_transaction(tx_id):
    user_id = g.user_id
    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Transaction not found"}), 404

    tx_type = data.get("type", existing["type"]).strip().lower()
    if tx_type not in ("income", "expense"):
        conn.close()
        return jsonify({"error": "Type must be 'income' or 'expense'"}), 400

    try:
        amount = float(data.get("amount", existing["amount"]))
        if amount <= 0:
            conn.close()
            return jsonify({"error": "Amount must be greater than zero"}), 400
    except (TypeError, ValueError):
        conn.close()
        return jsonify({"error": "Valid numeric amount is required"}), 400

    category = data.get("category", existing["category"]).strip()
    payment_method = data.get("payment_method", existing["payment_method"]).strip()
    description = data.get("description", existing["description"]).strip()
    date_str = data.get("date", existing["date"]).strip()

    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        conn.close()
        return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400

    cursor.execute("""
        UPDATE transactions
        SET type = ?, amount = ?, category = ?, payment_method = ?, description = ?, date = ?
        WHERE id = ? AND user_id = ?
    """, (tx_type, amount, category, payment_method, description, date_str, tx_id, user_id))
    conn.commit()

    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    updated_tx = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "message": "Transaction updated successfully",
        "transaction": updated_tx
    }), 200

@transactions_bp.route("/<int:tx_id>", methods=["DELETE"])
@jwt_required
def delete_transaction(tx_id):
    user_id = g.user_id
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Transaction not found"}), 404

    cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Transaction deleted successfully"}), 200

@transactions_bp.route("/meta", methods=["GET"])
@jwt_required
def get_metadata():
    user_id = g.user_id
    conn = get_db()
    cursor = conn.cursor()

    # Get any custom categories the user used
    cursor.execute("""
        SELECT DISTINCT category, type FROM transactions WHERE user_id = ?
    """, (user_id,))
    user_cats = cursor.fetchall()
    conn.close()

    expense_cats = set(DEFAULT_EXPENSE_CATEGORIES)
    income_cats = set(DEFAULT_INCOME_CATEGORIES)

    for row in user_cats:
        if row["type"] == "expense":
            expense_cats.add(row["category"])
        elif row["type"] == "income":
            income_cats.add(row["category"])

    return jsonify({
        "expense_categories": sorted(list(expense_cats)),
        "income_categories": sorted(list(income_cats)),
        "payment_methods": DEFAULT_PAYMENT_METHODS
    }), 200
