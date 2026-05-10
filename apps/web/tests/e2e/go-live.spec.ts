import { expect, test } from "@playwright/test";

test("landing page does not show fake usage claims", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("4,247 PMs played")).toHaveCount(0);
  await expect(page.getByText(/daily product judgment rep/i)).toBeVisible();
});
