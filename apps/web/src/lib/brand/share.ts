import { brandCopy } from "./product-gym";

export type ShareResult = {
  correct: number;
  total?: number;
  date: string;
  rank?: number | null;
};

export function resultShareText(result: ShareResult) {
  const total = result.total ?? 5;
  const rankText = result.rank ? ` and ranked #${result.rank}` : "";
  return `I scored ${result.correct}/${total} in ${brandCopy.appName} on ${result.date}${rankText}. Think you can beat me?`;
}
