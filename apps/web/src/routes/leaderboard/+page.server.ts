import type { PageServerLoad } from "./$types";
import { readLeaderboards } from "$lib/server/leaderboard/read";
import { readPendingQuizPreview } from "$lib/server/quiz/pending-preview";

export const load: PageServerLoad = async ({ platform, locals, cookies }) => {
  if (!platform?.env) {
    return {
      weekly: { rows: [] },
      allTime: { rows: [] },
      weekKey: "",
      currentUserId: locals.user?.id ?? null,
      pendingPreview: null,
    };
  }
  const data = await readLeaderboards(platform.env);
  return {
    ...data,
    currentUserId: locals.user?.id ?? null,
    pendingPreview: locals.user
      ? null
      : await readPendingQuizPreview({ env: platform.env, cookies }),
  };
};
