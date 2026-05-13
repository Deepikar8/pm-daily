import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db/client";
import { quizAttempts, users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const GET: RequestHandler = async ({ params, platform }) => {
  if (!platform?.env) throw error(500, "platform unavailable");

  const db = getDb(platform.env.DB);
  const attempt = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.id, params.attemptId))
    .get();
  if (!attempt?.submittedAt) throw error(404, "result not found");

  const user = await db.select().from(users).where(eq(users.id, attempt.userId)).get();
  const name = user && !user.deletedAt ? user.displayName : "Product Gym athlete";
  const correct = attempt.totalCorrect ?? 0;
  const points = attempt.totalPoints ?? 0;
  const date = attempt.date;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FBF7F0"/>
  <rect x="46" y="42" width="1108" height="546" rx="34" fill="#FFFFFF" stroke="#1F1A14" stroke-width="6"/>
  <rect x="84" y="80" width="1032" height="470" rx="28" fill="#F4EFD8" stroke="#1F1A14" stroke-width="4"/>
  <circle cx="985" cy="159" r="64" fill="#D2691E" stroke="#1F1A14" stroke-width="5"/>
  <path d="M960 164c0-25 18-45 40-45s40 20 40 45v28h-80v-28z" fill="#FBF7F0" stroke="#1F1A14" stroke-width="5"/>
  <rect x="942" y="190" width="116" height="30" rx="15" fill="#1F1A14"/>
  <text x="110" y="132" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="5" fill="#D2691E">PRODUCT GYM</text>
  <text x="110" y="210" font-family="Georgia, serif" font-size="56" font-weight="800" fill="#1F1A14">${esc(name)} scored</text>
  <text x="110" y="337" font-family="Georgia, serif" font-size="138" font-weight="900" fill="#1F1A14">${correct}/5</text>
  <text x="110" y="403" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#5A8A3A">${points.toLocaleString()} points · ${esc(date)}</text>
  <text x="110" y="476" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#3D3328">One daily challenge to sharpen your product instincts.</text>
  <rect x="110" y="505" width="274" height="58" rx="18" fill="#D2691E" stroke="#1F1A14" stroke-width="4"/>
  <text x="146" y="544" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="#FBF7F0">Beat this score</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
