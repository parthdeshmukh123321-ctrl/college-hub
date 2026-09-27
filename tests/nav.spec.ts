import { test, expect } from "@playwright/test";
import { trackConsole, expectNoConsoleErrors } from "./helpers";

const PAGES: [string, string][] = [
  ["/", "College Resource Hub"],
  ["/resources", "All Resources"],
  ["/subjects", "Subjects"],
  ["/notes", "Notes"],
  ["/pyqs", "Previous Year Questions"],
  ["/lab", "Lab & Practical Hub"],
  ["/question-banks", "Question Banks"],
  ["/search?q=matrices", "Search"],
  ["/saved", "Saved Resources"],
  ["/recent", "Recently Viewed"],
  ["/academic", "Academic"],
  ["/academic/timetable", "Timetable"],
  ["/academic/calendar", "Calendar"],
  ["/academic/exams", "Exam Schedule"],
  ["/academic/notices", "Notices"],
  ["/add", "Add Resource"],
  ["/settings", "Settings"],
  ["/admin", "Admin"],
  ["/admin/resources", "Resource moderation"],
  ["/admin/subjects", "Subjects & Topics"],
  ["/admin/reports", "Reports"],
  ["/admin/academic", "Academic data"],
  ["/subjects/sub_m1", "Engineering Mathematics"],
  ["/resources/res_m1_notes", "M-1 Matrices"],
];

test("every page loads with zero console errors", async ({ page }) => {
  const errors = trackConsole(page);
  for (const [path, heading] of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({ timeout: 20000 });
  }
  expectNoConsoleErrors(errors);
});

test("every in-app link resolves (crawl)", async ({ page }) => {
  const seen = new Set<string>();
  const bad: string[] = [];
  for (const start of ["/", "/resources", "/subjects", "/subjects/sub_m1", "/resources/res_m1_notes", "/academic"]) {
    await page.goto(start);
    await page.waitForLoadState("networkidle").catch(() => {});
    const hrefs = await page.locator("a[href^='/']").evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || "").filter(Boolean)
    );
    for (const href of [...new Set(hrefs)]) {
      if (seen.has(href)) continue;
      seen.add(href);
      const res = await page.request.get(href);
      if (res.status() >= 400) bad.push(`${href} -> ${res.status()}`);
    }
  }
  expect(seen.size).toBeGreaterThan(20);
  expect(bad, `broken links:\n${bad.join("\n")}`).toEqual([]);
});
