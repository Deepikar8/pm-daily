export type ScoreInput = {
  correctCount: number;
  seconds: number;
  streak: number;
};
export type ScoreResult = {
  basePoints: number;
  speedBonus: number;
  streakMultiplier: number;
  totalPoints: number;
};

/**
 * Per-quiz score formula (spec §6.1):
 *   basePoints     = correctCount * 20                                  (0..100)
 *   speedBonus     = clamp(0..20, 20 - (seconds - 60) / 6)              (capped 20, floor 60s)
 *   streakMult     = 1.30 if streak >= 30
 *                  | 1.20 if streak >= 7
 *                  | 1.10 if streak >= 3
 *                  | 1.00
 *   totalPoints    = round((basePoints + speedBonus) * streakMult)
 */
export function score({ correctCount, seconds, streak }: ScoreInput): ScoreResult {
  const basePoints = correctCount * 20;
  const speedBonus = Math.max(0, Math.min(20, Math.round(20 - (seconds - 60) / 6)));
  const streakMultiplier =
    streak >= 30 ? 1.30 :
    streak >= 7  ? 1.20 :
    streak >= 3  ? 1.10 : 1.00;
  const totalPoints = Math.round((basePoints + speedBonus) * streakMultiplier);
  return { basePoints, speedBonus, streakMultiplier, totalPoints };
}
