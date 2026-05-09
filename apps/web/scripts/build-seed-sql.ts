// One-off generator for SQL + KV payloads from content/<date>.json.
// Used for prod seeding via wrangler CLI until the content pipeline ships.
// Run from apps/web/:
//   npx tsx scripts/build-seed-sql.ts
//   # or rename to .mjs and: node scripts/build-seed-sql.mjs
//
// Outputs (all under apps/web/.tmp/, gitignored):
//   - seed-2026-05-08.sql           (D1: daily_sessions + 5 daily_questions)
//   - digest.json                    (KV: today:digest:<date>)
//   - questions.json                 (KV: today:questions:<date>)
//
// Mirrors the shape produced by src/lib/server/content/seed.ts so that the
// /today page and /api/quiz/<date>/preview endpoint resolve identically to a
// runtime-seeded day.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { ulid } from "ulid";

// SQLite single-quote escape: ' -> ''
const esc = (s: string) => s.replace(/'/g, "''");
const jsonEsc = (o: unknown) => esc(JSON.stringify(o));

const overrideDate = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1];

const CONTENT_PATH = "./content/2026-05-08.json";
const OUT_DIR = "./.tmp";
const SQL_OUT = `${OUT_DIR}/seed-2026-05-08.sql`;
const DIGEST_OUT = `${OUT_DIR}/digest.json`;
const QUESTIONS_OUT = `${OUT_DIR}/questions.json`;

type Citation = {
  filename: string;
  title: string;
  byline: string;
  type: string;
  date: string;
  source_url: string;
  search_url: string;
  quote_excerpt?: string;
  timestamp?: string;
};

type Question = {
  position: number;
  idea_id: string;
  archetype: string;
  scenario_md: string;
  options: { key: string; text: string }[];
  correct_key: string;
  explanation_md: string;
  pm_takeaway: string;
  citation: Citation;
};

type DailyJson = {
  date: string;
  headline: string;
  theme_pillar: string;
  digest_md: string;
  takeaways: string[];
  source: Citation;
  questions: Question[];
};

const j: DailyJson = JSON.parse(readFileSync(CONTENT_PATH, "utf-8"));
const targetDate = overrideDate ?? j.date;

mkdirSync(OUT_DIR, { recursive: true });

const SQL_OUT_FINAL = `${OUT_DIR}/seed-${targetDate}.sql`;
const DIGEST_OUT_FINAL = `${OUT_DIR}/digest-${targetDate}.json`;
const QUESTIONS_OUT_FINAL = `${OUT_DIR}/questions-${targetDate}.json`;

const now = Date.now();
const sql: string[] = [];

sql.push(
  `INSERT OR REPLACE INTO daily_sessions
  (date, headline, theme_pillar, digest_md, takeaways_json, source_json, published_at)
VALUES
  ('${esc(targetDate)}', '${esc(j.headline)}', '${esc(j.theme_pillar)}',
   '${esc(j.digest_md)}', '${jsonEsc(j.takeaways)}', '${jsonEsc(j.source)}', ${now});`,
);

const questionIds: string[] = [];
for (const q of j.questions) {
  const id = ulid();
  questionIds.push(id);
  sql.push(
    `INSERT OR REPLACE INTO daily_questions
    (id, date, position, idea_id, archetype, scenario_md, options_json, correct_key, explanation_md, pm_takeaway, citation_json)
  VALUES
    ('${id}', '${esc(targetDate)}', ${q.position},
     '${esc(q.idea_id)}', '${esc(q.archetype)}', '${esc(q.scenario_md)}',
     '${jsonEsc(q.options)}', '${esc(q.correct_key)}',
     '${esc(q.explanation_md)}', '${esc(q.pm_takeaway)}',
     '${jsonEsc(q.citation)}');`,
  );
}

writeFileSync(SQL_OUT_FINAL, sql.join("\n"));

// Build KV payloads. Strip correct_key, explanation_md, pm_takeaway from
// questions (they're only revealed server-side after answer submission).
// quote_excerpt is also stripped via { ...citation, quote_excerpt: undefined }
// to match seedDay() exactly.
const safeQuestions = j.questions.map((q) => ({
  position: q.position,
  archetype: q.archetype,
  scenario_md: q.scenario_md,
  options: q.options,
  citation: { ...q.citation, quote_excerpt: undefined },
}));

writeFileSync(
  DIGEST_OUT_FINAL,
  JSON.stringify({
    date: targetDate,
    headline: j.headline,
    digest_md: j.digest_md,
    takeaways: j.takeaways,
    source: j.source,
  }),
);
writeFileSync(QUESTIONS_OUT_FINAL, JSON.stringify(safeQuestions));

console.log(`Wrote ${sql.length} SQL statements + 2 KV payloads.`);
console.log(`  SQL:       ${SQL_OUT_FINAL}`);
console.log(`  digest:    ${DIGEST_OUT_FINAL}`);
console.log(`  questions: ${QUESTIONS_OUT_FINAL}`);
console.log(`Question IDs: ${JSON.stringify(questionIds)}`);

console.log("\nNext: run these commands");
console.log(`  pnpm exec wrangler d1 execute pm-daily --remote --file=./.tmp/seed-${targetDate}.sql`);
console.log(`  pnpm exec wrangler kv key put --binding=KV --remote "today:digest:${targetDate}" --path=./.tmp/digest-${targetDate}.json`);
console.log(`  pnpm exec wrangler kv key put --binding=KV --remote "today:questions:${targetDate}" --path=./.tmp/questions-${targetDate}.json`);
