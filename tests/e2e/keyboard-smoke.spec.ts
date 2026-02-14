import { expect, test } from "@playwright/test";
import { resetLocalStateAndOpenHome } from "./helpers";

test("core crisis loop is keyboard-triggerable for primary decisions", async ({ page }) => {
  await resetLocalStateAndOpenHome(page);

  const doctrine = page.getByTestId("doctrine-technocrat");
  await doctrine.focus();
  await page.keyboard.press("Enter");
  await expect(doctrine).toHaveCount(0);

  const firstOption = page.locator("[data-testid^='crisis-option-']").first();
  await firstOption.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("causality-entry").first()).toBeVisible();
});
