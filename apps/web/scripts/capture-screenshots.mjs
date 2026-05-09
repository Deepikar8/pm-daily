import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "/Users/deepikarudramurthy/Documents/lenny-podcasts/docs/screenshots";
mkdirSync(OUT, { recursive: true });

const LIVE = "https://pm-daily.avalanche05.workers.dev";
const PREVIEW = "http://localhost:4173/preview.html";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

async function shot(page, viewport, url, file, opts = {}) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.beforeShot) await opts.beforeShot(page);
  await page.waitForTimeout(opts.delay ?? 800);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: opts.fullPage ?? false });
  console.log("captured", file);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();

// === LIVE captures ===
await shot(page, MOBILE,  LIVE + "/",            "01-landing-mobile.png");
await shot(page, DESKTOP, LIVE + "/",            "02-landing-desktop.png");
await shot(page, MOBILE,  LIVE + "/leaderboard", "03-leaderboard-mobile.png");

// === preview.html captures (auth-gated screens) ===
async function jumpTo(page, screen) {
  // The jumper bar buttons have textContent matching the screen name
  await page.getByRole("button", { name: screen, exact: true }).first().click();
  await page.waitForTimeout(500);
}

// /today digest (intro screen)
await page.setViewportSize(MOBILE);
await page.goto(PREVIEW, { waitUntil: "networkidle" });
await page.waitForTimeout(2000); // let Babel + esm.sh + React hydrate
await jumpTo(page, "intro");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/04-today-mobile.png`, fullPage: true });
console.log("captured 04-today-mobile.png");

// /quiz active question
await jumpTo(page, "quiz");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/05-quiz-mobile.png`, fullPage: false });
console.log("captured 05-quiz-mobile.png");

// /quiz post-submit takeaway hero — click correct option for Q1
const correctOpt = page.locator("button").filter({ hasText: /Ask ten of those same customers/i });
const cnt = await correctOpt.count();
console.log("found correct option buttons:", cnt);
if (cnt > 0) {
  await correctOpt.first().click();
  await page.waitForTimeout(900);
  // Try to scroll to the takeaway hero
  const takeaway = page.locator("text=/This week/i").first();
  if (await takeaway.count() > 0) {
    await takeaway.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/06-quiz-result-takeaway-mobile.png`, fullPage: false });
  console.log("captured 06-quiz-result-takeaway-mobile.png");
}

// Final results screen
await jumpTo(page, "results");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/07-results-mobile.png`, fullPage: true });
console.log("captured 07-results-mobile.png");

// Leaderboard with podium
await jumpTo(page, "leaderboard");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/08-leaderboard-mobile.png`, fullPage: true });
console.log("captured 08-leaderboard-mobile.png");

// Profile
await jumpTo(page, "profile");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/09-profile-mobile.png`, fullPage: true });
console.log("captured 09-profile-mobile.png");

// Sign-in landing (preview.html version)
await jumpTo(page, "signin");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/10-signin-mobile.png`, fullPage: true });
console.log("captured 10-signin-mobile.png");

await browser.close();
console.log("done");
