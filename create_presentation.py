import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# Initialize Presentation with 16:9 widescreen
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

blank_layout = prs.slide_layouts[6]

# Theme Colors
COLOR_BLACK = RGBColor(10, 10, 10)       # #0A0A0A
COLOR_WHITE = RGBColor(255, 255, 255)   # #FFFFFF
COLOR_GRAY_BG = RGBColor(248, 248, 248) # #F8F8F8
COLOR_CARD_BORDER = RGBColor(229, 229, 229) # #E5E5E5
COLOR_TEXT_PRIMARY = RGBColor(17, 17, 17)   # #111111
COLOR_TEXT_SECONDARY = RGBColor(102, 102, 102) # #666666
COLOR_TEXT_MUTED = RGBColor(140, 140, 140)     # #8C8C8C
COLOR_DARK_CARD = RGBColor(20, 20, 20)         # #141414
COLOR_DARK_BORDER = RGBColor(45, 45, 45)       # #2D2D2D

ASSETS_DIR = "/Users/vipinkumar/FinAI/presentation_assets"

def set_slide_background(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_header(slide, badge_text, title_text, subtitle_text, dark=False):
    # Badge
    badge_box = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(0.8), Inches(0.55), Inches(3.2), Inches(0.32)
    )
    badge_box.fill.solid()
    if dark:
        badge_box.fill.fore_color.rgb = RGBColor(35, 35, 35)
        badge_box.line.color.rgb = RGBColor(70, 70, 70)
        badge_box.line.width = Pt(1)
        text_color = RGBColor(220, 220, 220)
    else:
        badge_box.fill.fore_color.rgb = COLOR_BLACK
        badge_box.line.color.rgb = COLOR_BLACK
        badge_box.line.width = Pt(1)
        text_color = COLOR_WHITE
    
    tf = badge_box.text_frame
    tf.text = badge_text.upper()
    tf.margin_left = Inches(0.15)
    tf.margin_top = Inches(0.04)
    p = tf.paragraphs[0]
    p.font.name = "Arial"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = text_color
    p.alignment = PP_ALIGN.LEFT

    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.95), Inches(11.7), Inches(0.6))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.name = "Arial"
    p_title.font.size = Pt(26)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE if dark else COLOR_TEXT_PRIMARY

    # Subtitle
    sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.55), Inches(11.7), Inches(0.4))
    tf_sub = sub_box.text_frame
    tf_sub.word_wrap = True
    tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_right = tf_sub.margin_bottom = 0
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = subtitle_text
    p_sub.font.name = "Arial"
    p_sub.font.size = Pt(12)
    p_sub.font.color.rgb = RGBColor(180, 180, 180) if dark else COLOR_TEXT_SECONDARY

def add_card(slide, left, top, width, height, title, items, dark=False, badge=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    if dark:
        shape.fill.fore_color.rgb = COLOR_DARK_CARD
        shape.line.color.rgb = COLOR_DARK_BORDER
    else:
        shape.fill.fore_color.rgb = COLOR_GRAY_BG
        shape.line.color.rgb = COLOR_CARD_BORDER
    shape.line.width = Pt(1)

    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_right = Inches(0.25)
    tf.margin_top = Inches(0.25)
    tf.margin_bottom = Inches(0.2)

    if badge:
        p_badge = tf.paragraphs[0]
        p_badge.text = badge.upper()
        p_badge.font.name = "Arial"
        p_badge.font.size = Pt(9)
        p_badge.font.bold = True
        p_badge.font.color.rgb = RGBColor(160, 160, 160) if dark else COLOR_TEXT_MUTED
        p_badge.space_after = Pt(4)
        p_title = tf.add_paragraph()
    else:
        p_title = tf.paragraphs[0]

    p_title.text = title
    p_title.font.name = "Arial"
    p_title.font.size = Pt(14)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE if dark else COLOR_TEXT_PRIMARY
    p_title.space_after = Pt(10)

    for item in items:
        p_item = tf.add_paragraph()
        p_item.text = f"•  {item}"
        p_item.font.name = "Arial"
        p_item.font.size = Pt(10.5)
        p_item.font.color.rgb = RGBColor(210, 210, 210) if dark else COLOR_TEXT_SECONDARY
        p_item.space_after = Pt(6)

    return shape

def add_speaker_note(slide, text):
    notes_slide = slide.notes_slide
    tf = notes_slide.notes_text_frame
    tf.text = text

# ==============================================================================
# SLIDE 1: Title Slide (Executive Dark Theme)
# ==============================================================================
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1, COLOR_BLACK)

# Top badge
badge1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(3.6), Inches(0.36))
badge1.fill.solid()
badge1.fill.fore_color.rgb = RGBColor(30, 30, 30)
badge1.line.color.rgb = RGBColor(70, 70, 70)
badge1.line.width = Pt(1)
tf1_b = badge1.text_frame
tf1_b.text = "FINAI 2.0 • PRODUCTION PLATFORM"
p = tf1_b.paragraphs[0]
p.font.name = "Arial"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = RGBColor(230, 230, 230)

# Main Title
title_box1 = slide1.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(1.8))
tf1_t = title_box1.text_frame
tf1_t.word_wrap = True
p1_t = tf1_t.paragraphs[0]
p1_t.text = "FINAL: AI Personal Finance Manager"
p1_t.font.name = "Arial"
p1_t.font.size = Pt(40)
p1_t.font.bold = True
p1_t.font.color.rgb = COLOR_WHITE

p1_s = tf1_t.add_paragraph()
p1_s.text = "Intelligent Multi-User Financial Advisory, Grounded Analytics & Real-Time Cash Flow Engine"
p1_s.font.name = "Arial"
p1_s.font.size = Pt(16)
p1_s.font.color.rgb = RGBColor(170, 170, 170)
p1_s.space_before = Pt(12)

# Divider Line
line1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(4.0), Inches(11.733), Inches(0.02))
line1.fill.solid()
line1.fill.fore_color.rgb = RGBColor(50, 50, 50)
line1.line.color.rgb = RGBColor(50, 50, 50)

# 3 Highlights Cards at Bottom
card_w = Inches(3.64)
c1 = add_card(slide1, Inches(0.8), Inches(4.4), card_w, Inches(2.2), "Modern Tech Stack", [
    "Frontend: React.js (v18) + Vite",
    "Backend: Python Flask & REST API",
    "Database: SQLite with Foreign Keys",
    "AI Engine: Google Gemini 1.5 Flash"
], dark=True, badge="CORE ARCHITECTURE")

c2 = add_card(slide1, Inches(4.84), Inches(4.4), card_w, Inches(2.2), "Enterprise Security", [
    "Strict multi-user isolation",
    "Salted PBKDF2-SHA256 password hashing",
    "HTTP-only authenticated sessions",
    "Zero-trust server-side validation"
], dark=True, badge="SECURITY & PRIVACY")

c3 = add_card(slide1, Inches(8.88), Inches(4.4), card_w, Inches(2.2), "Key Capabilities", [
    "Live cash flow KPI tracking",
    "Budget overage alert system",
    "Grounded AI transaction insights",
    "Zero-data cold start onboarding"
], dark=True, badge="PRODUCTION HIGHLIGHTS")

add_speaker_note(slide1, 
    "Good day, everyone. Today I am presenting 'FINAL – AI Personal Finance Manager' (FinAI), a production-grade personal finance management and intelligent advisory platform.\n\n"
    "FinAI was engineered from the ground up to address critical shortcomings in existing personal finance applications: lack of strict multi-user isolation, noisy demo data that pollutes fresh accounts, and hallucinating AI chatbots that invent non-existent financial numbers.\n\n"
    "Throughout this presentation, I will demonstrate how FinAI solves these challenges using a robust React and Flask architecture, a secure SQLite relational schema, and a grounded AI advisory engine powered by Google Gemini 1.5 Flash. Every screenshot and technical feature presented here is live and running in our local production environment."
)

# ==============================================================================
# SLIDE 2: Problem Statement & Engineering Philosophy
# ==============================================================================
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2, COLOR_WHITE)
add_header(slide2, "PROBLEM STATEMENT & PHILOSOPHY", "Rethinking Personal Finance Management", "Addressing Data Isolation, Demo Record Pollution, and AI Hallucinations")

# 3 Pillars comparison cards
col_w = Inches(3.64)
add_card(slide2, Inches(0.8), Inches(2.2), col_w, Inches(4.6), "1. Multi-User Isolation", [
    "Industry Flaw: Many local finance tools either lack user authentication or leak state across sessions using hardcoded demo user IDs.",
    "FinAI Engineering: Enforces strict multi-user relational architecture in SQLite.",
    "Zero-Trust Policy: All API queries are strictly filtered by authenticated session['user_id'].",
    "IDOR Prevention: Client-supplied IDs in payloads are rejected; data ownership is verified server-side."
], badge="TENANT INTEGRITY")

add_card(slide2, Inches(4.84), Inches(2.2), col_w, Inches(4.6), "2. Zero-Demo Onboarding", [
    "Industry Flaw: Apps often seed 30+ fake transactions on registration, confusing users and distorting genuine budgeting calculations.",
    "FinAI Engineering: Dedicated clean database schema with zero demo pollution.",
    "Pristine Starting Ledger: Newly registered users start with exactly ₹0.00 balance, 0 transactions, and 0 budgets.",
    "Friendly Onboarding: Intelligent empty states guide the user to log their first genuine transaction."
], badge="CLEAN LEDGER")

add_card(slide2, Inches(8.88), Inches(2.2), col_w, Inches(4.6), "3. Grounded AI Advisory", [
    "Industry Flaw: Generic LLMs hallucinate financial balances, invent categories, and offer unverifiable generic advice.",
    "FinAI Engineering: Dual-engine AI architecture combining Gemini 1.5 with deterministic local heuristics.",
    "Transaction Grounding: Real user metrics are injected into system prompts.",
    "Explicit Labeling: Clearly separates verified facts [ACTUAL DATA] from financial forecasts [PROJECTED ESTIMATE]."
], badge="FACTUAL AI")

add_speaker_note(slide2,
    "On Slide 2, we explore the core problems that motivated the architecture of FinAI.\n\n"
    "First, data isolation: In many prototype finance applications, authentication is either simulated or client-side, making it easy for one user to view or modify another's records. In FinAI, every database table enforces foreign key relationships tied to a specific user ID, and our Flask backend resolves identity exclusively from the secure session cookie.\n\n"
    "Second, the zero-demo onboarding philosophy: Users do not want to register for a finance tracker only to find ₹40,000 in fake transactions pre-populated. We eliminated all legacy demo seeds. A new user begins with a clean slate: ₹0.00 balance, zero transactions, and clear onboarding call-to-actions.\n\n"
    "Third, grounding the AI: When users ask 'Where did I spend the most money?', the AI must never guess. Our backend computes actual mathematical aggregates from SQLite and injects them into the Gemini prompt, enforcing strict labeling between verified actual numbers and forward-looking projections."
)

# ==============================================================================
# SLIDE 3: System Architecture Diagram
# ==============================================================================
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3, COLOR_WHITE)
add_header(slide3, "SYSTEM ARCHITECTURE", "End-to-End System Architecture & Data Flow", "Four-Tier High Integrity Architecture: Client, API Gateway, Relational Store & AI Engine")

# Draw 4 Tier horizontal blocks with connectors
tier_y = Inches(2.2)
tier_h = Inches(4.6)
tier_w = Inches(2.68)
gap = Inches(0.33)

# Tier 1
t1 = add_card(slide3, Inches(0.8), tier_y, tier_w, tier_h, "Tier 1: Client", [
    "React 18 & Vite SPA",
    "Tailwind CSS B&W Theme",
    "Recharts Visual Engine",
    "Protected Route Guards",
    "Auth & App Contexts",
    "Lucide React Icons",
    "Zero CSS Framework Bloat"
], badge="PRESENTATION LAYER")

# Tier 2
t2 = add_card(slide3, Inches(0.8) + tier_w + gap, tier_y, tier_w, tier_h, "Tier 2: API Gateway", [
    "Python Flask REST API",
    "Flask-CORS (Credentials)",
    "Session Cookie Auth",
    "PBKDF2 Password Hash",
    "Input Sanitization",
    "Error & Exception Handlers",
    "Secure Route Decorators"
], badge="SECURITY & BUSINESS")

# Tier 3
t3 = add_card(slide3, Inches(0.8) + (tier_w + gap)*2, tier_y, tier_w, tier_h, "Tier 3: Database", [
    "SQLite 3 Relational DB",
    "PRAGMA foreign_keys = ON",
    "Tables: users, transactions, budgets, settings, ai_msgs",
    "Foreign Key Cascades",
    "user_id Query Filtration",
    "ACID-Compliant State"
], badge="PERSISTENCE LAYER")

# Tier 4
t4 = add_card(slide3, Inches(0.8) + (tier_w + gap)*3, tier_y, tier_w, tier_h, "Tier 4: AI Engine", [
    "Context Grounding Engine",
    "Live Summary Aggregator",
    "Google Gemini 1.5 Flash",
    "Fallback NLP Rule Parser",
    "Factual Tagging Protocol",
    "Server-Side Secret Key",
    "Dual-Mode Availability"
], badge="INTELLIGENCE LAYER")

add_speaker_note(slide3,
    "Slide 3 illustrates the four-tier architectural model of FinAI.\n\n"
    "Tier 1 is our client presentation layer, implemented as a React 18 single-page application bundled with Vite. It features protected route guards, responsive Lucide icons, and Recharts visualization components wrapped in our high-contrast black-and-white design system.\n\n"
    "Tier 2 is the Flask API gateway. Communication between React and Flask is over REST with HTTP-only session cookies and CORS credentials enabled. It handles salted PBKDF2 password verification, request validation, and access control decorators.\n\n"
    "Tier 3 is our relational persistence layer. We use SQLite with explicit foreign key enforcement enabled on every connection. Tables include users, transactions, budgets, settings, and chat history. Crucially, all database queries execute strictly under the filter WHERE user_id = session['user_id'].\n\n"
    "Tier 4 is our AI advisory engine. When an inquiry is submitted, our backend compiles an aggregated financial snapshot (income, expenses, category spending) and injects it into Google Gemini 1.5 Flash. If the user operates offline or without an API key, our deterministic local NLP fallback answers immediately with zero downtime."
)

# ==============================================================================
# SLIDE 4: Technology Stack & Architectural Roles
# ==============================================================================
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4, COLOR_WHITE)
add_header(slide4, "ENGINEERING CHOICES", "Technology Stack & Architectural Roles", "Modern, Lightweight, Production-Grade Technologies with Zero Unnecessary Bloat")

grid_w = Inches(5.66)
grid_h = Inches(2.2)

# Card 1: Frontend
add_card(slide4, Inches(0.8), Inches(2.2), grid_w, grid_h, "Frontend: React 18 + Vite + Tailwind", [
    "React 18: Component-driven architecture, custom AuthContext, fast state management.",
    "Vite: Instant Hot Module Replacement (HMR) and optimized ES-module production builds.",
    "Tailwind CSS: Strict monochrome palette (#000000, #FFFFFF, #E5E5E5) with zero runtime CSS overhead.",
    "Recharts: SVG-based responsive charting for cash flow, category donuts, and savings trajectories."
], badge="UI & VISUALIZATION")

# Card 2: Backend
add_card(slide4, Inches(6.86), Inches(2.2), grid_w, grid_h, "Backend: Python Flask & REST API", [
    "Python 3.9+ & Flask: Lightweight, transparent request lifecycle with dedicated blueprint modularity.",
    "Werkzeug Security: Robust PBKDF2-SHA256 password hashing with unique salt generation.",
    "Flask-CORS: Configured with supports_credentials=True for secure browser cookie exchange.",
    "Python Dotenv: Secure externalized management of environment variables and Gemini API keys."
], badge="API & AUTHENTICATION")

# Card 3: Database
add_card(slide4, Inches(0.8), Inches(4.6), grid_w, grid_h, "Database: SQLite Relational Schema", [
    "SQLite 3: Zero-configuration, serverless, self-contained ACID-compliant database engine.",
    "Relational Integrity: PRAGMA foreign_keys = ON enforced on every active connection pool.",
    "Indexed Data Retrieval: Indexed queries on user_id, transaction_date, and category.",
    "Cascading Deletions: Safe, automatic cleanup of child records when parent user entities are updated."
], badge="RELATIONAL PERSISTENCE")

# Card 4: AI Engine
add_card(slide4, Inches(6.86), Inches(4.6), grid_w, grid_h, "AI Engine: Google Gemini 1.5 Flash", [
    "Google Gemini 1.5 Flash: Sub-second inference latency, large context window, high reasoning capacity.",
    "Prompt Engineering: System instructions forbid ungrounded calculations; mandate factual badges.",
    "Context Grounding: Financial metrics calculated dynamically from SQLite before LLM payload creation.",
    "Local Heuristic Fallback: Pattern-matching NLP engine guarantees uninterrupted service."
], badge="ARTIFICIAL INTELLIGENCE")

add_speaker_note(slide4,
    "Slide 4 details our engineering choices and the architectural role of each technology.\n\n"
    "On the frontend, React 18 and Vite provide lightning-fast compilation and instant user interactions. Recharts offers native SVG charting that seamlessly renders financial breakdowns without heavy charting bundles. Tailwind CSS allows us to enforce our strict black-and-white theme with zero layout shifts.\n\n"
    "On the backend, Flask gives us direct control over headers, cookies, and route lifecycle. We use Werkzeug's PBKDF2-SHA256 hashing to guarantee that plain-text passwords never touch the database.\n\n"
    "For the database, SQLite was chosen for its reliability, zero external daemon overhead, and native ACID compliance. By turning on foreign key PRAGMAs, we maintain enterprise-grade referential integrity.\n\n"
    "Finally, Google Gemini 1.5 Flash provides state-of-the-art natural language reasoning. Because financial advice requires utmost accuracy, we pair Gemini with a real-time data aggregator and a local deterministic fallback engine."
)

# ==============================================================================
# SLIDE 5: Multi-User Database Schema & Data Isolation
# ==============================================================================
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5, COLOR_WHITE)
add_header(slide5, "DATA ARCHITECTURE", "Multi-User Database Schema & Isolation Model", "Enforced Foreign Key Constraints, Tenant Isolation, and Zero-Demo Defaults")

# 5 Schema Cards horizontally/grid
sc_w = Inches(3.64)
sc_h = Inches(2.2)

add_card(slide5, Inches(0.8), Inches(2.2), sc_w, sc_h, "Table: users", [
    "id: INTEGER PRIMARY KEY AUTOINCREMENT",
    "full_name: TEXT NOT NULL",
    "email: TEXT UNIQUE NOT NULL",
    "password_hash: TEXT NOT NULL (PBKDF2)",
    "created_at / updated_at: TIMESTAMP"
], badge="USER IDENTITY")

add_card(slide5, Inches(4.84), Inches(2.2), sc_w, sc_h, "Table: transactions", [
    "id: INTEGER PRIMARY KEY AUTOINCREMENT",
    "user_id: INTEGER (FK -> users.id)",
    "transaction_type: 'income' | 'expense'",
    "amount: REAL NOT NULL, category: TEXT",
    "payment_method: TEXT, transaction_date: DATE"
], badge="FINANCIAL LEDGER")

add_card(slide5, Inches(8.88), Inches(2.2), sc_w, sc_h, "Table: budgets", [
    "id: INTEGER PRIMARY KEY AUTOINCREMENT",
    "user_id: INTEGER (FK -> users.id)",
    "category: TEXT NOT NULL",
    "monthly_limit: REAL NOT NULL",
    "month: INTEGER, year: INTEGER"
], badge="SPENDING LIMITS")

# Bottom row: user_settings and isolation rules
add_card(slide5, Inches(0.8), Inches(4.6), sc_w, sc_h, "Table: user_settings & ai_messages", [
    "user_settings: id, user_id (FK), currency ('₹'), preferences (JSON)",
    "ai_messages: id, user_id (FK), role ('user'|'assistant'), message, timestamp",
    "Complete conversation history isolation per user."
], badge="SETTINGS & CHAT")

# Bottom wide card: Data Isolation Principles
add_card(slide5, Inches(4.84), Inches(4.6), Inches(7.68), sc_h, "Enforced Multi-Tenant Isolation Rules", [
    "Zero-Trust Backend: API controllers never trust a user ID passed in JSON or URL query strings.",
    "Session Ownership: User identity is extracted exclusively from verified server-side session['user_id'].",
    "Referential Integrity: PRAGMA foreign_keys = ON ensures child records cannot exist without a valid parent user.",
    "Pristine Starting Ledger: Newly registered accounts start with 0 transactions, 0 budgets, and ₹0.00 total balance."
], badge="SECURITY GUARANTEES")

add_speaker_note(slide5,
    "Slide 5 outlines our relational database schema and tenant isolation rules.\n\n"
    "We maintain five normalized tables in SQLite: 'users', 'transactions', 'budgets', 'user_settings', and 'ai_messages'. Every single table except 'users' has an explicit user_id foreign key that cascades on delete.\n\n"
    "The core security guarantee is that Insecure Direct Object References (IDOR) are architecturally impossible. Even if a malicious user attempts to modify a transaction ID belonging to another user, our SQL queries execute with: WHERE id = ? AND user_id = session['user_id']. If the row does not belong to the active session user, the query updates zero rows and returns an unauthorized error.\n\n"
    "Furthermore, we enforced a clean database rule: all legacy demo records were purged. New accounts initialize with zero financial records, guaranteeing complete privacy and a clean financial slate."
)

# ==============================================================================
# SLIDE 6: Core Features: Landing & Personal Dashboard
# ==============================================================================
slide6 = prs.slides.add_slide(blank_layout)
set_slide_background(slide6, COLOR_WHITE)
add_header(slide6, "CORE MODULES • ONBOARDING & DASHBOARD", "Public Landing & Personal Finance Dashboard", "Clean Separation Between Public Showcase and Authenticated Financial Operations")

# Embed screenshots: 01_landing.png and 03_dashboard.png
img_w = Inches(5.66)
img_h = Inches(3.2)

# Left: Landing Page
box_l = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.2), img_w, img_h)
box_l.fill.solid()
box_l.fill.fore_color.rgb = COLOR_CARD_BORDER
box_l.line.color.rgb = COLOR_CARD_BORDER
slide6.shapes.add_picture(os.path.join(ASSETS_DIR, "01_landing.png"), Inches(0.81), Inches(2.21), img_w - Inches(0.02), img_h - Inches(0.02))

# Left description
desc_l = slide6.shapes.add_textbox(Inches(0.8), Inches(5.5), img_w, Inches(1.5))
tf_dl = desc_l.text_frame
tf_dl.word_wrap = True
tf_dl.margin_left = tf_dl.margin_right = tf_dl.margin_top = tf_dl.margin_bottom = 0
p = tf_dl.paragraphs[0]
p.text = "Public Landing Page (/)"
p.font.name = "Arial"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT_PRIMARY

p2 = tf_dl.add_paragraph()
p2.text = "• Fully decoupled public route with zero exposure of sensitive user data.\n• Minimalist black-and-white branding with clear value proposition.\n• Dedicated navigation paths to /login and /register."
p2.font.name = "Arial"
p2.font.size = Pt(10)
p2.font.color.rgb = COLOR_TEXT_SECONDARY
p2.space_before = Pt(4)

# Right: Dashboard
box_r = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.86), Inches(2.2), img_w, img_h)
box_r.fill.solid()
box_r.fill.fore_color.rgb = COLOR_CARD_BORDER
box_r.line.color.rgb = COLOR_CARD_BORDER
slide6.shapes.add_picture(os.path.join(ASSETS_DIR, "03_dashboard.png"), Inches(6.87), Inches(2.21), img_w - Inches(0.02), img_h - Inches(0.02))

# Right description
desc_r = slide6.shapes.add_textbox(Inches(6.86), Inches(5.5), img_w, Inches(1.5))
tf_dr = desc_r.text_frame
tf_dr.word_wrap = True
tf_dr.margin_left = tf_dr.margin_right = tf_dr.margin_top = tf_dr.margin_bottom = 0
p = tf_dr.paragraphs[0]
p.text = "Personal Financial Dashboard (/dashboard)"
p.font.name = "Arial"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT_PRIMARY

p2 = tf_dr.add_paragraph()
p2.text = "• Live scorecards: Total Balance, Income, Expense, and Net Savings.\n• Monthly Cash Flow bar chart and Category Spending distribution.\n• Recent transaction feed with category badges and instant status."
p2.font.name = "Arial"
p2.font.size = Pt(10)
p2.font.color.rgb = COLOR_TEXT_SECONDARY
p2.space_before = Pt(4)

add_speaker_note(slide6,
    "Slide 6 features actual screenshots from our running application.\n\n"
    "On the left is the public landing page at route slash. We created a clean, conversion-focused entry point that introduces the platform's AI capabilities without leaking any private financial information. Visitors can easily navigate to registration or login.\n\n"
    "On the right is the authenticated personal dashboard. As soon as a user logs in, the backend computes aggregate metrics from their actual transactions: Total Balance, Total Income, Total Expenses, and Net Savings. The Recharts module renders a monthly cash flow comparison and spending breakdown. Notice our sleek monochrome aesthetic: clean black cards, subtle gray borders, and crisp high-contrast typography."
)

# ==============================================================================
# SLIDE 7: Core Features: Transactions & Budget Management
# ==============================================================================
slide7 = prs.slides.add_slide(blank_layout)
set_slide_background(slide7, COLOR_WHITE)
add_header(slide7, "CORE MODULES • TRANSACTIONS & BUDGETS", "Transaction Management & Spending Limits", "Complete CRUD Controls, Multi-Criteria Filtering, and Proactive Budget Warning Alerts")

# Embed screenshots: 04_transactions.png and 05_budgets.png
# Left: Transactions
box_l7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.2), img_w, img_h)
box_l7.fill.solid()
box_l7.fill.fore_color.rgb = COLOR_CARD_BORDER
box_l7.line.color.rgb = COLOR_CARD_BORDER
slide7.shapes.add_picture(os.path.join(ASSETS_DIR, "04_transactions.png"), Inches(0.81), Inches(2.21), img_w - Inches(0.02), img_h - Inches(0.02))

desc_l7 = slide7.shapes.add_textbox(Inches(0.8), Inches(5.5), img_w, Inches(1.5))
tf_dl7 = desc_l7.text_frame
tf_dl7.word_wrap = True
tf_dl7.margin_left = tf_dl7.margin_right = tf_dl7.margin_top = tf_dl7.margin_bottom = 0
p = tf_dl7.paragraphs[0]
p.text = "Transaction Management (/transactions)"
p.font.name = "Arial"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT_PRIMARY

p2 = tf_dl7.add_paragraph()
p2.text = "• Full CRUD: Add income/expense, edit records, delete with instant balance recalculation.\n• Multi-filter search: Real-time search by description, type, category, and date range.\n• CSV Data Export for external auditing and spreadsheet management."
p2.font.name = "Arial"
p2.font.size = Pt(10)
p2.font.color.rgb = COLOR_TEXT_SECONDARY
p2.space_before = Pt(4)

# Right: Budgets
box_r7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.86), Inches(2.2), img_w, img_h)
box_r7.fill.solid()
box_r7.fill.fore_color.rgb = COLOR_CARD_BORDER
box_r7.line.color.rgb = COLOR_CARD_BORDER
slide7.shapes.add_picture(os.path.join(ASSETS_DIR, "05_budgets.png"), Inches(6.87), Inches(2.21), img_w - Inches(0.02), img_h - Inches(0.02))

desc_r7 = slide7.shapes.add_textbox(Inches(6.86), Inches(5.5), img_w, Inches(1.5))
tf_dr7 = desc_r7.text_frame
tf_dr7.word_wrap = True
tf_dr7.margin_left = tf_dr7.margin_right = tf_dr7.margin_top = tf_dr7.margin_bottom = 0
p = tf_dr7.paragraphs[0]
p.text = "Budgets & Spending Limits (/budgets)"
p.font.name = "Arial"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT_PRIMARY

p2 = tf_dr7.add_paragraph()
p2.text = "• Category-wise monthly limits (e.g., Housing, Food, Transportation, Bills).\n• Dynamic progress bars: Safe (<80%), Warning threshold (80-100%).\n• Critical over-budget alerts (>100%) highlighting exact overage amounts."
p2.font.name = "Arial"
p2.font.size = Pt(10)
p2.font.color.rgb = COLOR_TEXT_SECONDARY
p2.space_before = Pt(4)

add_speaker_note(slide7,
    "Slide 7 showcases our Transaction Management and Budget Control modules in action.\n\n"
    "On the left, the transactions ledger allows users to record both income and expense transactions. Each transaction captures the amount, category, payment method (such as UPI, Credit Card, or Cash), and date. Users can perform instant searches across descriptions, filter by category or type, and export their ledger to CSV format.\n\n"
    "On the right is our Budgets module. Users can establish monthly spending limits for specific categories. As transactions are logged, the backend aggregates monthly category spend and compares it to the limit. The frontend provides visual cues: normal progress bars below 80%, warning indicators between 80% and 100%, and bold overage badges when a budget is exceeded."
)

# ==============================================================================
# SLIDE 8: Core Features: Analytics & Grounded AI Assistant
# ==============================================================================
slide8 = prs.slides.add_slide(blank_layout)
set_slide_background(slide8, COLOR_WHITE)
add_header(slide8, "CORE MODULES • ANALYTICS & AI ADVISORY", "Visual Analytics & Grounded AI Assistant", "Data-Driven Visualizations & Hallucination-Free Transaction Intelligence")

# Embed screenshots: 06_analytics.png and 07_ai_assistant.png
box_l8 = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.2), img_w, img_h)
box_l8.fill.solid()
box_l8.fill.fore_color.rgb = COLOR_CARD_BORDER
box_l8.line.color.rgb = COLOR_CARD_BORDER
slide8.shapes.add_picture(os.path.join(ASSETS_DIR, "06_analytics.png"), Inches(0.81), Inches(2.21), img_w - Inches(0.02), img_h - Inches(0.02))

desc_l8 = slide8.shapes.add_textbox(Inches(0.8), Inches(5.5), img_w, Inches(1.5))
tf_dl8 = desc_l8.text_frame
tf_dl8.word_wrap = True
tf_dl8.margin_left = tf_dl8.margin_right = tf_dl8.margin_top = tf_dl8.margin_bottom = 0
p = tf_dl8.paragraphs[0]
p.text = "Financial Analytics & Reports (/analytics)"
p.font.name = "Arial"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT_PRIMARY

p2 = tf_dl8.add_paragraph()
p2.text = "• Category breakdown donut chart with percentage distributions.\n• Monthly income vs. expense comparison bar charts.\n• Net savings rate and financial trajectory analysis."
p2.font.name = "Arial"
p2.font.size = Pt(10)
p2.font.color.rgb = COLOR_TEXT_SECONDARY
p2.space_before = Pt(4)

# Right: AI Assistant
box_r8 = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.86), Inches(2.2), img_w, img_h)
box_r8.fill.solid()
box_r8.fill.fore_color.rgb = COLOR_CARD_BORDER
box_r8.line.color.rgb = COLOR_CARD_BORDER
slide8.shapes.add_picture(os.path.join(ASSETS_DIR, "07_ai_assistant.png"), Inches(6.87), Inches(2.21), img_w - Inches(0.02), img_h - Inches(0.02))

desc_r8 = slide8.shapes.add_textbox(Inches(6.86), Inches(5.5), img_w, Inches(1.5))
tf_dr8 = desc_r8.text_frame
tf_dr8.word_wrap = True
tf_dr8.margin_left = tf_dr8.margin_right = tf_dr8.margin_top = tf_dr8.margin_bottom = 0
p = tf_dr8.paragraphs[0]
p.text = "Grounded FinAI Assistant (/assistant)"
p.font.name = "Arial"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT_PRIMARY

p2 = tf_dr8.add_paragraph()
p2.text = "• Natural language inquiries: 'Where did I spend most?' or 'Can I save ₹5,000?'.\n• Fact Grounding: Injects real SQLite aggregates into Google Gemini context.\n• Explicit Protocol: Tags verified figures [ACTUAL DATA] and forecasts [PROJECTED ESTIMATE]."
p2.font.name = "Arial"
p2.font.size = Pt(10)
p2.font.color.rgb = COLOR_TEXT_SECONDARY
p2.space_before = Pt(4)

add_speaker_note(slide8,
    "Slide 8 highlights our Analytics and AI Assistant modules.\n\n"
    "On the left is the analytics report. It provides visual clarity using Recharts: category spending donut charts, month-by-month cash flow bars, and savings performance metrics.\n\n"
    "On the right is the FinAI Assistant. Personal finance AI cannot afford to hallucinate numbers. When a user submits a prompt, our Flask backend queries the user's actual ledger, calculating exact totals, top spending categories, and savings margins. These verified metrics are passed into Google Gemini 1.5 Flash. The assistant is instructed to explicitly label factual findings with [ACTUAL DATA] and speculative recommendations with [PROJECTED ESTIMATE]. If no API key is configured, our offline heuristic NLP parser takes over, ensuring the feature always responds accurately."
)

# ==============================================================================
# SLIDE 9: Technical Challenges & Engineering Solutions
# ==============================================================================
slide9 = prs.slides.add_slide(blank_layout)
set_slide_background(slide9, COLOR_WHITE)
add_header(slide9, "ENGINEERING DEEP DIVE", "Technical Challenges & Engineering Solutions", "Overcoming Practical Implementation Hurdles and Establishing Future Growth Vectors")

# 4 Engineering Challenges Cards
add_card(slide9, Inches(0.8), Inches(2.2), grid_w, grid_h, "1. Strict Multi-User Isolation", [
    "Challenge: Preventing data leakage across sessions and eliminating reliance on hardcoded mock IDs.",
    "Solution: Restructured SQLite tables with strict foreign keys (PRAGMA foreign_keys = ON).",
    "Security Model: Server-side session authentication. Backend ignores client-supplied user IDs and enforces data ownership on all CRUD operations."
], badge="TENANT SECURITY")

add_card(slide9, Inches(6.86), Inches(2.2), grid_w, grid_h, "2. Cryptographic Portability", [
    "Challenge: Standard scrypt hashing threw AttributeError on macOS Python 3.9 environments.",
    "Solution: Standardized password hashing on Werkzeug's pbkdf2:sha256 algorithm.",
    "Result: 100% cross-platform compatibility across macOS, Linux, and Windows with cryptographically secure salts."
], badge="CRYPTOGRAPHY")

add_card(slide9, Inches(0.8), Inches(4.6), grid_w, grid_h, "3. Eliminating AI Hallucinations", [
    "Challenge: Generic LLMs fabricate financial figures and offer inaccurate advice without transaction context.",
    "Solution: Engineered a context-injection pipeline that computes actual totals before prompting Gemini.",
    "Dual-Mode Engine: Seamless local rule-based heuristic parser ensures zero downtime when API quotas are hit."
], badge="AI FACTUALITY")

add_card(slide9, Inches(6.86), Inches(4.6), grid_w, grid_h, "4. Future Scope & Roadmap", [
    "Automated Bank Feeds: Integration with Open Banking / Plaid API for automated transaction sync.",
    "Recurring Subscription Intelligence: Automated detection and alerts for recurring monthly billing.",
    "Mobile Applications: Native iOS and Android companion apps built with React Native.",
    "Multi-Currency & FX: Real-time currency conversions for international transactions."
], badge="FUTURE ROADMAP")

add_speaker_note(slide9,
    "Slide 9 dives into the real-world engineering hurdles we encountered and solved during the development of FinAI.\n\n"
    "First, multi-user isolation: Many prototypes fail when multiple users log in because queries lack proper user filtering. We solved this by enforcing foreign keys across all tables and restricting all SQL queries to the authenticated session user ID.\n\n"
    "Second, cryptographic portability: On macOS systems running Python 3.9 with LibreSSL, Werkzeug's default scrypt implementation threw runtime errors. We standardized on PBKDF2-SHA256, which provides high entropy, cryptographically secure salts, and universal portability across operating systems.\n\n"
    "Third, AI reliability: We eliminated hallucinations through our context-injection pipeline and implemented an offline heuristic fallback to ensure uninterrupted operation.\n\n"
    "Looking forward, our roadmap includes automated bank feeds via Open Banking APIs, automated recurring subscription tracking, and a React Native mobile client."
)

# ==============================================================================
# SLIDE 10: Conclusion & Project Summary (Executive Dark Theme)
# ==============================================================================
slide10 = prs.slides.add_slide(blank_layout)
set_slide_background(slide10, COLOR_BLACK)

# Top badge
badge10 = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.0), Inches(3.2), Inches(0.36))
badge10.fill.solid()
badge10.fill.fore_color.rgb = RGBColor(30, 30, 30)
badge10.line.color.rgb = RGBColor(70, 70, 70)
badge10.line.width = Pt(1)
tf10_b = badge10.text_frame
tf10_b.text = "PROJECT SUMMARY & DELIVERABLES"
p = tf10_b.paragraphs[0]
p.font.name = "Arial"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = RGBColor(230, 230, 230)

# Main Title
title_box10 = slide10.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.7), Inches(1.2))
tf10_t = title_box10.text_frame
tf10_t.word_wrap = True
p10_t = tf10_t.paragraphs[0]
p10_t.text = "Conclusion & Production Milestones"
p10_t.font.name = "Arial"
p10_t.font.size = Pt(36)
p10_t.font.bold = True
p10_t.font.color.rgb = COLOR_WHITE

p10_s = tf10_t.add_paragraph()
p10_s.text = "Delivering a Secure, Scalable, AI-Driven Personal Finance Platform"
p10_s.font.name = "Arial"
p10_s.font.size = Pt(15)
p10_s.font.color.rgb = RGBColor(170, 170, 170)
p10_s.space_before = Pt(8)

# 3 Outcome Cards
c10_1 = add_card(slide10, Inches(0.8), Inches(3.0), card_w, Inches(2.8), "Robust Architecture", [
    "React 18 + Vite frontend delivering sub-second page transitions.",
    "Flask REST backend with Werkzeug PBKDF2 password security.",
    "SQLite schema with enforced foreign keys and zero data leakage.",
    "Clean code separation with dedicated modular directories."
], dark=True, badge="SYSTEM INTEGRITY")

c10_2 = add_card(slide10, Inches(4.84), Inches(3.0), card_w, Inches(2.8), "Grounded Intelligence", [
    "Google Gemini 1.5 Flash paired with live database metrics.",
    "Strict [ACTUAL DATA] vs [PROJECTED ESTIMATE] tagging.",
    "Deterministic local NLP fallback ensuring 100% uptime.",
    "Actionable budgeting insights and category spending alerts."
], dark=True, badge="PRACTICAL AI")

c10_3 = add_card(slide10, Inches(8.88), Inches(3.0), card_w, Inches(2.8), "Fintech User Experience", [
    "Premium minimalist black-and-white visual identity.",
    "Zero-demo cold start: clean ledger for new registrations.",
    "Full transaction CRUD with instant Recharts analytics.",
    "Live and tested on local production environment."
], dark=True, badge="DESIGN & QUALITY")

# Bottom Banner: Live Endpoints & Thank You
footer_box = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.1), Inches(11.733), Inches(0.85))
footer_box.fill.solid()
footer_box.fill.fore_color.rgb = RGBColor(22, 22, 22)
footer_box.line.color.rgb = RGBColor(60, 60, 60)
footer_box.line.width = Pt(1)

tf_foot = footer_box.text_frame
tf_foot.word_wrap = True
tf_foot.margin_left = Inches(0.3)
tf_foot.margin_top = Inches(0.15)
p_foot = tf_foot.paragraphs[0]
p_foot.text = "Thank You! Questions & Discussion  |  Live Web App: http://localhost:5173  |  API: http://127.0.0.1:5050"
p_foot.font.name = "Arial"
p_foot.font.size = Pt(13)
p_foot.font.bold = True
p_foot.font.color.rgb = COLOR_WHITE
p_foot.alignment = PP_ALIGN.CENTER

add_speaker_note(slide10,
    "To conclude, FinAI represents a complete, production-grade personal finance application that bridges modern full-stack web engineering with grounded, practical AI.\n\n"
    "We achieved strict multi-user isolation, secure session authentication, and referential integrity in SQLite. We eliminated demo data pollution with our pristine zero-balance startup policy. And our AI assistant provides genuine, trustworthy financial insights by grounding every answer in the user's actual database records.\n\n"
    "Both the Vite frontend and Flask backend are actively running right now. Thank you for your attention, and I would be delighted to take any questions or proceed directly with a live demonstration of the system."
)

# Save the presentation
output_pptx = "/Users/vipinkumar/FinAI/FINAL_AI_Personal_Finance_Manager_Presentation.pptx"
prs.save(output_pptx)
print(f"PowerPoint Presentation successfully created at: {output_pptx}")
