import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db/client";
import { dailyQuestions } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localDate } from "$lib/server/timezone/helpers";

/**
 * Returns correct_key + explanation + takeaway + quote_excerpt for a single
 * question — but ONLY if the user has already submitted an answer for that
 * position to the DO. The KV-cached questions strip these fields specifically
 * so they never leak to a client that hasn't committed an answer.
 */
export const GET: RequestHandler = async ({ url, locals, platform }) => {
  if (!locals.user) return new Response("unauth", { status: 401 });
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const env = platform.env;
  const date = url.searchParams.get("date") ?? localDate(locals.user.timezone ?? "UTC");
  const position = parseInt(url.searchParams.get("position") ?? "0", 10);
  if (!position || !date) return new Response("bad request", { status: 400 });

  // Verify the user has submitted this position via the DO
  const stub = env.QUIZ_SESSION.get(env.QUIZ_SESSION.idFromName(`${locals.user.id}:${date}`));
  const stateRes = await stub.fetch("https://do/state");
  const state = (await stateRes.json()) as
    | { uninitialized: true }
    | { answers: Array<{ position: number; selectedKey: string }>; submitted: boolean };
  if ("uninitialized" in state) return new Response("no quiz", { status: 400 });
  if (!state.answers.find((a) => a.position === position)) {
    return new Response("not yet answered", { status: 403 });
  }

  const db = getDb(env.DB);
  const q = await db
    .select({
      correctKey: dailyQuestions.correctKey,
      explanationMd: dailyQuestions.explanationMd,
      pmTakeaway: dailyQuestions.pmTakeaway,
      citationJson: dailyQuestions.citationJson,
    })
    .from(dailyQuestions)
    .where(and(eq(dailyQuestions.date, date), eq(dailyQuestions.position, position)))
    .get();
  if (!q) return new Response("not found", { status: 404 });
  const cit = JSON.parse(q.citationJson);
  return Response.json({
    correct_key: q.correctKey,
    explanation_md: q.explanationMd,
    pm_takeaway: q.pmTakeaway,
    citation_quote_excerpt: cit.quote_excerpt ?? "",
  });
};
