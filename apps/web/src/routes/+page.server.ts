import type { PageServerLoad } from "./$types";
import { isGoogleAuthEnabled } from "$lib/server/auth/config";
import * as kvKeys from "$lib/server/kv/keys";
import { formatInTimeZone } from "date-fns-tz";
import { normalizeSourceLinks } from "$lib/server/content/source-links";

const fallbackPreviewQuestion = {
  position: 1,
  archetype: "diagnose",
  scenario_md:
    "A founder says activation is flat, but power users keep inviting teammates. What should the PM investigate first?",
  options: [
    { key: "A", text: "Whether the invited teammates reach the same aha moment as the inviter" },
    { key: "B", text: "Whether the homepage explains every feature in the product" },
    { key: "C", text: "Whether paid ads can increase top-of-funnel volume" },
    { key: "D", text: "Whether the team should add more notification channels" },
  ],
  correct_key: "A",
  explanation_md:
    "The strongest signal is not more traffic. It is whether the invited teammate reaches the same value moment that caused the original user to invite them.",
  pm_takeaway: "Follow the activation chain, not the loudest metric.",
};

const fallbackTodayContent = {
  headline: "Cat Wu on shipping speed: how Anthropic compresses six-month timelines to a week",
  source: {
    title: "How Anthropic's product team moves faster than anyone else",
    byline: "Cat Wu",
    type: "podcast",
    date: "2026-04-23",
    search_url: "https://www.lennysnewsletter.com/p/how-anthropics-product-team-moves",
  },
};

const launchProof = "A daily product judgment rep sourced from expert product conversations.";

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform?.env) {
    return {
      previewQuestion: fallbackPreviewQuestion,
      todayDate: new Date().toISOString().slice(0, 10),
      todayContent: fallbackTodayContent,
      googleEnabled: false,
      isFallback: true,
      launchProof,
    };
  }
  const googleEnabled = isGoogleAuthEnabled(
    platform.env.GOOGLE_CLIENT_ID,
    platform.env.GOOGLE_CLIENT_SECRET,
  );
  const date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
  const [cached, digest] = await Promise.all([
    platform.env.KV.get(kvKeys.todayQuestions(date)),
    platform.env.KV.get(kvKeys.todayDigest(date)),
  ]);
  const parsedDigest = digest ? JSON.parse(digest) : null;
  const todayContent = parsedDigest
    ? { ...parsedDigest, source: normalizeSourceLinks(parsedDigest.source) }
    : fallbackTodayContent;
  if (!cached) {
    return {
      previewQuestion: fallbackPreviewQuestion,
      todayDate: date,
      todayContent,
      googleEnabled,
      isFallback: true,
      launchProof,
    };
  }
  const qs = JSON.parse(cached) as Array<any>;
  const q = qs.length ? qs[0] : fallbackPreviewQuestion;
  return {
    previewQuestion: q,
    todayDate: date,
    todayContent,
    googleEnabled,
    isFallback: qs.length === 0,
    launchProof,
  };
};
