import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g, session
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db

SECRET_KEY = os.environ.get("SECRET_KEY", "finai-production-jwt-and-session-secret-key-2026-min-32-chars")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 7

def create_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRY_DAYS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. First check server-side session
        session_user_id = session.get("user_id")
        if session_user_id:
            g.user_id = session_user_id
            g.user_email = session.get("user_email", "")
            return f(*args, **kwargs)

        # 2. Check Bearer token in Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
                g.user_id = payload["user_id"]
                g.user_email = payload["email"]
                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Session token has expired. Please log in again."}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid authentication token"}), 401

        return jsonify({"error": "Authentication required. Please log in."}), 401
    return decorated

def register_user():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    currency = data.get("currency", "₹").strip() or "₹"

    if not full_name:
        return jsonify({"error": "Full name is required"}), 400
    if not email or "@" not in email or "." not in email:
        return jsonify({"error": "A valid email address is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "An account with this email address already exists"}), 409

    hashed_pw = generate_password_hash(password, method="pbkdf2:sha256")
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO users (full_name, email, password_hash, currency, theme, alert_threshold, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'light', 80.0, ?, ?)
    """, (full_name, email, hashed_pw, currency, now_str, now_str))
    user_id = cursor.lastrowid

    # Create associated default user_settings
    cursor.execute("""
        INSERT OR IGNORE INTO user_settings (user_id, currency, preferences, updated_at)
        VALUES (?, ?, '{}', ?)
    """, (user_id, currency, now_str))

    conn.commit()

    # NOTE: The account starts with completely EMPTY financial records (₹0.00 balance, 0 transactions).
    # No demo/sample transactions are generated.

    cursor.execute("SELECT id, full_name, email, currency, theme, alert_threshold, created_at FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    conn.close()

    # Establish server-side session
    session["user_id"] = user_id
    session["user_email"] = email
    session.permanent = True

    token = create_token(user_id, email)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user
    }), 201

def login_user():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, email, password_hash, currency, theme, alert_threshold, created_at FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or not check_password_hash(user_row["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    user = {
        "id": user_row["id"],
        "full_name": user_row["full_name"],
        "email": user_row["email"],
        "currency": user_row["currency"],
        "theme": user_row["theme"] or "light",
        "alert_threshold": user_row["alert_threshold"] or 80.0,
        "created_at": user_row["created_at"]
    }

    # Establish server-side session
    session["user_id"] = user["id"]
    session["user_email"] = user["email"]
    session.permanent = True

    token = create_token(user["id"], user["email"])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user
    }), 200

def logout_user():
    session.clear()
    return jsonify({"message": "Successfully logged out"}), 200
