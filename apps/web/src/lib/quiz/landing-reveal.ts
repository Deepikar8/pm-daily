export type LandingPreviewReveal = {
  position?: number;
  correct_key?: string;
  explanation_md?: string;
  pm_takeaway?: string;
};

export type LandingReveal = {
  correct_key: string;
  explanation_md: string;
  pm_takeaway: string;
};

export async function revealLandingDecision(args: {
  date: string;
  preview: LandingPreviewReveal;
  selectedKey: string;
  fetcher: typeof fetch;
}): Promise<{ reveal: LandingReveal; persisted: boolean }> {
  try {
    const res = await args.fetcher("/api/landing/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: args.date,
        position: args.preview.position ?? 1,
        selectedKey: args.selectedKey,
      }),
    });
    if (!res.ok) throw new Error("reveal failed");
    return { reveal: (await res.json()) as LandingReveal, persisted: true };
  } catch (error) {
    if (args.preview.correct_key && args.preview.explanation_md && args.preview.pm_takeaway) {
      return {
        reveal: {
          correct_key: args.preview.correct_key,
          explanation_md: args.preview.explanation_md,
          pm_takeaway: args.preview.pm_takeaway,
        },
        persisted: false,
      };
    }
    throw error;
  }
}
