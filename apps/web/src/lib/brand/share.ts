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
  const rankText = result.rank ? ` and preview rank #${result.rank}` : "";
  return `I practiced today’s ${brandCopy.appName} rep on ${formatShareDate(result.date)} and scored ${result.correct}/${total}.${rankText}`;
}

export function resultShareText(result: ShareResult) {
  return `${resultShareHeadline(result)}

${brandCopy.appName} turns long-form operator ideas from Lenny’s Podcast and Newsletter into applied product decisions so they stick.`;
}
