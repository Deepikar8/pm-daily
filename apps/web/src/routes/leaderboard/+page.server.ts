import type { PageServerLoad } from "./$types";
import { readLeaderboards } from "$lib/server/leaderboard/read";

export const load: PageServerLoad = async ({ platform, locals }) => {
  if (!platform?.env) {
    return { weekly: { rows: [] }, allTime: { rows: [] }, weekKey: "", currentUserId: locals.user?.id ?? null };
  }
  const data = await readLeaderboards(platform.env);
  return { ...data, currentUserId: locals.user?.id ?? null };
};
