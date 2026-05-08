# Pass 1 — Generate

> Sent as the user message after Pass 0 (thesis brief).

---

You produced a thesis brief in Pass 0. Now use it to guide question generation.

## Coverage constraint (hard)

- Generate **7 candidate questions** distributed across **distinct ideas** from your thesis brief.
- **No more than 2 questions per idea**, even if one idea is the most quotable.
- Strive for at least 5 distinct ideas tested across your 7 candidates.
- Prefer **central** and **secondary** ideas from the brief; touch a **mentioned** idea only if it has an interesting applied angle.
- The **central_tension** from the brief should be detectable across the question set — a PM taking the quiz should walk away with the operator's contrast clearly in mind.

## Source recap

The same source metadata and excerpts you saw in Pass 0 are still your only ground truth. Do not invent content not supported by the excerpts.

(Source metadata, excerpts, and your thesis brief from Pass 0 remain in context.)

## Your task — Pass 1

1. Write the **headline** (operator + angle — the angle should reflect the central tension, not just the most quotable phrase).
2. Write the **5-minute digest** in markdown — distill the operator's actual position across multiple ideas from the brief, not just one. Use mostly third person describing what the operator advocates.
3. Write **3-5 key takeaways** as crisp bullets, each tied to a distinct idea.
4. Generate **7 candidate questions** following:
   - The coverage constraint above (distinct ideas, max 2 per idea)
   - The system prompt's archetype, distractor, anti-trivia, and length rules
5. For each candidate, include the `idea_id` it tests (matches an `id` from your thesis brief). This makes the coverage check trivial in Pass 2.
6. For each candidate, label every option with its `role` (correct / mistake / half_truth / adjacent).
7. For each candidate's citation, choose a passage from the excerpts that grounds the framework underlying the correct answer. Copy the passage **verbatim** as `quote_excerpt`; trim to ≤280 chars at sentence boundaries when needed.

Output the complete JSON object — extending the shape from the system prompt with a top-level `central_tension` (carried over from your brief) and per-question `idea_id`. Do not include `self_review_concerns` yet — that field belongs to Pass 2.

Begin.
