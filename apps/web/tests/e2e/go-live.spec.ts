import { expect, test } from "@playwright/test";

test("landing page does not show fake usage claims", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("4,247 PMs played")).toHaveCount(0);
  await expect(page.getByText(/daily product judgment rep/i)).toBeVisible();
});

test("public users can try one sample rep before sign-in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /try a sample rep/i }).click();

  await expect(page).toHaveURL(/\/demo/);
  await expect(page.getByText("Sample rep", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Make the call/i })).toBeVisible();
});

test("public users can read today's lesson before sign-in", async ({ page }) => {
  await page.goto("/today");

  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByText(/sign in/i)).toHaveCount(0);
  await expect(page.getByRole("heading")).toBeVisible();
});
