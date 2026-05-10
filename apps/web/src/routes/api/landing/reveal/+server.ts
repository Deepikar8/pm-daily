import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db/client";
import { dailyQuestions } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });

  const body = (await request.json().catch(() => null)) as
    | { date?: string; position?: number; selectedKey?: string }
    | null;
  const date = body?.date;
  const position = Number(body?.position ?? 1);
  const selectedKey = body?.selectedKey;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || position < 1 || position > 5) {
    return new Response("bad request", { status: 400 });
  }
  if (!selectedKey || !["A", "B", "C", "D"].includes(selectedKey)) {
    return new Response("bad request", { status: 400 });
  }

  const db = getDb(platform.env.DB);
  const q = await db
    .select({
      correctKey: dailyQuestions.correctKey,
      explanationMd: dailyQuestions.explanationMd,
      pmTakeaway: dailyQuestions.pmTakeaway,
    })
    .from(dailyQuestions)
    .where(and(eq(dailyQuestions.date, date), eq(dailyQuestions.position, position)))
    .get();

  if (!q) return new Response("not found", { status: 404 });

  return Response.json({
    correct_key: q.correctKey,
    explanation_md: q.explanationMd,
    pm_takeaway: q.pmTakeaway,
  });
};
