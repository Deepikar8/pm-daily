export function isGoogleAuthEnabled(
  googleClientId: string | undefined,
  googleClientSecret: string | undefined,
): boolean {
  return Boolean(googleClientId?.trim() && googleClientSecret?.trim());
}

export function resolveAuthBaseURL(requestUrl: string, configuredBaseURL?: string): string {
  try {
    return new URL(requestUrl).origin;
  } catch {
    return configuredBaseURL || "http://localhost:5173";
  }
}
