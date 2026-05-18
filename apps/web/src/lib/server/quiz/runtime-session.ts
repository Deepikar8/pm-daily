import { ulid } from "ulid";
import { quizSessionName } from "./session";
import type { QuizState } from "$lib/durable-objects/quiz-session";

const localSessions = new Map<string, QuizState>();

function localQuizSession(name: string) {
  return {
    async fetch(req: Request | string, init?: RequestInit): Promise<Response> {
      const request = typeof req === "string" ? new Request(req, init) : req;
      const url = new URL(request.url);
      const op = url.pathname.split("/").filter(Boolean).pop();
      let state = localSessions.get(name) ?? null;

      if (op === "init") {
        const body = (await request.json()) as { userId: string; date: string };
        if (!state) {
          state = {
            attemptId: ulid(),
            userId: body.userId,
            date: body.date,
            startedAt: Date.now(),
            questionPositions: [1, 2, 3, 4, 5],
            currentIndex: 0,
            answers: [],
            submitted: false,
          };
          localSessions.set(name, state);
        }
        return Response.json(state);
      }

      if (op === "answer") {
        if (!state || state.submitted) return new Response("invalid state", { status: 400 });
        const body = (await request.json()) as { position: number; selectedKey: string };
        if (state.answers.find((answer) => answer.position === body.position)) {
          return Response.json(state);
        }
        state.answers.push({ ...body, answeredAt: Date.now() });
        state.currentIndex = Math.min(state.currentIndex + 1, 5);
        localSessions.set(name, state);
        return Response.json(state);
      }

      if (op === "finalize") {
        if (!state) return new Response("not initialized", { status: 400 });
        state.submitted = true;
        localSessions.set(name, state);
        return Response.json(state);
      }

      if (op === "state") {
        return Response.json(state ?? { uninitialized: true });
      }

      return new Response("not found", { status: 404 });
    },
  };
}

export function getQuizSessionStub(
  env: App.Platform["env"],
  args: { userId: string; date: string; sessionId?: string | null },
): { fetch(req: Request | string, init?: RequestInit): Promise<Response> } {
  const name = quizSessionName(args);
  if (process.env.NODE_ENV !== "production") {
    return localQuizSession(name);
  }

  return env.QUIZ_SESSION.get(env.QUIZ_SESSION.idFromName(name));
}
