import type { LayoutServerLoad } from "./$types";

/**
 * Plumb `locals.user` to the layout so the global Nav can render
 * conditionally on authenticated routes. Returning a typed user object
 * (or null) lets `+layout.svelte` and any descendant page access it via
 * `data.user`.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
