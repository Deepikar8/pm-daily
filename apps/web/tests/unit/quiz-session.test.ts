import { describe, expect, it } from "vitest";
import { QuizSession, type QuizState } from "../../src/lib/durable-objects/quiz-session";

class MemoryStorage {
  private values = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
}

function session() {
  return new QuizSession({ storage: new MemoryStorage() });
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe("QuizSession durable object", () => {
  it("treats duplicate answers as idempotent so the client can still reveal", async () => {
    const s = session();
    await s.fetch(
      new Request("https://do/init", {
        method: "POST",
        body: JSON.stringify({ userId: "u1", date: "2026-05-18" }),
      }),
    );

    const first = await s.fetch(
      new Request("https://do/answer", {
        method: "POST",
        body: JSON.stringify({ position: 1, selectedKey: "A" }),
      }),
    );
    const duplicate = await s.fetch(
      new Request("https://do/answer", {
        method: "POST",
        body: JSON.stringify({ position: 1, selectedKey: "A" }),
      }),
    );

    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(200);
    const state = await json<QuizState>(duplicate);
    expect(state.currentIndex).toBe(1);
    expect(state.answers).toHaveLength(1);
  });
});
