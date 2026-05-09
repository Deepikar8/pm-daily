import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import type { DB } from "../db/client";
import { isGoogleAuthEnabled } from "./config";

export type AuthArgs = {
  db: DB;
  secret: string;
  baseURL: string;
  googleClientId?: string;
  googleClientSecret?: string;
  resendApiKey: string;
  // Sender for the magic-link email. Default is Resend's verified
  // `onboarding@resend.dev` so a fresh Resend account works out of
  // the box. Override with a verified custom domain when ready.
  emailFrom?: string;
};

export function createAuth(args: AuthArgs) {
  // Resend's constructor throws if the API key is missing/empty, so only
  // instantiate it when we actually have a key. Local dev with a blank
  // RESEND_API_KEY will fall back to logging the magic link.
  const resend = args.resendApiKey ? new Resend(args.resendApiKey) : null;

  const socialProviders =
    isGoogleAuthEnabled(args.googleClientId, args.googleClientSecret)
      ? {
          google: {
            clientId: args.googleClientId!,
            clientSecret: args.googleClientSecret!,
          },
        }
      : undefined;

  // Better Auth requires a non-trivial secret; if `.dev.vars` is missing or
  // ships an empty/short value, fall back to a stable dev-only secret so the
  // server can still boot. Production must always supply a real secret.
  const secret =
    args.secret && args.secret.length >= 32
      ? args.secret
      : "dev-only-fallback-secret-do-not-use-in-prod-32chars";

  return betterAuth({
    secret,
    baseURL: args.baseURL,
    basePath: "/auth",                     // route handler lives at /auth/[...all]
    database: drizzleAdapter(args.db, { provider: "sqlite" }),
    emailAndPassword: { enabled: false },
    // Magic-link sign-ups never pass `name`/`timezone`/`lastActiveAt`, but
    // the Drizzle schema requires `display_name`, `timezone`, and
    // `last_active_at` to be NOT NULL. Without this hook the verify step's
    // INSERT into `users` fails (surfacing as a 404/redirect on the user's
    // magic-link click). Populate safe defaults here; onboarding will let
    // the user override displayName/timezone afterwards.
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const data: Record<string, unknown> = { ...user };
            const name = data.name;
            if (typeof name !== "string" || !name.trim()) {
              const email = typeof data.email === "string" ? data.email : "";
              const prefix = email.split("@")[0];
              data.name = prefix && prefix.trim() ? prefix : "Anonymous PM";
            }
            if (!data.timezone) data.timezone = "UTC";
            // `last_active_at` is declared as `integer` without
            // `timestamp_ms` mode, so Drizzle won't auto-convert a
            // Date here — pass milliseconds directly to match the
            // `additionalFields.lastActiveAt: number` shape.
            if (!data.lastActiveAt) data.lastActiveAt = Date.now();
            return { data: data as typeof user };
          },
        },
      },
    },
    user: {
      // Our table is `users` (plural) and we store the user's name in
      // `display_name` instead of Better Auth's default `name` column.
      // Map both via the user config so the drizzle adapter targets our
      // existing schema.
      modelName: "users",
      fields: {
        name: "displayName",
      },
      additionalFields: {
        company: { type: "string", required: false },
        role: { type: "string", required: false },
        timezone: { type: "string", required: false },
        termsAcceptedAt: { type: "number", required: false },
        termsVersion: { type: "string", required: false },
        deletedAt: { type: "number", required: false },
        lastActiveAt: { type: "number", required: false },
      },
    },
    socialProviders,
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          if (!resend) {
            console.log("[dev] magic link for", email, "->", url);
            return;
          }
          await resend.emails.send({
            from: args.emailFrom || "PM Daily <onboarding@resend.dev>",
            to: email,
            subject: "Sign in to PM Daily",
            html: `<p>Click to sign in: <a href="${url}">${url}</a></p>
                   <p>Magic link only - we email you only for sign-in.
                   Daily reminders happen via your calendar.</p>`,
          });
        },
      }),
    ],
  });
}
