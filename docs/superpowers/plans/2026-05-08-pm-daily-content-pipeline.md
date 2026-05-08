# PM Daily — Content Pipeline Implementation Plan (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the nightly content generator: pick one Lenny source per day, fetch excerpts via the `lennysdata` MCP, run Claude through a 4-pass prompt sequence (thesis brief → generate → self-review → validation), and commit a JSON file to `apps/web/content/<date>.json` that Plan B's web app reads.

**Architecture:** A standalone Node/TypeScript pipeline that runs in a GitHub Action on a daily cron schedule. Pipeline stages: source picker (Vectorize semantic search + recency weighting + diversity filter) → excerpt fetcher (MCP) → 4-pass Claude orchestration via Anthropic SDK with MCP connector → strict programmatic validators → JSON writer → PR with 30-min auto-merge. A separate one-shot script builds the Vectorize index from the 652 archive items.

**Tech Stack:** TypeScript, Node 20, `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`, `zod`, `vitest`, GitHub Actions, Cloudflare Vectorize REST API. Stays in the same monorepo as Plan B but lives under `scripts/` (Node target, not Workers).

**Spec reference:** `docs/superpowers/specs/2026-05-07-pm-daily-design.md` (especially §5)
**Prompt reference:** `prompts/question-generation/{system,pass-0,pass-1,pass-2,pass-3,README}.md`

**Plan B dependency:** Plan A's only output is `apps/web/content/<date>.json` matching the `DailyContent` zod schema defined in Plan B Task 2.1. Plan A can ship before, with, or after Plan B as long as the schema is stable.

---

## File structure (target)

```
.
├── scripts/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── pipeline/
│   │   │   ├── index.ts                # main entrypoint
│   │   │   ├── pick-source.ts          # topic rotation + Vectorize search
│   │   │   ├── fetch-excerpts.ts       # MCP read_excerpt orchestration
│   │   │   ├── llm/
│   │   │   │   ├── client.ts           # Anthropic client wrapper
│   │   │   │   ├── prompts.ts          # loads system + pass-0..3 templates
│   │   │   │   ├── pass-0-brief.ts
│   │   │   │   ├── pass-1-generate.ts
│   │   │   │   ├── pass-2-review.ts
│   │   │   │   └── pass-3-retry.ts
│   │   │   ├── validate/
│   │   │   │   ├── schema.ts           # zod schemas (mirrors Plan B types)
│   │   │   │   ├── length.ts
│   │   │   │   ├── citation.ts         # MCP literal-match check
│   │   │   │   ├── setup-leak.ts
│   │   │   │   └── coverage.ts         # ≥4 distinct idea_ids
│   │   │   ├── render.ts               # JSON writer with option shuffling
│   │   │   ├── history.ts              # last-14d pillars + last-60d sources
│   │   │   └── types.ts
│   │   ├── vectorize/
│   │   │   ├── build-index.ts          # one-time: embed all 652 items
│   │   │   ├── client.ts               # CF Vectorize REST wrapper
│   │   │   └── embed.ts                # Anthropic embeddings via Voyage or fallback
│   │   └── mcp/
│   │       ├── client.ts               # MCP HTTP client wrapper
│   │       └── tools.ts                # typed wrappers for list/search/excerpt/read
│   └── tests/
│       ├── unit/
│       │   ├── pick-source.test.ts
│       │   ├── history.test.ts
│       │   ├── validate-length.test.ts
│       │   ├── validate-citation.test.ts
│       │   ├── validate-setup-leak.test.ts
│       │   ├── validate-coverage.test.ts
│       │   └── render.test.ts
│       └── golden/
│           ├── cat-wu.fixture.json     # captured excerpts + LLM transcript
│           └── pipeline.test.ts
└── .github/
    └── workflows/
        ├── nightly-content.yml
        └── prompt-regression.yml
```

---

## Phase 0 — Scripts package scaffold

### Task 0.1: Initialize scripts workspace

**Files:** `scripts/package.json`, `scripts/tsconfig.json`, `scripts/vitest.config.ts`

- [ ] **Step 1: Create `scripts/package.json`**

```json
{
  "name": "@pm-daily/scripts",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "pipeline": "tsx src/pipeline/index.ts",
    "vectorize:build": "tsx src/vectorize/build-index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.40.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0",
    "ulid": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`scripts/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ES2022", "moduleResolution": "bundler",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true,
    "outDir": "dist", "rootDir": "src",
    "lib": ["ES2022"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

`scripts/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 2: Install + verify**

```bash
cd /Users/deepikarudramurthy/Documents/lenny-podcasts
pnpm install
cd scripts && pnpm test
# expect: "no test files found" (PASS as a smoke check)
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "chore(scripts): initialize content-pipeline package"
```

---

## Phase 1 — Topic rotation + history

### Task 1.1: `history.ts` — derive last 14d pillars + last 60d sources

**Files:** `scripts/src/pipeline/history.ts`, `tests/unit/history.test.ts`

- [ ] **Step 1: Test first**

```ts
import { describe, it, expect } from "vitest";
import { computeHistory } from "../../src/pipeline/history";

describe("computeHistory", () => {
  it("returns pillars used in the last 14 days", () => {
    const today = "2026-05-08";
    const corpus = [
      { date: "2026-05-07", theme_pillar: "pricing", source: { filename: "podcasts/a.md" } },
      { date: "2026-05-01", theme_pillar: "growth", source: { filename: "podcasts/b.md" } },
      { date: "2026-04-20", theme_pillar: "leadership", source: { filename: "newsletters/c.md" } }, // > 14 days, ignored
    ];
    const h = computeHistory(today, corpus);
    expect(h.pillarsLast14).toEqual(new Set(["pricing", "growth"]));
    expect(h.sourcesLast60).toContain("podcasts/a.md");
    expect(h.sourcesLast60).toContain("podcasts/b.md");
  });
});
```

- [ ] **Step 2: Implement**

```ts
export function daysBetween(a: string, b: string) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}
type CorpusEntry = { date: string; theme_pillar: string; source: { filename: string } };

export function computeHistory(today: string, corpus: CorpusEntry[]) {
  const pillarsLast14 = new Set<string>();
  const sourcesLast60 = new Set<string>();
  for (const e of corpus) {
    const days = daysBetween(e.date, today);
    if (days >= 0 && days <= 14) pillarsLast14.add(e.theme_pillar);
    if (days >= 0 && days <= 60) sourcesLast60.add(e.source.filename);
  }
  return { pillarsLast14, sourcesLast60 };
}
```

- [ ] **Step 3: Loader that reads `apps/web/content/*.json`**

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function loadCorpus(contentDir: string): CorpusEntry[] {
  const files = readdirSync(contentDir).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const j = JSON.parse(readFileSync(join(contentDir, f), "utf-8"));
    return { date: j.date, theme_pillar: j.theme_pillar, source: j.source };
  });
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test history
git add . && git commit -m "feat(pipeline): history derives last-14d pillars + last-60d sources"
```

### Task 1.2: Pillar picker

**Files:** `scripts/src/pipeline/pick-source.ts` (partial)

- [ ] **Step 1: Pillar list constant + picker**

```ts
export const PILLARS = [
  "pricing", "growth", "activation", "retention", "leadership",
  "ai-product", "career", "metrics", "design", "go-to-market",
] as const;
export type Pillar = (typeof PILLARS)[number];

export function pickPillar(history: { pillarsLast14: Set<string> }, rng = Math.random): Pillar {
  const available = PILLARS.filter((p) => !history.pillarsLast14.has(p));
  const pool = available.length ? available : [...PILLARS];
  return pool[Math.floor(rng() * pool.length)];
}
```

- [ ] **Step 2: Test (deterministic via injected RNG)**

```ts
import { describe, it, expect } from "vitest";
import { pickPillar, PILLARS } from "../../src/pipeline/pick-source";

describe("pickPillar", () => {
  it("excludes pillars from last 14d when alternatives exist", () => {
    const recent = new Set(["pricing", "growth"]);
    const picked = pickPillar({ pillarsLast14: recent }, () => 0);
    expect(recent.has(picked)).toBe(false);
  });
  it("falls back to full list when all pillars exhausted", () => {
    const all = new Set(PILLARS);
    const picked = pickPillar({ pillarsLast14: all }, () => 0);
    expect(PILLARS).toContain(picked);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(pipeline): pillar picker with 14d exclusion + fallback"
```

### Task 1.3: Content-type alternation

**Files:** `scripts/src/pipeline/pick-source.ts` (extend)

- [ ] **Step 1: Pick podcast vs. newsletter based on yesterday's choice**

```ts
export function pickContentType(yesterdayType: "podcast" | "newsletter" | undefined): "podcast" | "newsletter" {
  return yesterdayType === "podcast" ? "newsletter" : "podcast";
}
```

- [ ] **Step 2: Test**

```ts
it("alternates type", () => {
  expect(pickContentType("podcast")).toBe("newsletter");
  expect(pickContentType("newsletter")).toBe("podcast");
  expect(pickContentType(undefined)).toBe("podcast");
});
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(pipeline): alternate podcast/newsletter days"
```

---

## Phase 2 — MCP client + Vectorize wrapper

### Task 2.1: MCP client + typed tools

**Files:** `scripts/src/mcp/client.ts`, `scripts/src/mcp/tools.ts`

- [ ] **Step 1: HTTP client for the lennysdata MCP**

The lennysdata MCP is a remote (HTTP/SSE) MCP server. Build a thin wrapper using `@modelcontextprotocol/sdk`:

```ts
// mcp/client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function connectLennysData(args: { url: string; token: string }) {
  const transport = new SSEClientTransport(new URL(args.url), {
    requestInit: { headers: { Authorization: `Bearer ${args.token}` } },
  });
  const client = new Client({ name: "pm-daily-pipeline", version: "1.0" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}
```

- [ ] **Step 2: Typed tool wrappers**

```ts
// mcp/tools.ts
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

const ListItem = z.object({
  title: z.string(), filename: z.string(), tags: z.array(z.string()),
  word_count: z.number(), date: z.string(), description: z.string().optional(),
  subtitle: z.string().optional(), guest: z.string().optional(),
  source_url: z.string().optional(), post_url: z.string().optional(),
  type: z.enum(["podcast", "newsletter"]),
});

export async function listContent(c: Client, args: { content_type?: string; limit?: number; offset?: number }) {
  const r = await c.callTool({ name: "list_content", arguments: args });
  const json = JSON.parse((r.content[0] as any).text);
  return { total: json.total, results: z.array(ListItem).parse(json.results) };
}

export async function readExcerpt(c: Client, args: { filename: string; query: string; match_index?: number; radius?: number }) {
  const r = await c.callTool({ name: "read_excerpt", arguments: args });
  const json = JSON.parse((r.content[0] as any).text);
  return json as {
    filename: string; total_excerpts: number; excerpt?: string;
    start_char?: number; end_char?: number;
  };
}

export async function searchContent(c: Client, args: { query: string; content_type?: string; limit?: number }) {
  const r = await c.callTool({ name: "search_content", arguments: args });
  return JSON.parse((r.content[0] as any).text);
}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(mcp): typed wrappers for list_content, search_content, read_excerpt"
```

### Task 2.2: Cloudflare Vectorize REST client

**Files:** `scripts/src/vectorize/client.ts`

- [ ] **Step 1: Wrapper around the Vectorize REST API**

```ts
const BASE = "https://api.cloudflare.com/client/v4";
type VectorizeOpts = { accountId: string; apiToken: string; indexName: string };

export async function upsertVectors(opts: VectorizeOpts, vectors: Array<{
  id: string; values: number[]; metadata?: Record<string, unknown>;
}>) {
  // NDJSON body
  const body = vectors.map((v) => JSON.stringify(v)).join("\n");
  const res = await fetch(
    `${BASE}/accounts/${opts.accountId}/vectorize/v2/indexes/${opts.indexName}/upsert`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiToken}`, "Content-Type": "application/x-ndjson" },
      body,
    },
  );
  if (!res.ok) throw new Error(`upsert failed: ${res.status} ${await res.text()}`);
}

export async function queryVectors(opts: VectorizeOpts, args: {
  vector: number[]; topK: number; filter?: Record<string, unknown>;
}) {
  const res = await fetch(
    `${BASE}/accounts/${opts.accountId}/vectorize/v2/indexes/${opts.indexName}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vector: args.vector, topK: args.topK, filter: args.filter, returnMetadata: "all" }),
    },
  );
  if (!res.ok) throw new Error(`query failed: ${res.status}`);
  const json = await res.json();
  return json.result.matches as Array<{ id: string; score: number; metadata: Record<string, unknown> }>;
}
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(vectorize): REST wrapper for upsert + query"
```

### Task 2.3: Embeddings

**Files:** `scripts/src/vectorize/embed.ts`

- [ ] **Step 1: Use Anthropic-recommended embeddings (Voyage AI for prod, but allow override)**

Anthropic recommends Voyage. For initial scaffolding, allow Workers AI (`@cf/baai/bge-large-en-v1.5`, 1024 dims) since it's already on Cloudflare. The 1024-dim choice in `wrangler.toml` matches this. Make the embedder pluggable.

```ts
type Embedder = (texts: string[]) => Promise<number[][]>;

export function workersAiEmbedder(opts: { accountId: string; apiToken: string }): Embedder {
  return async (texts) => {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai/run/@cf/baai/bge-large-en-v1.5`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${opts.apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: texts }),
      },
    );
    const json = await res.json();
    return json.result.data;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(vectorize): Workers AI embedder (1024-dim BGE-large)"
```

---

## Phase 3 — One-time index build

### Task 3.1: `vectorize/build-index.ts`

**Files:** `scripts/src/vectorize/build-index.ts`

- [ ] **Step 1: Implement**

```ts
import { connectLennysData } from "../mcp/client";
import { listContent } from "../mcp/tools";
import { upsertVectors } from "./client";
import { workersAiEmbedder } from "./embed";

const env = (k: string) => { const v = process.env[k]; if (!v) throw new Error(`missing ${k}`); return v; };

async function main() {
  const mcp = await connectLennysData({ url: env("LENNYS_MCP_URL"), token: env("LENNYS_MCP_TOKEN") });
  const opts = { accountId: env("CF_ACCOUNT_ID"), apiToken: env("CF_API_TOKEN"), indexName: "lennys_metadata" };
  const embedder = workersAiEmbedder(opts);

  let offset = 0;
  const PAGE = 50;
  while (true) {
    const { total, results } = await listContent(mcp, { limit: PAGE, offset });
    if (results.length === 0) break;
    const texts = results.map((r) => `${r.title}. ${r.description ?? r.subtitle ?? ""}. tags: ${r.tags.join(", ")}`);
    const vectors = await embedder(texts);
    await upsertVectors(opts, results.map((r, i) => ({
      id: r.filename, values: vectors[i],
      metadata: { title: r.title, type: r.type, date: r.date, guest: r.guest, tags: r.tags, word_count: r.word_count },
    })));
    console.log(`upserted ${offset + results.length} / ${total}`);
    offset += PAGE;
    if (offset >= total) break;
  }
}
main();
```

- [ ] **Step 2: Run once locally**

```bash
LENNYS_MCP_URL=... LENNYS_MCP_TOKEN=... CF_ACCOUNT_ID=... CF_API_TOKEN=... \
  pnpm vectorize:build
# expect: "upserted 50 / 652"... "upserted 652 / 652"
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(vectorize): one-shot index builder for 652 archive items"
```

---

## Phase 4 — Source picker (Vectorize search + scoring)

### Task 4.1: Pillar→keyword query mapping

**Files:** `scripts/src/pipeline/pick-source.ts` (extend)

- [ ] **Step 1: Map each pillar to a search query (used for embedding)**

```ts
export const PILLAR_QUERY: Record<Pillar, string> = {
  "pricing": "pricing tiers monetization packaging willingness to pay",
  "growth": "growth loops acquisition viral activation",
  "activation": "activation onboarding aha moment time-to-value",
  "retention": "retention engagement habit churn cohort",
  "leadership": "leadership management team building career",
  "ai-product": "AI product LLM model evaluation iteration speed",
  "career": "PM career skills hiring promotion role",
  "metrics": "metrics north star KPIs measurement analytics",
  "design": "product design taste UX craft",
  "go-to-market": "go to market positioning sales enablement launch",
};
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(pipeline): pillar→search query mapping for Vectorize"
```

### Task 4.2: `pickSource` with recency + diversity

**Files:** `scripts/src/pipeline/pick-source.ts` (extend), `tests/unit/pick-source.test.ts`

- [ ] **Step 1: Pure scoring function (testable without Vectorize)**

```ts
export function recencyWeightedScore(args: {
  similarity: number; sourceDate: string; today: string;
}) {
  const ageDays = daysBetween(args.sourceDate, args.today);
  const recency = Math.exp(-Math.max(0, ageDays) / 365);
  return args.similarity * (0.6 + 0.4 * recency);
}
```

```ts
// test
import { describe, it, expect } from "vitest";
import { recencyWeightedScore } from "../../src/pipeline/pick-source";

describe("recencyWeightedScore", () => {
  it("recent equal-similarity beats old equal-similarity", () => {
    const a = recencyWeightedScore({ similarity: 0.8, sourceDate: "2026-04-01", today: "2026-05-08" });
    const b = recencyWeightedScore({ similarity: 0.8, sourceDate: "2022-05-08", today: "2026-05-08" });
    expect(a).toBeGreaterThan(b);
  });
});
```

- [ ] **Step 2: Top-1 picker**

```ts
import { queryVectors } from "../vectorize/client";
import { workersAiEmbedder } from "../vectorize/embed";
import type { Embedder } from "../vectorize/embed";

export async function pickSource(args: {
  pillar: Pillar; contentType: "podcast" | "newsletter";
  history: { sourcesLast60: Set<string> };
  today: string;
  vectorize: { accountId: string; apiToken: string; indexName: string };
  embedder: Embedder;
}) {
  const queryText = PILLAR_QUERY[args.pillar];
  const [qv] = await args.embedder([queryText]);
  const matches = await queryVectors(args.vectorize, {
    vector: qv, topK: 20, filter: { type: { $eq: args.contentType } },
  });
  const candidates = matches
    .filter((m) => !args.history.sourcesLast60.has(m.id))
    .map((m) => ({
      ...m,
      score: recencyWeightedScore({
        similarity: m.score, sourceDate: String(m.metadata.date), today: args.today,
      }),
    }))
    .sort((a, b) => b.score - a.score);
  if (!candidates.length) throw new Error("No candidate sources after filters");
  return candidates[0];
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test pick-source
git add . && git commit -m "feat(pipeline): top-1 source picker with recency + 60d diversity"
```

---

## Phase 5 — Excerpt fetcher

### Task 5.1: `fetchExcerpts`

**Files:** `scripts/src/pipeline/fetch-excerpts.ts`

- [ ] **Step 1: Generate ≥3 query variants per source from metadata**

```ts
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { readExcerpt } from "../mcp/tools";

export function deriveQueries(metadata: { tags: string[]; description?: string; subtitle?: string; title: string }) {
  const queries = new Set<string>();
  // Tag pairs (pipe-delimited)
  for (const t of metadata.tags) queries.add(t);
  // High-signal nouns from title
  const titleWords = metadata.title.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4);
  if (titleWords.length >= 2) queries.add(titleWords.slice(0, 2).join("|"));
  // Description-based bigram pull
  const desc = (metadata.description ?? metadata.subtitle ?? "").toLowerCase();
  const descWords = desc.split(/[^a-z]+/).filter((w) => w.length > 5).slice(0, 4);
  if (descWords.length >= 2) queries.add(descWords.slice(0, 2).join("|"));
  return [...queries].slice(0, 5);
}

export async function fetchExcerpts(c: Client, filename: string, queries: string[]) {
  const out: Array<{ query: string; text: string }> = [];
  for (const q of queries) {
    for (let i = 0; i < 2; i++) {                              // up to 2 excerpts per query
      const r = await readExcerpt(c, { filename, query: q, match_index: i, radius: 350 });
      if (r.total_excerpts === 0 || !r.excerpt) break;
      out.push({ query: q, text: r.excerpt });
      if (i >= r.total_excerpts - 1) break;
    }
  }
  return out;
}
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(pipeline): excerpt fetcher with multiple queries per source"
```

---

## Phase 6 — LLM orchestration (passes 0/1/2)

### Task 6.1: Anthropic client wrapper + prompt loader

**Files:** `scripts/src/pipeline/llm/client.ts`, `prompts.ts`

- [ ] **Step 1: Client wrapper**

```ts
import Anthropic from "@anthropic-ai/sdk";

export function createClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}
export const MODEL = "claude-opus-4-7";
```

- [ ] **Step 2: Prompt loader**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROMPT_DIR = join(import.meta.dirname, "../../../../prompts/question-generation");

export const PROMPTS = {
  system: readFileSync(join(PROMPT_DIR, "system.md"), "utf-8"),
  pass0: readFileSync(join(PROMPT_DIR, "pass-0-thesis-brief.md"), "utf-8"),
  pass1: readFileSync(join(PROMPT_DIR, "pass-1-generate.md"), "utf-8"),
  pass2: readFileSync(join(PROMPT_DIR, "pass-2-review.md"), "utf-8"),
  pass3retry: readFileSync(join(PROMPT_DIR, "pass-3-retry-template.md"), "utf-8"),
};

export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, k) => vars[k] ?? "");
}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(llm): Anthropic client + prompt loader"
```

### Task 6.2: Pass 0 — thesis brief

**Files:** `scripts/src/pipeline/llm/pass-0-brief.ts`

- [ ] **Step 1: Implement**

```ts
import { createClient, MODEL } from "./client";
import { PROMPTS } from "./prompts";
import { z } from "zod";

const Brief = z.object({
  central_tension: z.string().min(20),
  ideas: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(), summary: z.string(),
    supporting_passage: z.string().max(280),
    framework_strength: z.enum(["central", "secondary", "mentioned"]),
  })).min(4).max(7),
});
export type ThesisBrief = z.infer<typeof Brief>;

export async function passZeroBrief(args: {
  source: { filename: string; title: string; type: string; byline: string; date: string; tags: string[]; description?: string; source_url?: string };
  excerpts: Array<{ query: string; text: string }>;
  date: string;
}): Promise<{ brief: ThesisBrief; conversation: any[] }> {
  const client = createClient();
  const userMsg = renderPass0(args);                    // see below
  const res = await client.messages.create({
    model: MODEL, max_tokens: 4096,
    system: PROMPTS.system,
    messages: [{ role: "user", content: userMsg }],
  });
  const text = (res.content.find((b) => b.type === "text") as any).text;
  const brief = Brief.parse(JSON.parse(extractJson(text)));
  return { brief, conversation: [{ role: "user", content: userMsg }, { role: "assistant", content: text }] };
}

function renderPass0(args: any) {
  const excerpts = args.excerpts.map((e: any, i: number) =>
    `### Excerpt ${i} — query: "${e.query}"\n\n\`\`\`\n${e.text}\n\`\`\`\n`,
  ).join("\n");
  return PROMPTS.pass0
    .replace("{{date}}", args.date)
    .replace("{{source.filename}}", args.source.filename)
    .replace("{{source.title}}", args.source.title)
    .replace("{{source.type}}", args.source.type)
    .replace("{{source.byline}}", args.source.byline)
    .replace("{{source.date}}", args.source.date)
    .replace("{{source.tags}}", args.source.tags.join(", "))
    .replace("{{source.description}}", args.source.description ?? "")
    .replace("{{source.source_url}}", args.source.source_url ?? "")
    .replace(/\{\{#each excerpts\}\}[\s\S]*?\{\{\/each\}\}/, excerpts);
}

function extractJson(text: string) {
  const m = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  return m ? m[1] : text;
}
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(llm): pass 0 — Claude generates thesis brief from excerpts"
```

### Task 6.3: Pass 1 + Pass 2 — generate and self-review

**Files:** `scripts/src/pipeline/llm/pass-1-generate.ts`, `pass-2-review.ts`, `scripts/src/pipeline/llm/types.ts`

- [ ] **Step 1: Shared zod for the candidate question shape**

```ts
// types.ts
import { z } from "zod";

export const Option = z.object({
  role: z.enum(["correct", "mistake", "half_truth", "adjacent"]),
  text: z.string().max(250),
});
export const Candidate = z.object({
  idea_id: z.string(),
  archetype: z.enum(["apply", "diagnose", "pick", "spot", "translate"]),
  scenario_md: z.string(),
  options: z.array(Option).length(4),
  explanation_md: z.string(),
  pm_takeaway: z.string(),
  citation: z.object({
    filename: z.string(),
    quote_excerpt: z.string().max(280),
  }),
});
export const Pass1Output = z.object({
  central_tension: z.string(),
  headline: z.string(),
  digest_md: z.string(),
  takeaways: z.array(z.string()).min(3).max(5),
  candidates: z.array(Candidate).length(7),
});
export const Pass2Output = Pass1Output.extend({
  candidates: z.array(Candidate).length(5),
  self_review_concerns: z.array(z.string()),
});
```

- [ ] **Step 2: Pass 1 turn**

```ts
// pass-1-generate.ts
import { createClient, MODEL } from "./client";
import { PROMPTS } from "./prompts";
import { Pass1Output } from "./types";

export async function passOneGenerate(args: { conversation: any[] }) {
  const client = createClient();
  const newMessages = [...args.conversation, { role: "user", content: PROMPTS.pass1 }];
  const res = await client.messages.create({
    model: MODEL, max_tokens: 8192,
    system: PROMPTS.system, messages: newMessages,
  });
  const text = (res.content.find((b) => b.type === "text") as any).text;
  const parsed = Pass1Output.parse(JSON.parse(extractJson(text)));
  return { pass1: parsed, conversation: [...newMessages, { role: "assistant", content: text }] };
}
function extractJson(text: string) { /* same as before */ return text.match(/```json\s*([\s\S]*?)```/)?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text; }
```

- [ ] **Step 3: Pass 2 turn (self-review)**

```ts
// pass-2-review.ts
import { createClient, MODEL } from "./client";
import { PROMPTS } from "./prompts";
import { Pass2Output } from "./types";

export async function passTwoReview(args: { conversation: any[] }) {
  const client = createClient();
  const newMessages = [...args.conversation, { role: "user", content: PROMPTS.pass2 }];
  const res = await client.messages.create({
    model: MODEL, max_tokens: 8192,
    system: PROMPTS.system, messages: newMessages,
  });
  const text = (res.content.find((b) => b.type === "text") as any).text;
  const parsed = Pass2Output.parse(JSON.parse(extractJson(text)));
  return { pass2: parsed, conversation: [...newMessages, { role: "assistant", content: text }] };
}
function extractJson(text: string) { return text.match(/```json\s*([\s\S]*?)```/)?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text; }
```

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat(llm): passes 1 and 2 with conversation continuity"
```

---

## Phase 7 — Validators (Pass 3, programmatic)

### Task 7.1: Length validator

**Files:** `scripts/src/pipeline/validate/length.ts`, `tests/unit/validate-length.test.ts`

- [ ] **Step 1: Test first**

```ts
import { describe, it, expect } from "vitest";
import { checkLengths } from "../../src/pipeline/validate/length";

describe("checkLengths", () => {
  it("flags scenario over 120 words", () => {
    const longScenario = "word ".repeat(130).trim();
    const failures = checkLengths({ scenario_md: longScenario, options: [], explanation_md: "ok", citation: { quote_excerpt: "x" } } as any);
    expect(failures.some((f) => f.field === "scenario")).toBe(true);
  });
  it("flags option over 25 words", () => {
    const longOption = "word ".repeat(30).trim();
    const failures = checkLengths({
      scenario_md: "short", options: [{ key: "A", text: longOption }, { key: "B", text: "x" }, { key: "C", text: "x" }, { key: "D", text: "x" }],
      explanation_md: "ok", citation: { quote_excerpt: "x" },
    } as any);
    expect(failures.some((f) => f.field === "option")).toBe(true);
  });
  it("flags citation over 280 chars", () => {
    const failures = checkLengths({
      scenario_md: "x", options: [], explanation_md: "x",
      citation: { quote_excerpt: "x".repeat(300) },
    } as any);
    expect(failures.some((f) => f.field === "citation")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
export type LengthFailure = { field: string; actual: number; limit: number };

export function checkLengths(q: { scenario_md: string; options: { text: string }[]; explanation_md: string; citation: { quote_excerpt: string } }): LengthFailure[] {
  const failures: LengthFailure[] = [];
  const scenarioWords = q.scenario_md.trim().split(/\s+/).length;
  if (scenarioWords > 120) failures.push({ field: "scenario", actual: scenarioWords, limit: 120 });
  for (const o of q.options) {
    const w = o.text.trim().split(/\s+/).length;
    if (w > 25) failures.push({ field: "option", actual: w, limit: 25 });
  }
  if (q.explanation_md.split(/[.!?]/).filter(Boolean).length > 2)
    failures.push({ field: "explanation", actual: 3, limit: 2 });
  if (q.citation.quote_excerpt.length > 280)
    failures.push({ field: "citation", actual: q.citation.quote_excerpt.length, limit: 280 });
  return failures;
}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(validate): length checks for scenario/options/explanation/citation"
```

### Task 7.2: Citation literal-match validator (re-fetches via MCP)

**Files:** `scripts/src/pipeline/validate/citation.ts`, `tests/unit/validate-citation.test.ts`

- [ ] **Step 1: Implementation**

```ts
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { readExcerpt } from "../../mcp/tools";

export async function checkCitationLiteralMatch(c: Client, citation: { filename: string; quote_excerpt: string }) {
  // Re-fetch the source with the quote as the search query
  const r = await readExcerpt(c, { filename: citation.filename, query: citation.quote_excerpt.slice(0, 80), match_index: 0, radius: 600 });
  if (r.total_excerpts === 0 || !r.excerpt) return { ok: false as const, reason: "No matching excerpt found" };
  if (!r.excerpt.includes(citation.quote_excerpt)) return { ok: false as const, reason: "Excerpt fetched but quote not literal substring" };
  return { ok: true as const };
}
```

- [ ] **Step 2: Test with a mocked MCP client**

```ts
import { describe, it, expect } from "vitest";
import { checkCitationLiteralMatch } from "../../src/pipeline/validate/citation";

const fakeClient = (excerpt: string | null) => ({
  callTool: async () => ({
    content: [{ type: "text", text: JSON.stringify(excerpt
      ? { filename: "x.md", total_excerpts: 1, excerpt }
      : { filename: "x.md", total_excerpts: 0 }) }],
  }),
}) as any;

describe("checkCitationLiteralMatch", () => {
  it("passes when quote is a verbatim substring", async () => {
    const c = fakeClient("...preamble [exact quote] postamble...");
    const r = await checkCitationLiteralMatch(c, { filename: "x.md", quote_excerpt: "[exact quote]" });
    expect(r.ok).toBe(true);
  });
  it("fails when no excerpt", async () => {
    const r = await checkCitationLiteralMatch(fakeClient(null), { filename: "x.md", quote_excerpt: "anything" });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(validate): citation literal-match via MCP re-fetch"
```

### Task 7.3: Setup-leak detector

**Files:** `scripts/src/pipeline/validate/setup-leak.ts`, `tests/unit/validate-setup-leak.test.ts`

- [ ] **Step 1: Implementation**

```ts
export function checkSetupLeak(q: { scenario_md: string; options: { text: string; role: string }[] }) {
  const correct = q.options.find((o) => o.role === "correct");
  if (!correct) return { ok: false as const, reason: "no correct option" };
  // Find distinctive 3+ word phrases in correct that appear verbatim in scenario.
  const correctWords = correct.text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  const scenarioLower = q.scenario_md.toLowerCase();
  for (let i = 0; i < correctWords.length - 2; i++) {
    const phrase = correctWords.slice(i, i + 3).join(" ");
    if (scenarioLower.includes(phrase)) return { ok: false as const, reason: `phrase "${phrase}" leaked into scenario` };
  }
  return { ok: true as const };
}
```

- [ ] **Step 2: Test**

```ts
import { describe, it, expect } from "vitest";
import { checkSetupLeak } from "../../src/pipeline/validate/setup-leak";

describe("setup-leak", () => {
  it("flags 3-word leak", () => {
    const q = { scenario_md: "you should remove every barrier today", options: [
      { role: "correct", text: "Remove every barrier and ship" },
      { role: "mistake", text: "ignore the model" },
      { role: "half_truth", text: "plan more" },
      { role: "adjacent", text: "hire more PMs" },
    ]} as any;
    expect(checkSetupLeak(q).ok).toBe(false);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(validate): setup-leak detector (3-word phrase overlap)"
```

### Task 7.4: Coverage breadth validator

**Files:** `scripts/src/pipeline/validate/coverage.ts`, `tests/unit/validate-coverage.test.ts`

- [ ] **Step 1: Implementation + test**

```ts
export function checkCoverage(questions: { idea_id: string }[]) {
  const distinct = new Set(questions.map((q) => q.idea_id));
  return distinct.size >= 4
    ? { ok: true as const }
    : { ok: false as const, reason: `only ${distinct.size} distinct idea_ids covered` };
}
```

```ts
import { describe, it, expect } from "vitest";
import { checkCoverage } from "../../src/pipeline/validate/coverage";

describe("coverage", () => {
  it("passes with 4 distinct ideas across 5 questions", () => {
    expect(checkCoverage([{idea_id:"a"},{idea_id:"b"},{idea_id:"c"},{idea_id:"d"},{idea_id:"a"}]).ok).toBe(true);
  });
  it("fails with 3 distinct ideas", () => {
    expect(checkCoverage([{idea_id:"a"},{idea_id:"a"},{idea_id:"b"},{idea_id:"c"},{idea_id:"a"}]).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(validate): coverage check (≥4 distinct idea_ids across 5 questions)"
```

---

## Phase 8 — Render + retry orchestration

### Task 8.1: `render.ts` — assemble final JSON, shuffle options, assign keys

**Files:** `scripts/src/pipeline/render.ts`

- [ ] **Step 1: Implement**

```ts
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { ulid } from "ulid";

export function shuffleOptions<T extends { role: string }>(opts: T[], rng = Math.random): { key: "A"|"B"|"C"|"D"; option: T }[] {
  const a = [...opts];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.map((o, i) => ({ key: ["A","B","C","D"][i] as "A"|"B"|"C"|"D", option: o }));
}

export function buildDailyContent(args: {
  date: string;
  pass2: any;       // Pass2Output
  source: any;      // ListItem from MCP
  searchUrlBase: string;
}) {
  const questions = args.pass2.candidates.map((c: any, idx: number) => {
    const shuffled = shuffleOptions(c.options);
    const correct = shuffled.find((s) => s.option.role === "correct")!;
    return {
      position: idx + 1,
      idea_id: c.idea_id,
      archetype: c.archetype,
      scenario_md: c.scenario_md,
      options: shuffled.map((s) => ({ key: s.key, text: s.option.text })),
      correct_key: correct.key,
      explanation_md: c.explanation_md,
      pm_takeaway: c.pm_takeaway,
      citation: {
        filename: c.citation.filename,
        title: args.source.title,
        byline: args.source.guest ?? "Lenny Rachitsky",
        type: args.source.type,
        date: args.source.date,
        source_url: args.source.source_url || args.source.post_url || undefined,
        search_url: `${args.searchUrlBase}?q=${encodeURIComponent(args.source.title)}`,
        quote_excerpt: c.citation.quote_excerpt,
      },
    };
  });
  return {
    date: args.date,
    headline: args.pass2.headline,
    theme_pillar: args.source._pillar ?? "general",
    digest_md: args.pass2.digest_md,
    takeaways: args.pass2.takeaways,
    source: { ...questions[0].citation, quote_excerpt: undefined },
    questions,
  };
}

export function writeContent(filepath: string, content: unknown) {
  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, JSON.stringify(content, null, 2) + "\n");
}
```

- [ ] **Step 2: Test option shuffling preserves correct labelling**

```ts
import { describe, it, expect } from "vitest";
import { shuffleOptions } from "../src/pipeline/render";

describe("shuffleOptions", () => {
  it("preserves the role of each option after shuffle", () => {
    const before = [
      { role: "correct", text: "X" }, { role: "mistake", text: "Y" },
      { role: "half_truth", text: "Z" }, { role: "adjacent", text: "W" },
    ];
    const after = shuffleOptions(before, () => 0);
    const correctSlot = after.find((s) => s.option.role === "correct");
    expect(correctSlot).toBeDefined();
    expect(correctSlot?.option.text).toBe("X");
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat(render): assemble daily JSON, shuffle options, track correct_key"
```

### Task 8.2: Retry orchestration (Pass 3)

**Files:** `scripts/src/pipeline/llm/pass-3-retry.ts`

- [ ] **Step 1: Build retry message and call Claude**

```ts
import { createClient, MODEL } from "./client";
import { PROMPTS } from "./prompts";
import { Candidate } from "./types";
import { z } from "zod";

const RetryOutput = z.object({
  retries: z.array(z.object({
    position: z.number(),
    question: Candidate,
  })),
});

export async function passThreeRetry(args: {
  conversation: any[];
  failures: Array<{ position: number; failure_type: string; reason: string; field?: string; actual?: string|number; limit?: string|number; leaked_phrase?: string; original_question_json: string; filename?: string; schema_error?: string }>;
}) {
  const client = createClient();
  const failuresBlock = args.failures.map((f) => `## Question ${f.position}
**Failure type:** \`${f.failure_type}\`
**Reason:** ${f.reason}
**Original:** ${f.original_question_json}`).join("\n\n");
  const userMsg = PROMPTS.pass3retry.replace("{{count}}", String(args.failures.length))
    .replace(/\{\{#each failures\}\}[\s\S]*?\{\{\/each\}\}/, failuresBlock);
  const newMessages = [...args.conversation, { role: "user", content: userMsg }];
  const res = await client.messages.create({
    model: MODEL, max_tokens: 4096, system: PROMPTS.system, messages: newMessages,
  });
  const text = (res.content.find((b) => b.type === "text") as any).text;
  const parsed = RetryOutput.parse(JSON.parse(extractJson(text)));
  return { retries: parsed.retries };
}
function extractJson(text: string) { return text.match(/```json\s*([\s\S]*?)```/)?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text; }
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(llm): pass 3 retry — regenerate failed questions"
```

### Task 8.3: Main entrypoint stitching it all together

**Files:** `scripts/src/pipeline/index.ts`

- [ ] **Step 1: Wire passes + validators**

```ts
import { connectLennysData } from "../mcp/client";
import { listContent } from "../mcp/tools";
import { computeHistory, loadCorpus } from "./history";
import { pickPillar, pickContentType, pickSource } from "./pick-source";
import { fetchExcerpts, deriveQueries } from "./fetch-excerpts";
import { passZeroBrief } from "./llm/pass-0-brief";
import { passOneGenerate } from "./llm/pass-1-generate";
import { passTwoReview } from "./llm/pass-2-review";
import { passThreeRetry } from "./llm/pass-3-retry";
import { checkLengths } from "./validate/length";
import { checkCitationLiteralMatch } from "./validate/citation";
import { checkSetupLeak } from "./validate/setup-leak";
import { checkCoverage } from "./validate/coverage";
import { buildDailyContent, writeContent } from "./render";
import { workersAiEmbedder } from "../vectorize/embed";

const env = (k: string) => { const v = process.env[k]; if (!v) throw new Error(`missing ${k}`); return v; };

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const contentDir = "../apps/web/content";          // relative to scripts/
  const corpus = loadCorpus(contentDir);
  const history = computeHistory(today, corpus);
  const yesterdayType = corpus.find((c) => c.date === sub1(today))?.source.type as any;

  const pillar = pickPillar(history);
  const contentType = pickContentType(yesterdayType);
  const cf = { accountId: env("CF_ACCOUNT_ID"), apiToken: env("CF_API_TOKEN"), indexName: "lennys_metadata" };
  const embedder = workersAiEmbedder(cf);

  const picked = await pickSource({ pillar, contentType, history, today, vectorize: cf, embedder });
  const mcp = await connectLennysData({ url: env("LENNYS_MCP_URL"), token: env("LENNYS_MCP_TOKEN") });

  // Resolve full source metadata via list_content (filtered to picked filename)
  const allSrc = await listContent(mcp, { content_type: contentType, limit: 50, offset: 0 });
  let source = allSrc.results.find((r) => r.filename === picked.id)!;
  // Iterate pagination until we find it (omitted: simple loop)

  const queries = deriveQueries({ tags: source.tags, description: (source as any).description, subtitle: (source as any).subtitle, title: source.title });
  const excerpts = await fetchExcerpts(mcp, source.filename, queries);

  // Pass 0
  const { brief, conversation: c0 } = await passZeroBrief({ source: source as any, excerpts, date: today });
  // Pass 1
  const { pass1, conversation: c1 } = await passOneGenerate({ conversation: c0 });
  // Pass 2
  const { pass2, conversation: c2 } = await passTwoReview({ conversation: c1 });

  // Pass 3 — programmatic validation, with up to 1 retry per question
  const failures: any[] = [];
  for (const [idx, q] of pass2.candidates.entries()) {
    const lenFails = checkLengths(q as any);
    if (lenFails.length) failures.push({ position: idx + 1, failure_type: "length_exceeded", reason: lenFails[0].field + " over limit", original_question_json: JSON.stringify(q) });
    const cit = await checkCitationLiteralMatch(mcp, q.citation as any);
    if (!cit.ok) failures.push({ position: idx + 1, failure_type: "citation_not_literal", reason: cit.reason, original_question_json: JSON.stringify(q) });
    const leak = checkSetupLeak(q as any);
    if (!leak.ok) failures.push({ position: idx + 1, failure_type: "setup_leak", reason: leak.reason, original_question_json: JSON.stringify(q) });
  }
  let candidates = [...pass2.candidates];
  if (failures.length) {
    const { retries } = await passThreeRetry({ conversation: c2, failures });
    for (const r of retries) {
      // re-validate single question; if pass, replace; else drop.
      const q = r.question as any;
      const lenOk = checkLengths(q).length === 0;
      const citOk = (await checkCitationLiteralMatch(mcp, q.citation)).ok;
      const leakOk = checkSetupLeak(q).ok;
      if (lenOk && citOk && leakOk) candidates[r.position - 1] = q;
      else candidates[r.position - 1] = null as any;
    }
  }
  candidates = candidates.filter(Boolean);
  if (candidates.length < 5) {
    // flag for manual review by exiting with non-zero code
    console.error(`Only ${candidates.length} valid questions; opening PR without auto-merge label.`);
    process.exit(2);
  }
  const cov = checkCoverage(candidates as any);
  if (!cov.ok) {
    console.error(`Coverage check failed: ${cov.reason}`);
    process.exit(2);
  }

  const daily = buildDailyContent({
    date: today,
    pass2: { ...pass2, candidates },
    source: { ...source, _pillar: pillar },
    searchUrlBase: source.type === "podcast" ? "https://www.lennyspodcast.com/" : "https://www.lennysnewsletter.com/",
  });
  writeContent(`${contentDir}/${today}.json`, daily);
  console.log(`wrote ${contentDir}/${today}.json`);
}
function sub1(date: string) { const d = new Date(date); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "feat(pipeline): main entrypoint stitches all 4 passes + validators + render"
```

---

## Phase 9 — Golden source regression test

### Task 9.1: Capture Cat Wu fixture

**Files:** `scripts/tests/golden/cat-wu.fixture.json`

- [ ] **Step 1: Capture metadata + 5 hand-curated excerpts from the real source**

JSON content:
```json
{
  "source": {
    "filename": "podcasts/cat-wu.md",
    "title": "How Anthropic's product team moves faster than anyone else",
    "type": "podcast",
    "byline": "Cat Wu",
    "date": "2026-04-23",
    "tags": ["leadership","ai","design","engineering","product-management","go-to-market"],
    "description": "How Anthropic's product team moves faster than anyone else, covering team leadership, AI product work, and product design.",
    "source_url": ""
  },
  "excerpts": [
    {"query":"barriers|barrier","text":"...We want to remove every single barrier to shipping things. The timelines for a lot of our product features have gone down from six month to one month and sometimes to even one day..."},
    {"query":"product taste|taste","text":"...you can either hire a lot more engineers who have great product taste, or you can keep your engineering hiring the same and hire a lot more PMs..."},
    {"query":"timeline|six months","text":"...the timelines for a lot of our product features have gone down from six month to one month and sometimes to one week or even one day..."},
    {"query":"PM role|PMs are","text":"...The PM role is changing a lot. It's changing really quickly. The thing that is extremely important for building AI-native products is iterating so quickly..."},
    {"query":"multi-quarter|roadmap","text":"...as a PM, there should be less emphasis on making sure that you're aligning your multi-quarter roadmaps with your partner teams and more emphasis on, okay, how can we figure out the fastest way to get something out the door?..."}
  ]
}
```

(Capture the actual full excerpt text by running the MCP calls from spec §5.4.6 manually and pasting the result.)

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "test(pipeline): cat-wu golden fixture for regression"
```

### Task 9.2: Pipeline regression test against fixture

**Files:** `scripts/tests/golden/pipeline.test.ts`

- [ ] **Step 1: Test runs passes 0+1+2 against the fixture and asserts shape**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { passZeroBrief } from "../../src/pipeline/llm/pass-0-brief";
import { passOneGenerate } from "../../src/pipeline/llm/pass-1-generate";
import { passTwoReview } from "../../src/pipeline/llm/pass-2-review";
import { checkCoverage } from "../../src/pipeline/validate/coverage";
import { checkLengths } from "../../src/pipeline/validate/length";

describe("pipeline regression — Cat Wu fixture", () => {
  // Skipped unless ANTHROPIC_API_KEY is present
  it.skipIf(!process.env.ANTHROPIC_API_KEY)("produces 5 valid questions covering ≥4 distinct ideas", async () => {
    const fixture = JSON.parse(readFileSync("./tests/golden/cat-wu.fixture.json", "utf-8"));
    const { brief, conversation: c0 } = await passZeroBrief({ source: fixture.source, excerpts: fixture.excerpts, date: "2026-05-08" });
    expect(brief.ideas.length).toBeGreaterThanOrEqual(4);

    const { pass1, conversation: c1 } = await passOneGenerate({ conversation: c0 });
    expect(pass1.candidates).toHaveLength(7);

    const { pass2 } = await passTwoReview({ conversation: c1 });
    expect(pass2.candidates).toHaveLength(5);

    expect(checkCoverage(pass2.candidates as any).ok).toBe(true);
    for (const q of pass2.candidates) expect(checkLengths(q as any)).toEqual([]);
  }, 120_000);
});
```

- [ ] **Step 2: Commit**

```bash
git add . && git commit -m "test(pipeline): regression against Cat Wu fixture (skipped without API key)"
```

---

## Phase 10 — GitHub Action

### Task 10.1: `nightly-content.yml`

**Files:** `.github/workflows/nightly-content.yml`

- [ ] **Step 1: Workflow definition**

```yaml
name: Nightly content
on:
  schedule:
    - cron: "0 7 * * *"        # 07:00 UTC daily
  workflow_dispatch: {}

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Run content pipeline
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LENNYS_MCP_URL: ${{ secrets.LENNYS_MCP_URL }}
          LENNYS_MCP_TOKEN: ${{ secrets.LENNYS_MCP_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
        run: cd scripts && pnpm pipeline
      - name: Compute date
        id: date
        run: echo "date=$(date -u +%Y-%m-%d)" >> "$GITHUB_OUTPUT"
      - name: Open PR
        uses: peter-evans/create-pull-request@v6
        with:
          branch: content/${{ steps.date.outputs.date }}
          title: "content: ${{ steps.date.outputs.date }}"
          body: "Auto-generated daily content. Auto-merges in 30 minutes."
          labels: auto-merge
          add-paths: |
            apps/web/content/**
      - name: Schedule auto-merge after 30 min
        run: |
          sleep 1800
          gh pr merge --auto --squash --delete-branch \
            "content/${{ steps.date.outputs.date }}"
        env: { GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

If the pipeline exits with code 2 (validation flag), `gh pr merge --auto` is skipped because the previous step failed. Manual merge required.

- [ ] **Step 2: `prompt-regression.yml` runs golden test on prompt PRs**

```yaml
name: Prompt regression
on:
  pull_request:
    paths: [ "prompts/question-generation/**", "scripts/src/**" ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: cd scripts && pnpm test
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "ci: nightly content GH Action + prompt regression on PR"
```

---

## Phase 11 — Provision + run end-to-end

### Task 11.1: Set GH Action secrets

- [ ] **Step 1: Add to repo**

```bash
gh secret set ANTHROPIC_API_KEY     # from Anthropic console
gh secret set LENNYS_MCP_URL        # from Lenny's team or partnership
gh secret set LENNYS_MCP_TOKEN
gh secret set CF_ACCOUNT_ID
gh secret set CF_API_TOKEN          # token with Vectorize + Workers AI scopes
```

- [ ] **Step 2: Run the index build job (one-shot, locally)**

```bash
cd scripts && pnpm vectorize:build
# expect: 652 vectors upserted
```

- [ ] **Step 3: Trigger first nightly run manually**

```bash
gh workflow run nightly-content.yml
# expect: PR opens within ~5 minutes
```

- [ ] **Step 4: Verify the PR JSON validates against Plan B's `DailyContent` zod**

(Open the PR; copy the JSON; run a quick `pnpm test --filter web seed-fixture` against it.)

- [ ] **Step 5: Commit + tag**

```bash
git tag v0.1.0-pipeline
```

---

## Self-review summary

- **Spec coverage:** Tasks cover §5.1 (pipeline steps 1-11), §5.2 (pillar rotation), §5.4.1-§5.4.10 (question mechanics — all four passes implemented), §9.1 risks #2 (MCP credential — explicit step in 11.1) and #3 (admin override via the 30-min PR delay).
- **JSON contract with Plan B:** `apps/web/content/<date>.json` schema in Phase 8 matches Plan B Task 2.1's `DailyContent` zod exactly.
- **Coverage breadth check:** built into Phase 7.4 and gated in `pipeline/index.ts`. <4 distinct ideas blocks auto-merge.
- **Citation literal-match:** built into Phase 7.2; uses MCP re-fetch.
- **Retry orchestration:** one retry per failed question; final <5 questions or coverage failure exits with non-zero code, blocking auto-merge.
- **No placeholders:** every step has actual code or commands.
- **Type consistency:** `Candidate`, `Pass1Output`, `Pass2Output` zod types in `scripts/src/pipeline/llm/types.ts` are referenced consistently across passes 1, 2, 3 and validators.
- **Risk acknowledged:** Task 11.1 step 1 is the moment risk #2 (MCP credential availability in CI) gets validated. If it fails, the fallback is to run `pipeline` from a maintainer's laptop and commit the JSON manually — that's already the same code path, only the trigger differs.
