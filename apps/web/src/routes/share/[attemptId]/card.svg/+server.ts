import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { normalizeShareTakeaway } from "$lib/brand/share";
import { devShareResult } from "$lib/server/share/dev-sample";
import { readPublicShareResult } from "$lib/server/share/public-result";
import { renderShareCardSvg } from "$lib/server/share/share-card";

export const GET: RequestHandler = async ({ params, platform, url }) => {
  if (!platform?.env) throw error(500, "platform unavailable");
  const result =
    process.env.NODE_ENV !== "production" && params.attemptId === "dev-sample"
      ? devShareResult(url.origin)
      : await readPublicShareResult({
          env: platform.env,
          attemptId: params.attemptId,
          origin: url.origin,
        });
  if (!result) throw error(404, "result not found");

  return new Response(renderShareCardSvg({ ...result, takeaway: normalizeShareTakeaway(url.searchParams.get("takeaway")) }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
};
