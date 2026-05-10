# Quiz History, Replay, and Score Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users replay completed quizzes, complete missed past quizzes, navigate to past quiz/result pages, and understand how their score was calculated.

**Architecture:** Add date-addressable quiz/result routes while preserving `/quiz` and `/quiz/done` as today shortcuts. Keep one scored attempt per user/date for leaderboard integrity; replay is practice only and never writes scored attempt rows. Add score breakdown data to result loads and visible UI cards.

**Tech Stack:** SvelteKit 2, Svelte 5, Cloudflare D1/KV/Durable Objects, Drizzle ORM, Vitest, Playwright.

---

## File Map

- Modify `apps/web/src/routes/quiz/+page.server.ts`: redirect today shortcut to `/quiz/[date]`.
- Create `apps/web/src/routes/quiz/[date]/+page.server.ts`: load explicit date quiz, enforce auth/onboarding, support `?mode=practice`.
- Modify `apps/web/src/routes/quiz/+page.svelte`: keep reusable quiz UI behavior, read `data.mode`, finish to dated result.
- Create `apps/web/src/routes/quiz/[date]/+page.svelte`: re-export or duplicate the quiz page UI depending on SvelteKit import constraints.
- Modify `apps/web/src/routes/quiz/done/+page.server.ts`: redirect today shortcut to `/quiz/[date]/done`.
- Create `apps/web/src/routes/quiz/[date]/done/+page.server.ts`: load explicit date result.
- Create `apps/web/src/routes/quiz/[date]/done/+page.svelte`: result page with score breakdown and replay CTA.
- Modify `apps/web/src/routes/quiz/finish/+server.ts`: support `mode`, prevent practice writes, prevent late attempts from affecting streak/leaderboard.
- Modify `apps/web/src/routes/me/+page.server.ts`: expose available dates and URLs for heatmap/recent sessions.
- Modify `apps/web/src/routes/me/+page.svelte`: link completed/missed days to result or quiz pages.
- Add tests under `apps/web/tests/unit/` and update `apps/web/tests/e2e/go-live.spec.ts`.

## Scoring Rules

- Today scored quiz: writes `quiz_attempts`, `quiz_answers`, stats, streak, and leaderboard.
- Past missed quiz: writes history result but does not repair streak and does not affect leaderboard.
- Practice replay: does not write `quiz_attempts`, `quiz_answers`, stats, streak, or leaderboard.
- Result page must show:
  - Correct points: `correctCount * 20`
  - Speed bonus: `0..20`
  - Streak multiplier: `1.00x`, `1.10x`, `1.20x`, or `1.30x`
  - Total points
  - For practice: `No leaderboard points`
  - For late: `Late challenge: saved to history, not leaderboard`

## User-Facing Late Quiz Messaging

Late behavior must be visible before and after the user starts a missed quiz.

- On a late quiz start page/header:
  - Label: `Late challenge`
  - Helper copy: `This saves to your history, but won’t change your streak or leaderboard rank.`
- On a late result page:
  - Status line: `Saved to your history`
  - Helper copy: `Late challenges help you catch up, but only same-day attempts count toward streaks and leaderboard.`
- On missed heatmap tooltip/title:
  - `Missed · available as late challenge`
- On replay/practice:
  - Label: `Practice replay`
  - Helper copy: `Practice replays do not change your score, streak, or leaderboard rank.`

---

### Task 1: Date Utilities and Route Validation

**Files:**
- Create: `apps/web/src/lib/server/quiz/date.ts`
- Test: `apps/web/tests/unit/quiz-date.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isIsoDate, compareIsoDate } from "../../src/lib/server/quiz/date";

describe("quiz date helpers", () => {
  it("accepts YYYY-MM-DD dates only", () => {
    expect(isIsoDate("2026-05-10")).toBe(true);
    expect(isIsoDate("2026-5-10")).toBe(false);
    expect(isIsoDate("tomorrow")).toBe(false);
  });

  it("compares ISO dates lexically", () => {
    expect(compareIsoDate("2026-05-09", "2026-05-10")).toBeLessThan(0);
    expect(compareIsoDate("2026-05-10", "2026-05-10")).toBe(0);
    expect(compareIsoDate("2026-05-11", "2026-05-10")).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web exec vitest run tests/unit/quiz-date.test.ts`

Expected: fail because `src/lib/server/quiz/date.ts` does not exist.

- [ ] **Step 3: Implement helpers**

```ts
export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function compareIsoDate(a: string, b: string): number {
  return a.localeCompare(b);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web exec vitest run tests/unit/quiz-date.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/server/quiz/date.ts apps/web/tests/unit/quiz-date.test.ts
git commit -m "feat: add quiz date helpers"
```

---

### Task 2: Dated Quiz Route

**Files:**
- Modify: `apps/web/src/routes/quiz/+page.server.ts`
- Create: `apps/web/src/routes/quiz/[date]/+page.server.ts`
- Create: `apps/web/tests/unit/quiz-route-mode.test.ts`

- [ ] **Step 1: Extract today shortcut behavior**

Change `apps/web/src/routes/quiz/+page.server.ts` to compute the user’s local date and redirect:

```ts
throw redirect(302, `/quiz/${date}`);
```

- [ ] **Step 2: Create dated load**

Move existing quiz load behavior into `apps/web/src/routes/quiz/[date]/+page.server.ts`.

Rules:
- unauthenticated → `/`
- not onboarded → `/onboarding`
- invalid date → `/today`
- future date → `/today`
- submitted attempt and no `?mode=practice` → `/quiz/${date}/done`
- submitted attempt and `?mode=practice` → load questions with `mode: "practice"`
- past date with no submitted attempt → load questions with `mode: "late"`
- today with no submitted attempt → load questions with `mode: "scored_today"`

- [ ] **Step 3: Ensure Durable Object key includes mode for practice**

Use:

```ts
const sessionKey = mode === "practice"
  ? `${locals.user.id}:${date}:practice:${crypto.randomUUID()}`
  : `${locals.user.id}:${date}`;
```

For first launch, if `crypto.randomUUID()` is awkward in server load, use query param `replay=1` and let replay start fresh through a reset endpoint in Task 4.

- [ ] **Step 4: Run focused check**

Run: `pnpm --filter web check`

Expected: no errors, existing warnings only.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/quiz/+page.server.ts apps/web/src/routes/quiz/[date]/+page.server.ts
git commit -m "feat: add dated quiz route"
```

---

### Task 3: Finish Modes for Today, Late, and Practice

**Files:**
- Modify: `apps/web/src/routes/quiz/finish/+server.ts`
- Test: `apps/web/tests/unit/scoring.test.ts`

- [ ] **Step 1: Extend finish request body**

Accept:

```ts
type FinishBody = {
  date?: string;
  mode?: "scored_today" | "late" | "practice";
};
```

- [ ] **Step 2: Add practice response**

If `mode === "practice"`, compute correctness/time from DO state and return JSON without inserting into D1 and without recomputing leaderboard:

```ts
return Response.json({
  attemptId: null,
  date,
  mode: "practice",
  totalCorrect,
  totalSeconds,
  totalPoints: 0,
  basePoints,
  speedBonus,
  streakMultiplier: 1,
  leaderboardEligible: false,
});
```

- [ ] **Step 3: Add late response**

If `mode === "late"`, write attempt/answers for history but skip:

```ts
await applyAttemptToStats(...)
await recomputeLeaderboard(env)
```

Return:

```ts
leaderboardEligible: false
```

- [ ] **Step 4: Preserve today behavior**

For `mode === "scored_today"` or missing mode, keep existing stats/streak/leaderboard behavior.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter web exec vitest run tests/unit/scoring.test.ts`

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/quiz/finish/+server.ts apps/web/tests/unit/scoring.test.ts
git commit -m "feat: support quiz finish modes"
```

---

### Task 4: Quiz UI Uses Dated Routes

**Files:**
- Modify: `apps/web/src/routes/quiz/+page.svelte`
- Create: `apps/web/src/routes/quiz/[date]/+page.svelte`

- [ ] **Step 1: Make finish payload include mode**

In the quiz page `next()` finalization call, send:

```ts
body: JSON.stringify({ date: data.date, mode: data.mode })
```

- [ ] **Step 2: Navigate to dated result**

On success:

```ts
await goto(`/quiz/${data.date}/done${data.mode === "practice" ? "?mode=practice" : ""}`);
```

- [ ] **Step 3: Add mode label**

Near the progress header, render:

```svelte
{#if data.mode === "practice"}
  <div class="bg-paper-cream border-2 border-ink rounded-xl px-3 py-2 mb-4">
    <div class="sans text-[11px] font-bold uppercase text-accent">Practice replay</div>
    <div class="sans text-[12px] text-ink-soft mt-0.5">
      Practice replays do not change your score, streak, or leaderboard rank.
    </div>
  </div>
{:else if data.mode === "late"}
  <div class="bg-paper-cream border-2 border-ink rounded-xl px-3 py-2 mb-4">
    <div class="sans text-[11px] font-bold uppercase text-accent">Late challenge</div>
    <div class="sans text-[12px] text-ink-soft mt-0.5">
      This saves to your history, but won’t change your streak or leaderboard rank.
    </div>
  </div>
{/if}
```

- [ ] **Step 4: Run check**

Run: `pnpm --filter web check`

Expected: no errors, existing warnings only.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/quiz/+page.svelte apps/web/src/routes/quiz/[date]/+page.svelte
git commit -m "feat: route quiz completion by date"
```

---

### Task 5: Dated Result Page and Score Breakdown

**Files:**
- Modify: `apps/web/src/routes/quiz/done/+page.server.ts`
- Create: `apps/web/src/routes/quiz/[date]/done/+page.server.ts`
- Create: `apps/web/src/routes/quiz/[date]/done/+page.svelte`
- Modify: `apps/web/src/routes/quiz/done/+page.svelte`

- [ ] **Step 1: Make `/quiz/done` today shortcut**

Compute local date and redirect:

```ts
throw redirect(302, `/quiz/${date}/done`);
```

- [ ] **Step 2: Move current result load to dated result load**

Use `params.date` instead of local today date.

- [ ] **Step 3: Return score breakdown**

Include:

```ts
scoreBreakdown: {
  basePoints: attempt.basePoints ?? 0,
  speedBonus: attempt.speedBonus ?? 0,
  streakMultiplier: attempt.streakMultiplier ?? 1,
  totalPoints: attempt.totalPoints ?? 0,
  leaderboardEligible: params.date === localDate(tz),
}
```

- [ ] **Step 4: Add score explanation UI**

Below the score panel, add a compact card:

```svelte
<div class="bg-white rounded-2xl border-2 border-ink p-4 mb-4">
  <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-mute mb-3">
    How your score was calculated
  </div>
  <div class="grid grid-cols-2 gap-2 sans text-sm">
    <div>Correct</div><div class="text-right mono">{data.scoreBreakdown.basePoints} pts</div>
    <div>Speed bonus</div><div class="text-right mono">+{data.scoreBreakdown.speedBonus}</div>
    <div>Streak</div><div class="text-right mono">{data.scoreBreakdown.streakMultiplier.toFixed(2)}x</div>
    <div class="font-bold">Total</div><div class="text-right mono font-bold">{data.scoreBreakdown.totalPoints} pts</div>
  </div>
</div>
```

- [ ] **Step 5: Add late/practice status copy**

Above the score breakdown card, render:

```svelte
{#if data.mode === "late"}
  <div class="bg-paper-cream border-2 border-ink rounded-2xl p-4 mb-4">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">
      Saved to your history
    </div>
    <p class="sans text-[13px] text-ink-soft m-0">
      Late challenges help you catch up, but only same-day attempts count toward streaks and leaderboard.
    </p>
  </div>
{:else if data.mode === "practice"}
  <div class="bg-paper-cream border-2 border-ink rounded-2xl p-4 mb-4">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">
      Practice replay
    </div>
    <p class="sans text-[13px] text-ink-soft m-0">
      Practice replays do not change your score, streak, or leaderboard rank.
    </p>
  </div>
{/if}
```

- [ ] **Step 6: Add replay CTA**

Add:

```svelte
<a href={`/quiz/${data.date}?mode=practice`} class="sans btn-press ...">
  Replay as practice
</a>
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/quiz/done/+page.server.ts apps/web/src/routes/quiz/done/+page.svelte apps/web/src/routes/quiz/[date]/done
git commit -m "feat: add dated results and score breakdown"
```

---

### Task 6: Past Quiz Links in You

**Files:**
- Modify: `apps/web/src/routes/me/+page.server.ts`
- Modify: `apps/web/src/routes/me/+page.svelte`

- [ ] **Step 1: Add heatmap link data**

Return heatmap items as:

```ts
{
  date: d,
  score: a?.totalCorrect ?? null,
  href: a ? `/quiz/${d}/done` : `/quiz/${d}`,
  available: true
}
```

Only set `available: true` when `dailySessions` exists for the date.

- [ ] **Step 2: Wrap heatmap cell with link**

In Svelte:

```svelte
{#if h.available}
  <a href={h.href} title={h.score ? `${h.score}/5` : "Missed · available as late challenge"} class="block aspect-square border-[1.5px] border-ink rounded" style="background-color: {heatColor(h.score)};"></a>
{:else}
  <div title="not available" class="aspect-square border-[1.5px] border-ink rounded opacity-40" style="background-color: {heatColor(h.score)};"></div>
{/if}
```

- [ ] **Step 3: Link recent sessions**

Wrap recent session rows:

```svelte
<a href={`/quiz/${r.date}/done`} class="flex items-center gap-3.5 px-5 py-3 no-underline text-ink ...">
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/me/+page.server.ts apps/web/src/routes/me/+page.svelte
git commit -m "feat: link training log to past quizzes"
```

---

### Task 7: E2E and Regression Coverage

**Files:**
- Modify: `apps/web/tests/e2e/go-live.spec.ts`
- Create: `apps/web/tests/unit/quiz-mode.test.ts`

- [ ] **Step 1: Add e2e route checks**

Add tests:

```ts
test("public today lesson still renders", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByText(/One daily challenge/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Start today’s challenge/i })).toBeVisible();
});

test("landing page stays accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Product Gym/i })).toBeVisible();
});
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter web exec vitest run tests/unit/quiz-date.test.ts
pnpm --filter web check
pnpm --filter web build
```

Expected: all pass, with existing warnings only.

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/e2e/go-live.spec.ts apps/web/tests/unit/quiz-mode.test.ts
git commit -m "test: cover quiz history routes"
```

---

## Launch Rollout

- Deploy after Task 7.
- Verify production:
  - `/` returns landing page.
  - `/today` renders public lesson.
  - `/quiz` redirects to `/quiz/YYYY-MM-DD`.
  - completed today redirects to `/quiz/YYYY-MM-DD/done`.
  - replay link opens practice mode.
  - `You` heatmap links to past results or missed quizzes.
- Watch leaderboard after one scored today attempt and one late attempt to confirm only today affects leaderboard.

## Self-Review

- Spec coverage: replay, missed past quizzes, links to past quiz pages, and score visibility are covered.
- Placeholder scan: no deferred behavior is left unspecified; late and practice scoring rules are explicit.
- Type consistency: mode strings are consistently `scored_today`, `late`, and `practice`; date routes consistently use `/quiz/[date]` and `/quiz/[date]/done`.
