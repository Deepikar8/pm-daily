import { expect, test } from "@playwright/test";

test("home always shows product proof before auth", async ({ page }) => {
  await page.goto("/");

  // Either real preview or fallback — both must show *some* preview block
  const previewVisible = page.getByText(/Today's question|Sample question/i);
  await expect(previewVisible).toBeVisible();

  await expect(page.getByText("sign in to submit", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Email me a magic link/i })).toBeVisible();
});

test("home mobile keeps primary content in the first viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Five questions a day, sourced from Lenny's Podcast\./ })).toBeVisible();
  await expect(page.getByText(/Today's question|Sample question/i)).toBeVisible();
});
