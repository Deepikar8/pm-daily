import { brandCopy } from "./product-gym";

export type ShareResult = {
  correct: number;
  total?: number;
  date: string;
  rank?: number | null;
};

export function formatShareDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  const day = parsed.getUTCDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13
    ? "th"
    : day % 10 === 1
      ? "st"
      : day % 10 === 2
        ? "nd"
        : day % 10 === 3
          ? "rd"
          : "th";
  const month = parsed.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `${day}${suffix} ${month}`;
}

export function resultShareHeadline(result: ShareResult) {
  const total = result.total ?? 5;
  const rankText = result.rank ? ` and ranked #${result.rank}` : "";
  return `I scored ${result.correct}/${total} in ${brandCopy.appName} on ${formatShareDate(result.date)}${rankText}. Think you can beat me?`;
}

export function resultShareText(result: ShareResult) {
  return `${resultShareHeadline(result)}

${brandCopy.appName} is one daily product judgment challenge based on lessons from top operators.`;
}
