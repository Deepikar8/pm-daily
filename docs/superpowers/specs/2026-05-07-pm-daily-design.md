# PM Daily — Design Spec

**Date:** 2026-05-07
**Status:** Draft, pending user review
**Working name:** PM Daily (final domain TBD)

---

## 1. Product summary

A public web app where any product manager can sign up, get a fresh **operator-of-the-day learning session** every day (a 5-min digest distilled from one Lenny's Newsletter podcast or post, with the day's *angle* serving as the theme — e.g., *"Cat Wu on shipping speed: how Anthropic removes every barrier"*), take a **5-question scenario MCQ quiz** that applies that operator's frameworks to realistic PM situations, and climb a **weekly + all-time leaderboard** scored by correctness, speed, and streak multiplier.

Same source, digest, and quiz are served to every PM that day, so the leaderboard is fair. Every quiz answer cites the day's source with a direct link so PMs can dive deeper.

**Why one source per day (not stitched):** preserves operator voice, sharpens quiz attribution, makes headlines tweetable, simplifies the generation pipeline, and reflects what Lenny's archive actually is — concentrated operator wisdom one episode/post at a time. With 652 items, one-per-day means no repeats for ~1.8 years.

Distribution model: anyone can land on the site, take the quiz preview as a guest, and sign up to submit and join the leaderboard.

---

## 2. User flows (MVP)

### 2.1 Sign up / sign in
- Land on `/` → see today's theme + a teaser ("Sign in to take the quiz and join 1,247 PMs on the leaderboard")
- Click "Sign in" → magic link via email **or** Google OAuth (Better Auth)
- First sign-in: pick a display name, confirm/edit auto-detected timezone, agree to Terms + Privacy
- Redirect to today's session

### 2.2 Daily session (`/today`)
- Headline (operator + angle, e.g., *"Cat Wu on shipping speed"*), ~5-min markdown digest, 3-5 key takeaways
- One source citation block — operator/author name, episode/post title, date, type (podcast/newsletter), and a primary "Listen on Lenny's Podcast" / "Read on Lenny's Newsletter" link (or fallback search link if `source_url` is empty — see §4.3)
- "Take today's quiz →" button at the bottom
- Read at your own pace; no timer

### 2.3 Quiz (`/quiz`)
- 5 scenario MCQs, one at a time, all framed in second-person about the PM's own work
- Each: scenario paragraph + 4 options + "Submit"
- **After submit, in this visual hierarchy:**
  1. **Takeaway** (largest text) — *"This week: use 5–10 AI products yourself daily, taking notes on what feels broken."* This is the headline the PM remembers.
  2. Correctness indicator + which option was correct
  3. Explanation (the framework — why this is true)
  4. Citation block with direct Lenny link
- Final screen: score (X/5), elapsed time, day's leaderboard rank, **a "your 5 takeaways from today" recap** (the 5 `pm_takeaway`s collected), shareable result card
- One attempt per day, server-enforced (Durable Object lock + DB unique constraint)
- **Anonymous quiz preview:** unauthenticated visitors see *one randomly chosen* question from today's pool. Submit gated on sign-in.

### 2.4 Leaderboard (`/leaderboard`)
- Toggle: This Week | All Time
- Rows: rank, display name (+ flame icon at streak tiers 7+, 30+), weekly points, current streak, days active this week
- Top 50 always; user's row highlighted; if outside top 50, also show ranks (your_rank − 2) through (your_rank + 2)

### 2.5 Profile (`/me`)
- Current streak (big number, flame icon), best streak, total points, weekly points, weekly rank
- 14-day streak heatmap
- Recent attempts: date, theme, score, your time, citations encountered
- Settings: edit display name, edit timezone, re-download calendar invite
- **Privacy controls:** "Download my data" (JSON export), "Delete my account"

### 2.6 Reminder hook
- During onboarding: "Add to Google Calendar" button → downloads `.ics` from `/api/calendar.ics`
- Recurring 8am-local invite, "PM Daily — 5 min", links to `/today`
- Re-download link in `/me` (for users who change timezone)
- **Email is not used** for daily reminders in v1; calendar only.

---

## 3. Architecture

### 3.1 Stack
- **App framework:** SvelteKit deployed to **Cloudflare Pages** (Workers runtime)
- **Database:** **Cloudflare D1** (SQLite at the edge)
- **Hot read cache:** **Cloudflare KV** (today's content, leaderboard snapshots)
- **Vector search:** **Cloudflare Vectorize** (metadata-only index of Lenny's archive)
- **Concurrency primitive:** **Durable Objects** for per-user-per-day quiz session locks
- **Scheduled job:** **GitHub Actions** runs nightly content generation; outputs JSON committed to repo, deploys re-seed D1+KV
- **Auth:** **Better Auth** on D1 (magic link + Google OAuth)
- **LLM:** **Anthropic Claude** API
- **Content source:** `lennysdata` MCP (read_excerpt, read_content, list_content, search_content)
- **Cookie consent:** `vanilla-cookieconsent` (OSS, necessary-only mode in v1)
- **Email (auth only):** Better Auth's configured sender (Resend or similar; magic link only, no marketing)

### 3.2 Topology

```
GLOBAL EDGE
  Cloudflare Pages (SvelteKit SSR + hydrated client)
    Routes: /, /today, /quiz, /leaderboard, /me, /terms, /privacy, /api/*
       │
       ├── reads (hot)  ──► Cloudflare KV
       │                     • today:digest:<date>
       │                     • today:questions:<date> (no correct_key)
       │                     • leaderboard:weekly:<week_key>
       │                     • leaderboard:alltime
       │                     • user:stats:<user_id>
       │
       ├── writes (auth'd) ──► Cloudflare D1
       │                        users, daily_sessions, daily_questions,
       │                        quiz_attempts, quiz_answers, user_stats,
       │                        weekly_archive, Better Auth tables
       │
       ├── locks ──────────► Durable Object: QuizSession (per user/day)
       │
       └── topic discovery ─► Cloudflare Vectorize: lennys_metadata (652 items)

NIGHTLY (~7am UTC)
  GitHub Actions: nightly-content.yml
    1. Topic rotation logic → pick theme pillar + content type (podcast/newsletter alternation)
    2. Vectorize semantic search → top 20 candidate sources
    3. Recency-weight + diversity filter → pick 1 source
    4. Anthropic API + lennysdata MCP: read_excerpt for chosen source (multiple queries to gather context)
    5. Claude generates digest + 5 quiz questions JSON, all anchored to that source
    6. Commit content/<date>.json + assets
    7. Deploy → seed D1 + warm KV
```

### 3.3 Key architectural decisions
- **Reads off KV, not D1.** `/today` and `/leaderboard` SSR off KV. KV reads are ~10ms global, near-free at scale. This is the viral-defense layer.
- **Writes go to D1**, colocated with the Worker handling the request.
- **Durable Object per (user, day) for quiz** enforces single attempt and prevents multi-tab racing of the speed bonus.
- **Leaderboard recompute strategy:** on quiz submit (debounced ≤1/30s) and as a 60s safety-net cron. Result written to KV.
- **Vectorize holds metadata only** (title, description, tags, embedding) — never full text. Stays well within fair-use posture for derivative content.

---

## 4. Data model

### 4.1 D1 schema

```sql
users (
  id                 TEXT PRIMARY KEY,           -- ULID
  email              TEXT UNIQUE NOT NULL,
  display_name       TEXT NOT NULL,
  company            TEXT,
  role               TEXT,
  timezone           TEXT NOT NULL,              -- IANA, e.g. "Asia/Kolkata"
  created_at         INTEGER NOT NULL,           -- unix ms
  last_active_at     INTEGER NOT NULL,
  terms_accepted_at  INTEGER,
  terms_version      TEXT,
  deleted_at         INTEGER                     -- null = active
)

-- Better Auth's own tables (sessions, accounts, verification) managed by the lib

daily_sessions (
  date            TEXT PRIMARY KEY,              -- "2026-05-08"
  headline        TEXT NOT NULL,                 -- "Cat Wu on shipping speed: how Anthropic removes every barrier"
  theme_pillar    TEXT NOT NULL,                 -- e.g. "ai-product"; used for rotation diversity
  digest_md       TEXT NOT NULL,
  takeaways_json  TEXT NOT NULL,                 -- JSON array of bullets
  source_json     TEXT NOT NULL,                 -- ONE source object: see 4.3
  published_at    INTEGER NOT NULL
)

daily_questions (
  id              TEXT PRIMARY KEY,              -- ULID
  date            TEXT NOT NULL,
  position        INTEGER NOT NULL,              -- 1..5
  idea_id         TEXT NOT NULL,                 -- references thesis-brief idea
  archetype       TEXT NOT NULL,                 -- apply|diagnose|pick|spot|translate
  scenario_md     TEXT NOT NULL,                 -- first-person, ≤120 words
  options_json    TEXT NOT NULL,                 -- [{key:"A", text:"..."}, ...]
  correct_key     TEXT NOT NULL,                 -- "A" | "B" | "C" | "D"
  explanation_md  TEXT NOT NULL,                 -- ≤2 sentences, framework-centered
  pm_takeaway     TEXT NOT NULL,                 -- 1 sentence, action-centered
  citation_json   TEXT NOT NULL,                 -- {filename, title, source_url, search_url, quote_excerpt}
  UNIQUE(date, position)
)

quiz_attempts (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  date               TEXT NOT NULL,
  started_at         INTEGER NOT NULL,
  submitted_at       INTEGER,
  total_correct      INTEGER,                    -- 0..5
  total_seconds      INTEGER,
  base_points        INTEGER,
  speed_bonus        INTEGER,
  streak_multiplier  REAL,
  total_points       INTEGER,
  UNIQUE(user_id, date),
  FOREIGN KEY(user_id) REFERENCES users(id)
)

quiz_answers (
  attempt_id      TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  selected_key    TEXT NOT NULL,
  is_correct      INTEGER NOT NULL,
  answered_at     INTEGER NOT NULL,
  PRIMARY KEY(attempt_id, question_id),
  FOREIGN KEY(attempt_id) REFERENCES quiz_attempts(id)
)

user_stats (
  user_id            TEXT PRIMARY KEY,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  best_streak        INTEGER NOT NULL DEFAULT 0,
  last_attempt_date  TEXT,                       -- "2026-05-07"
  total_points       INTEGER NOT NULL DEFAULT 0,
  weekly_points      INTEGER NOT NULL DEFAULT 0,
  week_key           TEXT NOT NULL,              -- "2026-W19"
  total_attempts     INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
)

weekly_archive (
  user_id    TEXT NOT NULL,
  week_key   TEXT NOT NULL,                      -- "2026-W19"
  points     INTEGER NOT NULL,
  rank       INTEGER NOT NULL,
  PRIMARY KEY(user_id, week_key),
  FOREIGN KEY(user_id) REFERENCES users(id)
)
```

### 4.2 KV layout

```
today:digest:<date>             → daily_sessions row JSON
today:questions:<date>          → 5 daily_questions JSON (correct_key + explanation STRIPPED)
leaderboard:weekly:<week_key>   → top-50 + total_count
leaderboard:alltime             → top-50
user:stats:<user_id>            → cached user_stats for /me
```

### 4.3 Source citation JSON shape

Single source per day. Same shape used for `daily_sessions.source_json` and per-question `daily_questions.citation_json` (where `quote_excerpt` is the question-specific quote).

```json
{
  "filename": "podcasts/sean-ellis.md",
  "title": "How to use the PMF survey to find your true customer",
  "byline": "Sean Ellis",                                       // guest for podcasts; author "Lenny Rachitsky" for newsletters
  "type": "podcast",                                            // "podcast" | "newsletter"
  "date": "2025-08-14",
  "source_url": "https://www.lennyspodcast.com/sean-ellis",     // when present in MCP metadata
  "search_url": "https://www.lennysnewsletter.com/?q=Sean+Ellis+PMF",  // fallback when source_url empty
  "quote_excerpt": "≤280 chars, attributable, drawn from read_excerpt"
}
```

**URL handling:** newsletters from MCP almost always have `source_url`/`post_url` populated. Podcasts often don't. Pipeline stores both `source_url` (when present) and a constructed `search_url` (always); UI prefers `source_url`, falls back to `search_url`.

### 4.4 Vectorize index `lennys_metadata`

```
{
  id: "podcasts/sean-ellis.md",
  values: [embedding of title + description + tags],
  metadata: { title, type, date, guest, tags, word_count }
}
```

One-time build cost: ~$0.07 for 652 items. Re-embed when archive grows.

---

## 5. Daily content pipeline

Runs as `nightly-content.yml` GitHub Action, scheduled ~7am UTC daily.

### 5.1 Steps
1. **Pick theme pillar** via rotation logic over: `pricing, growth, activation, retention, leadership, ai-product, career, metrics, design, go-to-market`. Exclude pillars used in last 14 days.
2. **Pick content type** by alternating podcast/newsletter days (so users get a steady mix and the "Read on Lenny's Newsletter" direct-link days are predictable).
3. **Vectorize search** for the pillar keyword, filtered by chosen content type → top 20 candidate sources.
4. **Score candidates** with recency weighting:
   ```
   age_days = today - source.date
   recency_score = exp(-age_days / 365)              # half-life ~1 year
   score = semantic_similarity * (0.6 + 0.4 * recency_score)
   ```
5. **Diversity filter:** exclude any source used in last 60 days (longer than the 3-source variant since we only pick 1/day).
6. **Pick the top 1 source.** Generate the day's headline as `<byline> on <angle>: <hook>`.
7. **Fetch focused excerpts** via `mcp__lennysdata__read_excerpt` — multiple queries against the same source to gather enough context for the digest + 5 questions (e.g., theme keyword + key concepts mentioned in the description/tags).
8. **Claude (Anthropic API)** generates:
   - Headline
   - 5-min markdown digest in the operator's voice (not abstract synthesis)
   - 3-5 key takeaways
   - 5 scenario MCQ questions, all anchored to this source — each with scenario, 4 options, correct key, 2-sentence explanation, and a `citation_json` quoting the specific passage that grounds the correct answer
9. **Validate** the JSON output against schema; reject + retry if malformed.
10. **Commit** `content/<date>.json` to repo; **open PR with auto-merge after 30 minutes** (gives admin a chance to intercept bad days; absent intervention, content ships).
11. **On merge**, deploy hook seeds D1 (`daily_sessions`, `daily_questions`) and warms KV (`today:*`).

### 5.2 Topic rotation pseudocode

```python
def pick_today_pillar(history_last_14d):
    available = [p for p in PILLARS if p not in history_last_14d]
    if not available:
        available = PILLARS  # rare; full rotation took longer than 14d
    return random.choice(available)
```

### 5.3 No popularity signal in v1

Recency + theme rotation only. v1.5 candidate: hand-curated "evergreen hits" list of ~50 sources, pulled in 1-of-5 days for variety.

### 5.4 Question generation mechanics

The 5 daily quiz questions are the heart of the product. This subsection specifies how they're generated and validated.

#### 5.4.1 Failure mode to avoid: trivia drift

Default LLM behavior produces questions like *"According to Cat Wu, what's the timeline goal?"* — ctrl-F-able trivia that tests memory, not judgment. Anti-trivia rules below are non-negotiable in the generation prompt.

#### 5.4.2 Question archetypes (content-aware selection)

Five archetypes the prompt makes available; Claude picks the mix that fits the day's source rather than following a fixed quota. A metrics-heavy episode leans into Diagnose; a prioritization-heavy one leans into Pick-the-next-move; etc.

| # | Archetype | Tests | Shape |
|---|---|---|---|
| 1 | **Apply the framework** | Recognition + application | "Given scenario X, the operator's framework says you should..." |
| 2 | **Diagnose the situation** | Mental model | "Activation 40%, D7 retention 5%. The operator would say the real problem is..." |
| 3 | **Pick the next move** | Prioritization | "[4 actions]. Which would the operator do first?" |
| 4 | **Spot the mistake** | Critical reading | "A PM proposes [plan]. Per the operator's view, the missing step is..." |
| 5 | **Translate the framework** | Generalization | "Operator's [X-context] framework. For [Y-context], the equivalent move is..." |

The prompt instructs Claude to choose archetypes naturally fitting the source, with a soft constraint that no two of the 5 questions should be the same archetype if avoidable.

#### 5.4.3 Distractor design (non-negotiable rules)

Every question must have **one** correct option plus **three** distractors of the following types:

| Distractor type | Description |
|---|---|
| **Plausible PM mistake** | What a less-experienced PM would actually do in this scenario |
| **Half-truth** | Partly aligned with the operator's framework but missing a key nuance |
| **Adjacent framework** | Would be correct under a *different* operator's view, wrong here |

The prompt requires the model to label each option's role internally (used for self-review in pass 2) and present them in randomized order in the final output.

#### 5.4.4 Anti-trivia rules (hard constraints in prompt)

- **No "according to X, what did Y say"** formulations.
- **Scenarios must be novel** — distinct from any example literally in the source.
- **No verbatim phrasing leaks** — the correct option's distinctive phrasing must not appear in the scenario setup.
- **Test application, not recall** — questions test how to apply the operator's framework, not whether the PM remembers it was mentioned.

#### 5.4.5 Length bounds

| Element | Bound |
|---|---|
| Scenario | ≤ 120 words |
| Each option | ≤ 25 words |
| Explanation (post-submit) | ≤ 2 sentences |
| Quote excerpt in citation | ≤ 280 characters |

#### 5.4.6 Audience and PM-agency framing

Audience target: **mid-level PM (3-7 years' experience)**. Difficulty tiers deferred to v1.5.

The defining constraint is that every question must speak to the PM's actual question — *"After hearing this, what should I do tomorrow morning?"* This is enforced through three rules:

1. **First-person scope.** Scenarios are framed in second-person ("you," "your team," "your week") — never third-person about a hypothetical PM, founder, or hiring committee.
2. **PM-agency only.** Questions test decisions the PM actually controls (own time, PRDs, 1:1s, surfaces championed, personal practice). Org-design, hiring committees, and founder-level calls are out of scope.
3. **Tomorrow-morning answer.** The correct option is an action the PM can take in their next workday, not an opinion or strategic claim.

Each question carries a separate `pm_takeaway` field stating *one specific change the PM should make this week*. This is distinct from `explanation_md` (which explains the framework). The takeaway is what the user remembers; the explanation is why it's true.

#### 5.4.7 Four-pass generation pipeline

The verbatim prompts used in this pipeline are version-controlled in `prompts/question-generation/`:
- `system.md` — establishes role, rules, archetypes, distractors, anti-trivia, **coverage requirement**, output format
- `pass-0-thesis-brief.md` — Claude maps the source's 5-7 distinct ideas + central tension *before* generating questions (prevents concentration on the most quotable framework)
- `pass-1-generate.md` — overgenerate 7 candidates distributed across distinct ideas, plus headline/digest/takeaways
- `pass-2-review.md` — Claude self-audits including a **coverage breadth check** (≥4 distinct ideas across the kept 5), keeps 5
- `pass-3-retry-template.md` — used on validation failure (one retry per question)
- `README.md` — describes file roles, update process, and runtime variables

The diagram below summarizes the runtime flow.

```
PASS 0 — Thesis brief (NEW)
  Inputs:
    • Source metadata (title, byline, type, date, tags, description)
    • Source excerpts: 3-5 read_excerpt calls covering key concepts
  Output:
    • central_tension: what the operator argues against (1-2 sentences)
    • ideas[]: 5-7 distinct ideas/frameworks, each with id, title,
      summary, supporting_passage, framework_strength
      (central / secondary / mentioned)
  Purpose:
    Forces breadth-mapping before any question is written.
    Without this, the model concentrates on the most quotable
    framework and misses the source's actual thesis.

PASS 1 — Generate (overgeneration, coverage-constrained)
  Inputs:
    • Same metadata + excerpts as Pass 0
    • Pass 0's thesis brief (in context)
    • System prompt: archetypes + distractor rules + anti-trivia +
                     length bounds + mid-level PM target +
                     coverage requirement
  Output:
    • central_tension (carried over from brief)
    • headline (reflects the central tension, not just the quotable phrase)
    • digest_md, takeaways
    • 7 candidate questions distributed across ≥5 distinct idea_ids
      (max 2 questions per idea_id)
    • Each question: idea_id, archetype, scenario, 4 options with
      role tags (correct / mistake / half_truth / adjacent),
      correct_key, explanation, citation

PASS 2 — Self-review
  Same Claude session reviews its own 7 candidates against:
    • Trivia check: would ctrl-F on source transcript answer this?
    • Distractor check: do the wrong answers cover all 3 required types?
    • Citation grounding: does the cited excerpt support the framework
      that makes the correct answer correct?
    • Coverage breadth: do the kept 5 cover ≥4 distinct idea_ids?
      Is the central_tension detectable from the question set?
    • Distinctness within idea: any two questions test the same concept?
    • Setup leak: correct option's distinctive phrases in scenario?
  Output: best 5 candidates + a "concerns" array with any flagged issues.

PASS 3 — Programmatic validation (deterministic)
  • Strict JSON schema validation (Zod / typebox).
  • Length bounds enforcement (§5.4.5).
  • Strict citation literal-match: each citation.quote_excerpt is
    re-fetched via mcp__lennysdata__read_excerpt with the quote as query;
    if total_excerpts == 0, reject the question.
  • Coverage check: if final 5 questions cover <4 distinct idea_ids,
    flag the day for manual review (do not auto-merge).
  • Option-order randomization: shuffle the 4 options post-validation;
    record final correct_key.

  On any failure: retry the failing question up to 2 more times
  (regenerate just that question with the failure reason in context).
  After 3 retries, the question is dropped — if we end with <5,
  the day is escalated (PR opens but does NOT auto-merge).
```

#### 5.4.8 Schema (output of pass 3, written to D1 `daily_questions`)

```typescript
type DailyQuestion = {
  id: string;                    // ULID
  date: string;                  // "2026-05-08"
  position: number;              // 1..5
  idea_id: string;               // references an idea from the day's thesis brief; used for coverage check
  archetype: 'apply' | 'diagnose' | 'pick' | 'spot' | 'translate';
  scenario_md: string;           // ≤120 words, first-person ("you," "your team")
  options: Array<{               // length 4, post-shuffle order
    key: 'A' | 'B' | 'C' | 'D';
    text: string;                // ≤25 words
  }>;
  correct_key: 'A' | 'B' | 'C' | 'D';
  explanation_md: string;        // ≤2 sentences, framework-centered
  pm_takeaway: string;           // 1 sentence, action-centered ("what to do this week")
  citation: {
    filename: string;
    title: string;
    byline: string;
    type: 'podcast' | 'newsletter';
    date: string;
    source_url?: string;
    search_url: string;
    quote_excerpt: string;       // ≤280 chars, literal-match-validated
  };
};
```

Stored in D1 as defined in §4.1 `daily_questions` (with `options_json` and `citation_json` holding the JSON-encoded structures).

#### 5.4.9 Manual override path

The GH Action's PR (§5.1 step 10) lets the admin edit any question's `scenario_md`, options, `correct_key`, or `explanation_md` directly in the JSON before merge. The 30-min auto-merge window gives this opportunity. Tampering with citation `quote_excerpt` is discouraged — re-running pass 3 validation locally is the safer path.

#### 5.4.10 What we are *not* doing in v1 (flagged)

- Difficulty tiers (deferred to v1.5)
- Per-user question pool of 8 (the anti-cheating defense — already deferred, see §8.2)
- "Explain your reasoning" follow-up after MCQs (deferred, see §8.2)
- Image/video stimuli in scenarios (text-only v1)

---

## 6. Scoring, streaks, leaderboard

### 6.1 Per-quiz score

```
base_points  = correct_answers × 20                                     # 0..100
speed_bonus  = max(0, min(20, 20 - (seconds - 60) / 6))                 # capped at +20, floor 0
streak_mult  = 1.0  if streak < 3
               1.10 if 3 ≤ streak < 7
               1.20 if 7 ≤ streak < 30
               1.30 if streak ≥ 30
total_points = round((base_points + speed_bonus) × streak_mult)         # realistic max ≈ 156
```

Notes:
- A 4/5 fast cannot beat a 5/5 slow. Correctness dominates.
- Speed floor at 60s: any answer faster than 60s gets max speed bonus = 20. No advantage to instant-clicking.
- First-attempt-only enforced by `quiz_attempts.UNIQUE(user_id, date)`.

### 6.2 Streak rules

- Streak = consecutive days with submitted quiz, in user's local timezone.
- Day boundary = midnight in `users.timezone`.
- Miss a day → streak resets to 0 on next attempt.
- `best_streak` preserved forever.
- No grace day in v1 (deferred to v1.5).

### 6.3 Weekly window

- Week starts **Monday 00:00 UTC** (global, simple).
- `weekly_points` reset to 0 at week boundary by cron worker.
- `week_key` format: ISO week (`2026-W19`).
- Pre-rollover snapshot copied to `weekly_archive` for "best week ever" feature in v1.5.

### 6.4 Leaderboard recompute

- Trigger: quiz submit (debounced ≤1/30s) + 60s safety-net cron.
- Implementation: D1 `SELECT ... FROM users JOIN user_stats ORDER BY weekly_points DESC LIMIT 50` → write JSON to `leaderboard:weekly:<week_key>` in KV.
- KV key includes `week_key` so weekly rollover is atomic.

### 6.5 Tie breaks

- Weekly: weekly_points DESC → total_correct DESC → earlier last submitted_at
- All-time: total_points DESC → current_streak DESC

### 6.6 Anti-replay (technical, not anti-cheating)

- `QuizSession` Durable Object holds in-progress state per `(user_id, date)`.
- Started on first GET to a question; submit closes the DO and writes to D1 transactionally.
- Refresh / new tab during active quiz resumes same DO; no time reset.
- After submit, DO is destroyed; reopening `/quiz` shows the results page.

---

## 7. Compliance — cookies, terms, privacy

### 7.1 Data inventory

| Data | Why | Where |
|---|---|---|
| Email | Sign-in (magic link), identity | D1 `users.email` |
| Display name, optional company/role | Profile, leaderboard | D1 `users` |
| Timezone | Streak boundaries, calendar invite | D1 `users.timezone` |
| Quiz attempts + answers | Score, streak, history | D1 `quiz_attempts`, `quiz_answers` |
| Auth session cookie | Keep user signed in | HTTP-only secure cookie |
| IP address (transient) | Cloudflare abuse / rate limit | Cloudflare logs only; not persisted |
| OAuth tokens (Google) | Sign-in only; email + name scope | Better Auth `accounts` |

We do **not** send any user data to Anthropic. Prompts to Claude are about Lenny's content, not user behavior.

### 7.2 Cookie banner

- v1: only strictly-necessary cookies (auth session, CSRF) — minimal banner: *"We use a cookie to keep you signed in. Nothing else. [Got it]"*
- Library: `vanilla-cookieconsent` (OSS, ~5kB)
- v1.5 (when analytics added): expand to a real consent flow (Necessary / Analytics toggles); same library supports it.

### 7.3 Terms + Privacy pages

- `/terms` and `/privacy`, footer-linked on every page
- Generation approach: **Termly or iubenda** baseline + lawyer review before public launch
- Signup gate: required checkbox *"I agree to the Terms and Privacy Policy"*
- Captured in `users.terms_accepted_at` + `users.terms_version`

### 7.4 GDPR rights — minimum viable

- **Access:** "Download my data" button in `/me` exports JSON
- **Erasure:** "Delete my account" in `/me`. Anonymizes rather than hard-deletes:
  - Set `users.deleted_at`, null `users.email`, set `users.display_name = "deleted user"`
  - Delete Better Auth `accounts` and `sessions` rows for this user (revokes OAuth)
  - `quiz_attempts.user_id` retains FK integrity by pointing at the same (now-anonymous) `users` row
  - `user_stats` row retained but excluded from `/leaderboard` queries via `WHERE users.deleted_at IS NULL`
  - Net effect: leaderboard history stats remain in D1 for analytics, but the deleted user is no longer identifiable or visible on any user-facing surface
- **Rectification:** display name + timezone editable in `/me`
- **Portability:** the export above

### 7.5 Sub-processors (must be listed in privacy policy)

Cloudflare, Anthropic, Google OAuth, Better Auth's email provider (Resend or similar), Termly/iubenda, GitHub. Maintain `docs/subprocessors.md`; update privacy policy when this list changes.

---

## 8. MVP scope cut

### 8.1 In scope (v1)

- Sign up / sign in (Better Auth, magic link + Google OAuth) with anonymous quiz preview
- Timezone capture + edit
- `/today` daily session
- `/quiz` 5-question MCQ flow with explanations + citations
- `/leaderboard` weekly + all-time, top 50 + your-slice
- `/me` profile with streak, points, history, settings, privacy controls
- `/api/calendar.ics` recurring 8am-local invite
- `/terms`, `/privacy` pages + cookie banner + signup agreement
- Nightly GitHub Action: theme rotation, Vectorize search, MCP excerpt fetch, Claude generation, JSON commit, deploy seed
- D1 schema + Vectorize index of 652 metadata items + KV cache + Durable Object for quiz session
- Shareable result card after quiz

### 8.2 Out of MVP (deferred)

| Feature | Target | Why deferred |
|---|---|---|
| Anti-cheating (per-user 5-of-8, shuffled options, post-submit explanations only) | v1.5 if leaderboard credibility erodes | User chose lean MVP; nightly-job structure already supports adding it |
| Email re-engagement / win-back | v1.5 if cold-user retention is a problem | Calendar-only is leaner; easy to add later |
| WhatsApp reminders | v2 | Ops cost (Meta verification, templates) doesn't pay back at MVP scale |
| In-app streak loss-aversion banner | v1.5 | Cheap, high yield once streak data shows up |
| Curated evergreen hits list | v1.5 once you see what resonates | Needs human curation pass |
| "Explain your reasoning" follow-up | v1.5 | Soft credibility signal |
| Comments / discussion threads | v2 | Distinct social product, moderation cost |
| Topic opt-in/out | v2 | Defeats fair-leaderboard premise unless re-scored |
| Weekly archive UI ("best week ever") | v1.5 | Already in schema |
| Mobile native app | v2+ | Web works; PWA install banner is fine |
| Admin review UI | v1.5 | GH Action PR with auto-merge delay is sufficient initially |
| Analytics dashboard (PostHog) | v1.5 | Cloudflare Analytics enough for MVP |
| Streak grace day | v1.5 | Duolingo-validated; small implementation cost |

---

## 9. Risks & open questions

### 9.1 Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Content licensing.** `lennysdata` is a paid/licensed product. Building a public derivative needs Lenny's blessing or clear fair-use posture. We store only AI-generated digests + ≤280-char excerpts + citations — closer to "review" than "republish" — but legal call required. | High | Reach out to Lenny's team before public launch. Until then, treat as private/limited beta. Worst case: rebuild with public sources only. |
| 2 | **MCP credential / runtime access from GH Action.** lennysdata MCP is currently auth'd via the user's Claude Code OAuth. Nightly job needs its own credential — unverified path. | High | Validate in first implementation step. Fallback: run nightly from local machine + commit JSON. |
| 3 | **Quiz quality drift.** LLM can produce ambiguous or subtly wrong questions, or questions that overlap with takeaways (giving away answers). | Medium | GH Action opens PR with 30-min auto-merge delay; admin can intercept. v1.5 adds `/admin/review` page. |
| 4 | **D1 size cap (10GB).** At ~10kB per attempt × 5 questions × N users, fine for ~100k users for years. Beyond that, archive `quiz_answers` older than 90d to R2. | Low for v1 | Add archival cron at 1M-attempt mark. Not now. |
| 5 | **Vectorize embedding cost.** ~$0.07 one-time for 652 items. | Trivial | Re-run when corpus updates. |
| 6 | **Time-zone correctness for streaks + calendar.** Easy to get wrong (DST, mid-streak TZ change, midnight edge). | Medium | IANA TZ + robust library (`date-fns-tz` or `Temporal`). Test cases: midnight rollover at submit, DST forward, user changing TZ. |
| 7 | **Anonymous preview spoils answer key.** If preview always shows Q1, it becomes a public answer key after day 1. | Medium | Show *random* one of 5 day's questions. Strip `correct_key` from KV payload (already designed). Submit gated on login. |
| 8 | **Email collection without notification emails.** Better Auth sends magic-link emails; must be configured for auth-only, no marketing. | Low | Configure narrowly. Visible privacy copy at signup: "We email you only for sign-in. Reminders via your calendar." |
| 9 | **Compliance gap at launch.** Termly/iubenda gives a sane baseline but isn't a substitute for legal review for EU users. | Medium | Ship private beta on generator-only baseline; lawyer review before public launch. |
| 10 | **Sub-processor list maintenance.** Privacy policy must list sub-processors and update when they change. | Low | Maintain `docs/subprocessors.md`; update privacy on changes. |

### 9.2 Open questions (not blocking design)

- **A. Domain name.** Suggestions: `pmdaily.com`, `dailypm.dev`, `productdaily.app`. Decide before public launch.
- **B. Branding posture with Lenny.** Explicit Lenny's Newsletter co-branding (with permission) vs. "PM Daily — based on the public Lenny's archive". Affects source presentation.
- **C. Pricing.** MVP free, ungated. Future: paid tier? Always free? Not blocking design.
- **D. Beta size.** Soft launch to 10-20 known PMs vs. open public from day one. Affects how aggressively we harden anti-spam.

---

## 10. Decisions log (locked in this brainstorm)

| Decision | Choice |
|---|---|
| Audience | Open community / public web app |
| Daily session shape | One source per day; the day's "theme" is the angle on that source. Podcast/newsletter days alternate. |
| Quiz format | Scenario MCQs (5 questions/day) |
| Scoring | Weekly + all-time, points per quiz, streak multiplier (1.0/1.1/1.2/1.3), speed bonus capped, first-attempt-only |
| Content engine | Nightly pre-gen (GitHub Action) |
| Content pipeline | Hybrid C+B: Vectorize index for topic selection + GH Action pre-bake with auto-merge delay |
| Hosting / stack | Cloudflare + SvelteKit (Pages, D1, KV, Vectorize, Cron Triggers, Durable Objects) |
| Auth | Better Auth on D1; magic link + Google OAuth; anonymous quiz preview |
| Reminder hook | Calendar-only (`.ics`); no email reminders in v1 |
| Theme selection | Recency-weighted; no popularity signal in v1 |
| Anti-cheating defenses | Skipped for MVP; revisit in v1.5 |
| Compliance | Cookie banner (necessary-only), `/terms`, `/privacy`, signup agreement, GDPR rights via `/me` |
| Audience framing | First-person scope ("you," "your team"); PM-agency only (decisions the PM controls — own time, PRDs, 1:1s, surfaces championed); tomorrow-morning answers (actions, not opinions) |
| Per-question takeaway | Each question carries a `pm_takeaway` field — 1 sentence, action-centered, distinct from the framework explanation. Surfaced as the headline of the post-submit screen and recapped after the final question. |
| Question archetypes | 5 available (Apply / Diagnose / Pick / Spot / Translate); content-aware mix per source — Claude picks archetypes that fit each day's source rather than a fixed quota |
| Distractor design | 3 required types per question: plausible PM mistake, half-truth, adjacent framework |
| Anti-trivia | Hard constraints in prompt: no "according to X" memory questions; novel scenarios; no verbatim phrasing leaks |
| Citation validation | Strict literal match — `quote_excerpt` re-verified via `read_excerpt` post-generation; reject + retry on failure |
| Difficulty | Single uniform target: mid-level PM (3-7 yrs) in v1; tiers deferred to v1.5 |
| Generation pipeline | Three-pass: overgenerate 7 → self-review keep 5 → programmatic validation; up to 2 retries per question; <5 valid questions blocks auto-merge |

---

## 11. Acceptance for this spec

This spec is approved when the user has:
1. Read sections 1-10
2. Signed off on the locked decisions in §10
3. Acknowledged risks 1-10 in §9.1 (no resolution required for design — only acknowledgement)
4. Optionally given rough takes on open questions A-D (can also defer)

After approval, the next step is the **writing-plans** skill, which converts this spec into a sequenced implementation plan.
