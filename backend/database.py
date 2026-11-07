import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "finai.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        currency TEXT DEFAULT '₹',
        theme TEXT DEFAULT 'dark',
        alert_threshold REAL DEFAULT 80.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL CHECK(amount > 0),
        category TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        description TEXT DEFAULT '',
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Budgets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        category TEXT NOT NULL,
        allocated_amount REAL NOT NULL CHECK(allocated_amount > 0),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, year, month, category),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # AI Chat Messages Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        metadata_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_user_date ON transactions(user_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_budget_user_period ON budgets(user_id, year, month);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

    conn.commit()
    conn.close()

def seed_sample_data(user_id):
    """Seed comprehensive, realistic transactions and budgets for new user or demo reset."""
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing data for this user
    cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM budgets WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM ai_messages WHERE user_id = ?", (user_id,))

    now = datetime.now()
    current_year = now.year
    current_month = now.month

    # Generate dates for past 3 months including current month
    # Sample categories:
    # Income: Salary, Freelance, Dividend, Bonus
    # Expense: Housing, Food & Dining, Groceries, Utilities, Transportation, Entertainment, Shopping, Healthcare, Subscriptions, Miscellaneous
    
    categories = {
        "expense": [
            "Housing", "Food & Dining", "Groceries", "Utilities",
            "Transportation", "Entertainment", "Shopping", "Healthcare",
            "Subscriptions", "Miscellaneous"
        ],
        "income": ["Salary", "Freelance", "Investment Returns", "Bonus"]
    }

    # Budgets for current month
    default_budgets = [
        ("Housing", 25000),
        ("Food & Dining", 10000),
        ("Groceries", 8000),
        ("Utilities", 5000),
        ("Transportation", 4500),
        ("Entertainment", 4000),
        ("Shopping", 7000),
        ("Healthcare", 3000),
        ("Subscriptions", 1500),
        ("Miscellaneous", 2000)
    ]

    for cat, amount in default_budgets:
        cursor.execute("""
            INSERT OR REPLACE INTO budgets (user_id, year, month, category, allocated_amount)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, current_year, current_month, cat, float(amount)))

    # Previous month budgets as well
    prev_month = 12 if current_month == 1 else current_month - 1
    prev_year = current_year - 1 if current_month == 1 else current_year
    for cat, amount in default_budgets:
        cursor.execute("""
            INSERT OR REPLACE INTO budgets (user_id, year, month, category, allocated_amount)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, prev_year, prev_month, cat, float(amount)))

    sample_txs = []

    # Current month transactions (relative to today)
    # Income:
    day1_str = f"{current_year:04d}-{current_month:02d}-01"
    day15_str = f"{current_year:04d}-{current_month:02d}-15"
    sample_txs.append(('income', 85000.0, 'Salary', 'Bank Transfer', 'Monthly Tech Lead Salary', day1_str))
    sample_txs.append(('income', 12000.0, 'Freelance', 'UPI / Net Banking', 'UI/UX Consulting Project Milestone', day15_str))

    # Expenses current month
    sample_txs.extend([
        ('expense', 24000.0, 'Housing', 'Bank Transfer', 'Apartment Rent for current month', f"{current_year:04d}-{current_month:02d}-02"),
        ('expense', 3200.0, 'Utilities', 'UPI / Net Banking', 'Electricity & Water Bill', f"{current_year:04d}-{current_month:02d}-04"),
        ('expense', 1199.0, 'Utilities', 'Credit Card', 'High-speed Fiber Broadband', f"{current_year:04d}-{current_month:02d}-05"),
        ('expense', 4850.0, 'Groceries', 'Credit Card', 'Whole foods & organic supplies store', f"{current_year:04d}-{current_month:02d}-06"),
        ('expense', 1450.0, 'Food & Dining', 'UPI / Net Banking', 'Team Dinner at Bistro', f"{current_year:04d}-{current_month:02d}-08"),
        ('expense', 1800.0, 'Transportation', 'Debit Card', 'Monthly Metro Card & Fuel Refill', f"{current_year:04d}-{current_month:02d}-09"),
        ('expense', 1999.0, 'Entertainment', 'Credit Card', 'Concert & IMAX Movie Tickets', f"{current_year:04d}-{current_month:02d}-11"),
        ('expense', 999.0, 'Subscriptions', 'Credit Card', 'Netflix & Spotify Family bundle', f"{current_year:04d}-{current_month:02d}-12"),
        ('expense', 5400.0, 'Shopping', 'Credit Card', 'Noise-cancelling headphones replacement', f"{current_year:04d}-{current_month:02d}-14"),
        ('expense', 2300.0, 'Food & Dining', 'UPI / Net Banking', 'Weekend Gourmet Brunch with friends', f"{current_year:04d}-{current_month:02d}-16"),
        ('expense', 2600.0, 'Groceries', 'Debit Card', 'Weekly supermarket provisions', f"{current_year:04d}-{current_month:02d}-18"),
        ('expense', 1500.0, 'Healthcare', 'UPI / Net Banking', 'Routine health checkup & supplements', f"{current_year:04d}-{current_month:02d}-19"),
        ('expense', 850.0, 'Food & Dining', 'Cash', 'Artisanal Cafe coffee & snacks', f"{current_year:04d}-{current_month:02d}-21"),
        ('expense', 1200.0, 'Transportation', 'UPI / Net Banking', 'Cab rides to airport & city hub', f"{current_year:04d}-{current_month:02d}-23"),
    ])

    # Previous month transactions
    prev_txs = [
        ('income', 85000.0, 'Salary', 'Bank Transfer', 'Monthly Tech Lead Salary', f"{prev_year:04d}-{prev_month:02d}-01"),
        ('income', 18000.0, 'Freelance', 'UPI / Net Banking', 'Fullstack API Contract', f"{prev_year:04d}-{prev_month:02d}-18"),
        ('expense', 24000.0, 'Housing', 'Bank Transfer', 'Apartment Rent', f"{prev_year:04d}-{prev_month:02d}-02"),
        ('expense', 4100.0, 'Utilities', 'UPI / Net Banking', 'Electricity, Gas & Internet', f"{prev_year:04d}-{prev_month:02d}-05"),
        ('expense', 7800.0, 'Groceries', 'Credit Card', 'Supermarket monthly haul', f"{prev_year:04d}-{prev_month:02d}-07"),
        ('expense', 8900.0, 'Food & Dining', 'Credit Card', 'Dining out, cafes, weekend orders', f"{prev_year:04d}-{prev_month:02d}-12"),
        ('expense', 3800.0, 'Transportation', 'Debit Card', 'Fuel & cab commutes', f"{prev_year:04d}-{prev_month:02d}-15"),
        ('expense', 6200.0, 'Shopping', 'Credit Card', 'Winter apparel and essentials', f"{prev_year:04d}-{prev_month:02d}-20"),
        ('expense', 3200.0, 'Entertainment', 'Credit Card', 'Gaming passes & theater', f"{prev_year:04d}-{prev_month:02d}-22"),
        ('expense', 1800.0, 'Healthcare', 'UPI / Net Banking', 'Dental cleanup', f"{prev_year:04d}-{prev_month:02d}-24"),
        ('expense', 999.0, 'Subscriptions', 'Credit Card', 'Cloud backup & streaming', f"{prev_year:04d}-{prev_month:02d}-27")
    ]
    sample_txs.extend(prev_txs)

    # Two months prior
    two_m_prior = 11 if current_month <= 2 else current_month - 2
    two_m_year = current_year - 1 if current_month <= 2 else current_year
    two_m_txs = [
        ('income', 85000.0, 'Salary', 'Bank Transfer', 'Monthly Tech Lead Salary', f"{two_m_year:04d}-{two_m_prior:02d}-01"),
        ('income', 8000.0, 'Investment Returns', 'Bank Transfer', 'Quarterly Mutual Fund Dividend', f"{two_m_year:04d}-{two_m_prior:02d}-15"),
        ('expense', 24000.0, 'Housing', 'Bank Transfer', 'Apartment Rent', f"{two_m_year:04d}-{two_m_prior:02d}-02"),
        ('expense', 7200.0, 'Groceries', 'Credit Card', 'Fresh produce & groceries', f"{two_m_year:04d}-{two_m_prior:02d}-08"),
        ('expense', 6500.0, 'Food & Dining', 'UPI / Net Banking', 'Restaurants and food deliveries', f"{two_m_year:04d}-{two_m_prior:02d}-14"),
        ('expense', 3500.0, 'Utilities', 'UPI / Net Banking', 'Utility bills', f"{two_m_year:04d}-{two_m_prior:02d}-17"),
        ('expense', 4000.0, 'Transportation', 'Debit Card', 'Vehicle servicing & transit', f"{two_m_year:04d}-{two_m_prior:02d}-21")
    ]
    sample_txs.extend(two_m_txs)

    for tx in sample_txs:
        cursor.execute("""
            INSERT INTO transactions (user_id, type, amount, category, payment_method, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, tx[0], tx[1], tx[2], tx[3], tx[4], tx[5]))

    conn.commit()
    conn.close()
