import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '..', 'presentation_assets');

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('Capturing Landing page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outputDir, '01_landing.png') });

  console.log('Capturing Login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outputDir, '02_login.png') });

  console.log('Logging in as Alice...');
  await page.type('input[type="email"]', 'alice@finai.io');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  console.log('Capturing Dashboard...');
  await page.screenshot({ path: path.join(outputDir, '03_dashboard.png') });

  console.log('Capturing Transactions page...');
  await page.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '04_transactions.png') });

  console.log('Capturing Budgets page...');
  await page.goto('http://localhost:5173/budgets', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '05_budgets.png') });

  console.log('Capturing Analytics page...');
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '06_analytics.png') });

  console.log('Capturing AI Assistant page...');
  await page.goto('http://localhost:5173/ai-assistant', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outputDir, '07_ai_assistant.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
