# Pipeline trace — Cat Wu episode (2026-04-23)

> What this is: a verifiable end-to-end trace of how PM Daily's
> 4-pass content pipeline turns one Lenny's Podcast episode into a
> day's worth of digest + 5 first-person PM-agency quiz questions.
>
> Why it exists: the deck and submission writeup describe the AI
> engine ("source-grounded LLM pipeline with literal-match
> validation"). This directory shows the engine actually
> running — the prompts that go in, the model output that comes
> out, the validators that check it, the final JSON that ships.
>
> Production status: the pipeline is fully specced + prompted +
> tested but not yet automated end-to-end (see
> [`docs/superpowers/plans/2026-05-08-pm-daily-content-pipeline.md`](../../superpowers/plans/2026-05-08-pm-daily-content-pipeline.md)
> for the GitHub Action plan). This trace is the one-time manual
> walk-through used to validate the design before automation.

## Read order

| File | What it shows |
|---|---|
| [`00-source.md`](./00-source.md) | The input: source metadata + 5 real excerpts pulled via the `lennysdata` MCP server during the spec session |
| [`10-pass-0-thesis-brief.json`](./10-pass-0-thesis-brief.json) | **Pass 0** — Claude maps the source's distinct ideas + central tension before any questions are written |
| [`20-pass-1-generate.json`](./20-pass-1-generate.json) | **Pass 1** — Claude overgenerates 7 candidate questions distributed across the brief's ideas |
| [`30-pass-2-review.json`](./30-pass-2-review.json) | **Pass 2** — Claude self-audits the 7 against trivia / distractor / coverage rules and keeps 5 |
| [`40-pass-3-validation.md`](./40-pass-3-validation.md) | **Pass 3** — programmatic validators (length, citation literal-match, setup-leak, coverage breadth). Includes one synthetic citation-drift retry. |
| [`99-final-content.json`](./99-final-content.json) | The shipped JSON: matches `DailyContent` zod at `apps/web/src/lib/server/content/types.ts`. This is what would seed D1 + KV. |

## Why "trace" not "live execution"

The `lennysdata` MCP server became unavailable on 2026-05-09 (mid-build).
The 5 excerpts in [`00-source.md`](./00-source.md) are the actual responses
captured during the spec brainstorm before that. Pass 0 / Pass 1 / Pass 2
outputs in this trace are reconstructions consistent with the prompts at
[`prompts/question-generation/`](../../../prompts/question-generation/) and
the question rewrites locked in spec §5.4.6 (the first-person PM-agency
revision that defined the product). The validators in Pass 3 are real and
were exercised against the input — see the synthetic citation-drift retry.

When the MCP credential path is resolved (Risk #2 in the spec), this
exact pipeline runs unattended via the
[GitHub Action plan](../../superpowers/plans/2026-05-08-pm-daily-content-pipeline.md).

## Verifying

The cheapest verification — open [`00-source.md`](./00-source.md) and
[`99-final-content.json`](./99-final-content.json) side by side. Every
`citation.quote_excerpt` in the final JSON must appear verbatim in the
excerpts. That's the literal-match enforcement — Pass 3's job. If you find
a quote in the final JSON that doesn't appear in the source excerpts, the
pipeline failed silently and we have a bug.
