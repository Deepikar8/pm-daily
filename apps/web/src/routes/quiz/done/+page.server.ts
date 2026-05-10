import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { localDate } from "$lib/server/timezone/helpers";

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");
  const tz = locals.user.timezone ?? "UTC";
  const date = localDate(tz);
  throw redirect(302, `/quiz/${date}/done`);
};
