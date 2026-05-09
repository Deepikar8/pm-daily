# PM Daily — submission

> A daily applied-judgment quiz for product managers. Lenny Rachitsky's
> archive → Claude-generated scenarios → five-minute decision reps →
> leaderboard.

| Asset | Link |
|---|---|
| **Live app** | https://pm-daily.avalanche05.workers.dev |
| **Repo** | https://github.com/Deepikar8/pm-daily |
| **60-sec demo** | [`docs/demo.gif`](./demo.gif) (autoplays in the README) · [`docs/demo.mp4`](./demo.mp4) |
| **Deck** | [`docs/pm_daily_hackathon_submission.pptx`](./pm_daily_hackathon_submission.pptx) (8 slides) |
| **Spec + plans** | [`docs/superpowers/`](./superpowers/) |
| **License** | MIT (code) + [NOTICE](../NOTICE) (source-material rights) |

---

## The problem

PMs read insight constantly — newsletters, podcasts, frameworks,
advice — and almost none of it converts to applied judgment. The gap
isn't content; it's reps. Real PM work is diagnosis, trade-off
recognition, and deciding what *not* to do. Passive reading doesn't
build that muscle.

## The solution

Every weekday, PM Daily picks one operator from Lenny Rachitsky's
archive (Cat Wu on shipping speed, Sean Ellis on PMF, Madhavan
Ramanujam on monetization, etc.), distills their core thesis into a
five-minute digest, then poses **five first-person scenarios** that
test how to *apply* it. Not trivia. Each question asks "**you're a
PM at... what should you do tomorrow morning?**" — first-person,
action-centered, with a takeaway sentence delivered as the visual
hero of every result screen.

Streaks, a weekly + all-time leaderboard, and a calendar invite turn
it into a five-minute daily ritual.

---

## What's novel

- **First-person PM-agency questions.** Every scenario is framed in
  second-person, with the correct answer being an action the PM takes
  that workday. The original brainstorm draft tested *recall* of
  operator frameworks; we rejected it after a design review and
  rewrote the entire question style. The exact constraints are
  documented in
  [`prompts/question-generation/system.md`](../prompts/question-generation/system.md).

- **Source-grounded LLM pipeline with literal-match validation.**
  A four-pass nightly job: (1) Claude produces a *thesis brief*
  mapping the source's distinct ideas, (2) generates 7 candidate
  questions distributed across those ideas (max 2 per idea — coverage
  enforced), (3) self-reviews against trivia/distractor/citation
  rules and keeps the best 5, (4) a programmatic validator
  *re-fetches each citation via MCP* and rejects any that don't appear
  verbatim. No hallucinated attributions ever ship.

- **MCP-native content access.** Production code calls Lenny's archive
  through the `lennysdata` MCP server — no scraping, no rehosting.
  Quotations stored in the app are short ≤280-char excerpts with
  literal-match validation. The repo contains zero full-episode or
  full-post copies.

- **Takeaway-as-hero result UX.** The post-submit screen leads with
  the *action takeaway* ("This week: ask ten prospective buyers what
  they'd pay before scoping a single line of code"), rendered in
  oversized italic Fraunces with a hard offset shadow. The framework
  explanation lives in a smaller dark "Why" card below. We made this
  UX call explicitly during brainstorming because we wanted PMs to
  remember the *action*, not the framework.

- **Production-grade infrastructure, not a hackathon toy.** D1 + KV
  + Durable Objects + scheduled cron + GDPR export/anonymizing-delete
  + magic-link + Google OAuth + cookie banner + content-licensing
  notice + 39 unit and e2e tests. Soup-to-nuts.

---

## Tech stack

SvelteKit 2 (Svelte 5 runes mode) · Tailwind v3 · Drizzle ORM ·
Better Auth (magic link + Google OAuth) · Lucide icons · Cloudflare
Workers + Static Assets + D1 + KV + Durable Objects + cron triggers
· Anthropic Claude API · `lennysdata` MCP · Cloudflare Vectorize ·
Resend (auth-only) · Vitest + Playwright

---

## How this was built — two AI agents, complementary roles

This was built as a hackathon submission, with two AI coding agents
in the loop. Disclosing both is the honest thing to do.

**Claude Code (Anthropic)** was the primary planning + implementation
driver:
- Brainstormed the product (audience, session shape, scoring,
  content pipeline, anti-cheating, hooks, login, compliance, question
  mechanics) with the user across multiple decision rounds
- Authored the design spec at
  [`docs/superpowers/specs/2026-05-07-pm-daily-design.md`](./superpowers/specs/2026-05-07-pm-daily-design.md)
  and the two implementation plans at
  [`docs/superpowers/plans/`](./superpowers/plans/)
- Implemented the bulk of the build via subagent-dispatched
  development across 13 phases (scaffold → schema → auth → quiz →
  Durable Object → leaderboard → profile → calendar → cron → deploy)
- Wrote the canonical `lenny-daily-quiz.jsx` reference component, the
  five-direction palette comparison page, and the 60-second demo
  video pipeline
- Caught its own mistakes during review (e.g., the original quiz
  questions tested *recall* of frameworks; we discarded them and
  rewrote everything to first-person PM-agency framing after a real
  push-back round)

**OpenAI Codex** was used by the user for independent code review,
design review, and resolving production-deploy bugs that Claude
hadn't caught:
- Conducted the May 9 design review that produced the five findings
  → six-task remediation plan at
  [`docs/superpowers/plans/2026-05-09-design-review-remediation.md`](./superpowers/plans/2026-05-09-design-review-remediation.md)
  (durable landing preview, broader palette, actionable empty
  states, mobile hierarchy, responsive profile stats)
- Wrote the auth helpers `isGoogleAuthEnabled` and
  `resolveAuthBaseURL` at
  [`apps/web/src/lib/server/auth/config.ts`](../apps/web/src/lib/server/auth/config.ts)
  with tests, plus the Better Auth integration that uses the request
  origin instead of a hardcoded `BETTER_AUTH_URL` so OAuth/magic-link
  callbacks work across dev/preview/prod
- Diagnosed and fixed the post-deploy 500s on `/` and `/leaderboard`
  by adding `run_worker_first = ["/*", "!/_app/*", "!/robots.txt"]`
  to `wrangler.toml` — the static-assets binding was short-circuiting
  SvelteKit dynamic routes; Claude had landed the deploy but missed
  the routing semantics

**Net effect:** the two agents were complementary. Claude planned and
implemented at scale; Codex reviewed and caught two non-obvious
production bugs (the auth URL plumbing and the worker-first routing
directive). The user orchestrated both, made every product decision,
and approved every commit.

---

## Sponsor-track relevance

### Anthropic / Claude

The content pipeline is the meaningfully-AI part. Claude does three
sequential passes (thesis brief → generate → self-review) constrained
by MCP-sourced excerpts; a fourth, programmatic pass re-fetches every
citation against the original source and rejects fabricated quotes.
The pipeline is idempotent, reproducible, and cheap — roughly one LLM
run per day, not per user. Prompts are version-controlled as code at
[`prompts/question-generation/`](../prompts/question-generation/) so
prompt changes are reviewable, diffable, and testable against a
golden source fixture.

### Cloudflare

Workers + Static Assets handle all dynamic routing. **D1** stores
users, attempts, answers, and per-week stats. **KV** caches today's
content and leaderboard snapshots for sub-50ms global reads. A
**QuizSession Durable Object** enforces single-attempt-per-day at the
edge and prevents tab-racing the speed bonus. A **cron-triggered
scheduled handler** runs leaderboard recompute every five minutes and
weekly archive rollover at Monday 00:00 UTC. **Vectorize** indexes
the 652 archive items for topic rotation. A small custom adapter
wrapper injects the DO and `scheduled` handler exports into the
SvelteKit worker bundle (a footgun the default `adapter-cloudflare`
doesn't solve out of the box).

---

## How to evaluate (three paths, fastest first)

1. **Live, ~30 seconds:** open the live URL, see the landing with the
   anonymous quiz preview teaser, click "Email me a magic link" or
   "Continue with Google" to sign in. Take today's quiz; land on the
   final summary; click through to the leaderboard. The full mobile
   ritual.

2. **Demo video, 60 seconds:** the GIF embedded at the top of the
   README autoplays through every screen — sign-in → onboarding →
   today's digest → quiz scenario → takeaway hero → next question →
   final results → leaderboard → profile.

3. **Read three files, ~5 minutes** if you want to verify the AI
   posture and infra:
   - [`prompts/question-generation/system.md`](../prompts/question-generation/system.md)
     — the constraints that make Claude's output usable (anti-trivia
     rules, distractor-design rules, first-person framing rules,
     length bounds, citation literal-match requirement)
   - [`apps/web/src/routes/quiz/finish/+server.ts`](../apps/web/src/routes/quiz/finish/+server.ts)
     — the score → streak → leaderboard recompute pipeline at the
     edge
   - [`apps/web/src/lib/server/leaderboard/recompute.ts`](../apps/web/src/lib/server/leaderboard/recompute.ts)
     — the D1 → KV writer with 30s debounce and soft-deleted user
     filtering

---

## What I'd build next

- **Plan A — nightly content pipeline.** Currently I seed content
  manually each day via a CLI helper. Plan A (already specced and
  planned, just not yet implemented) automates this: a GitHub Action
  runs the four-pass pipeline daily, opens a PR with a 30-minute
  auto-merge delay so the maintainer can intercept bad days. Spec at
  [`docs/superpowers/plans/2026-05-08-pm-daily-content-pipeline.md`](./superpowers/plans/2026-05-08-pm-daily-content-pipeline.md).

- **Per-user 5-of-8 question pool.** Anti-cheating defense:
  pre-generate 8 questions/day, serve a random 5 per user. Already
  designed; deferred from MVP scope.

- **Custom domain + Termly-generated terms/privacy + lawyer review**
  before any actual public launch.

---

*This is a personal hackathon submission. PM Daily is not officially
affiliated with, endorsed by, or sponsored by Lenny's Newsletter,
Lenny's Podcast, or Lenny Rachitsky. See [`NOTICE`](../NOTICE) for
the full source-material rights clarification.*
