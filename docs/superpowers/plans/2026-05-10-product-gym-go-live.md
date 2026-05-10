# Product Gym Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the app for a May 13 go-live by turning the hackathon product into Product Gym: a trustworthy, fast, shareable daily product-judgment practice app.

**Architecture:** Keep the existing SvelteKit/Cloudflare app structure. Make launch improvements in thin, testable slices: brand vocabulary, activation, Arena/leaderboard, sharing, mascot assets, and analytics. Treat Claude's generated `apps/web/content/YYYY-MM-DD.json` files as source content and do not modify them unless validation fails.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind, Vitest, Playwright, Better Auth, D1, KV, Durable Objects, Cloudflare Workers, hatch-pet mascot assets.

---

## File Structure

- `apps/web/src/lib/brand/product-gym.ts`: single source of truth for Product Gym names, CTAs, share copy, and route labels.
- `apps/web/src/lib/brand/share.ts`: pure helpers for result share text and public result URLs.
- `apps/web/src/lib/analytics/events.ts`: typed analytics event names and a no-op/browser-safe tracking helper.
- `apps/web/src/lib/components/Nav.svelte`: rename nav labels to Product Gym vocabulary.
- `apps/web/src/lib/components/MascotCoach.svelte`: small wrapper for Kettlebell Coach usage.
- `apps/web/src/routes/+page.svelte`: public landing and demo-start CTA.
- `apps/web/src/routes/+page.server.ts`: remove fake social proof and expose real/fallback launch copy.
- `apps/web/src/routes/demo/+page.server.ts`: load a public demo question.
- `apps/web/src/routes/demo/+page.svelte`: one-question public demo, auth gate after answer.
- `apps/web/src/routes/today/+page.svelte`: faster above-the-fold CTA and collapsed digest path.
- `apps/web/src/routes/quiz/done/+page.svelte`: real share button, challenge CTA, Product Gym result copy.
- `apps/web/src/routes/share/[attemptId]/+page.server.ts`: public result data loader with privacy-safe fields.
- `apps/web/src/routes/share/[attemptId]/+page.svelte`: public result page for shared links.
- `apps/web/src/routes/leaderboard/+page.svelte`: rename leaderboard to Arena and clarify ranking copy.
- `apps/web/src/routes/me/+page.svelte`: remove or wire dead edit/session controls.
- `apps/web/tests/unit/brand-share.test.ts`: share-copy tests.
- `apps/web/tests/unit/content-runway.test.ts`: launch content runway validation.
- `apps/web/tests/e2e/go-live.spec.ts`: critical funnel smoke tests.
- `static/mascots/kettlebell-coach.webp`: final mascot asset after hatch-pet is complete.

---

## Phase 0: Takeover And Content Runway

### Task 0.1: Verify Claude's 14-Day Content Batch

**Files:**
- Read: `apps/web/content/*.json`
- Read: `docs/pipeline-runs/*.md`
- Test: `apps/web/tests/unit/content-runway.test.ts`

- [ ] **Step 1: Write the failing runway test**

Create `apps/web/tests/unit/content-runway.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const launchStart = "2026-05-13";
const launchDays = 14;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("launch content runway", () => {
  it("has 14 consecutive go-live days starting May 13", () => {
    const files = new Set(
      readdirSync("content").filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)),
    );

    for (let i = 0; i < launchDays; i += 1) {
      expect(files.has(`${addDays(launchStart, i)}.json`)).toBe(true);
    }
  });

  it("each launch day has exactly five valid questions", () => {
    for (let i = 0; i < launchDays; i += 1) {
      const date = addDays(launchStart, i);
      const content = JSON.parse(readFileSync(join("content", `${date}.json`), "utf8"));

      expect(content.date).toBe(date);
      expect(content.questions).toHaveLength(5);
      expect(content.questions.map((q: { position: number }) => q.position)).toEqual([1, 2, 3, 4, 5]);

      for (const q of content.questions) {
        expect(["A", "B", "C", "D"]).toContain(q.correct_key);
        expect(q.options.map((o: { key: string }) => o.key).sort()).toEqual(["A", "B", "C", "D"]);
        expect(q.scenario_md.length).toBeGreaterThan(40);
        expect(q.explanation_md.length).toBeGreaterThan(40);
        expect(q.pm_takeaway.length).toBeGreaterThan(20);
        expect(q.citation.quote_excerpt.length).toBeGreaterThan(20);
      }
    }
  });
});
```

- [ ] **Step 2: Run the runway test and verify it fails if Claude has not finished**

Run:

```bash
pnpm --filter web exec vitest run tests/unit/content-runway.test.ts
```

Expected before all 14 files exist: FAIL on missing dated content files.

- [ ] **Step 3: After Claude finishes, rerun the runway test**

Run:

```bash
pnpm --filter web exec vitest run tests/unit/content-runway.test.ts
```

Expected after content lands: PASS.

- [ ] **Step 4: Remove generated local artifacts from commit scope**

Do not commit:

```text
.pnpm-store/
docs/~$pm_daily_hackathon_submission.pptx
```

If `.pnpm-store/` keeps appearing, add it to `.gitignore` in a separate hygiene commit.

- [ ] **Step 5: Commit the verified content batch**

```bash
git add apps/web/content/2026-05-13.json apps/web/content/2026-05-14.json apps/web/content/2026-05-15.json apps/web/content/2026-05-16.json apps/web/content/2026-05-17.json apps/web/content/2026-05-18.json apps/web/content/2026-05-19.json apps/web/content/2026-05-20.json apps/web/content/2026-05-21.json apps/web/content/2026-05-22.json apps/web/content/2026-05-23.json apps/web/content/2026-05-24.json apps/web/content/2026-05-25.json apps/web/content/2026-05-26.json docs/pipeline-runs
git commit -m "content: add first Product Gym launch runway"
```

---

## Phase 1: Trust And Production Hygiene

### Task 1.1: Remove Fake Social Proof

**Files:**
- Modify: `apps/web/src/routes/+page.server.ts`
- Modify: `apps/web/src/routes/+page.svelte`
- Test: `apps/web/tests/e2e/go-live.spec.ts`

- [ ] **Step 1: Add an e2e assertion that fake stats are absent**

Create `apps/web/tests/e2e/go-live.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("landing page does not show fake usage claims", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("4,247 PMs played")).toHaveCount(0);
  await expect(page.getByText(/daily reps for sharper product judgment/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e test and verify it fails**

Run:

```bash
pnpm --filter web test:e2e -- tests/e2e/go-live.spec.ts
```

Expected: FAIL until the landing copy is updated.

- [ ] **Step 3: Update landing server data**

In `apps/web/src/routes/+page.server.ts`, return launch copy instead of a fake user count:

```ts
return {
  previewQuestion: q,
  todayDate: date,
  googleEnabled,
  isFallback: qs.length === 0,
  launchProof: "A daily product judgment rep sourced from expert product conversations.",
};
```

Apply the same `launchProof` field in the fallback branches.

- [ ] **Step 4: Update landing UI copy**

In `apps/web/src/routes/+page.svelte`, replace the hardcoded usage line with:

```svelte
<p class="sans text-center text-xs text-ink-mute mb-5 flex justify-center items-center gap-5 flex-wrap">
  <span class="flex items-center gap-1.5">
    <Users size={13} class="text-accent" /> {data.launchProof}
  </span>
</p>
```

- [ ] **Step 5: Rerun e2e**

Run:

```bash
pnpm --filter web test:e2e -- tests/e2e/go-live.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/+page.server.ts apps/web/src/routes/+page.svelte apps/web/tests/e2e/go-live.spec.ts
git commit -m "fix: remove fake landing social proof"
```

### Task 1.2: Fix Dead Profile Controls

**Files:**
- Modify: `apps/web/src/routes/me/+page.svelte`
- Test: `apps/web/tests/e2e/go-live.spec.ts`

- [ ] **Step 1: Add an e2e check for no inert edit buttons**

Append to `apps/web/tests/e2e/go-live.spec.ts`:

```ts
test("profile does not expose inert edit controls", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByRole("button", { name: /^Edit$/ })).toHaveCount(0);
});
```

- [ ] **Step 2: Run and verify current behavior**

Run:

```bash
pnpm --filter web test:e2e -- tests/e2e/go-live.spec.ts
```

Expected: the new profile test fails if auth fixtures reach `/me`; if e2e auth is not available, keep this as a manual QA checklist and cover the UI with code review.

- [ ] **Step 3: Replace inert edit buttons with honest static state**

In `apps/web/src/routes/me/+page.svelte`, change non-calendar settings rows so they do not render a button:

```svelte
{:else}
  <span class="sans text-[11px] text-ink-mute">Editable after launch</span>
{/if}
```

- [ ] **Step 4: Make recent session rows non-clickable until detail pages exist**

Replace:

```svelte
class="flex items-center gap-3.5 px-5 py-3 cursor-pointer ..."
```

with:

```svelte
class="flex items-center gap-3.5 px-5 py-3 ..."
```

and remove the trailing `ChevronRight` icon from recent rows.

- [ ] **Step 5: Run check**

```bash
pnpm --filter web check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/me/+page.svelte apps/web/tests/e2e/go-live.spec.ts
git commit -m "fix: remove inert profile controls"
```

---

## Phase 2: Product Gym Brand System

### Task 2.1: Add Brand Vocabulary Helpers

**Files:**
- Create: `apps/web/src/lib/brand/product-gym.ts`
- Test: `apps/web/tests/unit/product-gym-brand.test.ts`

- [ ] **Step 1: Write brand vocabulary tests**

Create `apps/web/tests/unit/product-gym-brand.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { brandCopy, navLabels } from "../../src/lib/brand/product-gym";

describe("Product Gym brand copy", () => {
  it("uses Product Gym as the app brand", () => {
    expect(brandCopy.appName).toBe("Product Gym");
    expect(brandCopy.tagline).toBe("Daily reps for sharper product judgment.");
  });

  it("uses Arena as the competitive surface", () => {
    expect(navLabels.arena).toBe("Arena");
    expect(brandCopy.leaderboardName).toBe("Arena");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

```bash
pnpm --filter web exec vitest run tests/unit/product-gym-brand.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement brand helper**

Create `apps/web/src/lib/brand/product-gym.ts`:

```ts
export const brandCopy = {
  appName: "Product Gym",
  tagline: "Daily reps for sharper product judgment.",
  todayRep: "Today’s Rep",
  takeRepCta: "Take today’s rep",
  demoCta: "Try a sample rep",
  leaderboardName: "Arena",
  profileName: "Training Log",
  streakName: "Training Streak",
} as const;

export const navLabels = {
  today: "Today",
  rep: "Rep",
  arena: "Arena",
  trainingLog: "Log",
} as const;
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter web exec vitest run tests/unit/product-gym-brand.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/brand/product-gym.ts apps/web/tests/unit/product-gym-brand.test.ts
git commit -m "feat: add Product Gym brand vocabulary"
```

### Task 2.2: Apply Brand Copy Across Core UI

**Files:**
- Modify: `apps/web/src/lib/components/Nav.svelte`
- Modify: `apps/web/src/lib/components/Footer.svelte`
- Modify: `apps/web/src/routes/+page.svelte`
- Modify: `apps/web/src/routes/today/+page.svelte`
- Modify: `apps/web/src/routes/quiz/+page.svelte`
- Modify: `apps/web/src/routes/quiz/done/+page.svelte`
- Modify: `apps/web/src/routes/leaderboard/+page.svelte`
- Modify: `apps/web/src/routes/me/+page.svelte`

- [ ] **Step 1: Replace visible PM Daily app labels**

Use `brandCopy.appName` where the app brand appears in nav/footer/title-like UI. Keep source attribution separate as “Sourced from expert product conversations” or “Sourced from Lenny’s Podcast” where the user is viewing a cited source.

- [ ] **Step 2: Rename leaderboard UI to Arena**

In `apps/web/src/routes/leaderboard/+page.svelte`, change the page title and headings:

```svelte
<svelte:head><title>Arena — Product Gym</title></svelte:head>
```

Use “Arena” in visible labels and keep the route `/leaderboard` for now to avoid route churn.

- [ ] **Step 3: Rename quiz CTAs**

Replace “quiz” CTA copy with “rep” copy:

```svelte
{brandCopy.takeRepCta}
```

- [ ] **Step 4: Run text search**

Run:

```bash
rg -n "PM Daily|leaderboard|quiz|Profile|Today's quiz" apps/web/src
```

Expected: remaining occurrences are route names, source-compatible technical names, or intentionally retained legacy internal identifiers.

- [ ] **Step 5: Run check and tests**

```bash
pnpm --filter web check
pnpm --filter web test
```

Expected: 0 errors, tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "feat: apply Product Gym brand copy"
```

---

## Phase 3: Activation And Public Demo

### Task 3.1: Add Public One-Question Demo

**Files:**
- Create: `apps/web/src/routes/demo/+page.server.ts`
- Create: `apps/web/src/routes/demo/+page.svelte`
- Modify: `apps/web/src/routes/+page.svelte`
- Test: `apps/web/tests/e2e/go-live.spec.ts`

- [ ] **Step 1: Add e2e for demo access**

Append:

```ts
test("public users can try one sample rep before sign-in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /try a sample rep/i }).click();
  await expect(page).toHaveURL(/\/demo/);
  await expect(page.getByText(/Question 1 of 1|Sample rep/i)).toBeVisible();
});
```

- [ ] **Step 2: Run e2e and verify it fails**

```bash
pnpm --filter web test:e2e -- tests/e2e/go-live.spec.ts
```

Expected: FAIL because `/demo` does not exist.

- [ ] **Step 3: Create demo server loader**

Create `apps/web/src/routes/demo/+page.server.ts`:

```ts
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { formatInTimeZone } from "date-fns-tz";

const fallbackQuestion = {
  position: 1,
  archetype: "diagnose",
  scenario_md:
    "A founder says activation is flat, but power users keep inviting teammates. What should the PM investigate first?",
  options: [
    { key: "A", text: "Whether invited teammates reach the same aha moment as the inviter" },
    { key: "B", text: "Whether the homepage explains every feature" },
    { key: "C", text: "Whether paid ads can increase top-of-funnel volume" },
    { key: "D", text: "Whether the team should add more notification channels" },
  ],
  correct_key: "A",
  explanation_md:
    "The strongest signal is not more traffic. It is whether the invited teammate reaches the same value moment that caused the original user to invite them.",
  pm_takeaway: "Follow the activation chain, not the loudest metric.",
};

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform?.env) return { question: fallbackQuestion, isFallback: true };
  const date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
  const cached = await platform.env.KV.get(kvKeys.todayQuestions(date));
  const questions = cached ? JSON.parse(cached) : [];
  return { question: questions[0] ?? fallbackQuestion, isFallback: questions.length === 0 };
};
```

- [ ] **Step 4: Create demo page**

Create `apps/web/src/routes/demo/+page.svelte` with a one-question client-side reveal:

```svelte
<script lang="ts">
  import { ArrowRight, Check, X as XIcon } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";

  let { data } = $props();
  let selected = $state<string | null>(null);
  let revealed = $state(false);
  const q = $derived(data.question);
</script>

<svelte:head><title>Sample Rep — {brandCopy.appName}</title></svelte:head>

<main class="max-w-2xl mx-auto px-6 py-10">
  <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-3">Sample rep</p>
  <h1 class="serif text-4xl font-extrabold leading-tight mb-5">Make the call.</h1>
  <h2 class="serif text-[24px] font-bold leading-snug mb-5">{q.scenario_md}</h2>

  <div class="flex flex-col gap-3 mb-5">
    {#each q.options as opt}
      {@const isSelected = selected === opt.key}
      {@const isCorrect = revealed && q.correct_key === opt.key}
      {@const isWrong = revealed && isSelected && !isCorrect}
      <button
        disabled={revealed}
        onclick={() => (selected = opt.key)}
        class="sans text-left rounded-2xl px-4 py-4 text-[15px] font-medium border-2 flex items-center gap-3 {isCorrect ? 'bg-[#E8F0DC] border-ok' : isWrong ? 'bg-[#F8DDD3] border-wrong' : isSelected ? 'bg-paper-cream border-accent' : 'bg-white border-ink shadow-brut'}"
      >
        <span class="w-7 h-7 rounded-full border-2 border-ink flex items-center justify-center serif font-bold">
          {#if isCorrect}<Check size={16} />{:else if isWrong}<XIcon size={16} />{:else}{opt.key}{/if}
        </span>
        <span>{opt.text}</span>
      </button>
    {/each}
  </div>

  {#if !revealed}
    <button disabled={!selected} onclick={() => (revealed = true)} class="sans btn-press w-full bg-accent text-paper border-2 border-ink rounded-2xl py-4 font-bold shadow-brut-lg">
      Check my call
    </button>
  {:else}
    <div class="bg-white border-2 border-ink rounded-2xl p-5 shadow-brut mb-4">
      <p class="serif text-xl font-bold mb-2">{selected === q.correct_key ? "Strong call." : "Good rep. Different call."}</p>
      <p class="sans text-sm text-ink-soft mb-3">{q.explanation_md}</p>
      <p class="serif italic text-lg">{q.pm_takeaway}</p>
    </div>
    <a href="/" class="sans btn-press flex items-center justify-center gap-2 bg-accent text-paper border-2 border-ink rounded-2xl py-4 font-bold shadow-brut-lg no-underline">
      Save streaks and enter the Arena <ArrowRight size={16} />
    </a>
  {/if}
</main>
```

- [ ] **Step 5: Add landing CTA**

In `apps/web/src/routes/+page.svelte`, add a secondary link:

```svelte
<a href="/demo" class="sans btn-press w-full bg-white text-ink border-2 border-ink rounded-2xl py-4 text-[15px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline">
  {brandCopy.demoCta}
</a>
```

- [ ] **Step 6: Run e2e**

```bash
pnpm --filter web test:e2e -- tests/e2e/go-live.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/routes/demo apps/web/src/routes/+page.svelte apps/web/tests/e2e/go-live.spec.ts
git commit -m "feat: add public sample rep"
```

### Task 3.2: Speed Up Today Page

**Files:**
- Modify: `apps/web/src/routes/today/+page.svelte`

- [ ] **Step 1: Move primary CTA above digest**

Add the existing CTA strip immediately after the byline strip, before the pull quote and digest.

- [ ] **Step 2: Collapse long digest behind a details block on mobile**

Wrap the digest in:

```svelte
<details class="sm:block" open>
  <summary class="sans sm:hidden text-[13px] font-bold text-accent mb-3">Read today’s brief</summary>
  <article class="serif text-[17px] leading-[1.65] text-ink prose-pmd">
    {@html marked(c.digest_md ?? "")}
  </article>
</details>
```

- [ ] **Step 3: Run check**

```bash
pnpm --filter web check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/today/+page.svelte
git commit -m "feat: make today's rep easier to start"
```

---

## Phase 4: Sharing And Virality

### Task 4.1: Add Share Copy Helpers

**Files:**
- Create: `apps/web/src/lib/brand/share.ts`
- Test: `apps/web/tests/unit/brand-share.test.ts`

- [ ] **Step 1: Write failing share tests**

Create `apps/web/tests/unit/brand-share.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildResultShareText } from "../../src/lib/brand/share";

describe("buildResultShareText", () => {
  it("includes score, time, and Product Gym", () => {
    expect(
      buildResultShareText({
        score: 4,
        total: 5,
        seconds: 134,
        sourceName: "Madhavan on pricing",
        url: "https://productgym.example/share/abc",
      }),
    ).toBe("I got 4/5 on today’s Product Gym rep: Madhavan on pricing. Beat my time: 2:14 https://productgym.example/share/abc");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

```bash
pnpm --filter web exec vitest run tests/unit/brand-share.test.ts
```

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helper**

Create `apps/web/src/lib/brand/share.ts`:

```ts
export function formatShareTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function buildResultShareText(args: {
  score: number;
  total: number;
  seconds: number;
  sourceName: string;
  url: string;
}): string {
  return `I got ${args.score}/${args.total} on today’s Product Gym rep: ${args.sourceName}. Beat my time: ${formatShareTime(args.seconds)} ${args.url}`;
}
```

- [ ] **Step 4: Run test**

```bash
pnpm --filter web exec vitest run tests/unit/brand-share.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/brand/share.ts apps/web/tests/unit/brand-share.test.ts
git commit -m "feat: add result share copy"
```

### Task 4.2: Wire Result Share Button

**Files:**
- Modify: `apps/web/src/routes/quiz/done/+page.svelte`
- Modify: `apps/web/src/routes/quiz/done/+page.server.ts`

- [ ] **Step 1: Add share URL to server data**

In `apps/web/src/routes/quiz/done/+page.server.ts`, include:

```ts
shareUrl: `/share/${attempt.id}`,
sourceName: source?.title ?? "today’s product judgment call",
```

- [ ] **Step 2: Add client share handler**

In `apps/web/src/routes/quiz/done/+page.svelte`:

```svelte
<script lang="ts">
  import { buildResultShareText } from "$lib/brand/share";
  let shareStatus = $state<string | null>(null);

  async function shareResult() {
    const url = new URL(data.shareUrl, window.location.origin).toString();
    const text = buildResultShareText({
      score: data.attempt.totalCorrect,
      total: 5,
      seconds: data.attempt.totalSeconds,
      sourceName: data.sourceName,
      url,
    });

    if (navigator.share) {
      await navigator.share({ title: "Product Gym result", text, url });
      return;
    }

    await navigator.clipboard.writeText(text);
    shareStatus = "Copied";
  }
</script>
```

Change the share button:

```svelte
<button onclick={shareResult} class="sans btn-press bg-white text-ink border-2 border-ink rounded-2xl px-5 py-4 text-[14px] font-bold shadow-brut flex items-center gap-2">
  <Share2 size={15} /> {shareStatus ?? "Share"}
</button>
```

- [ ] **Step 3: Run unit and check**

```bash
pnpm --filter web exec vitest run tests/unit/brand-share.test.ts
pnpm --filter web check
```

Expected: PASS, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/quiz/done apps/web/src/lib/brand/share.ts
git commit -m "feat: enable result sharing"
```

### Task 4.3: Add Public Share Result Page

**Files:**
- Create: `apps/web/src/routes/share/[attemptId]/+page.server.ts`
- Create: `apps/web/src/routes/share/[attemptId]/+page.svelte`

- [ ] **Step 1: Create privacy-safe loader**

Create `apps/web/src/routes/share/[attemptId]/+page.server.ts`:

```ts
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getDb } from "$lib/server/db/client";
import { dailySessions, quizAttempts, users } from "$lib/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, platform }) => {
  if (!platform?.env) throw error(404);
  const db = getDb(platform.env.DB);
  const attempt = await db
    .select({
      id: quizAttempts.id,
      date: quizAttempts.date,
      totalCorrect: quizAttempts.totalCorrect,
      totalSeconds: quizAttempts.totalSeconds,
      displayName: users.displayName,
    })
    .from(quizAttempts)
    .innerJoin(users, eq(users.id, quizAttempts.userId))
    .where(and(eq(quizAttempts.id, params.attemptId), isNull(users.deletedAt)))
    .get();

  if (!attempt) throw error(404);

  const session = await db.select().from(dailySessions).where(eq(dailySessions.date, attempt.date)).get();
  const source = session ? JSON.parse(session.sourceJson) : null;

  return {
    attempt,
    headline: session?.headline ?? "Product Gym rep",
    sourceName: source?.title ?? "today’s rep",
  };
};
```

- [ ] **Step 2: Create share page**

Create `apps/web/src/routes/share/[attemptId]/+page.svelte`:

```svelte
<script lang="ts">
  import { Trophy, ArrowRight } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  let { data } = $props();
  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }
</script>

<svelte:head>
  <title>{data.attempt.displayName}'s Product Gym result</title>
  <meta property="og:title" content={`${data.attempt.displayName} scored ${data.attempt.totalCorrect}/5 on Product Gym`} />
  <meta property="og:description" content={`Beat their time: ${fmtTime(data.attempt.totalSeconds ?? 0)}.`} />
</svelte:head>

<main class="max-w-xl mx-auto px-6 py-12 text-center">
  <Trophy size={36} class="mx-auto text-accent mb-4" />
  <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-2">{brandCopy.appName}</p>
  <h1 class="serif text-5xl font-extrabold leading-none mb-3">
    {data.attempt.totalCorrect}/5
  </h1>
  <p class="serif italic text-lg text-ink-soft mb-6">
    {data.attempt.displayName} finished {data.sourceName} in {fmtTime(data.attempt.totalSeconds ?? 0)}.
  </p>
  <a href="/demo" class="sans btn-press inline-flex items-center justify-center gap-2 bg-accent text-paper border-2 border-ink rounded-2xl px-5 py-4 font-bold shadow-brut no-underline">
    Try a sample rep <ArrowRight size={16} />
  </a>
</main>
```

- [ ] **Step 3: Run build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/share
git commit -m "feat: add public result pages"
```

---

## Phase 5: Mascot Integration

### Task 5.1: Finish Kettlebell Coach Hatch-Pet

**Files:**
- Generated: `${CODEX_HOME:-$HOME/.codex}/pets/kettlebell-coach/pet.json`
- Generated: `${CODEX_HOME:-$HOME/.codex}/pets/kettlebell-coach/spritesheet.webp`
- Copy: `static/mascots/kettlebell-coach.webp`

- [ ] **Step 1: Continue hatch-pet with subagents**

Use the active hatch-pet run:

```text
/private/tmp/product-gym-pets-20260510/kettlebell-coach
```

Generate row jobs using subagents as required by `hatch-pet`.

- [ ] **Step 2: Finalize and inspect QA**

Run:

```bash
python3 /Users/deepikarudramurthy/.codex/skills/hatch-pet/scripts/finalize_pet_run.py --run-dir /private/tmp/product-gym-pets-20260510/kettlebell-coach
```

Inspect:

```text
/private/tmp/product-gym-pets-20260510/kettlebell-coach/qa/contact-sheet.png
/private/tmp/product-gym-pets-20260510/kettlebell-coach/final/validation.json
```

Expected: visual identity consistent across rows, validation passes.

- [ ] **Step 3: Copy final spritesheet to app static assets**

```bash
mkdir -p apps/web/static/mascots
cp "${HOME}/.codex/pets/kettlebell-coach/spritesheet.webp" apps/web/static/mascots/kettlebell-coach.webp
```

- [ ] **Step 4: Commit asset**

```bash
git add apps/web/static/mascots/kettlebell-coach.webp
git commit -m "asset: add Kettlebell Coach mascot"
```

### Task 5.2: Add Mascot Coach Component

**Files:**
- Create: `apps/web/src/lib/components/MascotCoach.svelte`
- Modify: `apps/web/src/routes/quiz/done/+page.svelte`
- Modify: `apps/web/src/routes/leaderboard/+page.svelte`

- [ ] **Step 1: Create component**

Create `apps/web/src/lib/components/MascotCoach.svelte`:

```svelte
<script lang="ts">
  let {
    message,
    tone = "neutral",
  }: {
    message: string;
    tone?: "neutral" | "success" | "miss" | "empty";
  } = $props();
</script>

<div class="flex items-center gap-3 bg-paper-warm border-2 border-ink rounded-2xl px-4 py-3 shadow-brut-deep">
  <div
    class="w-14 h-14 bg-center bg-no-repeat bg-contain flex-shrink-0"
    style="background-image: url('/mascots/kettlebell-coach.webp')"
    aria-hidden="true"
  ></div>
  <p class="serif italic text-[15px] leading-snug text-ink">
    {message}
  </p>
</div>
```

- [ ] **Step 2: Use mascot on result page**

In `apps/web/src/routes/quiz/done/+page.svelte`, import:

```ts
import MascotCoach from "$lib/components/MascotCoach.svelte";
```

Add after score panel:

```svelte
<MascotCoach
  tone={data.attempt.totalCorrect >= 4 ? "success" : "miss"}
  message={data.attempt.totalCorrect >= 4 ? "Strong rep. You found the real constraint." : "Good rep. Every miss is a thing you now know."}
/>
```

- [ ] **Step 3: Use mascot in empty Arena state**

In `apps/web/src/routes/leaderboard/+page.svelte`, import `MascotCoach` and add it inside the empty state:

```svelte
<MascotCoach tone="empty" message="Be first in the Arena today. One rep is enough to set the pace." />
```

- [ ] **Step 4: Run check**

```bash
pnpm --filter web check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/components/MascotCoach.svelte apps/web/src/routes/quiz/done/+page.svelte apps/web/src/routes/leaderboard/+page.svelte
git commit -m "feat: add Kettlebell Coach moments"
```

---

## Phase 6: Analytics And Go-Live QA

### Task 6.1: Add Launch Analytics Events

**Files:**
- Create: `apps/web/src/lib/analytics/events.ts`
- Modify: `apps/web/src/routes/+page.svelte`
- Modify: `apps/web/src/routes/demo/+page.svelte`
- Modify: `apps/web/src/routes/quiz/done/+page.svelte`

- [ ] **Step 1: Create typed event helper**

Create `apps/web/src/lib/analytics/events.ts`:

```ts
export type AnalyticsEvent =
  | "landing_viewed"
  | "demo_started"
  | "demo_completed"
  | "signup_started"
  | "rep_completed"
  | "result_shared";

export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("product-gym:event", { detail: { event, properties } }));
}
```

- [ ] **Step 2: Track demo start and completion**

In `apps/web/src/routes/demo/+page.svelte`, call:

```ts
import { track } from "$lib/analytics/events";
```

When the user reveals:

```svelte
onclick={() => {
  revealed = true;
  track("demo_completed", { correct: selected === q.correct_key });
}}
```

- [ ] **Step 3: Track result share**

In `shareResult`, after successful native share or clipboard copy:

```ts
track("result_shared", { score: data.attempt.totalCorrect });
```

- [ ] **Step 4: Run check**

```bash
pnpm --filter web check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/analytics/events.ts apps/web/src/routes
git commit -m "feat: add launch funnel analytics events"
```

### Task 6.2: Final Go-Live Verification

**Files:**
- Read: all changed files

- [ ] **Step 1: Run full verification**

```bash
pnpm --filter web check
pnpm --filter web test
pnpm --filter web build
```

Expected:

```text
svelte-check found 0 errors
Test Files all passed
build completed with adapter-cloudflare-with-do patch
```

- [ ] **Step 2: Run e2e smoke**

```bash
pnpm --filter web test:e2e
```

Expected: PASS, or document any environment-only auth fixture limitation.

- [ ] **Step 3: Manual mobile QA**

Check these routes at mobile width:

```text
/
/demo
/today
/quiz
/quiz/done
/leaderboard
/me
```

Verify:

```text
No overlapping text
Primary CTA visible without excessive scrolling
Share button works or copies text
Arena empty and populated states render
Mascot is visible but not dominant
No fake usage stats
```

- [ ] **Step 4: Commit final fixes**

```bash
git status --short
git add <only intended files>
git commit -m "chore: complete Product Gym go-live QA"
```

---

## Self-Review

- Spec coverage: Plan covers content runway, fake stats/trust, Product Gym rebrand, public demo, Today CTA speed, sharing, public result pages, mascot integration, analytics, and final QA.
- Placeholder scan: No `TBD` or open-ended “add appropriate” steps remain. Each code task includes concrete file paths and code snippets.
- Type consistency: `brandCopy`, `navLabels`, `buildResultShareText`, `track`, and public route names are defined before use.
- Deferred intentionally: catch-up archive for missed days is not included in this go-live batch. It should be a separate post-launch plan because it changes scoring, streak, and Arena fairness rules.
