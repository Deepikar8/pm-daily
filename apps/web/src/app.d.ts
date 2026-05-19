declare global {
  namespace App {
    interface Locals {
      user:
        | {
            id: string;
            email: string;
            displayName: string;
            timezone: string;
          }
        | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        ASSETS: {
          fetch(request: Request | string): Promise<Response>;
        };
        KV: KVNamespace;
        VECTORIZE: VectorizeIndex;
        QUIZ_SESSION: DurableObjectNamespace;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
        RESEND_API_KEY: string;
        PUBLIC_POSTHOG_KEY?: string;
        PUBLIC_POSTHOG_HOST?: string;
      };
    }
  }
}
export {};
