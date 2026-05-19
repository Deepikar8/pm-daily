# Fix Broken Lenny Podcast URLs in Future Content

## Context

PM Daily ships daily content as JSON files under `apps/web/content/YYYY-MM-DD.json`. Each file references a single Lenny's Newsletter source — either a newsletter post or a podcast episode — via a `source` block at the top level and a `citation` block repeated inside each of the five questions.

For newsletter sources, the `source_url` correctly points to the canonical `lennysnewsletter.com/p/<slug>` episode page. For four upcoming podcast entries the `source_url` is missing or points to YouTube, so a reader who clicks "source" never lands on Lenny's Newsletter.

The lennysdata MCP archive (the upstream of record) does not itself carry Lenny URLs for these four podcasts — its `source_url` field is either absent or a YouTube link. The fix therefore cannot be a simple MCP re-fetch; the canonical Lenny URL has to be looked up on `lennysnewsletter.com` directly.

## Scope

Four files under `apps/web/content/`:

| File | Guest | Current `source_url` |
|---|---|---|
| `2026-05-20.json` | Elena Verna (4.0) | *(missing)* |
| `2026-05-22.json` | Stewart Butterfield | `youtube.com/watch?v=kLe-zy5r0Mk` |
| `2026-05-24.json` | Molly Graham | `youtube.com/watch?v=twzLDx9iers` |
| `2026-05-26.json` | Jeanne DeWitt Grosser | `youtube.com/watch?v=RmnWHz8HD74` |

For each file, two locations must be updated:

1. Top-level `source.source_url`
2. Each `questions[*].citation.source_url` (5 questions per file, so 20 inner references total across the four files)

Additionally, `search_url` is currently the generic `lennysnewsletter.com/podcast` landing page on these four files. When a canonical episode page is found, `search_url` should be updated to the same canonical URL so both fields point at a useful destination.

## Approach

For each guest:

1. WebFetch `https://www.lennysnewsletter.com/podcast` and search the page text for the guest's name to find the episode entry.
2. If the listing page link does not resolve directly, derive a slug candidate from the episode title in the JSON file (e.g. "Slack founder: Mental models for building products people love ft. Stewart Butterfield" → `slack-founder-mental-models-for-building-products-people-love`) and fetch `https://www.lennysnewsletter.com/p/<slug>`. Lenny's published slugs are often truncated, so try the first 6-8 hyphenated tokens of the title before falling back.
3. Verify the resolved URL with an HTTP HEAD or equivalent — must return 200.
4. Update both `source.source_url` and every `questions[*].citation.source_url` in the file to the verified URL. Also update both `search_url` fields to the same canonical URL.

## Fallback

If a guest's episode genuinely cannot be found on `lennysnewsletter.com` (the podcast hasn't published yet, or the episode is YouTube-only):

- Leave the YouTube URL in place.
- Record the file and reason in the implementation plan as a known exception.
- Do not invent a URL.

## Verification

For each modified file, after the edit:

- The new top-level `source.source_url` returns 200.
- Every `questions[*].citation.source_url` in the file matches the new top-level URL.
- The JSON parses cleanly (`jq . file.json > /dev/null`).
- A diff of the file shows changes only to URL fields — no accidental changes to question text, headlines, or takeaways.

## Out of scope

- Past content files (`2026-05-08.json` through `2026-05-19.json`). Not asked, and most are newsletters with correct URLs.
- The newsletter files `2026-05-21.json`, `2026-05-23.json`, `2026-05-25.json`. Already have correct `lennysnewsletter.com/p/<slug>` URLs.
- Any schema change to the JSON shape.
- Any pipeline change to prevent recurrence. Flag as a follow-up; the right fix at the pipeline level is to teach the question-generation runner to resolve a Lenny URL for podcast sources before writing the JSON, but that belongs in a separate spec.
- Backfilling the four files into the D1 database. The content pipeline reads the JSON, so committing the file changes is the integration point; database refresh, if needed, follows the same code path as a normal content update.
