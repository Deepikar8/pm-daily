import { chromium } from "@playwright/test";
import { mkdirSync, renameSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REPO = "/Users/deepikarudramurthy/Documents/lenny-podcasts";
const OUT_DIR = join(REPO, "docs/_video-raw");
const PREVIEW = "http://localhost:4173/preview.html";

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

// Mobile portrait viewport. Playwright's recordVideo paints only the viewport region —
// any extra pixels beyond the viewport are gray. So viewport size MUST equal record size.
// We use 720x1560 (9:16 portrait, 720p-wide) for crisp output without leaving blank pixels.
const ctx = await browser.newContext({
  viewport: { width: 720, height: 1560 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: OUT_DIR,
    size: { width: 720, height: 1560 },
  },
});

const page = await ctx.newPage();

// Capture console + errors so we can debug failures
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[browser-error]", msg.text());
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("requestfailed", (req) => console.log("[reqfail]", req.url(), req.failure()?.errorText));

// We hide the dev jumper bar AFTER hydration completes (post-page.goto),
// not via addInitScript — the observer-based approach was crashing the page.

await page.goto(PREVIEW, { waitUntil: "networkidle" });
// Wait for Babel + esm.sh + React to hydrate; poll for actual content
await page.waitForFunction(() => {
  // Wait for the React tree to render: look for a real button (not loading text)
  const txt = document.body?.innerText || "";
  return txt.includes("Today's set") || txt.includes("OPERATOR OF THE DAY") || txt.includes("Continue with Google") || txt.length > 200;
}, { timeout: 15000 }).catch((e) => console.log("[hydrate-wait]", e.message));
await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT_DIR, "_debug_after_hydrate.png") }).catch(() => {});

// Inject a stylesheet that hides the dev jumper bar.
// We target by attribute combination unique to that element rather than tagging it
// (which would cause React to detect a foreign DOM mutation).
await page.addStyleTag({
  content: `
    /* Hide the preview-only "Preview · jump to:" debug bar.
       It's the first <div> with brown bg + monospace font in the rendered tree. */
    div[style*="background: rgb(42, 24, 16)"][style*="ui-monospace"],
    div[style*="background:#2A1810"][style*="ui-monospace"] {
      display: none !important;
    }
  `,
});

// Helper: jump to a screen by clicking the (hidden) dev jumper button
async function jumpTo(name) {
  const ok = await page.evaluate((n) => {
    const btns = Array.from(document.querySelectorAll("button"));
    const target = btns.find((b) => (b.textContent || "").trim() === n);
    if (target) { target.click(); return true; }
    return false;
  }, name);
  if (!ok) console.log("[jumpTo] failed:", name);
  await page.waitForTimeout(500);
  // Debug screenshot after each jump
  await page.screenshot({ path: join(OUT_DIR, `_debug_${name}.png`) }).catch(() => {});
}

async function pause(ms) { await page.waitForTimeout(ms); }
async function smoothScroll(targetY, durationMs = 1500) {
  await page.evaluate(({ targetY, durationMs }) => {
    return new Promise((resolve) => {
      const start = window.scrollY;
      const distance = targetY - start;
      const startTime = performance.now();
      function step(t) {
        const progress = Math.min((t - startTime) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start + distance * eased);
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
}

// === BEAT 1: signin (~3s) ===
await jumpTo("signin");
await pause(3000);

// === BEAT 2: onboarding (~5s) ===
await jumpTo("onboarding");
await pause(1200);
const nameField = page.locator('input[placeholder="Aditi M."]').first();
if (await nameField.count()) {
  await nameField.fill("Aditi M.", { timeout: 2000 }).catch(() => {});
}
await pause(900);
const termsBox = page.locator('input[type="checkbox"]').first();
if (await termsBox.count()) {
  await termsBox.check({ timeout: 2000 }).catch(() => {});
}
await pause(1800);

// === BEAT 3: today's digest (~6s) ===
await jumpTo("intro");
await pause(1200);
await smoothScroll(600, 1500);
await pause(700);
await smoothScroll(1300, 1500);
await pause(900);
await smoothScroll(0, 800);
await pause(500);

// === BEAT 4: quiz (~10s scenario + answer + takeaway) ===
await jumpTo("quiz");
await pause(2500); // read scenario

// Click option B (correct on Q1)
const optionB = page.locator("button:has-text('Ask ten of those same customers')").first();
if (await optionB.count()) {
  await optionB.click({ timeout: 2000 }).catch(() => {});
} else {
  // Fallback: click the 2nd option button in the question card
  const allOptions = page.locator("button:has-text('Ask')");
  if (await allOptions.count()) await allOptions.first().click({ timeout: 2000 }).catch(() => {});
}
await pause(2200);
await smoothScroll(700, 1200);
await pause(2800); // pause on takeaway

// Next question
const nextBtn = page.locator("button:has-text('Next question')").first();
if (await nextBtn.count()) {
  await nextBtn.click({ timeout: 2000 }).catch(() => {});
}
await pause(1800);

// Q2: click an option
const waitOption = page.locator("button:has-text('Wait')").first();
if (await waitOption.count()) {
  await waitOption.click({ timeout: 2000 }).catch(() => {});
}
await pause(2000);
await smoothScroll(700, 1000);
await pause(2000);

// === BEAT 5: results (~5s) ===
await jumpTo("results");
await pause(2200);
await smoothScroll(700, 1200);
await pause(1800);
await smoothScroll(1500, 1200);
await pause(1200);

// === BEAT 6: leaderboard (~5s) ===
await jumpTo("leaderboard");
await pause(2200);
await smoothScroll(600, 1100);
await pause(1800);

// === BEAT 7: profile (~5s) ===
await jumpTo("profile");
await pause(2200);
await smoothScroll(700, 1300);
await pause(1500);
await smoothScroll(1500, 1200);
await pause(1500);

await ctx.close();
await browser.close();

// Find the produced webm and rename it
const videos = readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
if (!videos.length) {
  console.error("No video produced");
  process.exit(1);
}
const src = join(OUT_DIR, videos[0]);
const dst = join(OUT_DIR, "raw.webm");
renameSync(src, dst);
console.log("Recorded:", dst);
