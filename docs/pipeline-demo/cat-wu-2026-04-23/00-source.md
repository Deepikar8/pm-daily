# Pass 0 input — source metadata + excerpts

## Source metadata

```yaml
filename: podcasts/cat-wu.md
title: "How Anthropic's product team moves faster than anyone else | Cat Wu (Head of Product, Claude Code)"
type: podcast
byline: Cat Wu
date: 2026-04-23
tags: [leadership, ai, design, engineering, product-management, go-to-market]
description: >
  How Anthropic's product team moves faster than anyone else, covering
  team leadership, AI product work, and product design.
word_count: 16271
source_url: ""    # MCP returned empty; fallback search URL used downstream
```

## Excerpts fetched via `mcp__lennysdata__read_excerpt`

Five queries were run against `podcasts/cat-wu.md` to gather context for the
4-pass pipeline. These are the actual MCP responses captured during the
spec session — verbatim, single-source-of-truth for the citation
literal-match validator (Pass 3).

### Excerpt 1 — query: `barriers|barrier`

> ...00:00:00): I think it is very hard to be the right amount of AGI-pilled. It's very easy to build the product for the super AGI strong model. The hard thing is figuring out for the current model, how do you elicit the maximum capability?  **Lenny Rachitsky** (00:00:13): I've never seen anything like the pace folks at Anthropic are shipping at.  **Cat Wu** (00:00:17): We want to remove every single barrier to shipping things. The timelines for a lot of our product features have gone down from six month to one month and sometimes to even one day.  **Lenny Rachitsky** (00:00:27): You're interviewing hundreds of PMs and you just keep feeling like they're approaching it very incorrectly.  **Cat Wu** (00:00:32): The PM role is changing a lot. It's changing really quickly. The thing that is extremely imp...

### Excerpt 2 — query: `product taste|taste`

> ...use it's hard to keep up. What's your take there? Do you feel like there'll be an increase in hiring of PMs? What do you think is going on with the PM profession long-term?  **Cat Wu** (00:16:15): I think all of the roles are merging. PMs are doing some engineering work, engineers are doing PM work, designers are PMing and also landing code. You can either hire a lot more engineers who have great product taste, or you can keep your engineering hiring the same and hire a lot more PMs to help guide some of their work. On our team, we're pretty focused on hiring engineers with great product taste. This way, we can reduce the amount of overhead for shipping any product. There are many engineers on our team who are fully able to end to end go from see user feedback on Twitter through to ship a product at the end of the week with almost no product involvement. And this I think is actually the most efficient way to ship something.  **Cat Wu** (00:17:05): So I think engineer and PM are kind of overlapping and you will get a lot of benefit from having more of either. I think product taste is still a very rare skill to have, and we'll pretty much hire anyone who we feel has demonstrated this strongly...

### Excerpt 3 — query: `timeline|six months`

> ...slower rate, there was a lot more emphasis on coordinating with all the other partner teams to make sure that their shipping features that unblock your features because code at that time was very expensive to make. I think now with AI and with how much that has accelerated engineering and with how quickly the model capabilities are improving, the timelines for a lot of our product features have gone down from six month to one month and sometimes to one week or even one day. And with that, we actually need to make sure that products ship quite quickly.  **Cat Wu** (00:05:49): And what that means is as a PM, there should be less emphasis on making sure that you're aligning your multi-quarter roadmaps...

### Excerpt 4 — query: `PM role|PMs are`

> ...nthropic are shipping at.  **Cat Wu** (00:00:17): We want to remove every single barrier to shipping things. The timelines for a lot of our product features have gone down from six month to one month and sometimes to even one day.  **Lenny Rachitsky** (00:00:27): You're interviewing hundreds of PMs and you just keep feeling like they're approaching it very incorrectly.  **Cat Wu** (00:00:32): The PM role is changing a lot. It's changing really quickly. The thing that is extremely important for building AI-native products is iterating so quickly, figuring out a way for you to actually launch features every single week.  **Lenny Rachitsky** (00:00:44): What do you think are the emerging skills PMs need to develop?  **Cat Wu** (00:00:48): It comes back to product taste. As code becomes much cheaper...

### Excerpt 5 — query: `multi-quarter|roadmap`

> ...and with how quickly the model capabilities are improving, the timelines for a lot of our product features have gone down from six month to one month and sometimes to one week or even one day. And with that, we actually need to make sure that products ship quite quickly.  **Cat Wu** (00:05:49): And what that means is as a PM, there should be less emphasis on making sure that you're aligning your multi-quarter roadmaps with your partner teams and more emphasis on, okay, how can we figure out the fastest way to get something out the door? How can we figure out how to make a concept corner of our product suite where we can just... An engineer has an idea or a PM has an idea, and by the end of the week, we are able to get into our user's hands. I think the PMs who do the best on AI-native products are the ones wh...

---

These five excerpts are the **only** source material the pipeline sees.
All citations in the final JSON must be verbatim substrings of one of
these excerpts (Pass 3 enforces this). If you spot a citation in the
final JSON that doesn't appear above, the pipeline failed.
