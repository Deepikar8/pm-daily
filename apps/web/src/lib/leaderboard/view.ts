export type LeaderboardScope = "weekly" | "allTime";

export type LeaderboardDisplayRow = {
  userId: string;
  displayName: string;
  weeklyPoints?: number;
  totalPoints?: number;
  currentStreak: number;
  totalAttempts?: number;
};

/** A row plus its 1-indexed rank in the original ordering. */
export type RankedLeaderboardRow = LeaderboardDisplayRow & { rank: number };

export function getLeaderboardDisplay(args: {
  rows: LeaderboardDisplayRow[];
  scope: LeaderboardScope;
  currentUserId: string | null;
}): {
  podium: LeaderboardDisplayRow[];
  pinned: LeaderboardDisplayRow | null;
  pinnedRank: number | null;
  rows: RankedLeaderboardRow[];
} {
  const { rows, scope, currentUserId } = args;
  const myIndex = currentUserId ? rows.findIndex((row) => row.userId === currentUserId) : -1;
  const hasPodium = scope === "weekly" && rows.length >= 3;
  const userIsOnPodium = hasPodium && myIndex >= 0 && myIndex < 3;
  // Suppress the pinned-you strip when the user is already visible on
  // the podium — otherwise they'd render twice (once in the podium,
  // once immediately below it). Their podium card is signal enough.
  const pinned =
    myIndex >= 0 && scope === "weekly" && !userIsOnPodium ? rows[myIndex] : null;
  const podium = hasPodium ? [rows[1], rows[0], rows[2]] : [];
  const listStart = hasPodium ? 3 : 0;

  // Carry each row's rank explicitly so filtering out the pinned user
  // doesn't break rank display. (e.g. with 2 users and the current
  // user pinned at rank 1, the remaining user must render as rank 2,
  // not rank 1.)
  const rankedRows: RankedLeaderboardRow[] = rows
    .map((row, idx) => ({ ...row, rank: idx + 1 }))
    .slice(listStart)
    .filter((row) => !pinned || row.userId !== pinned.userId);

  return {
    podium,
    pinned,
    pinnedRank: myIndex >= 0 ? myIndex + 1 : null,
    rows: rankedRows,
  };
}
