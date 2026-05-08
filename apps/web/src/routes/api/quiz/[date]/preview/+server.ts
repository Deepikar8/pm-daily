import type { RequestHandler } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";

export const GET: RequestHandler = async ({ params, platform }) => {
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const date = params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("invalid date", { status: 400 });
  }
  const cached = await platform.env.KV.get(kvKeys.todayQuestions(date));
  if (!cached) return new Response("not found", { status: 404 });
  const qs = JSON.parse(cached) as Array<unknown>;
  if (!Array.isArray(qs) || qs.length === 0) {
    return new Response("not found", { status: 404 });
  }
  const q = qs[Math.floor(Math.random() * qs.length)];
  return Response.json({ question: q });
};
