# Pass 3 — Programmatic Validation Retry Template

> Sent only when programmatic validation fails on one or more questions.
> Pass 3 itself runs in code (no LLM). This template is used for the *retry* turn that asks Claude to fix specific failures.

---

Programmatic validation failed for **{{count}}** of your 5 questions:

{{#each failures}}
## Question {{this.position}} — {{this.archetype}}

**Failure type:** `{{this.failure_type}}`
**Reason:** {{this.reason}}

{{#if this.failure_type == "citation_not_literal"}}
The `quote_excerpt` you provided was not found verbatim in `{{this.filename}}` when re-fetched. Either you paraphrased, or the excerpt isn't in the source. Pick a different passage that:
1. Appears verbatim in one of the original excerpts you were given.
2. Grounds the framework underlying the `correct` option.
{{/if}}

{{#if this.failure_type == "schema_invalid"}}
The output didn't match the JSON schema. Specifically: {{this.schema_error}}. Re-emit the question with the correct shape.
{{/if}}

{{#if this.failure_type == "length_exceeded"}}
The {{this.field}} exceeded its bound ({{this.actual}} > {{this.limit}}). Trim while preserving meaning.
{{/if}}

{{#if this.failure_type == "setup_leak"}}
The phrase "{{this.leaked_phrase}}" appears in both the scenario and the `correct` option. Rewrite one of them so the scenario doesn't telegraph the answer.
{{/if}}

**Original question (for your reference):**
```json
{{this.original_question_json}}
```
{{/each}}

## Your task — Retry

For each failed question above, output the **revised version only** as a JSON object:

```json
{
  "retries": [
    { "position": 1, "question": { ...full question shape... } },
    { "position": 3, "question": { ...full question shape... } }
  ]
}
```

You have **one retry per question**. After this turn, any still-failing question will be dropped. If too many drop (final count < 5), the day's content will be flagged for manual review and will not auto-merge.

Do not re-emit the questions that passed. Only return the failing positions in the `retries` array.

Begin.
