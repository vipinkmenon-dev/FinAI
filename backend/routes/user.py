from flask import Blueprint, request, jsonify, g, session
from database import get_db
from auth import jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
import json

user_bp = Blueprint("user", __name__, url_prefix="/api/user")

@user_bp.route("/profile", methods=["GET"])
@jwt_required
def get_profile():
    user_id = g.user_id
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, currency, theme, alert_threshold, created_at, updated_at
        FROM users
        WHERE id = ?
    """, (user_id,))
    user = cursor.fetchone()
    
    # Also fetch user_settings
    cursor.execute("SELECT currency, preferences FROM user_settings WHERE user_id = ?", (user_id,))
    settings_row = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_dict = dict(user)
    if settings_row:
        user_dict["currency"] = settings_row["currency"] or user_dict["currency"]
        try:
            user_dict["preferences"] = json.loads(settings_row["preferences"] or "{}")
        except Exception:
            user_dict["preferences"] = {}

    return jsonify({"user": user_dict}), 200

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
    currency = data.get("currency", current_user["currency"]).strip() or "₹"
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
        SET full_name = ?, currency = ?, alert_threshold = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (full_name, currency, alert_threshold, user_id))

    # Also update user_settings
    cursor.execute("""
        INSERT INTO user_settings (user_id, currency, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET currency = excluded.currency, updated_at = CURRENT_TIMESTAMP
    """, (user_id, currency))

    conn.commit()

    cursor.execute("""
        SELECT id, email, full_name, currency, theme, alert_threshold, created_at, updated_at
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
    cursor.execute("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_hash, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password changed successfully"}), 200

@user_bp.route("/account", methods=["DELETE"])
@jwt_required
def delete_account():
    """Permanently delete user account and all personal financial records."""
    user_id = g.user_id
    data = request.get_json() or {}
    password = data.get("password", "").strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    if password and not check_password_hash(row["password_hash"], password):
        conn.close()
        return jsonify({"error": "Incorrect password. Cannot delete account."}), 401

    # Cascading delete cleans transactions, budgets, settings, ai_messages
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    session.clear()
    return jsonify({"message": "Your account and all associated financial records have been permanently deleted."}), 200
