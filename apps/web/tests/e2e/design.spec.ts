import { expect, test } from "@playwright/test";

test("home always shows product proof before auth", async ({ page }) => {
  await page.goto("/");

  // Either real preview or fallback — both must show *some* preview block
  const previewVisible = page.getByText(/Today's rep|Sample rep/i);
  await expect(previewVisible).toBeVisible();

  await expect(page.getByText("sign in to save your streak", { exact: false })).toBeVisible();
  // Magic-link is the always-available auth path (no env creds required).
  // Google button is conditional on GOOGLE_CLIENT_ID/SECRET being set, so we
  // don't assert it here — covered separately when those creds exist.
  await expect(page.getByRole("link", { name: /Email me a magic link/i })).toBeVisible();
});

test("home mobile keeps primary content in the first viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Train your product judgment with one daily rep\./ })).toBeVisible();
  await expect(page.getByText(/Today's rep|Sample rep/i)).toBeVisible();
});

test("leaderboard empty state offers a next action", async ({ page }) => {
  await page.goto("/leaderboard");

  await expect(page.getByText(/No Arena standings yet/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Take today’s rep/i })).toBeVisible();
});
