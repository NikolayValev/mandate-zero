import { expect, test } from "@playwright/test";
import { resetLocalStateAndOpenHome } from "./helpers";

test.describe("Automated Bot Player", () => {
  // Give the bot plenty of time to play through the 12 turns (or early collapse)
  test.setTimeout(120000);

  test("plays through a complete game automatically", async ({ page }) => {
    // 1. Initial Load & Setup
    await resetLocalStateAndOpenHome(page);
    await expect(page.getByTestId("main-stage-card")).toBeVisible({ timeout: 10000 });

    // 2. Choose Doctrine (Bot selects one deterministically or at random initially)
    // There are 3 doctrines: technocrat, populist, militarist.
    // The bot will try to pick 'technocrat', but will fallback if needed.
    const doctrines = ["technocrat", "populist", "militarist"];
    const randomDoctrine = doctrines[Math.floor(Math.random() * doctrines.length)];
    const doctrineBtn = page.getByTestId(`doctrine-${randomDoctrine}`);

    if (await doctrineBtn.isVisible()) {
      await doctrineBtn.click();
      await page.waitForTimeout(500); // Wait for animations if Headed
    }

    // 3. Play Loop
    let gameEnded = false;
    let turnCount = 0;

    while (!gameEnded && turnCount < 40) {
      turnCount++; // Failsafe against infinite loops

      // Wait for React to settle
      await page.waitForTimeout(1000);

      // Check if debrief card is visible, signaling end of run
      const debriefCard = page.getByTestId("run-debrief-card");
      if (await debriefCard.isVisible()) {
        gameEnded = true;
        break;
      }

      // Find all available crisis options
      const crisisOptions = page.locator("[data-testid^='crisis-option-']");

      // Playwright trick: wait for at least one to be attached
      try {
        await crisisOptions.first().waitFor({ state: "visible", timeout: 2000 });
      } catch {
        // If not visible, it might be animating or game is ending, just loop again
      }

      const optionCount = await crisisOptions.count();

      if (optionCount > 0) {
        // Pick a random option to click
        const randomIndex = Math.floor(Math.random() * optionCount);
        const optionToClick = crisisOptions.nth(randomIndex);

        // Ensure it is actionable
        if (await optionToClick.isEnabled()) {
          await optionToClick.click();
        }
      }
    }

    // 4. Verification post-game
    // Bot should have successfully reached the debrief card
    const debriefCard = page.getByTestId("run-debrief-card");
    await expect(debriefCard).toBeVisible();

    // As a bonus validation, make sure the restart button exists
    await expect(page.getByTestId("debrief-restart")).toBeVisible();
  });
});
