const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const assetsDir = path.resolve(__dirname, 'presentation_assets');

// Helper to convert images to base64 for reliable PDF rendering
function imgBase64(filename) {
  const filePath = path.join(assetsDir, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const landingImg = imgBase64('01_landing.png');
const dashboardImg = imgBase64('03_dashboard.png');
const transactionsImg = imgBase64('04_transactions.png');
const budgetsImg = imgBase64('05_budgets.png');
const analyticsImg = imgBase64('06_analytics.png');
const assistantImg = imgBase64('07_ai_assistant.png');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FINAL – AI Personal Finance Manager Presentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @page {
    size: 1920px 1080px;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #000;
    color: #111;
    -webkit-font-smoothing: antialiased;
  }
  .slide {
    width: 1920px;
    height: 1080px;
    page-break-after: always;
    break-after: page;
    position: relative;
    padding: 90px 110px;
    overflow: hidden;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
  }
  .slide.dark {
    background: #0A0A0A;
    color: #FFFFFF;
  }

  /* Header Components */
  .badge {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    width: fit-content;
    margin-bottom: 20px;
  }
  .badge-light {
    background: #000000;
    color: #FFFFFF;
  }
  .badge-dark {
    background: #222222;
    color: #E5E5E5;
    border: 1px solid #333333;
  }
  .slide-title {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .slide-subtitle {
    font-size: 20px;
    font-weight: 500;
    color: #666666;
    margin-bottom: 45px;
  }
  .dark .slide-subtitle {
    color: #999999;
  }

  /* Cards */
  .card-grid {
    display: grid;
    gap: 30px;
    flex: 1;
  }
  .cols-3 { grid-template-columns: repeat(3, 1fr); }
  .cols-4 { grid-template-columns: repeat(4, 1fr); }
  .cols-2 { grid-template-columns: repeat(2, 1fr); }

  .card {
    background: #F8F8F8;
    border: 1px solid #E5E5E5;
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
  }
  .dark .card {
    background: #141414;
    border-color: #262626;
  }
  .card-tag {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #888888;
    margin-bottom: 12px;
  }
  .card-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 18px;
    color: #111111;
  }
  .dark .card-title {
    color: #FFFFFF;
  }
  .card ul {
    list-style: none;
  }
  .card li {
    font-size: 16px;
    line-height: 1.55;
    color: #555555;
    margin-bottom: 12px;
    position: relative;
    padding-left: 20px;
  }
  .dark .card li {
    color: #CCCCCC;
  }
  .card li::before {
    content: "•";
    position: absolute;
    left: 0;
    font-weight: bold;
    color: #111111;
  }
  .dark .card li::before {
    color: #FFFFFF;
  }

  /* Screenshot Showcase */
  .showcase-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    flex: 1;
  }
  .showcase-col {
    display: flex;
    flex-direction: column;
  }
  .img-wrapper {
    background: #FAFAFA;
    border: 1px solid #E5E5E5;
    border-radius: 12px;
    overflow: hidden;
    height: 440px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  }
  .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
  }
  .showcase-caption {
    margin-top: 18px;
  }
  .caption-title {
    font-size: 20px;
    font-weight: 700;
    color: #111111;
    margin-bottom: 8px;
  }
  .caption-desc {
    font-size: 15px;
    color: #666666;
    line-height: 1.5;
  }

  /* Footer */
  .slide-footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: #888888;
    padding-top: 25px;
    border-top: 1px solid #E5E5E5;
  }
  .dark .slide-footer {
    border-color: #222222;
    color: #666666;
  }
</style>
</head>
<body>

<!-- SLIDE 1: TITLE SLIDE -->
<div class="slide dark" style="justify-content: center; padding: 120px 140px;">
  <div class="badge badge-dark">FINAI 2.0 • PRODUCTION PLATFORM</div>
  <h1 class="slide-title" style="font-size: 60px; line-height: 1.1; margin-bottom: 16px;">FINAL: AI Personal Finance Manager</h1>
  <p class="slide-subtitle" style="font-size: 24px; color: #AAAAAA; margin-bottom: 60px;">Intelligent Multi-User Financial Advisory, Grounded Analytics & Real-Time Cash Flow Engine</p>
  
  <div class="card-grid cols-3" style="flex: none; height: 280px;">
    <div class="card">
      <div class="card-tag">CORE ARCHITECTURE</div>
      <div class="card-title">Modern Full-Stack</div>
      <ul>
        <li>Frontend: React.js (v18) + Vite + Tailwind</li>
        <li>Backend: Python Flask & REST API</li>
        <li>Database: SQLite with Foreign Key Cascades</li>
        <li>AI Engine: Google Gemini 1.5 Flash</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">SECURITY & PRIVACY</div>
      <div class="card-title">Enterprise Security</div>
      <ul>
        <li>Strict multi-user isolation on all queries</li>
        <li>Salted PBKDF2-SHA256 password hashing</li>
        <li>HTTP-only authenticated sessions</li>
        <li>Zero-trust server-side validation</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">PRODUCTION HIGHLIGHTS</div>
      <div class="card-title">Key Capabilities</div>
      <ul>
        <li>Real-time cash flow & KPI scorecards</li>
        <li>Category spending limits & overage alerts</li>
        <li>Grounded transaction AI financial advisory</li>
        <li>Zero-data clean ledger cold start</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 01 / 10</span>
  </div>
</div>

<!-- SLIDE 2: PROBLEM STATEMENT & PHILOSOPHY -->
<div class="slide">
  <div class="badge badge-light">PROBLEM STATEMENT & PHILOSOPHY</div>
  <h1 class="slide-title">Rethinking Personal Finance Management</h1>
  <p class="slide-subtitle">Addressing Data Isolation, Demo Record Pollution, and AI Hallucinations</p>

  <div class="card-grid cols-3">
    <div class="card">
      <div class="card-tag">TENANT INTEGRITY</div>
      <div class="card-title">1. Multi-User Isolation</div>
      <ul>
        <li><strong>Industry Flaw:</strong> Most local finance trackers lack real user authentication or leak state across sessions using hardcoded demo IDs.</li>
        <li><strong>FinAI Engineering:</strong> Enforces strict multi-user relational architecture in SQLite with session-bound isolation.</li>
        <li><strong>Zero-Trust Backend:</strong> Every API query filters strictly by authenticated <code>session['user_id']</code>.</li>
        <li><strong>IDOR Prevention:</strong> Client-supplied IDs in payloads are rejected; data ownership is strictly verified.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">CLEAN LEDGER</div>
      <div class="card-title">2. Zero-Demo Onboarding</div>
      <ul>
        <li><strong>Industry Flaw:</strong> Applications often seed dozens of fake records on registration, confusing users and distorting analytics.</li>
        <li><strong>FinAI Engineering:</strong> Dedicated clean database schema with zero demo pollution.</li>
        <li><strong>Pristine Starting Ledger:</strong> Newly registered users start with exactly ₹0.00 balance, 0 transactions, and 0 budgets.</li>
        <li><strong>Friendly Onboarding:</strong> Intelligent empty states guide the user to log their first genuine transaction.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">FACTUAL AI</div>
      <div class="card-title">3. Grounded AI Advisory</div>
      <ul>
        <li><strong>Industry Flaw:</strong> Generic LLMs hallucinate financial balances, invent categories, and offer unverifiable advice.</li>
        <li><strong>FinAI Engineering:</strong> Dual-engine AI architecture combining Gemini 1.5 with deterministic local heuristics.</li>
        <li><strong>Transaction Grounding:</strong> Real user metrics are calculated dynamically and injected into system prompts.</li>
        <li><strong>Explicit Labeling:</strong> Clearly separates verified facts [ACTUAL DATA] from forecasts [PROJECTED ESTIMATE].</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 02 / 10</span>
  </div>
</div>

<!-- SLIDE 3: SYSTEM ARCHITECTURE -->
<div class="slide">
  <div class="badge badge-light">SYSTEM ARCHITECTURE</div>
  <h1 class="slide-title">End-to-End System Architecture & Data Flow</h1>
  <p class="slide-subtitle">Four-Tier High Integrity Architecture: Client, API Gateway, Relational Store & AI Engine</p>

  <div class="card-grid cols-4">
    <div class="card">
      <div class="card-tag">TIER 1 • PRESENTATION</div>
      <div class="card-title">Client Layer</div>
      <ul>
        <li>React 18 & Vite SPA</li>
        <li>Tailwind CSS Minimal B&W Theme</li>
        <li>Recharts Dynamic Charting Suite</li>
        <li>Protected Route Guards</li>
        <li>Context-Driven Auth & State</li>
        <li>Lucide React Financial Icons</li>
        <li>Zero CSS Framework Bloat</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">TIER 2 • GATEWAY</div>
      <div class="card-title">API & Security</div>
      <ul>
        <li>Python Flask REST API</li>
        <li>Flask-CORS (Credentials Enabled)</li>
        <li>HTTP-Only Session Cookie Auth</li>
        <li>PBKDF2-SHA256 Password Hash</li>
        <li>Input Validation & Sanitization</li>
        <li>Route Protection Decorators</li>
        <li>Standardized JSON Envelopes</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">TIER 3 • PERSISTENCE</div>
      <div class="card-title">Relational DB</div>
      <ul>
        <li>SQLite 3 Database Engine</li>
        <li><code>PRAGMA foreign_keys = ON</code></li>
        <li>Tables: users, transactions, budgets, settings, ai_messages</li>
        <li>Cascading Deletes on Accounts</li>
        <li>Strict user_id Query Filtering</li>
        <li>ACID-Compliant State Safety</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">TIER 4 • INTELLIGENCE</div>
      <div class="card-title">AI Advisory</div>
      <ul>
        <li>Context Grounding Aggregator</li>
        <li>Live Database Metrics Compiler</li>
        <li>Google Gemini 1.5 Flash API</li>
        <li>Deterministic Fallback Heuristics</li>
        <li>[ACTUAL] vs [PROJECTED] Rules</li>
        <li>Zero Frontend API Key Exposure</li>
        <li>Dual-Mode High Availability</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 03 / 10</span>
  </div>
</div>

<!-- SLIDE 4: TECHNOLOGY STACK & ARCHITECTURAL ROLES -->
<div class="slide">
  <div class="badge badge-light">ENGINEERING CHOICES</div>
  <h1 class="slide-title">Technology Stack & Architectural Roles</h1>
  <p class="slide-subtitle">Modern, Lightweight, Production-Grade Technologies with Zero Unnecessary Bloat</p>

  <div class="card-grid cols-2" style="grid-template-rows: 1fr 1fr; gap: 24px;">
    <div class="card">
      <div class="card-tag">UI & VISUALIZATION</div>
      <div class="card-title">Frontend: React 18 + Vite + Tailwind CSS</div>
      <ul>
        <li><strong>React 18:</strong> Component-driven architecture, custom AuthContext, instantaneous UI transitions.</li>
        <li><strong>Vite:</strong> Ultra-fast Hot Module Replacement (HMR) and optimized ES-module production builds.</li>
        <li><strong>Tailwind CSS:</strong> Strict monochrome palette (#000000, #FFFFFF, #E5E5E5) with zero runtime styling overhead.</li>
        <li><strong>Recharts:</strong> Vectorized SVG charting for cash flow bars, category donuts, and savings trajectories.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">API & AUTHENTICATION</div>
      <div class="card-title">Backend: Python Flask & REST API</div>
      <ul>
        <li><strong>Flask Microframework:</strong> Explicit control over request lifecycle, session cookies, and route middleware.</li>
        <li><strong>Werkzeug Security:</strong> Enterprise-grade PBKDF2-SHA256 password hashing with unique salt generation.</li>
        <li><strong>Flask-CORS:</strong> Configured with <code>supports_credentials=True</code> for secure cross-origin session cookies.</li>
        <li><strong>Python Dotenv:</strong> Secure environment variable isolation protecting secret keys and credentials.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">RELATIONAL PERSISTENCE</div>
      <div class="card-title">Database: SQLite Relational Schema</div>
      <ul>
        <li><strong>SQLite 3:</strong> Serverless, zero-maintenance ACID-compliant database with zero network daemon overhead.</li>
        <li><strong>Relational Constraints:</strong> Explicit foreign key enforcement (<code>PRAGMA foreign_keys = ON</code>) on all connections.</li>
        <li><strong>Indexed Queries:</strong> High-performance index lookups on <code>user_id</code>, dates, and categories.</li>
        <li><strong>Cascading Deletes:</strong> Clean, atomic cleanup of child records when account actions occur.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">ARTIFICIAL INTELLIGENCE</div>
      <div class="card-title">AI Engine: Google Gemini 1.5 Flash</div>
      <ul>
        <li><strong>Gemini 1.5 Flash:</strong> Sub-second inference latency, broad context window, and exceptional reasoning capacity.</li>
        <li><strong>Prompt Grounding:</strong> Injects live mathematical aggregates into Gemini prompts, preventing hallucinated numbers.</li>
        <li><strong>Strict Verification Protocol:</strong> Enforces explicit tagging of verified facts vs forecast projections.</li>
        <li><strong>Local Heuristic Fallback:</strong> Regex and pattern-matching NLP engine guarantees uninterrupted service.</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 04 / 10</span>
  </div>
</div>

<!-- SLIDE 5: MULTI-USER DATABASE SCHEMA -->
<div class="slide">
  <div class="badge badge-light">DATA ARCHITECTURE</div>
  <h1 class="slide-title">Multi-User Database Schema & Isolation Model</h1>
  <p class="slide-subtitle">Enforced Foreign Key Constraints, Tenant Isolation, and Zero-Demo Defaults</p>

  <div class="card-grid cols-3" style="margin-bottom: 24px; flex: none; height: 230px;">
    <div class="card">
      <div class="card-tag">USER IDENTITY</div>
      <div class="card-title">Table: users</div>
      <ul>
        <li><code>id: INTEGER PRIMARY KEY</code></li>
        <li><code>full_name: TEXT NOT NULL</code></li>
        <li><code>email: TEXT UNIQUE NOT NULL</code></li>
        <li><code>password_hash: TEXT (PBKDF2)</code></li>
        <li><code>created_at, updated_at: TEXT</code></li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">FINANCIAL LEDGER</div>
      <div class="card-title">Table: transactions</div>
      <ul>
        <li><code>id: INTEGER PRIMARY KEY</code></li>
        <li><code>user_id: INTEGER (FK -> users.id)</code></li>
        <li><code>transaction_type: 'income'|'expense'</code></li>
        <li><code>amount: REAL, category: TEXT</code></li>
        <li><code>payment_method, transaction_date</code></li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">SPENDING LIMITS</div>
      <div class="card-title">Table: budgets</div>
      <ul>
        <li><code>id: INTEGER PRIMARY KEY</code></li>
        <li><code>user_id: INTEGER (FK -> users.id)</code></li>
        <li><code>category: TEXT NOT NULL</code></li>
        <li><code>monthly_limit: REAL NOT NULL</code></li>
        <li><code>month: INTEGER, year: INTEGER</code></li>
      </ul>
    </div>
  </div>

  <div class="card-grid cols-2" style="flex: 1;">
    <div class="card">
      <div class="card-tag">SETTINGS & AUDIT LOGS</div>
      <div class="card-title">Tables: user_settings & ai_messages</div>
      <ul>
        <li><code>user_settings: id, user_id (FK), currency ('₹'), preferences (JSON)</code></li>
        <li><code>ai_messages: id, user_id (FK), role ('user'|'assistant'), message, timestamp</code></li>
        <li>Every conversation thread is strictly partitioned per user ID.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">SECURITY GUARANTEES</div>
      <div class="card-title">Enforced Multi-Tenant Isolation Rules</div>
      <ul>
        <li><strong>Zero-Trust Backend:</strong> API endpoints never trust a user ID supplied by request bodies or URL parameters.</li>
        <li><strong>Session Authority:</strong> User identity is extracted solely from the cryptographic server session.</li>
        <li><strong>Referential Integrity:</strong> <code>PRAGMA foreign_keys = ON</code> ensures orphan records cannot exist.</li>
        <li><strong>Pristine Start:</strong> Registrations create empty accounts starting with strictly ₹0.00 balance.</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 05 / 10</span>
  </div>
</div>

<!-- SLIDE 6: CORE FEATURES: LANDING & DASHBOARD -->
<div class="slide">
  <div class="badge badge-light">CORE MODULES • ONBOARDING & DASHBOARD</div>
  <h1 class="slide-title">Public Landing & Personal Finance Dashboard</h1>
  <p class="slide-subtitle">Clean Separation Between Public Showcase and Authenticated Financial Operations</p>

  <div class="showcase-grid">
    <div class="showcase-col">
      <div class="img-wrapper">
        <img src="${landingImg}" alt="Public Landing Page">
      </div>
      <div class="showcase-caption">
        <div class="caption-title">Public Landing Page (<code>/</code>)</div>
        <div class="caption-desc">
          • Fully decoupled public route with zero exposure of sensitive financial data.<br>
          • Premium black-and-white visual identity with clear call-to-actions.<br>
          • Direct entry routes to separate <code>/login</code> and <code>/register</code> pages.
        </div>
      </div>
    </div>
    <div class="showcase-col">
      <div class="img-wrapper">
        <img src="${dashboardImg}" alt="Personal Dashboard">
      </div>
      <div class="showcase-caption">
        <div class="caption-title">Personal Financial Dashboard (<code>/dashboard</code>)</div>
        <div class="caption-desc">
          • Real-time KPI scorecards: Total Balance, Income, Expense, and Savings Rate.<br>
          • Monthly Cash Flow Recharts comparison and category spending donut breakdown.<br>
          • Live recent transactions feed with status indicators and zero-state welcome onboarding.
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 06 / 10</span>
  </div>
</div>

<!-- SLIDE 7: CORE FEATURES: TRANSACTIONS & BUDGETS -->
<div class="slide">
  <div class="badge badge-light">CORE MODULES • TRANSACTIONS & BUDGETS</div>
  <h1 class="slide-title">Transaction Management & Spending Limits</h1>
  <p class="slide-subtitle">Complete CRUD Controls, Multi-Criteria Filtering, and Proactive Budget Warning Alerts</p>

  <div class="showcase-grid">
    <div class="showcase-col">
      <div class="img-wrapper">
        <img src="${transactionsImg}" alt="Transactions Ledger">
      </div>
      <div class="showcase-caption">
        <div class="caption-title">Transaction Management (<code>/transactions</code>)</div>
        <div class="caption-desc">
          • Full CRUD operations: Add income/expense, edit records, and delete with instant recalculation.<br>
          • Multi-criteria search: Real-time search by description, type, category, and date ranges.<br>
          • One-click CSV Data Export for external auditing, backups, and spreadsheet workflows.
        </div>
      </div>
    </div>
    <div class="showcase-col">
      <div class="img-wrapper">
        <img src="${budgetsImg}" alt="Budgets & Spending Limits">
      </div>
      <div class="showcase-caption">
        <div class="caption-title">Budgets & Spending Limits (<code>/budgets</code>)</div>
        <div class="caption-desc">
          • Category-wise monthly thresholds (Housing, Food, Utilities, Transport, Entertainment).<br>
          • Dynamic progress indicators: Normal spending (&lt;80%), Warning threshold (80-100%).<br>
          • Critical over-budget alerts (&gt;100%) highlighting exact overage amounts in real-time.
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 07 / 10</span>
  </div>
</div>

<!-- SLIDE 8: CORE FEATURES: ANALYTICS & AI ASSISTANT -->
<div class="slide">
  <div class="badge badge-light">CORE MODULES • ANALYTICS & AI ADVISORY</div>
  <h1 class="slide-title">Visual Analytics & Grounded AI Assistant</h1>
  <p class="slide-subtitle">Data-Driven Visualizations & Hallucination-Free Transaction Intelligence</p>

  <div class="showcase-grid">
    <div class="showcase-col">
      <div class="img-wrapper">
        <img src="${analyticsImg}" alt="Financial Analytics">
      </div>
      <div class="showcase-caption">
        <div class="caption-title">Financial Analytics & Reports (<code>/analytics</code>)</div>
        <div class="caption-desc">
          • High-clarity Recharts analytics: category percentage distribution donuts.<br>
          • Monthly income vs. expense cash flow comparisons across historical cycles.<br>
          • Net savings performance metrics and data-driven financial health indicators.
        </div>
      </div>
    </div>
    <div class="showcase-col">
      <div class="img-wrapper">
        <img src="${assistantImg}" alt="FinAI Assistant">
      </div>
      <div class="showcase-caption">
        <div class="caption-title">Grounded FinAI Assistant (<code>/assistant</code>)</div>
        <div class="caption-desc">
          • Answers natural questions: "Where did I spend most?" or "Can I save ₹5,000 next month?".<br>
          • Dynamic Grounding: Real user financial totals are injected into Gemini system prompts.<br>
          • Strict Verification Protocol: Distinguishes <code>[ACTUAL DATA]</code> from <code>[PROJECTED ESTIMATE]</code>.
        </div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 08 / 10</span>
  </div>
</div>

<!-- SLIDE 9: TECHNICAL CHALLENGES & ROADMAP -->
<div class="slide">
  <div class="badge badge-light">ENGINEERING DEEP DIVE</div>
  <h1 class="slide-title">Technical Challenges & Engineering Solutions</h1>
  <p class="slide-subtitle">Overcoming Practical Implementation Hurdles and Establishing Future Growth Vectors</p>

  <div class="card-grid cols-2" style="grid-template-rows: 1fr 1fr; gap: 24px;">
    <div class="card">
      <div class="card-tag">TENANT SECURITY</div>
      <div class="card-title">1. Strict Multi-User Data Isolation</div>
      <ul>
        <li><strong>Challenge:</strong> Preventing data leakage across sessions and eliminating reliance on hardcoded mock IDs.</li>
        <li><strong>Engineering Fix:</strong> Enforced SQLite foreign key constraints (<code>PRAGMA foreign_keys = ON</code>).</li>
        <li><strong>Security Model:</strong> Server-side session authentication. Backend ignores client-supplied user IDs and enforces data ownership on all CRUD operations.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">CRYPTOGRAPHY</div>
      <div class="card-title">2. Cryptographic Portability on macOS</div>
      <ul>
        <li><strong>Challenge:</strong> Standard scrypt hashing threw AttributeError on macOS Python 3.9 / LibreSSL runtimes.</li>
        <li><strong>Engineering Fix:</strong> Standardized password hashing on Werkzeug's <code>pbkdf2:sha256</code> algorithm.</li>
        <li><strong>Result:</strong> 100% cross-platform compatibility across macOS, Linux, and Windows with cryptographically secure salts.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">AI FACTUALITY</div>
      <div class="card-title">3. Eliminating AI Hallucinations</div>
      <ul>
        <li><strong>Challenge:</strong> Generic LLMs fabricate financial figures and offer inaccurate advice without transaction context.</li>
        <li><strong>Engineering Fix:</strong> Engineered a context-injection pipeline that computes actual totals before prompting Gemini.</li>
        <li><strong>Dual-Mode Engine:</strong> Seamless local rule-based heuristic parser ensures zero downtime when API quotas are hit.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">FUTURE ROADMAP</div>
      <div class="card-title">4. Future Scope & Roadmap</div>
      <ul>
        <li><strong>Automated Bank Feeds:</strong> Integration with Open Banking / Plaid API for automated transaction sync.</li>
        <li><strong>Recurring Subscriptions:</strong> Automated detection and renewal alerts for monthly recurring bills.</li>
        <li><strong>Mobile Application:</strong> Native iOS and Android companion app developed with React Native.</li>
        <li><strong>Multi-Currency & FX:</strong> Real-time currency conversions for international transactions.</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 09 / 10</span>
  </div>
</div>

<!-- SLIDE 10: CONCLUSION & SUMMARY -->
<div class="slide dark" style="justify-content: center; padding: 100px 140px;">
  <div class="badge badge-dark">PROJECT SUMMARY & DELIVERABLES</div>
  <h1 class="slide-title" style="font-size: 54px; margin-bottom: 12px;">Conclusion & Production Milestones</h1>
  <p class="slide-subtitle" style="font-size: 22px; color: #AAAAAA; margin-bottom: 50px;">Delivering a Secure, Scalable, AI-Driven Personal Finance Platform</p>

  <div class="card-grid cols-3" style="flex: none; height: 310px; margin-bottom: 40px;">
    <div class="card">
      <div class="card-tag">SYSTEM INTEGRITY</div>
      <div class="card-title">Robust Architecture</div>
      <ul>
        <li>React 18 + Vite frontend delivering sub-second transitions.</li>
        <li>Flask REST backend with Werkzeug PBKDF2 password security.</li>
        <li>SQLite schema with enforced foreign keys and zero data leakage.</li>
        <li>Clean code separation with dedicated modular directories.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">PRACTICAL AI</div>
      <div class="card-title">Grounded Intelligence</div>
      <ul>
        <li>Google Gemini 1.5 Flash paired with live database metrics.</li>
        <li>Strict [ACTUAL DATA] vs [PROJECTED ESTIMATE] tagging.</li>
        <li>Deterministic local NLP fallback ensuring 100% uptime.</li>
        <li>Actionable budgeting insights and category spending alerts.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-tag">DESIGN & QUALITY</div>
      <div class="card-title">Fintech User Experience</div>
      <ul>
        <li>Premium minimalist black-and-white visual identity.</li>
        <li>Zero-demo cold start: clean ledger for new registrations.</li>
        <li>Full transaction CRUD with instant Recharts analytics.</li>
        <li>Live, tested, and fully functional production build.</li>
      </ul>
    </div>
  </div>

  <div style="background: #181818; border: 1px solid #333333; border-radius: 12px; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: 700; color: #FFFFFF;">
      Thank You! Questions & System Demonstration
    </div>
    <div style="font-size: 15px; color: #AAAAAA;">
      Live Web App: <code style="color: #FFFFFF; background: #2A2A2A; padding: 4px 8px; border-radius: 6px;">http://localhost:5173</code> &nbsp;|&nbsp; 
      API: <code style="color: #FFFFFF; background: #2A2A2A; padding: 4px 8px; border-radius: 6px;">http://127.0.0.1:5050</code>
    </div>
  </div>

  <div class="slide-footer" style="border-top: none; padding-top: 30px;">
    <span>FinAI – Smart Personal Finance Assistant</span>
    <span>Slide 10 / 10</span>
  </div>
</div>

</body>
</html>
`;

fs.writeFileSync(path.resolve(__dirname, 'presentation.html'), htmlContent);
console.log('HTML presentation template generated successfully.');

async function exportPDF() {
  console.log('Launching headless browser to export PDF...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  
  const htmlPath = path.resolve(__dirname, 'presentation.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  const pdfPathFinAI = path.resolve(__dirname, 'FINAL_AI_Personal_Finance_Manager_Presentation.pdf');
  const pdfPathHome = '/Users/vipinkumar/FINAL_AI_Personal_Finance_Manager_Presentation.pdf';

  await page.pdf({
    path: pdfPathFinAI,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    preferCSSPageSize: true
  });

  fs.copyFileSync(pdfPathFinAI, pdfPathHome);
  console.log(`PDF successfully exported to: ${pdfPathFinAI} and ${pdfPathHome}`);

  await browser.close();
}

exportPDF().catch(err => {
  console.error('Error exporting PDF:', err);
  process.exit(1);
});
