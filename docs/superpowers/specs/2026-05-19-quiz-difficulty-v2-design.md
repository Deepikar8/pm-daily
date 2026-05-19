# Quiz Difficulty v2 — Prompt Hardening

## Context

PM Daily generates five scenario-based multiple-choice questions per day from one Lenny source, using a four-pass prompt pipeline in `prompts/question-generation/`:

- `system.md` v1.0 — role, archetypes, distractor types, anti-trivia rules, length bounds
- `pass-0-thesis-brief.md` — coverage map (5-7 distinct ideas)
- `pass-1-generate.md` — overgenerate 7 candidates
- `pass-2-review.md` — self-audit, keep best 5
- `pass-3-retry-template.md` — programmatic validation retry

The current output is competent but a mid-level PM can pattern-match their way to the correct answer without invoking the operator's framework. Three observable tells:

1. The scenario stem often names the specific framework element being tested (e.g., "Per GAIN, the missing **Goal** is —"). The PM is told which element to look for.
2. The correct option is frequently the longest and most-qualified of the four. Length alone signals the answer.
3. Distractors are often obviously inferior on a surface read — no framework application required to reject them.

This spec hardens the prompt against all three tells and adds a fourth axis: at least one question per day should be a second-order case where the framework's literal application would mislead.

## Goal

Raise the difficulty bar so a PM cannot consistently get five out of five without engaging the operator's framework — without making the quiz unfair, trivia-flavored, or substantially more expensive to generate.

## The four rules

### Rule 1 — No-giveaway-stem

Scenario stems must not name the specific framework element being tested.

- Bad: *"Per GAIN, the most important element your script is missing is —"*
- Good: *"The script's most important missing piece is —"*

The PM must identify which element matters, not be told and asked to match.

### Rule 2 — Length-parity for options

The `correct` option must not be the longest of the four, and must not be the only option with qualifying clauses ("— and also...", "while still...", "but in a way that..."). Distractors must match the correct option's grammatical shape and approximate length, within ±5 words.

When the correct option needs precision that pushes it past the others, the fix is to either trim it or to pad distractors with plausible specificity. Never leave the correct option as the outlier.

### Rule 3 — Two-plausible-answers tension

At least one distractor — the `half_truth` or the `adjacent` — must be defensibly close enough that a skilled PM has to actively reject it using the operator's framework. If a distractor can be dismissed on surface read without invoking the framework, it is too weak and must be rewritten.

Pass-2 must articulate, in `self_review_concerns`, which distractor is the "defensibly close" one and the framework reason it is wrong. If Pass-2 cannot articulate this, the distractor is not yet doing its job.

### Rule 4 — Second-order scenario

Across the final five questions, at least one must be a *second-order* case: a situation where the framework's literal application would mislead, and the PM has to apply the framework's spirit rather than its letter.

The point is not to trick the reader. The point is to test that the PM understood *why* the framework works, not just *what* it says. Pass-2 must flag this question in `self_review_concerns` with an entry beginning `"second-order: <one-line rationale>"`.

## Files changed

| File | Change |
|---|---|
| `prompts/question-generation/system.md` | Version line bumped per stage. Add the rule under the appropriate existing section (rules 1 and 4 under "Anti-trivia hard constraints"; rules 2 and 3 under "Distractor design"). |
| `prompts/question-generation/pass-2-review.md` | Add the corresponding checklist item per stage. Pass-2 must answer each new check and rewrite any question that fails. |
| `prompts/question-generation/README.md` | Update changelog with each version bump. |

The system-prompt text alone is intent. Pass-2 self-audit is what enforces it. Both files change at every stage.

## Staged rollout

The four rules ship as four separate minor versions, one rule at a time, with a validation gate between each.

| Version | Adds | Why this order |
|---|---|---|
| v1.1 | Rule 1: No-giveaway-stem | Cheapest. Pure rewrite of stems. Doesn't change distractors. Low validator-failure risk. Builds confidence. |
| v1.2 | Rule 2: Length-parity | Mechanical and easy to audit (count words). Doesn't depend on subjective judgment. |
| v1.3 | Rule 3: Two-plausible distractor tension | Subjective. Needs the model to articulate why a distractor is defensibly close. Higher chance of Pass-2 churn. |
| v1.4 | Rule 4: Second-order question | Highest ambition, highest validator-failure risk. Saved for last so earlier rules are stable. |

Each stage is its own commit.

## Validation gate between stages

Each stage is gated by the eval harness defined in `2026-05-19-quiz-generation-evals-design.md` (Spec C), which scores six fixed sources across mechanical, LLM-judge, and cost/latency layers.

For each version, run:

```bash
pnpm eval --version=vX.Y
```

The run writes `eval-runs/<timestamp>-vX.Y/summary.md` with a per-threshold go/no-go verdict. A stage advances only when every threshold defined in Spec C's "Gate thresholds per Spec B stage" table passes for that version. A human spot-read of one or two generated quizzes per stage stays in the loop as a sanity check, but the harness is what decides the gate.

If any threshold fails at a stage, fix that stage only — do not advance to the next rule until the current stage is green. If the failure is a borderline judge-score (within 0.2 of threshold), re-run once before treating it as a fail, per Spec C's variance handling.

## Decision authority

At each stage gate, the implementation plan presents the diff against v1.0, the validator-failure and retry counts, and the spot-read notes. The user decides go/no-go. No auto-advance between stages.

## Risks

- **Validator failure rate may rise.** Stricter rules → more candidates rejected in Pass 2 → more Pass-3 retries → longer and more expensive nightly runs. Accept up to ~2× cost. If a stage breaches that, dial back the strictest rule of that stage (most likely Rule 2's ±5-word parity).
- **Subjectivity of "defensibly close."** Rule 3 is judgment-heavy. Mitigation: Pass-2 must articulate the framework reason a distractor is wrong; if it cannot, the distractor is not yet doing its job. This shifts the subjectivity from a binary call to a written-justification gate.
- **Second-order questions invite trick perception.** Rule 4 is the riskiest for fairness. Mitigation: the explanation must clearly state how literal application would have misled, so a reader who got it wrong learns the distinction and does not feel tricked.

## Out of scope

- Changing the five-question-per-day count or the archetype list.
- Changing the audience definition (mid-level PM, 3-7 years).
- A difficulty-calibration UI (e.g., easy/medium/hard toggle for the reader). Bigger product change, not asked.
- Backfilling difficulty into already-generated 2026-05-* JSON files.
- Cost-budget guardrails on the nightly run. Out of scope for the prompt change; tracked separately if the 2× ceiling is ever breached in production.
