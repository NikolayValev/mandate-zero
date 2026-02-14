import { expect, test } from "@playwright/test";
import { createInitialGame } from "../../components/mandate-zero/engine";

const RUN_STORAGE_KEY = "mandate-zero-local-run-v3";

test("end-of-run debrief renders for completed runs and supports restart", async ({ page }) => {
  const game = createInitialGame("debrief-seed");
  game.phase = "lost";
  game.turn = 4;
  game.turnStage = "fallout";
  game.message = "Command authority collapsed for test validation.";
  const payload = {
    game,
    history: ["test run"],
    causalityHistory: [],
    seedInput: game.seedText,
  };

  await page.addInitScript(
    ({ key, runPayload }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, JSON.stringify(runPayload));
    },
    { key: RUN_STORAGE_KEY, runPayload: payload },
  );
  await page.goto("/");

  const debriefCard = page.getByTestId("run-debrief-card");
  await expect(debriefCard).toBeVisible();
  await expect(debriefCard.getByText("Command authority collapsed for test validation.")).toBeVisible();

  await page.getByTestId("debrief-restart").click();
  await expect(page.getByTestId("onboarding-title")).toBeVisible();
});
