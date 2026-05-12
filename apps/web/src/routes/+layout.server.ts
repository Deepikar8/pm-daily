import type { LayoutServerLoad } from "./$types";

/**
 * Plumb `locals.user` to the layout so the global Nav can render
 * conditionally on authenticated routes. Returning a typed user object
 * (or null) lets `+layout.svelte` and any descendant page access it via
 * `data.user`.
 */
export const load: LayoutServerLoad = async ({ locals, platform }) => {
  return {
    user: locals.user,
    analytics: {
      posthogKey: platform?.env?.PUBLIC_POSTHOG_KEY || "",
      posthogHost: platform?.env?.PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    },
  };
};
