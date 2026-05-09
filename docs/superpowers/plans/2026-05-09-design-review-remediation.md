# Design Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the May 9 design review findings by making the unauthenticated product preview durable, adding purposeful forward motion to empty states, reducing the one-note brown/orange palette, and tightening mobile utility layouts.

**Architecture:** Keep the current SvelteKit route structure and Tailwind token system. Add small focused UI helpers only where repeated patterns emerge; otherwise modify the existing route components directly. Verify visually with Playwright screenshots at mobile and desktop sizes.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind, `lucide-svelte`, Playwright screenshot CLI, `svelte-check`.

---

## File Map

- Modify `apps/web/tailwind.config.ts`: add a cool secondary palette and utility shadows for non-primary surfaces.
- Modify `apps/web/src/routes/+page.server.ts`: return a stable fallback preview question when KV is unavailable.
- Modify `apps/web/src/routes/+page.svelte`: always render product proof; make auth CTAs secondary to seeing the quiz shape.
- Modify `apps/web/src/routes/leaderboard/+page.svelte`: add actionable empty state and reduce orange dominance.
- Modify `apps/web/src/routes/today/+page.svelte`: reduce editorial top weight and expose the quiz action earlier on mobile.
- Modify `apps/web/src/routes/me/+page.svelte`: make stats responsive and prevent cramped mobile labels.
- Create `apps/web/tests/e2e/design.spec.ts`: add lightweight smoke checks for design-critical states.

---

## Task 1: Add Durable Landing Preview

**Files:**
- Modify: `apps/web/src/routes/+page.server.ts`
- Modify: `apps/web/src/routes/+page.svelte`
- Test: `apps/web/tests/e2e/design.spec.ts`

- [ ] **Step 1: Write the failing Playwright smoke tests**

Create `apps/web/tests/e2e/design.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home always shows product proof before auth", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Today's question", { exact: false })).toBeVisible();
  await expect(page.getByText("sign in to submit", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Email me a magic link" })).toBeVisible();
});

test("home mobile keeps primary content in the first viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Five questions a day, sourced from Lenny's Podcast." })).toBeVisible();
  await expect(page.getByText("Today's question", { exact: false })).toBeVisible();
});
```

- [ ] **Step 2: Run tests and confirm the first test fails when KV has no preview**

Run:

```bash
pnpm --filter web test:e2e -- design.spec.ts
```

Expected: FAIL on `Today's question` when local KV has no seeded preview.

- [ ] **Step 3: Add a local fallback preview object**

In `apps/web/src/routes/+page.server.ts`, add this constant above `load`:

```ts
const fallbackPreviewQuestion = {
  position: 1,
  archetype: "diagnose",
  scenario_md:
    "A founder says activation is flat, but power users keep inviting teammates. What should the PM investigate first?",
  options: [
    { key: "A", text: "Whether the invited teammates reach the same aha moment as the inviter" },
    { key: "B", text: "Whether the homepage explains every feature in the product" },
    { key: "C", text: "Whether paid ads can increase top-of-funnel volume" },
    { key: "D", text: "Whether the team should add more notification channels" },
  ],
};
```

Then replace both `previewQuestion: null` returns with `previewQuestion: fallbackPreviewQuestion`:

```ts
if (!platform?.env) {
  return {
    previewQuestion: fallbackPreviewQuestion,
    todayDate: new Date().toISOString().slice(0, 10),
  };
}

const date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
const cached = await platform.env.KV.get(kvKeys.todayQuestions(date));
if (!cached) return { previewQuestion: fallbackPreviewQuestion, todayDate: date };
```

- [ ] **Step 4: Make the preview visually intentional, not conditional filler**

In `apps/web/src/routes/+page.svelte`, keep the preview block but remove the outer `{#if data.previewQuestion}` guard. Inside the block, use `{@const preview = data.previewQuestion}` and reference `preview`.

Use this header copy:

```svelte
<span class="sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-soft">
  Today's question · preview
</span>
```

Keep `+2 more options · sign in to submit` visible.

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter web test:e2e -- design.spec.ts
pnpm --filter web check
```

Expected: e2e tests pass. `svelte-check` has 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/+page.server.ts apps/web/src/routes/+page.svelte apps/web/tests/e2e/design.spec.ts
git commit -m "fix(design): keep product preview visible on landing"
```

---

## Task 2: Broaden the Palette Without Rebranding

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/routes/leaderboard/+page.svelte`
- Modify: `apps/web/src/routes/me/+page.svelte`

- [ ] **Step 1: Add secondary design tokens**

In `apps/web/tailwind.config.ts`, extend `colors` with a cool-but-muted family:

```ts
secondary: {
  DEFAULT: "#2F6F73",
  soft: "#5E8F92",
  fill: "#DDEDEC",
  deep: "#17484B",
},
neutral: {
  line: "#D8CEC0",
  panel: "#F7F2EA",
},
```

Keep existing `paper`, `ink`, `accent`, `ok`, `wrong`, and `gold` unchanged.

- [ ] **Step 2: Move non-primary leaderboard accents off orange**

In `apps/web/src/routes/leaderboard/+page.svelte`, update `avatarBg`:

```ts
function avatarBg(i: number) {
  const palette = ["#2F6F73", "#8B4513", "#5A8A3A", "#A0522D", "#17484B", "#8B7355"];
  return palette[i % palette.length];
}
```

Change the inactive segmented control text color from `text-ink-soft` to `text-secondary-deep`:

```svelte
{scope === opt.id ? 'bg-ink text-paper' : 'text-secondary-deep hover:text-ink'}
```

- [ ] **Step 3: Move profile heatmap miss/low colors out of the orange family**

In `apps/web/src/routes/me/+page.svelte`, replace `heatColors` with:

```ts
const heatColors = ["#DDEDEC", "#F0E8D4", "#E8B04B", "#D2691E", "#8B4513", "#5A8A3A"];
```

- [ ] **Step 4: Run visual screenshot checks**

Run:

```bash
pnpm --filter web dev -- --host 127.0.0.1 --port 5173
pnpm --filter web exec playwright screenshot --viewport-size=390,844 http://localhost:5173/leaderboard /private/tmp/pm-leaderboard-palette.png
```

Expected: leaderboard no longer reads as all orange/brown; primary orange still identifies emphasis and CTA surfaces.

- [ ] **Step 5: Run check**

```bash
pnpm --filter web check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/src/routes/leaderboard/+page.svelte apps/web/src/routes/me/+page.svelte
git commit -m "style(design): add secondary palette for utility surfaces"
```

---

## Task 3: Make Empty States Actionable

**Files:**
- Modify: `apps/web/src/routes/leaderboard/+page.svelte`
- Test: `apps/web/tests/e2e/design.spec.ts`

- [ ] **Step 1: Add failing empty-state test**

Append to `apps/web/tests/e2e/design.spec.ts`:

```ts
test("leaderboard empty state offers a next action", async ({ page }) => {
  await page.goto("/leaderboard");

  await expect(page.getByText("No standings yet", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Take today's quiz" })).toBeVisible();
});
```

- [ ] **Step 2: Run test and confirm failure**

```bash
pnpm --filter web test:e2e -- design.spec.ts
```

Expected: FAIL because there is no `Take today's quiz` link in the empty state.

- [ ] **Step 3: Add action row to leaderboard empty state**

In `apps/web/src/routes/leaderboard/+page.svelte`, import `ArrowRight`:

```ts
import { Trophy, Crown, TrendingUp, Users, ArrowRight } from "lucide-svelte";
```

Replace the activeBoard empty state with:

```svelte
{#if activeBoard.length === 0}
  <div class="px-5 py-10 text-center">
    <Trophy size={32} class="text-secondary mx-auto mb-3" />
    <p class="serif italic text-ink-soft mb-4">
      No standings yet — be the first to play today.
    </p>
    <a
      href="/quiz"
      class="sans btn-press inline-flex items-center justify-center gap-2 bg-accent text-paper border-2 border-ink rounded-2xl px-5 py-3 text-[14px] font-bold shadow-brut no-underline"
    >
      Take today's quiz <ArrowRight size={15} />
    </a>
  </div>
{/if}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter web test:e2e -- design.spec.ts
pnpm --filter web check
```

Expected: e2e tests pass; 0 type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/leaderboard/+page.svelte apps/web/tests/e2e/design.spec.ts
git commit -m "fix(design): add leaderboard empty state action"
```

---

## Task 4: Tighten Daily Utility Hierarchy

**Files:**
- Modify: `apps/web/src/routes/today/+page.svelte`

- [ ] **Step 1: Reduce mobile headline scale and top spacing**

Change the main container in `apps/web/src/routes/today/+page.svelte`:

```svelte
<main class="max-w-2xl mx-auto px-6 py-7 sm:py-10">
```

Change the headline:

```svelte
<h1 class="serif text-[34px] sm:text-[44px] font-extrabold leading-[1.03] tracking-tight mt-1 mb-3">
  {c.headline}.
</h1>
```

- [ ] **Step 2: Add an early compact CTA under the byline strip**

After the byline strip, add:

```svelte
<a
  href="/quiz"
  class="sans btn-press mb-6 bg-accent text-paper border-2 border-ink rounded-2xl px-4 py-3 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline sm:hidden"
>
  Take today's quiz <ArrowRight size={15} />
</a>
```

Keep the existing bottom CTA; this mobile-only early CTA prevents long digest content from burying the primary action.

- [ ] **Step 3: Make pull quote less dominant on mobile**

Change the blockquote class:

```svelte
<blockquote class="serif text-[21px] sm:text-[26px] italic leading-[1.28] text-ink my-6 sm:my-7 pl-5 border-l-[3px] border-accent font-medium tracking-tight">
```

- [ ] **Step 4: Capture mobile screenshot**

```bash
pnpm --filter web exec playwright screenshot --viewport-size=390,844 http://localhost:5173/today /private/tmp/pm-today-tightened.png
```

Expected: on a seeded/authenticated local session, the quiz action is visible before the digest body. If local auth redirects to `/`, note this and rely on code review plus later authenticated QA.

- [ ] **Step 5: Run check and commit**

```bash
pnpm --filter web check
git add apps/web/src/routes/today/+page.svelte
git commit -m "style(design): tighten today page mobile hierarchy"
```

Expected: `svelte-check` has 0 errors.

---

## Task 5: Make Profile Stats Responsive

**Files:**
- Modify: `apps/web/src/routes/me/+page.svelte`

- [ ] **Step 1: Change stat grid to two columns on mobile**

In `apps/web/src/routes/me/+page.svelte`, replace:

```svelte
<div class="grid grid-cols-4 gap-2 mb-5">
```

with:

```svelte
<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
```

- [ ] **Step 2: Stabilize stat card text wrapping**

Replace the stat card internals with:

```svelte
<div class="bg-white border-2 border-ink rounded-xl px-3 py-3 shadow-brut-deep min-h-[74px]">
  <div class="sans text-[9px] font-bold tracking-widest uppercase text-ink-mute mb-1 leading-tight">{s.label}</div>
  <div class="serif text-xl font-extrabold leading-none mono break-words">{s.val}</div>
</div>
```

- [ ] **Step 3: Run check**

```bash
pnpm --filter web check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/me/+page.svelte
git commit -m "style(design): improve profile stats on mobile"
```

---

## Task 6: Final Visual Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Start the dev server**

```bash
pnpm --filter web dev -- --host 127.0.0.1 --port 5173
```

Expected: Vite reports `Local: http://localhost:5173/`.

- [ ] **Step 2: Capture key screenshots**

```bash
pnpm --filter web exec playwright screenshot --viewport-size=390,844 http://localhost:5173/ /private/tmp/pm-home-final-mobile.png
pnpm --filter web exec playwright screenshot --viewport-size=1280,900 http://localhost:5173/ /private/tmp/pm-home-final-desktop.png
pnpm --filter web exec playwright screenshot --viewport-size=390,844 http://localhost:5173/leaderboard /private/tmp/pm-leaderboard-final-mobile.png
```

Expected:
- Home mobile shows heading, preview card, Google CTA, and email CTA without clipping.
- Home desktop does not show runtime errors.
- Leaderboard empty state includes a visible `Take today's quiz` action.

- [ ] **Step 3: Run full checks**

```bash
pnpm --filter web check
pnpm --filter web test
pnpm --filter web test:e2e -- design.spec.ts
pnpm --filter web build
```

Expected:
- `check`: 0 errors.
- `test`: all unit tests pass.
- `test:e2e -- design.spec.ts`: all design smoke tests pass.
- `build`: production build succeeds.

- [ ] **Step 4: Commit final verification notes if screenshots or tests required fixture tweaks**

If no code changed in this task, do not commit. If fixture or test harness changes were required:

```bash
git add apps/web/tests/e2e/design.spec.ts
git commit -m "test(design): stabilize visual smoke coverage"
```

---

## Self-Review

- Spec coverage: covers all five design findings from the review: durable landing proof, palette breadth, actionable leaderboard empty state, editorial-to-utility hierarchy, and mobile profile stat fit.
- Placeholder scan: no `TBD`, no vague “handle edge cases,” and each code-changing step includes exact target files and snippets.
- Type consistency: all snippets use existing Svelte route patterns, existing `lucide-svelte` icons, and current Tailwind token naming.

