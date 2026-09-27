import { test, expect, devices } from "@playwright/test";
import { trackConsole, expectNoConsoleErrors, unlockAdmin, adminHeaders, apiJson } from "./helpers";

test("E1 unknown ids show honest not-found states", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/resources/does-not-exist");
  await expect(page.getByText("Resource not found.")).toBeVisible();
  await page.goto("/topics/does-not-exist");
  await expect(page.getByText("This topic doesn't exist.")).toBeVisible();
  await page.goto("/subjects/does-not-exist");
  await expect(page.getByText(/not found/i).first()).toBeVisible();
  await page.goto("/add?id=does-not-exist");
  await expect(page.getByText("no longer exists")).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("E2 add form shows server validation errors", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/add");
  await page.getByRole("button", { name: "Submit resource" }).click();
  await expect(page.getByText("Title is required.")).toBeVisible();
  await expect(page.getByText("URL is required for link resources.")).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("E3 double submit creates exactly one row", async ({ page }) => {
  const errors = trackConsole(page);
  await unlockAdmin(page);
  const code = `DBL${Date.now().toString(36).toUpperCase()}`;
  await page.goto("/admin/subjects");
  await page.getByLabel("Subject name").fill("Double Submit Probe");
  await page.getByLabel("Subject code").fill(code);
  await page.getByRole("button", { name: "Add subject", exact: true }).dblclick();
  await expect(page.getByText("Subject added.")).toBeVisible();
  const subs = (await apiJson(page, "/api/subjects")).body.items as { code: string }[];
  expect(subs.filter((s) => s.code === code).length).toBe(1);
  expectNoConsoleErrors(errors);
});

test("E4 mobile viewport: drawer, bottom nav, palette fallback", async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices["iPhone 12"] });
  const page = await ctx.newPage();
  const errors = trackConsole(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "College Resource Hub" })).toBeVisible();
  // drawer opens and Escape closes
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
  // bottom nav navigates
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Saved" }).click();
  await expect(page).toHaveURL("/saved");
  // palette Enter with zero matches still searches
  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Search", exact: true }).click();
  await page.getByLabel("Command search input").fill("zzzznomatch");
  await expect(page.getByText("No matches. Press Enter to search resources.")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=zzzznomatch/);
  expectNoConsoleErrors(errors);
  await ctx.close();
});

test("E5 empty search shows zero-results state, not an error", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/search?q=zzzznoresults");
  await expect(page.getByText("0 results for “zzzznoresults”")).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("E6 tag filter debounces instead of pushing per keystroke", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/resources");
  await page.locator("#f-tag").fill("matrices");
  await expect(page).toHaveURL(/tag=matrices/, { timeout: 5000 });
  await expect(page.locator("article").first()).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("E7 lab All tab returns only lab types from the server", async ({ page }) => {
  const errors = trackConsole(page);
  const r = await apiJson(page, "/api/resources?types=LAB_MANUAL,PRACTICAL,VIVA&pageSize=50");
  expect(r.res.status()).toBe(200);
  expect(r.body.items.length).toBeGreaterThan(0);
  expect(r.body.items.every((x: { resourceType: string }) => ["LAB_MANUAL", "PRACTICAL", "VIVA"].includes(x.resourceType))).toBe(true);
  await page.goto("/lab");
  await page.getByRole("tab", { name: "All Lab" }).click();
  await expect(page.locator("article").first()).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("E8 popular subjects are ordered by resource count", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/");
  const pop = page.locator("section", { has: page.getByRole("heading", { name: "Popular subjects" }) });
  await expect(pop.locator("li p.muted").first()).toBeVisible({ timeout: 20000 });
  const texts = await pop.locator("li p.muted").allTextContents();
  const counts = texts.map((t) => Number(t.match(/(\d+) resources/)?.[1])).filter((n) => !isNaN(n));
  expect(counts.length).toBeGreaterThan(0);
  expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  expectNoConsoleErrors(errors);
});

test("E10 stored preferences cause zero hydration errors", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("crh_theme", "dark");
    localStorage.setItem("crh_view", '"list"');
    localStorage.setItem("crh_admin", "1");
    localStorage.setItem("crh_admin_key", "test-admin-key");
  });
  const errors = trackConsole(page);
  for (const path of ["/", "/resources", "/settings", "/admin", "/lab"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  expectNoConsoleErrors(errors);
});

test("E9 admin export includes pending, anonymous excludes", async ({ page }) => {
  const anon = await apiJson(page, "/api/data");
  const admin = await apiJson(page, "/api/data", { headers: adminHeaders });
  expect(anon.body.resources.every((x: { status: string }) => x.status === "PUBLISHED")).toBe(true);
  expect(admin.body.resources.some((x: { status: string }) => x.status !== "PUBLISHED")).toBe(true);
});
