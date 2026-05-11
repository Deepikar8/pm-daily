import { expect, test } from "@playwright/test";

test("home always shows product proof before auth", async ({ page }) => {
  await page.goto("/");

  // Either real preview or fallback — both must show *some* preview block.
  const previewVisible = page.getByText(/Today’s first decision|Sample decision/i);
  await expect(previewVisible).toBeVisible();

  await expect(page.getByText(/Answer one decision here/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Add the daily reminder/i })).toBeVisible();
});

test("home mobile keeps primary content in the first viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Product Gym/i })).toBeVisible();
  await expect(page.getByText(/One daily challenge to sharpen your product instincts/i)).toBeVisible();
});

test("leaderboard empty state offers a next action", async ({ page }) => {
  await page.goto("/leaderboard");

  await expect(page.getByRole("link", { name: /Start today’s challenge/i })).toBeVisible();
  await expect(page.getByText(/Take today’s rep/i)).toHaveCount(0);
});
