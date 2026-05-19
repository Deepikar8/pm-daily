# Fix Broken Lenny Podcast URLs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace YouTube `source_url` values (and one `null`) in five `apps/web/content/*.json` files with canonical Lenny's Newsletter / Lenny's Podcast URLs, verified via curl and WebFetch.

**Architecture:** Five independent file edits. Each file follows the same workflow: resolve the canonical URL → verify it (curl 200 + WebFetch guest-name match) → edit all 12 URL locations in the JSON (1 top-level `source.source_url`, 1 top-level `source.search_url`, 5 × `questions[].citation.source_url`, 5 × `questions[].citation.search_url`) → confirm only URL fields changed → commit. One task per file = one commit per file = easy revert if any single URL turns out wrong.

**Tech Stack:** WebFetch, Bash (curl + jq), Edit tool. No production code changes.

---

## Reference — files in scope

| File | Guest | Current `source.source_url` | MD filename |
|---|---|---|---|
| `apps/web/content/2026-05-16.json` | Jason Cohen | `https://www.youtube.com/watch?v=8xLquwfx6p0` | `podcasts/jason-cohen.md` |
| `apps/web/content/2026-05-20.json` | Elena Verna (4.0) | `null` | `podcasts/elena-verna-40.md` |
| `apps/web/content/2026-05-22.json` | Stewart Butterfield | `https://www.youtube.com/watch?v=kLe-zy5r0Mk` | `podcasts/stewart-butterfield.md` |
| `apps/web/content/2026-05-24.json` | Molly Graham | `https://www.youtube.com/watch?v=twzLDx9iers` | `podcasts/molly-graham.md` |
| `apps/web/content/2026-05-26.json` | Jeanne DeWitt Grosser | `https://www.youtube.com/watch?v=RmnWHz8HD74` | `podcasts/jeanne-grosser.md` |

Both `lennysnewsletter.com/p/<slug>` and `lennyspodcast.com/<slug>` are valid host patterns. If neither yields a verified URL for a guest, the fallback per Spec A is to leave the YouTube URL in place (or set Elena Verna's to `null` → resolved YouTube) and record the file as a known exception in the final task.

---

## Per-file workflow (same for Tasks 1-5)

The five per-file tasks share the same nine steps. Read the template once and apply to each task; the per-file tasks below specify only what differs (file path, guest name, current URL).

### Step pattern

- [ ] **Step A: Resolve candidate URL.** WebFetch `https://www.lennysnewsletter.com/podcast` asking "Is there a podcast episode by `<guest name>`? If so, return the exact URL." If yes, that's the candidate. If no, also WebFetch `https://www.lennyspodcast.com/` with the same question. If still no, derive a slug from the JSON's `source.title` (first 6-8 hyphenated lowercase tokens, stripping `|` and `:` separators) and try `https://www.lennysnewsletter.com/p/<slug>` directly.

- [ ] **Step B: Verify HTTP 200.**

```bash
curl -sIL -o /dev/null -w "%{http_code}\n" "<candidate-url>"
```

Expected output: `200`. If `404` or any non-2xx after redirects, return to Step A with a different slug candidate. If three slug variants fail, mark this file as the known exception (Step I).

- [ ] **Step C: Verify guest match.** WebFetch the candidate URL asking: "Does this page describe a Lenny's Newsletter or Lenny's Podcast episode featuring `<guest name>`? Answer yes or no with one sentence of evidence." Must be `yes` with evidence quoted from the page (guest name appears in title or first paragraph). If `no`, return to Step A.

- [ ] **Step D: Snapshot the file.**

```bash
cp apps/web/content/<file>.json /tmp/<file>.before.json
```

- [ ] **Step E: Replace YouTube URL with verified URL (skip for Elena Verna — see Task 2).**

Use Edit with `replace_all: true`:

- `old_string`: the current YouTube URL (full, exact)
- `new_string`: the verified canonical URL
- `replace_all`: `true`

This single edit hits all 6 locations of `source_url` (1 top-level + 5 in citations).

- [ ] **Step F: Replace generic `search_url`.**

Edit with `replace_all: true`:

- `old_string`: `https://www.lennysnewsletter.com/podcast`
- `new_string`: the verified canonical URL
- `replace_all`: `true`

This hits the remaining 6 locations of `search_url`. Both old strings (YouTube URL and generic `/podcast`) are unique-per-purpose within the file, so `replace_all` is safe.

- [ ] **Step G: Confirm JSON parses and counts match.**

```bash
jq '.' apps/web/content/<file>.json > /dev/null && \
  jq '[.. | objects | select(has("source_url")) | .source_url] | unique | length' apps/web/content/<file>.json
```

Expected: no parse error, and unique source_url count = `1` (every source_url field across the file holds the same canonical URL).

```bash
jq '[.. | objects | select(has("search_url")) | .search_url] | unique | length' apps/web/content/<file>.json
```

Expected: `1` (every search_url field also holds the canonical URL).

- [ ] **Step H: Confirm diff is URL-only.**

```bash
diff /tmp/<file>.before.json apps/web/content/<file>.json | grep -v -E '"(source_url|search_url)":'
```

Expected: empty output. Any line returned indicates an unintended change — investigate before committing.

- [ ] **Step I (only if Step A-C exhausted with no verified URL):** Stop, do not edit the file. Record in the final task's exception list with: file, guest, slug candidates tried, and why each failed. Do not commit.

- [ ] **Step J: Commit.**

```bash
git add apps/web/content/<file>.json
git commit -m "fix: replace YouTube source_url with Lenny URL in <file>"
```

---

## Task 1: Fix 2026-05-16.json (Jason Cohen) — past, already shipped

**File:** `apps/web/content/2026-05-16.json`
**Guest:** Jason Cohen
**Current `source.source_url`:** `https://www.youtube.com/watch?v=8xLquwfx6p0`
**Title:** "5 questions to ask when your product stops growing | Jason Cohen (2x unicorn founder)"
**Slug candidate (if needed):** `5-questions-to-ask-when-your-product-stops-growing`

Follow Steps A through J above.

**Priority note:** This file is already shipped — visible to users today. Sequence this task first so the user-visible defect closes first.

---

## Task 2: Fix 2026-05-20.json (Elena Verna 4.0) — null source_url

**File:** `apps/web/content/2026-05-20.json`
**Guest:** Elena Verna
**Current `source.source_url`:** `null` (Elena Verna's 4th podcast appearance per MCP: `Elena Verna 4.0`)
**Title:** *(read from file at step A — title field varies)*
**Slug candidate (if needed):** `elena-verna-4-0` or `elena-verna` or derive from title

**Workflow differs at Step E** because there's no YouTube URL to replace_all against. Use jq instead:

- [ ] **Step E (Elena Verna only):** Use jq to set every `source_url` field to the verified URL.

```bash
jq --arg url "<verified-url>" \
  '.source.source_url = $url | .questions |= map(.citation.source_url = $url)' \
  apps/web/content/2026-05-20.json > /tmp/2026-05-20.json && \
  mv /tmp/2026-05-20.json apps/web/content/2026-05-20.json
```

Then proceed with Steps F, G, H, J as normal.

---

## Task 3: Fix 2026-05-22.json (Stewart Butterfield)

**File:** `apps/web/content/2026-05-22.json`
**Guest:** Stewart Butterfield
**Current `source.source_url`:** `https://www.youtube.com/watch?v=kLe-zy5r0Mk`
**Title:** "Slack founder: Mental models for building products people love ft. Stewart Butterfield"
**Slug candidate (if needed):** `slack-founder-mental-models-for-building-products-people-love`

Follow Steps A through J above.

---

## Task 4: Fix 2026-05-24.json (Molly Graham)

**File:** `apps/web/content/2026-05-24.json`
**Guest:** Molly Graham
**Current `source.source_url`:** `https://www.youtube.com/watch?v=twzLDx9iers`
**Title:** "The high-growth handbook: Molly Graham's frameworks for leading through chaos, change, and scale"
**Slug candidate (if needed):** `the-high-growth-handbook-molly-grahams-frameworks`

Follow Steps A through J above.

---

## Task 5: Fix 2026-05-26.json (Jeanne DeWitt Grosser)

**File:** `apps/web/content/2026-05-26.json`
**Guest:** Jeanne DeWitt Grosser (also "Jeanne Grosser")
**Current `source.source_url`:** `https://www.youtube.com/watch?v=RmnWHz8HD74`
**Title:** "What world-class GTM looks like in 2026 | Jeanne DeWitt Grosser (Vercel, Stripe, Google)"
**Slug candidate (if needed):** `what-world-class-gtm-looks-like-in-2026`

Follow Steps A through J above.

---

## Task 6: Final verification sweep

**Files:** all five edited above.

- [ ] **Step 1: Re-verify every new URL still returns 200.**

```bash
for f in apps/web/content/2026-05-{16,20,22,24,26}.json; do
  url=$(jq -r '.source.source_url' "$f")
  printf "%s -> " "$f"
  curl -sIL -o /dev/null -w "%{http_code}\n" "$url"
done
```

Expected: each line ends in `200`. If any non-200 appears, that file needs Task 1-5 to be re-run for that guest.

- [ ] **Step 2: Confirm no YouTube URLs remain in the five files (other than any documented exception from Step I).**

```bash
grep -l 'youtube.com' apps/web/content/2026-05-{16,20,22,24,26}.json || echo "OK - no YouTube URLs remain"
```

Expected: `OK - no YouTube URLs remain`. If any file still contains `youtube.com`, that file was either skipped intentionally (Step I exception — verify it's in the exception list) or the edit didn't complete.

- [ ] **Step 3: List any Step I exceptions.**

If any of Tasks 1-5 ended at Step I, write a short summary as a follow-up note in the final commit message (Step 4) — file, guest, slug candidates tried, reason each failed. Format:

```
Known exceptions:
- 2026-05-XX.json (<Guest>): Tried slugs A, B, C; all returned <reason>. Left YouTube URL in place.
```

- [ ] **Step 4: Final commit (only if Step 3 had exceptions OR no further changes — otherwise no commit needed since per-file commits already happened).**

```bash
# Only if exceptions exist — add to the commit body
# Otherwise this task produces no commit; the per-file commits stand alone
git log --oneline -6
```

Expected: the last 5 commits each match `fix: replace YouTube source_url with Lenny URL in 2026-05-XX.json` (plus any earlier commits).

---

## Out of scope (deferred per Spec A)

- Past files other than 2026-05-16 (already-shipped newsletters are fine; `2026-05-08.json` uses `lennyspodcast.com`, a valid host — not in scope).
- Newsletter files (already have correct URLs).
- Schema changes.
- Pipeline change to prevent recurrence (would belong in a separate spec).
- Backfilling into D1 database (the JSON is the integration point).

---

## Self-review against Spec A

**Spec coverage:**
- Spec §Scope (5 files): Tasks 1-5 cover all five. ✓
- Spec §Approach (steps 1-4: resolve, verify status, verify guest, update fields): per-file Steps A, B, C, E+F. ✓
- Spec §Fallback (leave YouTube if not found): Step I. ✓
- Spec §Verification (200, fields match top-level, JSON parses, diff is URL-only): per-file Steps B (200), G (jq counts), H (diff), plus Task 6 Step 1 (re-verify). ✓

**Placeholder scan:** No "TBD", "implement later". One conditional ("title field varies — read at step A") in Task 2 is intentional because the file's `source.title` is the source of truth and I'd rather not duplicate it here in case it differs from what I expect. ✓

**Type consistency:** All references to `source_url`, `search_url`, `source.title`, `questions[].citation` match the JSON shape verified during brainstorming. ✓
