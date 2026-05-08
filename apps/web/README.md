# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.15.3 create --template minimal --types ts --install pnpm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Local development

```bash
cd apps/web
pnpm install
pnpm exec wrangler d1 migrations apply pm-daily --local   # one-time
pnpm dev                                                   # starts at :5173
curl -X POST http://localhost:5173/api/_dev/seed           # seeds today's content
```

Then open `http://localhost:5173/` to see the landing page. Sign-in flows
require `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and `RESEND_API_KEY`
in `apps/web/.dev.vars` — see `.env.example`. With an empty `RESEND_API_KEY`,
magic links are logged to the dev server console instead of sent.

The seed endpoint defaults to today's UTC date; pass
`?date=YYYY-MM-DD` to seed a specific day if a matching JSON file exists
under `content/`.

## Cloudflare resource IDs

Before first deploy, run:

```bash
wrangler d1 create pm-daily               # → copy database_id into wrangler.toml
wrangler kv namespace create pm-daily-kv  # → copy id into wrangler.toml
wrangler vectorize create lennys_metadata --dimensions=1024 --metric=cosine
```
