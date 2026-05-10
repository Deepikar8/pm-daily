import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { formatInTimeZone } from "date-fns-tz";

const fallbackQuestion = {
  position: 1,
  archetype: "diagnose",
  scenario_md:
    "A founder says activation is flat, but power users keep inviting teammates. What should the PM investigate first?",
  options: [
    { key: "A", text: "Whether invited teammates reach the same aha moment as the inviter" },
    { key: "B", text: "Whether the homepage explains every feature" },
    { key: "C", text: "Whether paid ads can increase top-of-funnel volume" },
    { key: "D", text: "Whether the team should add more notification channels" },
  ],
  correct_key: "A",
  explanation_md:
    "The strongest signal is not more traffic. It is whether the invited teammate reaches the same value moment that caused the original user to invite them.",
  pm_takeaway: "Follow the activation chain, not the loudest metric.",
};

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform?.env) return { question: fallbackQuestion, isFallback: true };

  const date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
  const cached = await platform.env.KV.get(kvKeys.todayQuestions(date));
  const questions = cached ? JSON.parse(cached) : [];

  return { question: questions[0] ?? fallbackQuestion, isFallback: questions.length === 0 };
};
