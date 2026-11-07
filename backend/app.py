import os
from flask import Flask, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import init_db
from auth import register_user, login_user, logout_user
from routes.transactions import transactions_bp
from routes.budgets import budgets_bp
from routes.analytics import analytics_bp
from routes.ai_advisor import ai_advisor_bp
from routes.user import user_bp

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "finai-production-jwt-and-session-secret-key-2026-min-32-chars")
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    # Configure CORS to allow frontend communication with credentials
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize SQLite schema
    with app.app_context():
        init_db()

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "online",
            "service": "FinAI Smart Personal Finance Assistant",
            "version": "2.0.0"
        }), 200

    # Auth routes
    @app.route("/api/auth/register", methods=["POST"])
    def register():
        return register_user()

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        return login_user()

    @app.route("/api/auth/logout", methods=["POST"])
    def logout():
        return logout_user()

    # Register modular blueprints
    app.register_blueprint(transactions_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_advisor_bp)
    app.register_blueprint(user_bp)

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "details": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5050))
    print(f"🚀 FinAI Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
