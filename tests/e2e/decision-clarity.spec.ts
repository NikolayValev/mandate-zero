import { expect, test } from "@playwright/test";
import { chooseDoctrine, resetLocalStateAndOpenHome } from "./helpers";

test("decision cards show scenarios, mandate targets, and pressure projections", async ({ page }) => {
  await resetLocalStateAndOpenHome(page);
  await chooseDoctrine(page, "technocrat");

  const firstOption = page.locator("[data-testid^='crisis-option-']").first();
  await expect(firstOption).toContainText("Situation");
  await expect(firstOption.locator("[data-testid^='pressure-projection-']").first()).toContainText(
    /Projected pressure/,
  );

  const mandateTargets = page.getByTestId("mandate-targets-card");
  await expect(mandateTargets).toBeVisible();
  await expect(page.getByTestId("mandate-target-stability")).toContainText(/PASS|FAIL/);
  await expect(page.getByTestId("mandate-target-pressure")).toContainText(/PASS|FAIL/);

  await expect(page.getByText("Predicted stats:")).toHaveCount(0);
  await expect(page.getByText("Predicted resources:")).toHaveCount(0);
  await expect(page.getByTestId("system-tier-stability")).toContainText(
    /Critical|Fragile|Unstable|Stable|Strong/,
  );
  await expect(page.getByTestId("pressure-label")).toContainText(/Pressure (Calm|Tense|Hot|Breaking)/);
});
