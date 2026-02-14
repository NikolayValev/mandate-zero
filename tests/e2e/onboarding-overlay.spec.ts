import { expect, test } from "@playwright/test";

test("first turn onboarding overlay appears and can be dismissed", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/");

  await expect(page.getByTestId("onboarding-title")).toBeVisible();
  await page.getByTestId("onboarding-dismiss").click();
  await expect(page.getByTestId("onboarding-title")).toHaveCount(0);
});
