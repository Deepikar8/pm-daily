import { expect, test } from "@playwright/test";

test("landing page does not show fake usage claims", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("4,247 PMs played")).toHaveCount(0);
  await expect(page.getByText(/daily product judgment rep/i)).toBeVisible();
});

test("public users can answer one landing question before sign-in", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/operator of the day/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cat Wu" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^A / })).toBeVisible();
  await expect(page.getByRole("button", { name: /^D / })).toBeVisible();
  await page.getByRole("button", { name: /^A / }).click();
  await page.getByRole("button", { name: /check my decision/i }).click();

  await expect(page.getByText(/training note|good decision/i)).toBeVisible();
  await expect(page.getByText(/ready for the full challenge/i)).toBeVisible();
  await expect(page.getByText(/answer all 5 now/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /start the full challenge/i })).toBeVisible();
});

test("public users can read today's lesson before sign-in", async ({ page }) => {
  await page.goto("/today");

  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByText(/sign in/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Cat Wu on shipping speed/i })).toBeVisible();
});

test("landing page stays accessible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Product Gym/i })).toBeVisible();
});
