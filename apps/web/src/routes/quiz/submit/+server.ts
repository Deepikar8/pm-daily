import type { RequestHandler } from "./$types";
import { localDate } from "$lib/server/timezone/helpers";
import { quizSessionName } from "$lib/server/quiz/session";

/**
 * Forwards a per-question answer to the QuizSession DO. The DO is the
 * authority on whether the user has already answered this position; this
 * endpoint is a thin proxy.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user) return new Response("unauth", { status: 401 });
  if (!platform?.env) return new Response("platform unavailable", { status: 500 });
  const env = platform.env;
  const body = (await request.json()) as {
    position: number;
    selectedKey: string;
    date?: string;
    sessionId?: string;
  };
  const date = body.date ?? localDate(locals.user.timezone ?? "UTC");
  const stub = env.QUIZ_SESSION.get(
    env.QUIZ_SESSION.idFromName(
      quizSessionName({ userId: locals.user.id, date, sessionId: body.sessionId }),
    ),
  );
  const res = await stub.fetch("https://do/answer", {
    method: "POST",
    body: JSON.stringify({ position: body.position, selectedKey: body.selectedKey }),
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
};
