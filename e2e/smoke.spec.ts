import { expect, test } from "@playwright/test";

/**
 * Web smoke = shared JS/routing stand-in for iOS/Android product flows.
 * Does NOT prove Liquid Glass, native share sheet, or .welift Open-In.
 */
test.describe("WeLift web smoke", () => {
  test("onboard → week → log a set → save", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Enter your name")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText("Next")).toBeVisible();

    await page.getByPlaceholder("Name").fill("Shlok");
    await page.getByText("Next").click();

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
    await page.getByTestId("create-from-search").click({ force: true });

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

  test("tabs navigate between week, people, and progress", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Enter your name")).toBeVisible({
      timeout: 60_000,
    });
    await page.getByPlaceholder("Name").fill("Web QA");
    await page.getByText("Next").click();
    await expect(page.getByText("Your week").first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId("people-tab").click({ force: true });
    await expect(page.getByText("Export", { exact: true })).toBeVisible();
    await expect(page.getByText("Import", { exact: true })).toBeVisible();

    await page.getByTestId("week-tab").click({ force: true });
    await expect(page.getByText("Your week").first()).toBeVisible();

    await page.getByTestId("progress-tab").click({ force: true });
    await expect(page.getByTestId("progress-heading")).toBeVisible();
    await expect(page.getByTestId("progress-empty")).toBeVisible();
  });
});
