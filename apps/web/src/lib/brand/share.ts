import { brandCopy } from "./product-gym";

export type ShareResult = {
  correct: number;
  total?: number;
  date: string;
  rank?: number | null;
};

export function resultShareText(result: ShareResult) {
  const total = result.total ?? 5;
  const rankText = result.rank ? ` Rank #${result.rank}.` : "";
  return `${brandCopy.appName}: ${result.correct}/${total} on ${result.date}.${rankText} ${brandCopy.tagline}`;
}
