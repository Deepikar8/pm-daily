import type { Cookies } from "@sveltejs/kit";

export const ANON_QUIZ_COOKIE = "pg_anon_quiz";
export const PENDING_QUIZ_COOKIE = "pg_pending_quiz";

const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 14,
};

export function anonymousUserId(anonId: string): string {
  return `anon:${anonId}`;
}

export function getOrCreateAnonymousQuizId(cookies: Cookies): string {
  const existing = cookies.get(ANON_QUIZ_COOKIE);
  if (existing) return existing;
  const next = crypto.randomUUID();
  cookies.set(ANON_QUIZ_COOKIE, next, cookieOptions);
  return next;
}

export function getAnonymousQuizId(cookies: Cookies): string | null {
  return cookies.get(ANON_QUIZ_COOKIE) ?? null;
}

export function setPendingQuizClaim(cookies: Cookies, args: { anonId: string; date: string }) {
  cookies.set(PENDING_QUIZ_COOKIE, JSON.stringify(args), cookieOptions);
}

export function getPendingQuizClaim(cookies: Cookies): { anonId: string; date: string } | null {
  const raw = cookies.get(PENDING_QUIZ_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { anonId?: unknown; date?: unknown };
    if (typeof parsed.anonId !== "string" || typeof parsed.date !== "string") return null;
    return { anonId: parsed.anonId, date: parsed.date };
  } catch {
    return null;
  }
}

export function clearPendingQuizClaim(cookies: Cookies) {
  cookies.delete(PENDING_QUIZ_COOKIE, { path: "/" });
}
