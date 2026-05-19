import { describe, expect, it } from "vitest";
import { load } from "../../src/routes/quiz/[date]/+page.server";
import { anonymousUserId } from "../../src/lib/server/quiz/anonymous";
import { getQuizSessionStub } from "../../src/lib/server/quiz/runtime-session";

function cookiesWithAnonymousId(anonId: string) {
  return {
    get(name: string) {
      return name === "pg_anon_quiz" ? anonId : undefined;
    },
    set() {},
  };
}

describe("dated quiz page load", () => {
  it("redirects anonymous completed sessions to the result page", async () => {
    const date = "2026-05-19";
    const anonId = "anon-completed-session";
    const env = {
      KV: {
        async get() {
          return JSON.stringify([
            {
              position: 1,
              archetype: "diagnose",
              scenario_md: "What should the PM do?",
              options: [{ key: "A", text: "Pick A" }],
              citation: {
                title: "Source",
                byline: "Author",
                type: "newsletter",
                search_url: "https://example.com",
              },
            },
          ]);
        },
      },
    };
    const stub = getQuizSessionStub(env as any, {
      userId: anonymousUserId(anonId),
      date,
      sessionId: "default",
    });

    await stub.fetch("https://do/init", {
      method: "POST",
      body: JSON.stringify({ userId: anonymousUserId(anonId), date }),
    });
    await stub.fetch("https://do/finalize", { method: "POST" });

    await expect(
      load({
        locals: { user: null },
        platform: { env },
        params: { date },
        url: new URL(`https://daily.deepikamurthy.com/quiz/${date}`),
        cookies: cookiesWithAnonymousId(anonId),
      } as any),
    ).rejects.toMatchObject({
      status: 302,
      location: `/quiz/${date}/done`,
    });
  });
});
