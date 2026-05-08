import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as kvKeys from "$lib/server/kv/keys";
import { formatInTimeZone } from "date-fns-tz";

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (locals.user) throw redirect(302, "/today");
  if (!platform?.env) {
    return { previewQuestion: null, todayDate: new Date().toISOString().slice(0, 10) };
  }
  const date = formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
  const cached = await platform.env.KV.get(kvKeys.todayQuestions(date));
  if (!cached) return { previewQuestion: null, todayDate: date };
  const qs = JSON.parse(cached) as Array<any>;
  const q = qs.length ? qs[Math.floor(Math.random() * qs.length)] : null;
  return { previewQuestion: q, todayDate: date };
};
