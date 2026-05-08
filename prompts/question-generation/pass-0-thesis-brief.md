# Pass 0 — Thesis Brief

> Sent as the first user message after the system prompt, BEFORE Pass 1.
> Variables in `{{...}}` are substituted at runtime by the GH Action.

---

Today's source for **PM Daily — {{date}}** is below.

## Source metadata

```yaml
filename: {{source.filename}}
title: {{source.title}}
type: {{source.type}}              # "podcast" | "newsletter"
byline: {{source.byline}}          # guest (podcast) or author (newsletter)
date: {{source.date}}
tags: [{{source.tags}}]
description: {{source.description}}
source_url: {{source.source_url}}  # may be empty
```

## Source excerpts

The pipeline has fetched these excerpts via `read_excerpt` against keywords derived from the tags and description.

{{#each excerpts}}
### Excerpt {{@index}} — query: "{{this.query}}"

```
{{this.text}}
```
{{/each}}

## Your task — Pass 0

Before generating any quiz questions, produce a **thesis brief** that captures the breadth of the operator's argument. This brief is the coverage map Pass 1 will use to ensure questions span the source's actual ideas, not just the most quotable one.

Output a JSON object with this shape:

```json
{
  "central_tension": "string — what the operator is arguing AGAINST. E.g., 'old PM toolkit (PRDs, alignment, multi-quarter roadmaps) vs. AI-native PM (speed, taste, end-to-end engineering ownership)'. 1-2 sentences.",
  "ideas": [
    {
      "id": "kebab-case-id",                   // e.g. "agi-pilled-calibration"
      "title": "string — short label",         // e.g. "AGI-pilled calibration"
      "summary": "string — 1-2 sentences",     // what the operator argues on this point
      "supporting_passage": "string",          // verbatim quote from excerpts above (≤280 chars)
      "framework_strength": "central | secondary | mentioned"
                                               // how foundational this idea is to the source's argument
    }
    // 5-7 ideas total
  ]
}
```

## How to find ideas

- **Read all excerpts.** The most-quotable bit is often *not* the most central idea.
- **Look for distinct claims.** A single concept stated three times is one idea, not three.
- **Look for the operator's contrast.** What are they arguing against? That contrast often reveals the central tension.
- **Look for the headline-worthy ideas the operator returns to.** Recurring framings are usually load-bearing.
- **Distinguish framework from anecdote.** "We shipped X in a week" is an anecdote; "remove every barrier to shipping" is a framework. Frameworks are testable.
- **Don't pad.** 5 strong ideas beat 7 thin ones. If the source genuinely has only 4 distinct frameworks, output 4.

The brief should accurately reflect what the source argues — including ideas you might find less interesting or quotable. Pass 1 will use this brief as a hard coverage constraint, so leaving an idea out here means it won't be tested.

Begin.
