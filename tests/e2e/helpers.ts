import { expect, type Page } from "@playwright/test";

export async function resetLocalStateAndOpenHome(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Lead the state through 10 crisis turns/i })).toBeVisible();
}

export async function chooseDoctrine(page: Page, doctrineId: "technocrat" | "populist" | "militarist") {
  await page.getByTestId(`doctrine-${doctrineId}`).click();
  await expect(page.getByTestId(`doctrine-${doctrineId}`)).toHaveCount(0);
}

export async function resolveFirstCrisisOption(page: Page) {
  await page.locator("[data-testid^='crisis-option-']").first().click();
  await expect(page.getByTestId("causality-entry").first()).toBeVisible();
}
