# Quiz Generation Evals

## Context

Spec B (Quiz Difficulty v2) hardens the question-generation prompt across four difficulty axes, rolled out as four staged minor versions (v1.1 → v1.4). The spec's original gate between stages is a single golden source (Cat Wu episode) plus a human spot-read.

A single source is too narrow. The prompt change might pass the gate on Cat Wu but regress on a multi-thesis newsletter or a metrics-heavy episode, and we would not notice until after merge. A statistical gate across a small fixed source set is the right shape — enough sources that one anomalous result does not pass or fail a stage on its own, few enough that the suite stays cheap and fast.

This spec defines that eval harness. Its sole purpose during Spec B's rollout is to act as the merge gate for each stage. Broader uses (CI regression suite, production drift monitor) are explicitly out of scope and tracked separately.

## Source set

Six sources, deliberately varied, frozen for the duration of Spec B's rollout so cross-stage deltas are meaningful.

| Source | Why this one |
|---|---|
| Cat Wu — Anthropic Claude Code | Full v1.0 pipeline trace already exists in `docs/pipeline-demo/cat-wu-2026-04-23/`. Strong single-thesis episode. |
| Eric Ries 2.0 — Lean Startup | Multi-framework, classic operator voice. Tests breadth handling. |
| Amol Avasare — Anthropic growth | Growth-heavy, metrics-flavored. Tests how rules behave on numeric scenarios. |
| Jack Cohen — GAIN framework newsletter | Already-shipped `2026-05-19.json` provides a v1.0 baseline to compare directly. |
| One podcast with a thin, concentrated thesis | Tests how rules behave when source breadth is limited. Picked from the lennysdata archive during implementation. |
| One newsletter with a broad, listicle thesis | Tests the opposite extreme. Picked from the archive during implementation. |

The frozen list lives in `scripts/evals/sources.json` and does not change once Spec B starts.

## Scoring layers

Three layers, each producing scores per question and aggregated per source. The aggregate per source becomes one row in the run scorecard.

### 1. Mechanical (deterministic, fast, free)

- **No-giveaway-stem:** the scenario stem contains zero substantive (≥ 4 chars) tokens from the title of the question's tagged `idea_id` (which Pass 1 already attaches per `pass-1-generate.md` step 5). Check is per-question against that one idea's title, *not* against every idea in the brief — otherwise natural domain vocabulary (e.g. "calibration" in an episode about calibration) trips false positives.
- **Length parity:** word count of the correct option is less than or equal to the max word count among the three distractors
- **Schema and length bounds:** re-uses the existing Pass-3 validator logic
- **Citation literal-match:** re-uses existing Pass-3 logic (`read_excerpt` substring verification)

### 2. LLM-as-judge (Claude, separate prompt, versioned)

A separate Claude call grades each generated quiz against a structured rubric and returns scores plus rationale.

- **Defensibly-close distractor quality (Rule 3):** judge picks the hardest distractor in each question and rates 1-5 whether rejecting it requires the operator's framework
- **Second-order presence (Rule 4):** the primary signal is Pass-2's self-tag (`"second-order: ..."` per Spec B Rule 4). The judge confirms that the tagged question genuinely tests framework *spirit* over *letter* — false-positive tag = stage fails. The judge is *not* asked to discover untagged second-order questions; that would introduce noise from judge mis-classification.
- **Scenario realism:** 1-5 on whether the scenario is one a mid-level PM (3-7 years) would actually face
- **Framework grounding:** 1-5 on whether the explanation cites the operator's framework correctly

The judge prompt is **frozen** for the full Spec B rollout. Changing the judge between stages changes the ruler and invalidates cross-stage comparison. If the judge needs to change, restart the baseline.

**Judge calibration (one-time, before freezing).** Before the judge prompt is frozen, hand-score 10 questions: 5 drawn from existing shipped `2026-05-*.json` content (a mix of obviously-strong and obviously-weak) and 5 synthetically degraded (e.g., correct option deliberately the longest, distractors deliberately surface-dismissible). Run the judge on the same 10. The judge agrees with the hand score within ±0.5 on each subjective dimension for at least 8 of 10 questions before it is fit to freeze. If it doesn't, iterate on the judge prompt and re-calibrate. Calibration set and hand scores are committed to `scripts/evals/judges/calibration/` for future re-baselines.

### 3. Cost and latency (observability, not a gate by itself)

- Total tokens across Pass 0 + Pass 1 + Pass 2 + any Pass 3 retries
- Pass-2 candidates dropped count
- Pass-3 retries triggered count
- Wall-clock per source

## Gate thresholds per Spec B stage

### Baseline measurement (precondition for any gate)

Before any Spec B stage runs, the v1.0 baseline must be measured to establish both means *and* within-source variance:

- Run the v1.0 prompt against all six sources **twice** (12 pipeline runs total). Twice is the minimum to compute a stddev; if a source's two runs diverge wildly (e.g., realism score differs by > 1.0), add a third run for that source.
- Commit results as `scripts/evals/baseline/v1.0-results.json` including per-source per-metric mean and stddev.
- Thresholds below are stated as `mean ± k·stddev` against this baseline, not as multiplicative ratios — multiplicative thresholds with N=1 hide variance and pass or fail spuriously.

### Gate table

A stage passes when, aggregated across the six sources, all of the following hold. **Each threshold is gated only once the rule it measures is in the prompt** — v1.1 measures Rule 1 mechanical only; v1.2 adds Rule 2; v1.3 adds Rule 3; v1.4 adds Rule 4. v1.0 baseline does *not* enforce Rules 1-4 in the prompt, so baseline mechanical scores on Rules 1 and 2 are expected to be low — that's the whole point of measuring the delta.

| Metric | Gated from | Threshold |
|---|---|---|
| Rule 1 mechanical (no-giveaway-stem) pass rate | v1.1 | ≥ 95% of questions across 6 sources |
| Rule 2 mechanical (length parity) pass rate | v1.2 | ≥ 95% of questions across 6 sources |
| Schema / length / citation literal-match pass rate (existing Pass-3 logic) | v1.1 onward | ≥ 95% (already enforced in v1.0; must not regress) |
| LLM-judge: defensibly-close score, mean across 6 sources | v1.3 | ≥ 3.5 / 5 |
| LLM-judge: confirms Pass-2 second-order tag is genuine | v1.4 | ≥ 5 of 6 sources have ≥ 1 question where Pass-2 tagged second-order *and* judge confirmed |
| LLM-judge: realism mean | v1.1 onward | No regression > 1·v1.0_stddev below baseline mean |
| LLM-judge: grounding mean | v1.1 onward | No regression > 1·v1.0_stddev below baseline mean |
| Total token cost, mean per source | v1.1 onward | ≤ v1.0_mean + 1·v1.0_stddev, with absolute ceiling ≤ 2× v1.0_mean |
| Pass-3 retries, mean per source | v1.1 onward | ≤ v1.0_mean + 1·v1.0_stddev, with absolute ceiling ≤ 1.5× v1.0_mean |

A stage that breaches any applicable threshold does not advance. Borderline judge scores (within 0.2 of threshold) trigger one re-run before being treated as a fail, per the variance-handling note in §Risks.

## Output

Each eval run writes to `eval-runs/<ISO-timestamp>-<version>/`:

- `summary.md` — human-readable scorecard, per-source and aggregate, with go/no-go verdict per threshold
- `results.json` — machine-readable, for diffing across runs and feeding the next stage's baseline
- `quizzes/<source-slug>.json` — the raw generated quiz per source, kept for spot-read

The `summary.md` is what gets read at each stage gate to make the go/no-go decision.

## Files added

```
scripts/evals/
  sources.json              # frozen 6-source list
  run-evals.ts              # CLI entry: `pnpm eval --version=v1.1`
  judges/
    judge-prompt.md         # LLM-as-judge rubric, frozen for Spec B
  checks/
    mechanical.ts           # regex / word-count checks
    llm-judge.ts            # Claude judge wrapper
  baseline/
    v1.0-results.json       # baseline run, committed once

eval-runs/                  # gitignored — local run artifacts
```

## Relationship to Spec B

Spec B's §Validation gate references this spec — when this harness ships, Spec B's stage gates are `pnpm eval --version=vX.Y` against the thresholds in §Gate table above. Cross-spec sequencing is owned by this spec's §Sequencing across all three specs below.

## Risks

- **Judge variance.** LLM-as-judge scores have non-trivial run-to-run variance. Mitigation: scores are means across 6 sources, which dampens single-question noise; if a stage gate is borderline (within 0.2 of threshold), re-run once before failing.
- **Six sources may be too few for tight thresholds.** Mitigation: thresholds are deliberately loose (≥ 95% on mechanical, ≥ 3.5 / 5 on subjective, ≤ 2× on cost) to absorb sample-size noise. If a stage routinely passes by tiny margins, expand the source set in a Spec C v2 (out of scope here).
- **Judge prompt drift over the rollout.** Mitigation: judge prompt is committed and explicitly frozen. Any change to it invalidates prior baselines and requires a re-baseline before resuming.
- **Cost of running the full suite.** Grounded estimate from the Cat Wu trace in `docs/pipeline-demo/cat-wu-2026-04-23/`: ~42 KB of output JSON across Pass 0+1+2 (~10K output tokens). Input per source (source excerpts + system prompt) is roughly 15-25K tokens summed across the four passes. Adding a judge call at ~5K input + 1K output per source. Total per source: ~25-35K input + ~11K output. Six sources: ~180K input + ~66K output. At Sonnet 4.6 prices (~$3 / Mtok input, ~$15 / Mtok output) one full eval run costs roughly **$1.50-2.50**. Doubled for the v1.0 baseline (12 runs): ~$3-5 one-time. Acceptable for a gate that ships at four stages. Wall-clock at 6 sources serially is ~30-60 min depending on retries — first baseline can run in background overnight; subsequent stage gates parallelize by source if latency becomes painful.

## Out of scope

- GitHub Action / CI wiring. CLI-only for now. CI is a follow-up if Spec B's staging works.
- Production drift monitor that re-grades shipped quizzes.
- Human-evaluation UI.
- Expanding past six sources during Spec B's rollout — the source set is frozen.
- Re-establishing baseline if the judge prompt later needs to change — covered as a risk, not designed for.

## Sequencing across all three specs

1. **Spec A** — fix podcast URLs in 4 future content files. Ship end to end.
2. **Spec C (this spec)** — build the eval harness, run the v1.0 baseline, commit `baseline/v1.0-results.json`.
3. **Spec B** — execute v1.1 → v1.4 staged prompt rollout, using `pnpm eval` as the gate at each stage.
