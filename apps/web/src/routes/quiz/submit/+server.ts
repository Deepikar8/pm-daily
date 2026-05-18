import type { RequestHandler } from "./$types";
import { localDate } from "$lib/server/timezone/helpers";
import { anonymousUserId, getOrCreateAnonymousQuizId } from "$lib/server/quiz/anonymous";
import { getQuizSessionStub } from "$lib/server/quiz/runtime-session";

/**
 * Forwards a per-question answer to the QuizSession DO. The DO is the
 * authority on whether the user has already answered this position; this
 * endpoint is a thin proxy.
 */
export const POST: RequestHandler = async ({ request, locals, platform, cookies }) => {
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const env = platform.env;
  const body = (await request.json()) as {
    position: number;
    selectedKey: string;
    date?: string;
    sessionId?: string;
  };
  const date = body.date ?? localDate(locals.user?.timezone ?? "UTC");
  const quizUserId = locals.user?.id ?? anonymousUserId(getOrCreateAnonymousQuizId(cookies));
  const stub = getQuizSessionStub(env, { userId: quizUserId, date, sessionId: body.sessionId });
  await stub.fetch("https://do/init", {
    method: "POST",
    body: JSON.stringify({ userId: quizUserId, date }),
  });
  const res = await stub.fetch("https://do/answer", {
    method: "POST",
    body: JSON.stringify({ position: body.position, selectedKey: body.selectedKey }),
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
};
