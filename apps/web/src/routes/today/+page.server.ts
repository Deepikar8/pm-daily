import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { getDb } from "$lib/server/db/client";
import { dailySessions, users } from "$lib/server/db/schema";
import { desc, eq, lte } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { normalizeSourceLinks } from "$lib/server/content/source-links";

function todayInTZ(tz: string) {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

const fallbackContent = {
  date: "2026-05-10",
  headline: "Cat Wu on shipping speed: how Anthropic compresses six-month timelines to a week",
  digest_md:
    "Cat Wu, Head of Product for Claude Code, argues the PM role is being rewritten in real time by AI-native engineering velocity. Six-month feature timelines have dropped to one week — sometimes one day. The traditional PM toolkit is now the bottleneck, not the cure.\n\nHer response: build small product surfaces where one engineer can ship end-to-end weekly, and hire engineers with strong product taste rather than adding PM process.",
  takeaways: [
    "Build for the model you have, not the model you'll have. Six-week plans beat nine-month roadmaps.",
    "If your team can't start work without a detailed PRD from you, you are the bottleneck.",
    "Product taste is built by using products, not reading frameworks. One hour a day, every day.",
  ],
  source: {
    title: "How Anthropic's product team moves faster than anyone else",
    byline: "Cat Wu",
    type: "podcast",
    date: "2026-04-23",
    search_url: "https://www.lennysnewsletter.com/p/how-anthropics-product-team-moves",
    source_url: "https://www.lennysnewsletter.com/p/how-anthropics-product-team-moves",
  },
};

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!platform?.env) throw redirect(302, "/");

  const db = getDb(platform.env.DB);
  const env = platform.env;

  let userRow:
    | {
        termsAcceptedAt: number | null;
        timezone: string;
      }
    | undefined;

  if (locals.user) {
    userRow = await db
      .select({
        termsAcceptedAt: users.termsAcceptedAt,
        timezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, locals.user.id))
      .get();
  }

  const tz = userRow?.timezone ?? locals.user?.timezone ?? "UTC";
  const date = todayInTZ(tz);

  // Try KV first (hot path)
  let cached = await env.KV.get(kvKeys.todayDigest(date));
  if (!cached) {
    // Fallback: D1 → cache
    let row = await db
      .select()
      .from(dailySessions)
      .where(eq(dailySessions.date, date))
      .get();

    row ??= await db
      .select()
      .from(dailySessions)
      .where(lte(dailySessions.date, date))
      .orderBy(desc(dailySessions.date))
      .get();

    if (!row) {
      return { date: fallbackContent.date, missing: false as const, content: fallbackContent };
    }
    const contentDate = row.date;
    cached = JSON.stringify({
      date: contentDate,
      headline: row.headline,
      digest_md: row.digestMd,
      takeaways: JSON.parse(row.takeawaysJson),
      source: normalizeSourceLinks(JSON.parse(row.sourceJson)),
    });
    if (contentDate === date) {
      await env.KV.put(kvKeys.todayDigest(date), cached);
    }
    return { date: contentDate, missing: false as const, content: JSON.parse(cached) };
  }

  const content = JSON.parse(cached);
  content.source = normalizeSourceLinks(content.source);
  return { date, missing: false as const, content };
};
