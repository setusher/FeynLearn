// Capture the README screenshots into docs/screenshots/.
//
//   npm i -D playwright && npx playwright install chromium
//   npm run dev                                   # in another terminal
//   node scripts/capture-screenshots.mjs          # BASE_URL defaults to http://localhost:3000
//   LIVE=1 node scripts/capture-screenshots.mjs   # also capture Explain and Catch the mistake (uses the AI)
//
// Each run uses a fresh browser profile, so the app starts on the welcome screen
// and loads the sample data.

import { mkdirSync } from "node:fs";

const { chromium } = await import("playwright").catch(() => import("playwright-core"));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
const LIVE = process.env.LIVE === "1";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.png` });

async function start(width, height) {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  await page.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function enter(page) {
  await page.fill("#welcome-name", "Shradha");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Hi, Shradha.").waitFor();
  await page.locator(".react-flow__node").first().waitFor().catch(() => {});
  await page.waitForTimeout(800);
}

async function visit(page, path, wait = 900) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
}

const page = await start(1440, 900);
await page.waitForTimeout(500);
await shot(page, "01-welcome");
await enter(page);
await shot(page, "02-dashboard");

await visit(page, "/gap-map", 1200);
await page.locator(".react-flow__node").filter({ hasText: "Sunlight angle" }).first().click().catch(() => {});
await page.waitForTimeout(300);
await shot(page, "03-gap-map");
await visit(page, "/understanding", 1200);
await shot(page, "04-understanding");
await visit(page, "/apply");
await shot(page, "05-apply");
await visit(page, "/revisit");
await shot(page, "06-revisit");
await visit(page, "/notes");
await shot(page, "07-notes");

if (LIVE) {
  await visit(page, "/");
  await page.fill("#box-topic", "How do vaccines work?");
  await page.getByRole("button", { name: "Begin session" }).click();
  await page.locator("#composer").waitFor();
  await page.fill("#composer", "Vaccines work by killing the virus directly in your blood, like an antibiotic does.");
  await page.keyboard.press("Enter");
  await page.getByText("Common misconception").waitFor({ timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, "08-explain");

  await page.getByRole("button", { name: "Discard" }).click();
  await page.getByRole("button", { name: "Discard", exact: true }).last().click();
  await page.locator("#box-topic").waitFor();
  await page.getByRole("radio", { name: "Catch the mistake" }).first().click();
  await page.fill("#box-topic", "Why do seasons happen?");
  const generated = page.waitForResponse((r) => r.url().endsWith("/api/reverse") && r.request().postData()?.includes('"generate"'), { timeout: 150000 });
  await page.getByRole("button", { name: "Begin session" }).click();
  const { paragraphs } = await (await generated).json();
  await page.getByRole("button", { name: "Finish and reveal" }).waitFor({ timeout: 150000 });
  // Play a student who spots the first planted error, so the screenshot shows a catch.
  const wrong = Math.max(0, paragraphs.findIndex((p) => p.hasError));
  await page.locator("ol > li > button").nth(wrong).click();
  await page.fill("#flag-reason", paragraphs[wrong]?.correctFact ?? "This states the cause the wrong way round.");
  await page.getByRole("button", { name: "Submit flag" }).click();
  await page.getByRole("button", { name: "Finish and reveal" }).click();
  await page.getByText("Planted mistakes").waitFor({ timeout: 150000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, "09-catch-the-mistake");
}

const phone = await start(390, 844);
await enter(phone);
await phone.screenshot({ path: `${OUT}10-dashboard-mobile.png`, fullPage: true });

await browser.close();
console.log(`Screenshots saved to ${OUT}`);
