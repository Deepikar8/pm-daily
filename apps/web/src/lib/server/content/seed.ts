import { ulid } from "ulid";
import type { DB } from "../db/client";
import { DailyContent } from "./types";
import * as schema from "../db/schema";
import * as kvKeys from "../kv/keys";
import { normalizeContentSourceLinks } from "./source-links";

// Minimal subset of the KV binding we need (Workers KV exposes more).
type KV = {
  put(key: string, value: string): Promise<void>;
};

export async function seedDay(args: {
  db: DB;
  kv: KV;
  contentJson: unknown;
}): Promise<{ date: string; questionIds: string[] }> {
  const c = normalizeContentSourceLinks(DailyContent.parse(args.contentJson));
  const now = Date.now();

  await args.db.insert(schema.dailySessions).values({
    date: c.date,
    headline: c.headline,
    themePillar: c.theme_pillar,
    digestMd: c.digest_md,
    takeawaysJson: JSON.stringify(c.takeaways),
    sourceJson: JSON.stringify(c.source),
    publishedAt: now,
  }).onConflictDoUpdate({
    target: schema.dailySessions.date,
    set: {
      headline: c.headline,
      themePillar: c.theme_pillar,
      digestMd: c.digest_md,
      takeawaysJson: JSON.stringify(c.takeaways),
      sourceJson: JSON.stringify(c.source),
      publishedAt: now,
    },
  }).run();

  const questionIds: string[] = [];
  for (const q of c.questions) {
    const id = ulid();
    questionIds.push(id);
    await args.db.insert(schema.dailyQuestions).values({
      id,
      date: c.date,
      position: q.position,
      ideaId: q.idea_id,
      archetype: q.archetype,
      scenarioMd: q.scenario_md,
      optionsJson: JSON.stringify(q.options),
      correctKey: q.correct_key,
      explanationMd: q.explanation_md,
      pmTakeaway: q.pm_takeaway,
      citationJson: JSON.stringify(q.citation),
    }).onConflictDoNothing().run();
  }

  // Strip correct_key, explanation_md, pm_takeaway from KV-cached questions
  // (these are only revealed after the user submits an answer, server-side).
  const safeQuestions = c.questions.map((q) => ({
    position: q.position,
    archetype: q.archetype,
    scenario_md: q.scenario_md,
    options: q.options,
    citation: { ...q.citation, quote_excerpt: undefined },
  }));

  await args.kv.put(kvKeys.todayDigest(c.date), JSON.stringify({
    date: c.date,
    headline: c.headline,
    digest_md: c.digest_md,
    takeaways: c.takeaways,
    source: c.source,
  }));
  await args.kv.put(kvKeys.todayQuestions(c.date), JSON.stringify(safeQuestions));

  return { date: c.date, questionIds };
}
