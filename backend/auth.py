import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db, seed_sample_data

SECRET_KEY = os.environ.get("SECRET_KEY", "finai-default-jwt-secret-key-2026")
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
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization token"}), 401

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
            g.user_id = payload["user_id"]
            g.user_email = payload["email"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        return f(*args, **kwargs)
    return decorated

def register_user():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    currency = data.get("currency", "₹").strip()

    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    if not full_name:
        return jsonify({"error": "Full name is required"}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "An account with this email already exists"}), 409

    hashed_pw = generate_password_hash(password, method="pbkdf2:sha256")
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, currency)
        VALUES (?, ?, ?, ?)
    """, (email, hashed_pw, full_name, currency))
    user_id = cursor.lastrowid
    conn.commit()

    # Automatically seed sample transactions for a rich first-run experience
    seed_sample_data(user_id)

    cursor.execute("SELECT id, email, full_name, currency, theme, alert_threshold FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    conn.close()

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
    cursor.execute("SELECT id, email, password_hash, full_name, currency, theme, alert_threshold FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or not check_password_hash(user_row["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    user = {
        "id": user_row["id"],
        "email": user_row["email"],
        "full_name": user_row["full_name"],
        "currency": user_row["currency"],
        "theme": user_row["theme"],
        "alert_threshold": user_row["alert_threshold"]
    }
    token = create_token(user["id"], user["email"])

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user
    }), 200
