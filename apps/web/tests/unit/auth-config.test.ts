import { describe, expect, it } from "vitest";
import { isGoogleAuthEnabled, resolveAuthBaseURL } from "../../src/lib/server/auth/config";

describe("auth config helpers", () => {
  it("uses the current request origin for auth URLs", () => {
    expect(
      resolveAuthBaseURL("https://pm-daily.example.com/auth/sign-in/magic-link", "http://localhost:5173"),
    ).toBe("https://pm-daily.example.com");
  });

  it("falls back to configured base URL when request URL is invalid", () => {
    expect(resolveAuthBaseURL("not a url", "https://configured.example.com")).toBe(
      "https://configured.example.com",
    );
  });

  it("only enables Google when both credentials are non-empty", () => {
    expect(isGoogleAuthEnabled("id", "secret")).toBe(true);
    expect(isGoogleAuthEnabled("id", "")).toBe(false);
    expect(isGoogleAuthEnabled("", "secret")).toBe(false);
    expect(isGoogleAuthEnabled(undefined, undefined)).toBe(false);
  });
});
