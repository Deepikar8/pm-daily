import { expect, test } from "@playwright/test";

test("cold visitor understands the product before auth", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Product Gym" })).toBeVisible();
  await expect(page.getByText("One daily challenge to sharpen your product instincts.")).toBeVisible();
  await expect(page.getByText(/operator of the day/i)).toBeVisible();
  await expect(page.getByText(/today.s first decision|sample decision/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^A / })).toBeVisible();
  await expect(page.getByRole("button", { name: /check my decision/i })).toBeDisabled();
  await expect(page.getByText(/want the full challenge/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /add the daily reminder/i })).toBeVisible();
});

test("cold visitor can answer Q1 before continuing to the full challenge", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /^A / }).click();
  await expect(page.getByText(/selected A/i)).toBeVisible();
  await page.getByRole("button", { name: /check my decision/i }).click();

  await expect(page.getByText(/training note|good decision/i)).toBeVisible();
  await expect(page.getByText(/ready for the full challenge/i)).toBeVisible();
  await expect(page.getByText(/answer all 5 now/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /start the full challenge/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /add the daily reminder/i })).toBeVisible();
});

test("public today page teaches first and keeps challenge CTAs clear", async ({ page }) => {
  await page.goto("/today");

  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByText(/operator of the day/i)).toBeVisible();
  await expect(page.getByText(/podcast recap/i)).toBeVisible();
  await expect(page.getByText("Takeaways", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /start today.s challenge/i })).toHaveCount(2);
  await expect(page.getByText(/sign in/i)).toHaveCount(0);
});

test("logged-out protected account routes recover to landing", async ({ page }) => {
  for (const path of ["/me", "/onboarding"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Product Gym" })).toBeVisible();
  }
});

test("leaderboard uses leaderboard-first navigation and CTA language", async ({ page }) => {
  await page.goto("/leaderboard");

  await expect(page.getByRole("button", { name: /this week/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /all-time/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start today.s challenge/i })).toBeVisible();
  await expect(page.getByText(/take today.s rep/i)).toHaveCount(0);
});
