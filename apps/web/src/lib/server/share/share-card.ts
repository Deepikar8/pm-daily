import { brandCopy } from "$lib/brand/product-gym";
import type { PublicShareResult } from "./public-result";

const colors = {
  paper: "#FFF8EC",
  paperWarm: "#FFECCF",
  paperCream: "#FFF0D6",
  ink: "#2A1810",
  inkSoft: "#6B5442",
  inkMute: "#9A7F63",
  accent: "#D86F24",
  accentDeep: "#9A4E16",
  gold: "#F7C37A",
  white: "#FFFFFF",
};

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sourceTypeLabel(type: string) {
  if (type === "podcast") return "Lenny's Podcast";
  if (type === "newsletter") return "Lenny's Newsletter";
  return "Lenny's Podcast and Newsletter";
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?-]+$/, "")}...`;
  }
  return lines;
}

function tspans(lines: string[], x: number, y: number, lineHeight: number) {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
}

export function renderShareCardSvg(result: PublicShareResult & { takeaway?: string | null }) {
  const name = result.player.displayName || "Product Gym athlete";
  const headline = `${name} practiced today's PM rep`;
  const lessonLines = wrapText(result.session.headline, 38, 2);
  const operatorLine = result.session.sourceByline
    ? `From ${result.session.sourceByline} via ${sourceTypeLabel(result.session.sourceType)}`
    : sourceTypeLabel(result.session.sourceType);
  const rankText = result.result.rank ? `#${result.result.rank} this week` : "Leaderboard ready";
  const takeaway = result.takeaway?.trim();
  const takeawayLines = takeaway ? wrapText(`My takeaway: ${takeaway}`, 54, 2) : [];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(headline)}">
  <title>${escapeXml(headline)}</title>
  <desc>${escapeXml(result.session.headline)} ${escapeXml(operatorLine)}. Score ${result.result.totalCorrect}/5, ${result.result.totalPoints} points.</desc>
  <style>
    .serif { font-family: Fraunces, Georgia, serif; }
    .sans { font-family: "DM Sans", Arial, sans-serif; }
    .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
    .label { font-size: 20px; font-weight: 800; letter-spacing: 2.8px; text-transform: uppercase; }
  </style>
  <rect width="1200" height="630" fill="${colors.paper}"/>
  <rect x="42" y="40" width="1116" height="526" rx="24" fill="${colors.white}" stroke="${colors.ink}" stroke-width="4"/>
  <rect x="54" y="52" width="1116" height="526" rx="24" fill="none" stroke="${colors.accent}" stroke-width="6" opacity="0.95"/>

  <rect x="78" y="74" width="196" height="42" rx="21" fill="${colors.paperCream}" stroke="${colors.accent}" stroke-width="3"/>
  <text x="108" y="102" class="sans label" fill="${colors.accent}">${escapeXml(brandCopy.appName)}</text>

  <text x="78" y="180" class="serif" fill="${colors.ink}" font-size="68" font-weight="900">
    ${tspans(wrapText(headline, 27, 2), 78, 180, 74)}
  </text>

  <rect x="78" y="308" width="658" height="152" rx="18" fill="${colors.paperCream}" stroke="${colors.ink}" stroke-width="3"/>
  <text x="110" y="354" class="sans label" fill="${colors.accent}">Today's lesson</text>
  <text x="110" y="398" class="serif" fill="${colors.ink}" font-size="34" font-weight="850">
    ${tspans(lessonLines, 110, 398, 39)}
  </text>
  <text x="110" y="446" class="sans" fill="${colors.inkSoft}" font-size="23" font-weight="700">${escapeXml(operatorLine)}</text>

  ${
    takeawayLines.length
      ? `<rect x="78" y="482" width="658" height="64" rx="14" fill="${colors.paper}" stroke="${colors.inkMute}" stroke-width="2"/>
  <text x="104" y="522" class="serif" fill="${colors.ink}" font-size="25" font-style="italic" font-weight="700">${tspans(takeawayLines, 104, 522, 29)}</text>`
      : ""
  }

  <line x1="778" y1="82" x2="778" y2="520" stroke="${colors.ink}" stroke-width="4"/>
  <rect x="826" y="86" width="250" height="54" rx="16" fill="${colors.ink}"/>
  <text x="951" y="123" text-anchor="middle" class="sans label" fill="${colors.gold}">Score</text>
  <text x="826" y="302" class="serif mono" fill="${colors.ink}" font-size="154" font-weight="900">${result.result.totalCorrect}/5</text>
  <rect x="826" y="330" width="250" height="76" rx="18" fill="${colors.accent}" stroke="${colors.ink}" stroke-width="3"/>
  <text x="951" y="381" text-anchor="middle" class="serif mono" fill="${colors.paper}" font-size="48" font-weight="900">${result.result.totalPoints} pts</text>
  <rect x="826" y="428" width="250" height="60" rx="18" fill="${colors.paperWarm}" stroke="${colors.ink}" stroke-width="3"/>
  <text x="951" y="467" text-anchor="middle" class="sans" fill="${colors.ink}" font-size="26" font-weight="900">${escapeXml(rankText)}</text>

  <g transform="translate(1094 112)">
    <rect x="-18" y="-18" width="56" height="56" rx="13" fill="${colors.paperWarm}" stroke="${colors.ink}" stroke-width="3"/>
    <path d="M -2 5 h24 M 10 -7 v24 M -10 -4 h8 v18 h-8 z M 22 -4 h8 v18 h-8 z" fill="none" stroke="${colors.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <rect x="42" y="566" width="1116" height="24" fill="${colors.ink}"/>
  <text x="600" y="612" text-anchor="middle" class="sans" fill="${colors.ink}" font-size="24" font-weight="900">
    Take today's rep at <tspan fill="${colors.accent}">daily.deepikamurthy.com</tspan>
  </text>
</svg>`;
}
