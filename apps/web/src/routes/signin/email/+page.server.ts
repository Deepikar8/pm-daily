import type { PageServerLoad } from "./$types";
import { isGoogleAuthEnabled } from "$lib/server/auth/config";

export const load: PageServerLoad = async ({ platform }) => ({
  googleEnabled: isGoogleAuthEnabled(
    platform?.env?.GOOGLE_CLIENT_ID,
    platform?.env?.GOOGLE_CLIENT_SECRET,
  ),
});

