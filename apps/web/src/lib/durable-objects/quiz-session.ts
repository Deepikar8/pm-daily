import { ulid } from "ulid";

export interface QuizState {
  attemptId: string;
  userId: string;
  date: string;
  startedAt: number;
  questionPositions: number[];
  currentIndex: number;
  answers: Array<{ position: number; selectedKey: string; answeredAt: number }>;
  submitted: boolean;
}

// Local typing for DO state — avoids needing @cloudflare/workers-types
// in the TS lib config (the rest of the codebase follows the same pattern,
// declaring D1Database / KVNamespace ambient via app.d.ts).
type DOStorage = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
};
type DOState = {
  storage: DOStorage;
};

/**
 * QuizSession Durable Object. One instance per (userId, date) — created via
 * `idFromName(\`\${userId}:\${date}\`)`. Holds the in-flight quiz state until
 * the user finalizes, at which point /quiz/finish reads `state` then writes
 * the persistent rows in D1 and recomputes the leaderboard.
 *
 * Endpoints (HTTP-shaped because that's the DO RPC surface):
 *   POST /init       { userId, date }   → idempotent; returns current state
 *   POST /answer     { position, key }  → appends an answer, advances index
 *   POST /finalize                      → marks submitted (idempotent)
 *   GET  /state                         → returns current state (for guards)
 */
export class QuizSession {
  state: DOState;
  constructor(state: DOState, _env?: unknown) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const op = url.pathname.split("/").filter(Boolean).pop();
    let s = (await this.state.storage.get<QuizState>("state")) ?? null;

    if (op === "init") {
      const body = (await req.json()) as { userId: string; date: string };
      if (!s) {
        s = {
          attemptId: ulid(),
          userId: body.userId,
          date: body.date,
          startedAt: Date.now(),
          questionPositions: [1, 2, 3, 4, 5],
          currentIndex: 0,
          answers: [],
          submitted: false,
        };
        await this.state.storage.put("state", s);
      }
      return Response.json(s);
    }

    if (op === "answer") {
      if (!s || s.submitted) return new Response("invalid state", { status: 400 });
      const body = (await req.json()) as { position: number; selectedKey: string };
      if (s.answers.find((a) => a.position === body.position)) {
        return new Response("already answered", { status: 400 });
      }
      s.answers.push({ ...body, answeredAt: Date.now() });
      s.currentIndex = Math.min(s.currentIndex + 1, 5);
      await this.state.storage.put("state", s);
      return Response.json(s);
    }

    if (op === "finalize") {
      if (!s) return new Response("not initialized", { status: 400 });
      if (!s.submitted) {
        s.submitted = true;
        await this.state.storage.put("state", s);
      }
      return Response.json(s);
    }

    if (op === "state") {
      return Response.json(s ?? { uninitialized: true });
    }

    return new Response("not found", { status: 404 });
  }
}
