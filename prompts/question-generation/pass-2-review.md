# Pass 2 — Self-review

> Sent as the second user message after Pass 1's response.

---

Now audit your 7 candidates against the system-prompt rules. For each candidate, check:

## Audit checklist

### Trivia check
> Could a PM answer this by ctrl-F searching the source transcript?
- If yes → **drop or rewrite** the candidate.

### First-person scope check
> Is the scenario framed as the reader's own work ("you," "your team," "your week"), and does the correct answer describe an action the PM can take in their next workday?
- If the scenario is third-person commentary about another PM, an org, or a hiring committee → **rewrite** to make it first-person.
- If the correct answer is an opinion or strategic claim rather than an action → **rewrite** to make it actionable.

### PM-agency check
> Does the question test a decision the PM actually controls?
- Bad subjects (drop or rewrite): hiring engineers, redesigning the org, removing company-wide processes, what the founder/VP should decide.
- Good subjects: how the PM allocates their own time, what they put in or remove from their next PRD, what they say in their next 1:1, what surface they champion shipping next, what they personally study or use this week.

### Takeaway check
> Does each kept question have a `pm_takeaway` that names *one specific change the PM will make in their work this week*?
- A takeaway like "the operator's framework is X" is a paraphrase of the explanation, not a takeaway. **Rewrite** to be action-centered.

### Distractor coverage
> Do the four options cover roles `correct + mistake + half_truth + adjacent`?
- If a role is missing or two options play the same role → **drop or rewrite**.
- A weak distractor (obvious, silly, or duplicating another option) is grounds to drop.

### Citation grounding
> Does `citation.quote_excerpt`:
> 1. Appear verbatim in the source excerpts you were given?
> 2. State the framework that makes the `correct` option correct (not a tangent or a definition)?
- If the excerpt isn't grounded in what makes the answer correct → **rewrite the citation**.

### Setup leak
> Does the `correct` option's distinctive phrasing appear in the scenario?
- If a unique phrase from the correct answer is in the scenario → **rewrite either**.

### Distinctness (within-idea)
> Do any two candidates test the same concept or framework?
- If yes → keep the stronger one; drop the weaker.

### Coverage breadth (across the thesis brief)
> Do your kept 5 questions cover at least **4 distinct `idea_id`s** from your Pass 0 thesis brief?
- If you've concentrated on 1-2 ideas, drop the redundant questions and revise to span more of the brief.
- Is the source's `central_tension` detectable from the question set as a whole? A PM taking the quiz should sense the operator's contrast.
- If only 3 ideas are covered and the source has more, you've underused the brief — revise.

### Archetype variety
> Are five distinct archetypes represented across your kept 5?
- Match if the source supports it. It's acceptable to repeat one archetype if the source genuinely warrants it.
- *Note:* archetype variety is secondary to **idea variety**. A quiz with 5 different archetypes all testing the same idea is worse than a quiz with 2 repeated archetypes spanning 5 different ideas.

### Length bounds
> Scenario ≤ 120 words, options ≤ 25 each, explanation ≤ 2 sentences, quote_excerpt ≤ 280 chars.
- Trim if over.

## Your task — Pass 2

1. Apply the audit. Drop the 2 weakest candidates and (if needed) revise the remaining 5.
2. Output the complete JSON object — same shape as Pass 1, but with `candidates` containing exactly **5 questions** in their kept-and-revised form.
3. Populate `self_review_concerns` with a short array of strings describing:
   - Any concern you couldn't fully resolve (e.g., "Q3 still relies somewhat on source-specific phrasing")
   - Any source limitation that affected question quality (e.g., "source mostly anecdotal; few crisp frameworks to test")
   - Empty array if no concerns.

Do not edit the headline, digest, or takeaways from Pass 1 unless rewriting a question forced a related change.

Begin.
