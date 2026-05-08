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
};

export function createAuth(args: AuthArgs) {
  const resend = new Resend(args.resendApiKey);

  const socialProviders =
    args.googleClientId && args.googleClientSecret
      ? {
          google: {
            clientId: args.googleClientId,
            clientSecret: args.googleClientSecret,
          },
        }
      : undefined;

  return betterAuth({
    secret: args.secret,
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
          if (!args.resendApiKey) {
            console.log("[dev] magic link for", email, "->", url);
            return;
          }
          await resend.emails.send({
            from: "PM Daily <noreply@pmdaily.app>",
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
