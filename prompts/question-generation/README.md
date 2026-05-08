# PM Daily — Question Generation Prompts

Versioned prompts used by the nightly GitHub Action (`nightly-content.yml`) to generate the day's digest, takeaways, and 5 quiz questions from a single Lenny's Newsletter source.

## Files

| File | Role |
|---|---|
| `system.md` | System prompt — establishes role, rules, archetypes, distractor design, anti-trivia constraints, coverage requirement, output format, and process. |
| `pass-0-thesis-brief.md` | First user message — Claude reads excerpts and produces a structured brief: 5-7 distinct ideas + central tension. Used as a coverage constraint in Pass 1. |
| `pass-1-generate.md` | Second user message — overgenerate 7 candidate questions distributed across distinct ideas from the brief, plus headline / digest / takeaways. |
| `pass-2-review.md` | Third user message — Claude self-audits its 7 candidates (including coverage breadth) and outputs the best 5. |
| `pass-3-retry-template.md` | Used only on validation failure — asks Claude to fix specific failed questions, one retry per question. |

## How to update

Treat prompts as code. Any change should:
1. Bump the version line in the relevant file.
2. Be reviewed via PR.
3. Be tested against a fixed sample source (see `tests/golden-source.md` once created) before merging.
4. Be deployed by re-running the nightly action.

## Why four passes

The pipeline catches three distinct failure modes:

- **Pass 0 — Thesis brief.** Forces the model to map the breadth of the source's argument *before* writing questions. Without this step, the model concentrates on the most quotable framework and misses the source's actual thesis.
- **Pass 2 — Self-review.** Asking the model to audit its own draft against explicit rules catches trivia drift, weak distractors, citation drift, and (with the breadth check) coverage failures far more reliably than trying to perfect the prompt for a one-shot generation. Overgeneration in Pass 1 (7 candidates → keep 5) gives the self-review pass real choice.
- **Pass 3 — Programmatic validation.** Catches what the model can miss: literal-match citation verification (re-fetched via `read_excerpt`), schema correctness, length bounds, and setup-leak detection.

## Variables

Pass 1 uses these mustache-style variables, substituted by the runner:

| Variable | Source |
|---|---|
| `{{date}}` | Today's ISO date |
| `{{source.*}}` | Picked source's metadata from MCP `list_content` |
| `{{excerpts}}` | Array of `{ query, text }` from MCP `read_excerpt` calls |

Pass 3 uses `{{failures}}` populated by the validator.
