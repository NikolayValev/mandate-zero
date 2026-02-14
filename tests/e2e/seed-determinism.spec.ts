import { expect, test, type Browser } from "@playwright/test";
import { chooseDoctrine, resolveFirstCrisisOption } from "./helpers";

async function runScriptedSequence(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto("/");
  await chooseDoctrine(page, "technocrat");
  await page.getByTestId("use-action-intel-sweep").click();
  await resolveFirstCrisisOption(page);

  const entries = (await page.getByTestId("causality-entry").allTextContents())
    .slice(0, 4)
    .map((text) => text.replace(/\s+/g, " ").trim());

  await context.close();
  return entries;
}

test("same seed and same choices produce identical visible causality output", async ({ browser }) => {
  const firstRun = await runScriptedSequence(browser);
  const secondRun = await runScriptedSequence(browser);
  expect(secondRun).toEqual(firstRun);
});
