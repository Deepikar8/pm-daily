import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import type { DB } from "../db/client";

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
    args.googleClientId && args.googleClientSecret
      ? {
          google: {
            clientId: args.googleClientId,
            clientSecret: args.googleClientSecret,
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
    database: drizzleAdapter(args.db, { provider: "sqlite" }),
    emailAndPassword: { enabled: false },
    user: {
      additionalFields: {
        displayName: { type: "string", required: false },
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
