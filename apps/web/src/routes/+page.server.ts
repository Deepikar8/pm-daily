import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { isGoogleAuthEnabled } from "$lib/server/auth/config";
import * as kvKeys from "$lib/server/kv/keys";
import { formatInTimeZone } from "date-fns-tz";

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
};

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (locals.user) throw redirect(302, "/today");
  if (!platform?.env) {
    return {
      previewQuestion: fallbackPreviewQuestion,
      todayDate: new Date().toISOString().slice(0, 10),
      googleEnabled: false,
      isFallback: true,
    };
  }
  const googleEnabled = isGoogleAuthEnabled(
    platform.env.GOOGLE_CLIENT_ID,
    platform.env.GOOGLE_CLIENT_SECRET,
  );
  const date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
  const cached = await platform.env.KV.get(kvKeys.todayQuestions(date));
  if (!cached) {
    return {
      previewQuestion: fallbackPreviewQuestion,
      todayDate: date,
      googleEnabled,
      isFallback: true,
    };
  }
  const qs = JSON.parse(cached) as Array<any>;
  const q = qs.length ? qs[Math.floor(Math.random() * qs.length)] : fallbackPreviewQuestion;
  return { previewQuestion: q, todayDate: date, googleEnabled, isFallback: qs.length === 0 };
};
