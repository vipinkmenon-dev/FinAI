import unittest
import os
import json
import tempfile

# Use temporary DB for tests
test_db_fd, test_db_path = tempfile.mkstemp(suffix=".db")
os.environ["DATABASE_PATH"] = test_db_path
os.environ["SECRET_KEY"] = "finai-test-secret-key-that-is-at-least-32-bytes-long-2026"

from app import create_app
from database import init_db

class FinAITestCase(unittest.TestCase):
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
        data = resp.get_json()
        self.assertEqual(data["status"], "online")

    def test_02_registration_and_login(self):
        # Register user
        reg_payload = {
            "email": "testuser@finai.io",
            "password": "password123",
            "full_name": "Test FinAI User",
            "currency": "₹"
        }
        resp = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "testuser@finai.io")
        token = data["token"]

        # Duplicate registration should fail
        dup_resp = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(dup_resp.status_code, 409)

        # Login user
        login_resp = self.client.post("/api/auth/login", json={
            "email": "testuser@finai.io",
            "password": "password123"
        })
        self.assertEqual(login_resp.status_code, 200)
        login_data = login_resp.get_json()
        self.assertIn("token", login_data)

        # Wrong password
        bad_login = self.client.post("/api/auth/login", json={
            "email": "testuser@finai.io",
            "password": "wrongpassword"
        })
        self.assertEqual(bad_login.status_code, 401)

    def _get_auth_header(self):
        login_resp = self.client.post("/api/auth/login", json={
            "email": "testuser@finai.io",
            "password": "password123"
        })
        token = login_resp.get_json()["token"]
        return {"Authorization": f"Bearer {token}"}

    def test_03_transactions_crud(self):
        headers = self._get_auth_header()

        # 1. Fetch seeded transactions
        resp = self.client.get("/api/transactions", headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(len(data["transactions"]) > 0)
        initial_count = data["total"]

        # 2. Create new transaction
        new_tx = {
            "type": "expense",
            "amount": 1250.00,
            "category": "Food & Dining",
            "payment_method": "Credit Card",
            "description": "Artisan Coffee & Lunch",
            "date": "2026-11-05"
        }
        create_resp = self.client.post("/api/transactions", json=new_tx, headers=headers)
        self.assertEqual(create_resp.status_code, 201)
        created_item = create_resp.get_json()["transaction"]
        tx_id = created_item["id"]
        self.assertEqual(created_item["amount"], 1250.00)

        # 3. Update transaction
        update_resp = self.client.put(f"/api/transactions/{tx_id}", json={
            "amount": 1350.00,
            "description": "Artisan Coffee, Pastry & Lunch"
        }, headers=headers)
        self.assertEqual(update_resp.status_code, 200)
        updated_item = update_resp.get_json()["transaction"]
        self.assertEqual(updated_item["amount"], 1350.00)
        self.assertEqual(updated_item["description"], "Artisan Coffee, Pastry & Lunch")

        # 4. Filter and search
        search_resp = self.client.get("/api/transactions?search=Artisan", headers=headers)
        self.assertEqual(search_resp.status_code, 200)
        self.assertTrue(any(t["id"] == tx_id for t in search_resp.get_json()["transactions"]))

        # 5. Delete transaction
        del_resp = self.client.delete(f"/api/transactions/{tx_id}", headers=headers)
        self.assertEqual(del_resp.status_code, 200)

    def test_04_budgets_and_alerts(self):
        headers = self._get_auth_header()

        # Upsert budget
        budget_payload = {
            "year": 2026,
            "month": 11,
            "category": "Entertainment",
            "allocated_amount": 5000.0
        }
        resp = self.client.post("/api/budgets", json=budget_payload, headers=headers)
        self.assertEqual(resp.status_code, 201)

        # Get budgets
        get_resp = self.client.get("/api/budgets?year=2026&month=11", headers=headers)
        self.assertEqual(get_resp.status_code, 200)
        budgets_data = get_resp.get_json()
        self.assertIn("budgets", budgets_data)
        self.assertTrue(len(budgets_data["budgets"]) > 0)

        # Get alerts
        alerts_resp = self.client.get("/api/budgets/alerts", headers=headers)
        self.assertEqual(alerts_resp.status_code, 200)
        self.assertIn("alerts", alerts_resp.get_json())

    def test_05_analytics(self):
        headers = self._get_auth_header()

        # Overview
        overview_resp = self.client.get("/api/analytics/overview?year=2026&month=11", headers=headers)
        self.assertEqual(overview_resp.status_code, 200)
        ov = overview_resp.get_json()
        self.assertIn("current_month", ov)
        self.assertIn("income", ov["current_month"])
        self.assertIn("expense", ov["current_month"])
        self.assertIn("savings", ov["current_month"])

        # Monthly Trend
        trend_resp = self.client.get("/api/analytics/monthly-trend", headers=headers)
        self.assertEqual(trend_resp.status_code, 200)
        self.assertIn("trend", trend_resp.get_json())

        # Category Breakdown
        cat_resp = self.client.get("/api/analytics/category-breakdown?year=2026&month=11", headers=headers)
        self.assertEqual(cat_resp.status_code, 200)
        self.assertIn("categories", cat_resp.get_json())

        # Payment Methods
        pm_resp = self.client.get("/api/analytics/payment-methods?year=2026&month=11", headers=headers)
        self.assertEqual(pm_resp.status_code, 200)
        self.assertIn("methods", pm_resp.get_json())

        # Yearly Report
        rep_resp = self.client.get("/api/analytics/report?year=2026", headers=headers)
        self.assertEqual(rep_resp.status_code, 200)
        self.assertIn("yearly_totals", rep_resp.get_json())

    def test_06_ai_advisor(self):
        headers = self._get_auth_header()

        # 1. "Where did I spend the most money?"
        q1 = self.client.post("/api/ai/chat", json={"message": "Where did I spend the most money?"}, headers=headers)
        self.assertEqual(q1.status_code, 200)
        ans1 = q1.get_json()["response"]
        self.assertIn("ACTUAL DATA", ans1)
        self.assertTrue("Housing" in ans1 or "Category" in ans1)

        # 2. "How much did I save this month?"
        q2 = self.client.post("/api/ai/chat", json={"message": "How much did I save this month?"}, headers=headers)
        self.assertEqual(q2.status_code, 200)
        ans2 = q2.get_json()["response"]
        self.assertIn("ACTUAL DATA", ans2)
        self.assertIn("Net Savings", ans2)

        # 3. "Can I save ₹5,000 next month?"
        q3 = self.client.post("/api/ai/chat", json={"message": "Can I save ₹5,000 next month?"}, headers=headers)
        self.assertEqual(q3.status_code, 200)
        ans3 = q3.get_json()["response"]
        self.assertTrue("5,000" in ans3)

        # 4. "Identify unnecessary spending"
        q4 = self.client.post("/api/ai/chat", json={"message": "Identify unnecessary spending"}, headers=headers)
        self.assertEqual(q4.status_code, 200)
        ans4 = q4.get_json()["response"]
        self.assertIn("Discretionary", ans4)

        # 5. "Predict monthly expenses"
        q5 = self.client.post("/api/ai/chat", json={"message": "Predict monthly expenses based on historical data"}, headers=headers)
        self.assertEqual(q5.status_code, 200)
        ans5 = q5.get_json()["response"]
        self.assertIn("PROJECTED ESTIMATE", ans5)

        # 6. Check chat history
        hist_resp = self.client.get("/api/ai/messages", headers=headers)
        self.assertEqual(hist_resp.status_code, 200)
        self.assertEqual(len(hist_resp.get_json()["messages"]), 10) # 5 user + 5 assistant

    def test_07_user_profile(self):
        headers = self._get_auth_header()

        # Get profile
        resp = self.client.get("/api/user/profile", headers=headers)
        self.assertEqual(resp.status_code, 200)
        user = resp.get_json()["user"]
        self.assertEqual(user["currency"], "₹")

        # Update profile
        update_resp = self.client.put("/api/user/profile", json={
            "full_name": "Senior Lead Dev",
            "currency": "₹",
            "alert_threshold": 85.0
        }, headers=headers)
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.get_json()["user"]["full_name"], "Senior Lead Dev")

if __name__ == "__main__":
    unittest.main()
