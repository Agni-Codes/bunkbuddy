import { expect, test } from "@playwright/test";

test("serves the built dashboard preview", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BunkBuddy" })).toBeVisible();
});
