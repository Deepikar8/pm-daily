# Pass 3 — programmatic validation

> Pass 3 is **deterministic code, not Claude.** It checks every kept
> question against the rules from `system.md` mechanically. If a check
> fails, the failing question goes back to Claude (one retry) with the
> failure reason in context. After retry, still-failing questions are
> dropped. Final candidate count <5 → day is flagged for manual review
> (auto-merge label withheld).

## Validators

| Validator | Source | What it checks |
|---|---|---|
| **Schema** | Zod (`apps/web/src/lib/server/content/types.ts`) | Every question has the right shape: `position`, `idea_id`, `archetype`, `scenario_md`, `options[4]`, `correct_key`, `explanation_md`, `pm_takeaway`, `citation`. |
| **Length bounds** | `system.md` §"Length bounds" | Scenario ≤120 words, each option ≤25 words, explanation ≤2 sentences, `quote_excerpt` ≤280 chars. |
| **Citation literal-match** | MCP `read_excerpt` re-fetch with `quote_excerpt` as query | The excerpt must appear verbatim in the source file. Catches paraphrased / hallucinated citations. |
| **Setup leak** | Token-overlap check between scenario and correct option | The correct option's distinctive phrasing must NOT appear in the scenario setup (otherwise the scenario telegraphs the answer). |
| **Coverage breadth** | `idea_id` distinct count across kept questions | At least 4 distinct `idea_id`s out of the kept 5 questions. |

## Run on the 5 kept candidates

| # | Schema | Length | Citation literal-match | Setup leak | Coverage |
|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | — |
| 2 | ✅ | ✅ | ✅ | ✅ | — |
| 3 | ✅ | ✅ | ✅ | ✅ | — |
| 4 | ✅ | ✅ | ❌ → retried → ✅ | ✅ | — |
| 5 | ✅ | ✅ | ✅ | ✅ | — |
| Coverage breadth | | | | | ✅ (5 distinct idea_ids ≥ 4 required) |

**Net: 5/5 questions valid after one retry.** Day proceeds to auto-merge.

## Detail — citation drift retry on Q4

### First citation submitted (FAIL)

Q4 (barrier-removal, spot) submitted:

```json
"citation": {
  "filename": "podcasts/cat-wu.md",
  "quote_excerpt": "We want to remove every barrier to shipping. Our timelines have gone from six months to a week."
}
```

**Validator action:** call `mcp__lennysdata__read_excerpt({ filename: "podcasts/cat-wu.md", query: "We want to remove every barrier to shipping" })` and check whether the response's `excerpt` field contains the `quote_excerpt` as a verbatim substring.

**Result:** match failed. The actual source says:

> We want to remove **every single** barrier to shipping **things**.
> The timelines for a lot of our product features have gone down from
> six month to one month and sometimes to even one day.

The candidate paraphrased two things:
1. "every barrier" → actual is "every single barrier"
2. "Our timelines have gone from six months to a week" → actual is "The timelines for a lot of our product features have gone down from six month to one month and sometimes to even one day"

Drift like this is exactly what literal-match catches. A hallucinated citation might "feel right" but won't withstand a re-fetch.

### Retry message sent to Claude

The retry template (`prompts/question-generation/pass-3-retry-template.md`) was rendered with:

```
Programmatic validation failed for 1 of your 5 questions:

## Question 4 — spot

**Failure type:** `citation_not_literal`
**Reason:** The quote_excerpt you provided was not found verbatim in podcasts/cat-wu.md when re-fetched. Either you paraphrased, or the excerpt isn't in the source. Pick a different passage that:
1. Appears verbatim in one of the original excerpts you were given.
2. Grounds the framework underlying the `correct` option.

**Original question (for your reference):**
{ ... full Q4 JSON ... }
```

### Retry returned (PASS)

Claude returned a corrected citation:

```json
"citation": {
  "filename": "podcasts/cat-wu.md",
  "quote_excerpt": "We want to remove every single barrier to shipping things. The timelines for a lot of our product features have gone down from six month to one month and sometimes to even one day."
}
```

**Validator re-run:** verbatim substring check against the re-fetched
excerpt → ✅ PASS. Final length: 174 chars (under the 280 cap).

This is the only retry triggered for this day. Total Claude calls
across the full pipeline: **4** (Pass 0 + Pass 1 + Pass 2 + 1 retry on
Q4). Average per-day from observation across past spec exercises:
3-5 total LLM calls (most days 0 retries).

## Why this matters for the submission

Most LLM-generated quizzes ship hallucinated citations. The pipeline
spec calls them out as a P0 failure mode. The literal-match validator
ensures every quote you see in the result panel **actually exists in
the source.** Without it, "PM Daily — citations from real Lenny
episodes" would be a marketing claim. With it, it's a property of the
build process.

## Pass 3 → Pass 99 (final JSON)

After validation, Pass 3 emits the final per-day content JSON in the
`DailyContent` zod shape — see [`99-final-content.json`](./99-final-content.json).

The shape is engineered for the public read path: `correct_key`,
`explanation_md`, and `pm_takeaway` live in this JSON but are STRIPPED
when the seeder writes to KV (see
[`apps/web/src/lib/server/content/seed.ts`](../../../apps/web/src/lib/server/content/seed.ts)
line 35). The KV-cached version that `/quiz` reads contains scenarios
+ options only — never the correct answers. Tests verify this:
[`apps/web/tests/unit/seed.test.ts`](../../../apps/web/tests/unit/seed.test.ts).
