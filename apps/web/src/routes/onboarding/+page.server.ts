import { redirect, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { getDb } from "$lib/server/db/client";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/today";
  return value;
}

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");

  // If the user has already accepted terms, they're onboarded → /today
  const db = getDb(platform.env.DB);
  const row = await db
    .select({
      termsAcceptedAt: users.termsAcceptedAt,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, locals.user.id))
    .get();

  if (row?.termsAcceptedAt && row.displayName) {
    throw redirect(302, safeNext(url.searchParams.get("next")));
  }

  return {
    suggestedDisplayName: row?.displayName ?? "",
    next: safeNext(url.searchParams.get("next")),
  };
};

export const actions: Actions = {
  default: async ({ request, locals, platform }) => {
    if (!locals.user) throw redirect(302, "/");

    const data = await request.formData();
    const displayName = String(data.get("displayName") ?? "").trim();
    const timezone = String(data.get("timezone") ?? "UTC").trim();
    const company = String(data.get("company") ?? "").trim() || null;
    const role = String(data.get("role") ?? "").trim() || null;
    const accept = data.get("acceptTerms") === "on";
    const next = safeNext(String(data.get("next") ?? ""));
    const values = { displayName, timezone, company, role };

    if (!platform?.env)
      return fail(500, { error: "platform unavailable", values });
    if (!displayName)
      return fail(400, {
        error: "Display name is required.",
        values,
      });
    if (!accept)
      return fail(400, {
        error: "You must agree to the Terms and Privacy Policy.",
        values,
      });

    const db = getDb(platform.env.DB);
    await db
      .update(users)
      .set({
        displayName,
        timezone,
        company,
        role,
        termsAcceptedAt: Date.now(),
        termsVersion: "v1.0",
        lastActiveAt: Date.now(),
      })
      .where(eq(users.id, locals.user.id))
      .run();

    throw redirect(302, next);
  },
};
