import { ImageResponse } from "@vercel/og";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { normalizeShareTakeaway } from "$lib/brand/share";
import { brandCopy } from "$lib/brand/product-gym";
import { devShareResult } from "$lib/server/share/dev-sample";
import { readPublicShareResult } from "$lib/server/share/public-result";

const c = {
  paper: "#FFF8EC",
  paperWarm: "#FFECCF",
  paperCream: "#FFF0D6",
  ink: "#2A1810",
  inkSoft: "#6B5442",
  inkMute: "#9A7F63",
  accent: "#D86F24",
  gold: "#F7C37A",
  white: "#FFFFFF",
};

function node(type: string, props: Record<string, unknown> = {}, ...children: unknown[]) {
  const visibleChildren = children.filter((child) => child !== null && child !== undefined && child !== false);
  return {
    type,
    props: {
      ...props,
      children: visibleChildren.length <= 1 ? visibleChildren[0] : visibleChildren,
    },
  };
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

export const GET: RequestHandler = async ({ params, platform, url }) => {
  if (!platform?.env) throw error(500, "platform unavailable");
  const result =
    process.env.NODE_ENV !== "production" && params.attemptId === "dev-sample"
      ? devShareResult(url.origin)
      : await readPublicShareResult({
          env: platform.env,
          attemptId: params.attemptId,
          origin: url.origin,
        });
  if (!result) throw error(404, "result not found");

  const operatorLine = result.session.sourceByline
    ? `From ${result.session.sourceByline} via ${sourceTypeLabel(result.session.sourceType)}`
    : sourceTypeLabel(result.session.sourceType);
  const rankText = result.result.rank ? `#${result.result.rank} this week` : "Leaderboard ready";
  const takeaway = normalizeShareTakeaway(url.searchParams.get("takeaway"));
  const headlineLines = wrapText(`${result.player.displayName} practiced today's PM rep`, 23, 2);
  const fonts = await Promise.all([
    platform.env.ASSETS.fetch(`${url.origin}/fonts/dm-sans-700.ttf`).then(async (response) => ({
      name: "DM Sans",
      data: await response.arrayBuffer(),
      weight: 700 as const,
      style: "normal" as const,
    })),
    platform.env.ASSETS.fetch(`${url.origin}/fonts/fraunces-900.ttf`).then(async (response) => ({
      name: "Fraunces",
      data: await response.arrayBuffer(),
      weight: 900 as const,
      style: "normal" as const,
    })),
  ]).catch(() => []);

  return new ImageResponse(
    node(
      "div",
      {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          background: c.paper,
          color: c.ink,
          padding: "40px 42px 64px 42px",
          fontFamily: "DM Sans",
          position: "relative",
        },
      },
      node("div", {
        style: {
          position: "absolute",
          left: 54,
          top: 52,
          width: 1116,
          height: 526,
          border: `6px solid ${c.accent}`,
          borderRadius: 24,
        },
      }),
      node(
        "div",
        {
          style: {
            width: "1116px",
            height: "526px",
            display: "flex",
            background: c.white,
            border: `4px solid ${c.ink}`,
            borderRadius: 24,
            padding: "34px 36px",
            gap: 36,
            position: "relative",
          },
        },
        node(
          "div",
          {
            style: {
              width: 690,
              display: "flex",
              flexDirection: "column",
            },
          },
          node(
            "div",
            {
              style: {
                alignSelf: "flex-start",
                background: c.paperCream,
                color: c.accent,
                borderRadius: 999,
                width: 216,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 2,
                lineHeight: "44px",
                textTransform: "uppercase",
              },
            },
            brandCopy.appName,
          ),
          node(
            "div",
            {
              style: {
                marginTop: 28,
                fontFamily: "Fraunces",
                fontSize: takeaway ? 46 : 60,
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: -2,
                display: "flex",
                flexDirection: "column",
              },
            },
            ...headlineLines.map((line) => node("div", {}, line)),
          ),
          node(
            "div",
            {
              style: {
                marginTop: takeaway ? 24 : 34,
                background: c.paperCream,
                border: `3px solid ${c.ink}`,
                borderRadius: 18,
                padding: takeaway ? "20px 26px" : "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              },
            },
            node(
              "div",
              {
                style: {
                  color: c.accent,
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                },
              },
              "Today's lesson",
            ),
            node(
              "div",
              {
                style: {
                  fontFamily: "Fraunces",
                  fontSize: takeaway ? 30 : 34,
                  fontWeight: 900,
                  lineHeight: 1.08,
                },
              },
              result.session.headline,
            ),
            node(
              "div",
              {
                style: {
                  color: c.inkSoft,
                  fontSize: 23,
                  fontWeight: 800,
                  marginTop: 4,
                },
            },
            operatorLine,
          ),
          ),
          takeaway
            ? node(
                "div",
                {
                  style: {
                    marginTop: 16,
                    background: c.white,
                    border: `3px solid ${c.ink}`,
                    borderRadius: 16,
                    padding: "14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    color: c.ink,
                    boxShadow: `4px 4px 0 ${c.accent}`,
                  },
                },
                node(
                  "div",
                  {
                    style: {
                      color: c.accent,
                      fontSize: 17,
                      fontWeight: 900,
                      letterSpacing: 1.8,
                      textTransform: "uppercase",
                    },
                  },
                  "My takeaway",
                ),
                node(
                  "div",
                  {
                    style: {
                      fontFamily: "Fraunces",
                      fontSize: 22,
                      lineHeight: 1.12,
                      color: c.ink,
                      fontWeight: 900,
                    },
                  },
                  takeaway,
                ),
              )
            : null,
        ),
        node("div", {
          style: {
            width: 4,
            height: 438,
            background: c.ink,
            marginTop: 8,
          },
        }),
        node(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 8,
            },
          },
          node(
            "div",
            {
              style: {
                width: 250,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: c.ink,
                color: c.gold,
                borderRadius: 16,
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
              },
            },
            "Score",
          ),
          node(
            "div",
            {
              style: {
                marginTop: 34,
                fontFamily: "Fraunces",
                fontSize: 150,
                fontWeight: 900,
                lineHeight: 0.9,
              },
            },
            `${result.result.totalCorrect}/5`,
          ),
          node(
            "div",
            {
              style: {
                marginTop: 28,
                width: 250,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: c.accent,
                color: c.paper,
                border: `3px solid ${c.ink}`,
                borderRadius: 18,
                fontFamily: "Fraunces",
                fontSize: 48,
                fontWeight: 900,
              },
            },
            `${result.result.totalPoints} pts`,
          ),
          node(
            "div",
            {
              style: {
                marginTop: 20,
                width: 250,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: c.paperWarm,
                color: c.ink,
                border: `3px solid ${c.ink}`,
                borderRadius: 18,
                fontSize: 26,
                fontWeight: 900,
              },
            },
            rankText,
          ),
        ),
      ),
      node(
        "div",
        {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.ink,
            fontSize: 24,
            fontWeight: 900,
          },
        },
        "Take today's rep at ",
        node("span", { style: { color: c.accent, marginLeft: 8 } }, "daily.deepikamurthy.com"),
      ),
    ) as any,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  );
};
