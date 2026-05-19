import { brandCopy } from "./product-gym";

export type ShareResult = {
  correct: number;
  total?: number;
  date: string;
  rank?: number | null;
  points?: number | null;
  lessonTitle?: string | null;
  operatorName?: string | null;
  sourceLabel?: string | null;
  takeaway?: string | null;
};

export function normalizeShareTakeaway(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 160);
}

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
  const pointsText = result.points ? ` · ${result.points} pts` : "";
  const rankText = result.rank ? ` · #${result.rank} this week` : "";
  return `I practiced today’s ${brandCopy.appName} rep on ${formatShareDate(result.date)} and scored ${result.correct}/${total}${pointsText}${rankText}.`;
}

export function resultShareText(result: ShareResult) {
  const lesson = result.lessonTitle?.trim();
  const operator = result.operatorName?.trim();
  const source = result.sourceLabel?.trim();
  const takeaway = normalizeShareTakeaway(result.takeaway);
  const lessonText = lesson
    ? `\nToday’s lesson: ${lesson}${operator ? `\nOperator: ${operator}${source ? ` via ${source}` : ""}` : ""}`
    : "";
  const takeawayText = takeaway ? `\nMy takeaway: ${takeaway}` : "";

  return `${resultShareHeadline(result)}${lessonText}${takeawayText}

${brandCopy.appName} turns long-form operator ideas from Lenny’s Podcast and Newsletter into applied product decisions so they stick.`;
}
