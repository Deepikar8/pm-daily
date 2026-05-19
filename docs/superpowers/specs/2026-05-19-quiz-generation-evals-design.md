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

- **No-giveaway-stem:** the scenario stem contains zero element names from the Pass-0 thesis brief
- **Length parity:** word count of the correct option is less than or equal to the max word count among the three distractors
- **Schema and length bounds:** re-uses the existing Pass-3 validator logic
- **Citation literal-match:** re-uses existing Pass-3 logic (`read_excerpt` substring verification)

### 2. LLM-as-judge (Claude, separate prompt, versioned)

A separate Claude call grades each generated quiz against a structured rubric and returns scores plus rationale.

- **Defensibly-close distractor quality (Rule 3):** judge picks the hardest distractor in each question and rates 1-5 whether rejecting it requires the operator's framework
- **Second-order presence (Rule 4):** judge identifies whether at least one of the five questions tests framework *spirit* over *letter*, with rationale
- **Scenario realism:** 1-5 on whether the scenario is one a mid-level PM (3-7 years) would actually face
- **Framework grounding:** 1-5 on whether the explanation cites the operator's framework correctly

The judge prompt is **frozen** for the full Spec B rollout. Changing the judge between stages changes the ruler and invalidates cross-stage comparison. If the judge needs to change, restart the baseline.

### 3. Cost and latency (observability, not a gate by itself)

- Total tokens across Pass 0 + Pass 1 + Pass 2 + any Pass 3 retries
- Pass-2 candidates dropped count
- Pass-3 retries triggered count
- Wall-clock per source

## Gate thresholds per Spec B stage

A stage passes the gate when, aggregated across the six sources, all of the following hold:

| Metric | Threshold vs v1.0 baseline |
|---|---|
| Mechanical pass rate | ≥ 95% (strict — these are deterministic checks) |
| LLM-judge: defensibly-close score, mean across 6 sources | v1.3 onward: ≥ 3.5 / 5 |
| LLM-judge: second-order presence | v1.4 onward: ≥ 5 of 6 sources contain ≥ 1 second-order question |
| LLM-judge: realism mean | Must not regress more than 0.3 vs v1.0 mean |
| LLM-judge: grounding mean | Must not regress more than 0.3 vs v1.0 mean |
| Total token cost mean | ≤ 2× v1.0 mean |
| Pass-3 retries mean | ≤ 1.5× v1.0 mean |

Each stage inherits all prior stages' thresholds and adds the threshold for the rule it introduces. A stage that breaches any threshold does not advance.

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

## Updates to Spec B

Once the eval harness exists and the v1.0 baseline is recorded, Spec B's "Validation gate between stages" section gets edited to reference `pnpm eval --version=vX.Y` and the thresholds defined here, in place of its current inline rule-specific checks. Spec C subsumes those checks.

This spec also updates Spec B's "Sequencing" implicitly: Spec C runs after Spec A and before Spec B's v1.1 work begins.

## Risks

- **Judge variance.** LLM-as-judge scores have non-trivial run-to-run variance. Mitigation: scores are means across 6 sources, which dampens single-question noise; if a stage gate is borderline (within 0.2 of threshold), re-run once before failing.
- **Six sources may be too few for tight thresholds.** Mitigation: thresholds are deliberately loose (≥ 95% on mechanical, ≥ 3.5 / 5 on subjective, ≤ 2× on cost) to absorb sample-size noise. If a stage routinely passes by tiny margins, expand the source set in a Spec C v2 (out of scope here).
- **Judge prompt drift over the rollout.** Mitigation: judge prompt is committed and explicitly frozen. Any change to it invalidates prior baselines and requires a re-baseline before resuming.
- **Cost of running the full suite.** Six sources × full pipeline + judge call per source. Estimate ~$1-3 per run at current Claude prices. Run cost is acceptable for a gate that ships four times across Spec B; not designed for hourly CI.

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
