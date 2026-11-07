import unittest
import os
import json
import tempfile

# Temporary isolated DB for tests
test_db_fd, test_db_path = tempfile.mkstemp(suffix=".db")
os.environ["DATABASE_PATH"] = test_db_path
os.environ["SECRET_KEY"] = "finai-test-secret-key-that-is-at-least-32-bytes-long-2026"

from app import create_app
from database import init_db

class FinAIMultiUserTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        try:
            os.close(test_db_fd)
            os.unlink(test_db_path)
        except Exception:
            pass

    def test_01_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["status"], "online")

    def test_02_user_a_registers_with_zero_records(self):
        """TEST 1: User A registers a new account. Expected: Empty personal dashboard."""
        reg_payload = {
            "full_name": "User Alpha",
            "email": "user.a@finai.io",
            "password": "password123",
            "currency": "₹"
        }
        resp = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertIn("token", data)
        token = data["token"]

        headers = {"Authorization": f"Bearer {token}"}

        # Verify User A starts with ZERO transactions
        tx_resp = self.client.get("/api/transactions", headers=headers)
        self.assertEqual(tx_resp.status_code, 200)
        self.assertEqual(tx_resp.get_json()["total"], 0)
        self.assertEqual(len(tx_resp.get_json()["transactions"]), 0)

        # Verify User A overview starts at ₹0
        ov_resp = self.client.get("/api/analytics/overview", headers=headers)
        self.assertEqual(ov_resp.status_code, 200)
        ov = ov_resp.get_json()
        self.assertEqual(ov["total_balance"], 0.0)
        self.assertEqual(ov["current_month"]["income"], 0.0)
        self.assertEqual(ov["current_month"]["expense"], 0.0)
        self.assertEqual(ov["current_month"]["savings"], 0.0)

        # Verify AI assistant asks to add transactions first
        ai_resp = self.client.post("/api/ai/chat", json={"message": "Where did I spend the most money?"}, headers=headers)
        self.assertEqual(ai_resp.status_code, 200)
        self.assertIn("No Financial Records Found", ai_resp.get_json()["response"])

    def test_03_user_a_adds_income_and_expense(self):
        """TEST 2: User A adds ₹5,000 income and ₹1,000 expense. Expected: Correct personal balance."""
        login_resp = self.client.post("/api/auth/login", json={
            "email": "user.a@finai.io",
            "password": "password123"
        })
        token_a = login_resp.get_json()["token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 1. Add Income ₹5,000
        inc_payload = {
            "type": "income",
            "amount": 5000.0,
            "category": "Salary",
            "payment_method": "Bank Transfer",
            "description": "Consulting Stipend",
            "date": "2026-11-05"
        }
        resp1 = self.client.post("/api/transactions", json=inc_payload, headers=headers_a)
        self.assertEqual(resp1.status_code, 201)

        # 2. Add Expense ₹1,000
        exp_payload = {
            "type": "expense",
            "amount": 1000.0,
            "category": "Food",
            "payment_method": "Credit Card",
            "description": "Weekly Dining",
            "date": "2026-11-06"
        }
        resp2 = self.client.post("/api/transactions", json=exp_payload, headers=headers_a)
        self.assertEqual(resp2.status_code, 201)
        self.__class__.user_a_tx_id = resp2.get_json()["transaction"]["id"]

        # Check User A balance: 5000 - 1000 = 4000
        ov_resp = self.client.get("/api/analytics/overview?year=2026&month=11", headers=headers_a)
        self.assertEqual(ov_resp.status_code, 200)
        ov = ov_resp.get_json()
        self.assertEqual(ov["total_balance"], 4000.0)
        self.assertEqual(ov["current_month"]["income"], 5000.0)
        self.assertEqual(ov["current_month"]["expense"], 1000.0)
        self.assertEqual(ov["current_month"]["savings"], 4000.0)

    def test_04_user_b_registers_and_isolation_check(self):
        """TEST 4 & 5: User B registers -> sees ₹0 -> tries to access User A's transaction."""
        reg_b = {
            "full_name": "User Beta",
            "email": "user.b@finai.io",
            "password": "password456",
            "currency": "₹"
        }
        resp = self.client.post("/api/auth/register", json=reg_b)
        self.assertEqual(resp.status_code, 201)
        token_b = resp.get_json()["token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User B must see ZERO income, ZERO expenses, and ZERO balance
        ov_b = self.client.get("/api/analytics/overview?year=2026&month=11", headers=headers_b)
        self.assertEqual(ov_b.status_code, 200)
        self.assertEqual(ov_b.get_json()["total_balance"], 0.0)
        self.assertEqual(ov_b.get_json()["current_month"]["income"], 0.0)
        self.assertEqual(ov_b.get_json()["current_month"]["expense"], 0.0)

        # User B must see ZERO transactions in their ledger
        tx_b = self.client.get("/api/transactions", headers=headers_b)
        self.assertEqual(tx_b.status_code, 200)
        self.assertEqual(tx_b.get_json()["total"], 0)

        # User B attempts to access or modify User A's transaction
        tx_id_a = getattr(self.__class__, "user_a_tx_id", 1)
        hack_resp = self.client.put(f"/api/transactions/{tx_id_a}", json={"amount": 99999.0}, headers=headers_b)
        self.assertEqual(hack_resp.status_code, 404)

        hack_del = self.client.delete(f"/api/transactions/{tx_id_a}", headers=headers_b)
        self.assertEqual(hack_del.status_code, 404)

    def test_05_user_a_logs_in_and_data_is_persisted(self):
        """TEST 7: User A logs back in. Expected: User A original records (₹4,000 balance) are fully preserved."""
        login_resp = self.client.post("/api/auth/login", json={
            "email": "user.a@finai.io",
            "password": "password123"
        })
        self.assertEqual(login_resp.status_code, 200)
        token_a = login_resp.get_json()["token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Transactions count should still be exactly 2
        tx_resp = self.client.get("/api/transactions", headers=headers_a)
        self.assertEqual(tx_resp.status_code, 200)
        self.assertEqual(tx_resp.get_json()["total"], 2)

        # Overview should still be exactly 4000
        ov_resp = self.client.get("/api/analytics/overview?year=2026&month=11", headers=headers_a)
        self.assertEqual(ov_resp.status_code, 200)
        self.assertEqual(ov_resp.get_json()["total_balance"], 4000.0)

        # AI Assistant should accurately read User A's actual data
        ai_resp = self.client.post("/api/ai/chat", json={"message": "Where did I spend the most money?"}, headers=headers_a)
        self.assertEqual(ai_resp.status_code, 200)
        ans = ai_resp.get_json()["response"]
        self.assertIn("ACTUAL DATA", ans)
        self.assertIn("Food", ans)

if __name__ == "__main__":
    unittest.main()
