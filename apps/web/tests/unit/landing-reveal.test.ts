import { describe, expect, it, vi } from "vitest";
import { revealLandingDecision } from "../../src/lib/quiz/landing-reveal";

const preview = {
  position: 1,
  correct_key: "C",
  explanation_md: "Embedded explanation",
  pm_takeaway: "Embedded takeaway",
};

describe("landing reveal", () => {
  it("calls the server reveal endpoint even when the preview has the answer key", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        correct_key: "C",
        explanation_md: "Server explanation",
        pm_takeaway: "Server takeaway",
      }),
    );

    const result = await revealLandingDecision({
      date: "2026-05-14",
      preview,
      selectedKey: "C",
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith("/api/landing/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-05-14",
        position: 1,
        selectedKey: "C",
      }),
    });
    expect(result.persisted).toBe(true);
    expect(result.reveal.explanation_md).toBe("Server explanation");
  });

  it("falls back to embedded reveal data if the server reveal fails", async () => {
    const fetcher = vi.fn(async () => new Response("platform unavailable", { status: 500 }));

    const result = await revealLandingDecision({
      date: "2026-05-14",
      preview,
      selectedKey: "A",
      fetcher,
    });

    expect(result.persisted).toBe(false);
    expect(result.reveal).toEqual({
      correct_key: "C",
      explanation_md: "Embedded explanation",
      pm_takeaway: "Embedded takeaway",
    });
  });
});
