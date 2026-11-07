from flask import Blueprint, request, jsonify, g
from database import get_db, seed_sample_data
from auth import jwt_required
from werkzeug.security import generate_password_hash, check_password_hash

user_bp = Blueprint("user", __name__, url_prefix="/api/user")

@user_bp.route("/profile", methods=["GET"])
@jwt_required
def get_profile():
    user_id = g.user_id
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, currency, theme, alert_threshold, created_at
        FROM users
        WHERE id = ?
    """, (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": dict(user)}), 200

@user_bp.route("/profile", methods=["PUT"])
@jwt_required
def update_profile():
    user_id = g.user_id
    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    current_user = cursor.fetchone()
    if not current_user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    full_name = data.get("full_name", current_user["full_name"]).strip()
    currency = data.get("currency", current_user["currency"]).strip()
    theme = data.get("theme", current_user["theme"]).strip()
    alert_threshold = data.get("alert_threshold", current_user["alert_threshold"])

    try:
        alert_threshold = float(alert_threshold)
        if not (1 <= alert_threshold <= 100):
            alert_threshold = 80.0
    except (TypeError, ValueError):
        alert_threshold = 80.0

    if not full_name:
        conn.close()
        return jsonify({"error": "Full name cannot be empty"}), 400

    cursor.execute("""
        UPDATE users
        SET full_name = ?, currency = ?, theme = ?, alert_threshold = ?
        WHERE id = ?
    """, (full_name, currency, theme, alert_threshold, user_id))
    conn.commit()

    cursor.execute("""
        SELECT id, email, full_name, currency, theme, alert_threshold, created_at
        FROM users WHERE id = ?
    """, (user_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "message": "Profile updated successfully",
        "user": updated_user
    }), 200

@user_bp.route("/change-password", methods=["PUT"])
@jwt_required
def change_password():
    user_id = g.user_id
    data = request.get_json() or {}
    old_pw = data.get("old_password", "").strip()
    new_pw = data.get("new_password", "").strip()

    if not old_pw or not new_pw:
        return jsonify({"error": "Current and new passwords are required"}), 400
    if len(new_pw) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row or not check_password_hash(row["password_hash"], old_pw):
        conn.close()
        return jsonify({"error": "Current password is incorrect"}), 401

    new_hash = generate_password_hash(new_pw, method="pbkdf2:sha256")
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password changed successfully"}), 200

@user_bp.route("/reset-demo-data", methods=["POST"])
@jwt_required
def reset_demo():
    user_id = g.user_id
    seed_sample_data(user_id)
    return jsonify({"message": "Sample transactions, budgets, and insights reloaded successfully!"}), 200
