import { expect, test } from "@playwright/test";
import { chooseDoctrine, resetLocalStateAndOpenHome, resolveFirstCrisisOption } from "./helpers";

test("causality selection highlights impacted systems and regions", async ({ page }) => {
  await resetLocalStateAndOpenHome(page);
  await chooseDoctrine(page, "technocrat");
  await resolveFirstCrisisOption(page);

  const firstEntry = page.getByTestId("causality-entry").first();
  await firstEntry.click();

  await expect(firstEntry).toContainText("Immediate:");
  await expect(firstEntry).toContainText("Affected regions:");

  await expect(page.locator("[data-testid^='system-row-'][data-highlighted='true']").first()).toBeVisible();
  await expect(page.locator("[data-testid^='region-card-'][data-highlighted='true']").first()).toBeVisible();
});
