# PM Daily

Daily learning sessions + applied quiz + leaderboard for product managers,
distilled from Lenny Rachitsky's podcast and newsletter archive.

**Live:** https://pm-daily.avalanche05.workers.dev

## Repository layout

- `apps/web` — SvelteKit web app on Cloudflare Workers (D1, KV, Durable Objects, cron)
- `scripts` — Nightly content pipeline (Plan A — not yet implemented)
- `prompts/question-generation` — Versioned Claude prompts for the daily content generator
- `docs/superpowers/specs` — Design spec (one canonical doc)
- `docs/superpowers/plans` — Implementation plans (web app, content pipeline, design remediation)
- `mockups` — Static HTML design references (canonical UI, palette comparison)
- `lenny-daily-quiz.jsx` — React reference component for the canonical aesthetic
- `preview.html` — Standalone browser preview of the reference component (Babel + esm.sh)

## Tech stack

SvelteKit 2 (Svelte 5 runes mode) · Tailwind v3 · Drizzle ORM · Better Auth (magic link + Google OAuth) · Lucide icons · Cloudflare Workers + D1 + KV + Durable Objects + cron · Vitest + Playwright

## Source material

Quiz questions, digests, and takeaways are derivative summaries
generated from Lenny Rachitsky's archive (podcasts and newsletter
posts). Original sources retain their rights; this repository contains
no full episodes or full posts. Excerpt quotations used in question
citations are short (≤280 characters) and attributable, with direct
links back to the original.

This is a personal hackathon submission and is not officially
affiliated with Lenny's Newsletter.

## Local development

```bash
cd apps/web
pnpm install
pnpm exec wrangler d1 migrations apply pm-daily --local   # one-time
pnpm dev                                                  # starts at :5173
curl -X POST http://localhost:5173/api/_dev/seed          # seeds today's content
```

Then open `http://localhost:5173/`. Sign-in flows require
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and `RESEND_API_KEY` in
`apps/web/.dev.vars` — see `.env.example`.

## Cloudflare resource IDs (for forks)

The committed `apps/web/wrangler.toml` references account-scoped resource
IDs from the original deployment. Forks should run:

```bash
wrangler d1 create pm-daily               # → copy database_id
wrangler kv namespace create pm-daily-kv  # → copy id
wrangler vectorize create lennys_metadata --dimensions=1024 --metric=cosine
```

…and replace the IDs in `wrangler.toml` accordingly.

## Deploy

```bash
cd apps/web
pnpm build && pnpm exec wrangler deploy
```

Worker secrets (set via `wrangler secret put`):
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`.
</content>
