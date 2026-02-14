import { devices, expect, test } from "@playwright/test";
import { chooseDoctrine, resetLocalStateAndOpenHome, resolveFirstCrisisOption } from "./helpers";

test.use({ ...devices["Pixel 7"] });

test("mobile layout remains readable and tap-first through one full decision", async ({ page }) => {
  await resetLocalStateAndOpenHome(page);

  const doctrineButton = page.getByTestId("doctrine-populist");
  const doctrineBox = await doctrineButton.boundingBox();
  expect(doctrineBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await chooseDoctrine(page, "populist");

  const actionButton = page.getByTestId("use-action-intel-sweep");
  const actionBox = await actionButton.boundingBox();
  expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await actionButton.click();

  await resolveFirstCrisisOption(page);
  await expect(page.getByText(/Turn 2/i).first()).toBeVisible();
});
