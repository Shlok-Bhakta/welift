import { expect, test } from "@playwright/test";

/**
 * Web smoke = shared JS/routing stand-in for iOS/Android product flows.
 * Does NOT prove Liquid Glass, native share sheet, or .welift Open-In.
 */
test.describe("WeLift web smoke", () => {
  test("onboard → week → log a set → save", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Open my week")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Chalk warmth/i)).toBeVisible();

    await page.getByPlaceholder("Shlok").fill("Shlok");
    await page.getByText("Open my week").click();

    await expect(page.getByText("Your week").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Shlok").first()).toBeVisible();

    await page.getByText("Log this day").click();
    await expect(page.getByText("Add exercise")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByText("Add exercise").click();
    const search = page.getByPlaceholder("Search or create…");
    await expect(search).toBeVisible();
    await search.fill("E2E Smoke Lift");
    await page.getByText("Create from search").click({ force: true });

    await expect(page.getByPlaceholder("lb").first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByPlaceholder("lb").first().fill("225");
    await page.getByPlaceholder("reps").first().fill("5");

    await page.getByText("Save", { exact: true }).click();
    // Expo Router stack can keep a prior Week screen mounted (hidden) on web.
    await expect(
      page.getByText("E2E Smoke Lift").filter({ visible: true })
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText("225×5").filter({ visible: true })
    ).toBeVisible();
    await expect(
      page.getByText("Your week").filter({ visible: true })
    ).toBeVisible();
  });

  test("menu opens people & progress", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Open my week")).toBeVisible({
      timeout: 60_000,
    });
    await page.getByPlaceholder("Shlok").fill("Web QA");
    await page.getByText("Open my week").click();
    await expect(page.getByText("Your week").first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByText("☰").click();
    await expect(page.getByText("People & share")).toBeVisible();
    await page.getByText("People & share").click();
    await expect(page.getByText("People", { exact: true })).toBeVisible();
    await expect(page.getByText("Export", { exact: true })).toBeVisible();
    await expect(page.getByText("Import", { exact: true })).toBeVisible();

    await page.getByText("Week", { exact: true }).first().click();
    await expect(page.getByText("Your week").first()).toBeVisible();

    await page.getByText("☰").click();
    await page.getByText("Progress", { exact: true }).first().click();
    await expect(
      page.getByText("Progress", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Est. 1RM for weight lifts", { exact: false })
    ).toBeVisible();
    await expect(page.getByTestId("progress-web-chart")).toBeVisible();
  });
});
