import { test, expect } from "@playwright/test";
import fs from "fs";
import { trackConsole, expectNoConsoleErrors, unlockAdmin, adminHeaders, apiJson } from "./helpers";

test("F1 homepage search finds seeded content", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/");
  await page.locator("#home-q").fill("matrices");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=matrices/);
  await expect(page.getByText(/results? for/)).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("F2 filters and pagination work", async ({ page }) => {
  const errors = trackConsole(page);
  // bulk seed for pagination (admin creates published directly)
  for (let i = 0; i < 30; i++) {
    await page.request.post("/api/resources", {
      headers: { "Content-Type": "application/json", ...adminHeaders },
      data: { title: `Paginate E2E ${i}`, resourceType: "NOTE", sourceType: "EXTERNAL_URL", url: `https://example.com/pag${i}`, subjectId: "sub_m1", status: "PUBLISHED", contributorId: "e2e" },
    });
  }
  await page.goto("/resources");
  await expect(page.getByText(/^\d+ results?$/).first()).toBeVisible();
  // subject filter narrows
  const subs = (await apiJson(page, "/api/subjects")).body.items as { id: string }[];
  await page.locator("#f-sub").selectOption(subs[0].id);
  await expect(page).toHaveURL(/subjectId=/);
  // pagination page 2 has items
  await page.goto("/resources?page=2");
  await expect(page.locator("article").first()).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("F3 detail view counts views and records history", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/resources/res_m1_notes");
  await expect(page.getByRole("heading", { name: /M-1 Matrices/ })).toBeVisible();
  const viewsText = await page.getByText(/\d+ views/).first().textContent();
  const before = Number(viewsText?.match(/(\d+)/)?.[1]);
  await page.reload();
  await expect(page.getByRole("heading", { name: /M-1 Matrices/ })).toBeVisible();
  await expect(page.getByText(new RegExp(`${before + 1} views`))).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related resources" })).toBeVisible();
  await page.goto("/recent");
  await expect(page.getByText("M-1 Matrices", { exact: false }).first()).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("F4 save and unsave round-trip", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/resources?q=Paginate+E2E+1");
  const card = page.locator("article").first();
  await expect(card).toBeVisible();
  const savedTitle = (await card.locator("a").first().textContent()) || "Paginate E2E 1";
  const savedResp = page.waitForResponse((r) => r.url().includes("/api/bookmarks") && r.request().method() === "POST");
  await card.getByRole("button", { name: /save/i }).click();
  await savedResp;
  await page.goto("/saved");
  await expect(page.getByText(savedTitle.trim(), { exact: false }).first()).toBeVisible();
  const delResp = page.waitForResponse((r) => r.url().includes("/api/bookmarks") && r.request().method() === "DELETE");
  await page.locator("article").first().getByRole("button", { name: /save/i }).click();
  await delResp;
  await expect(page.getByText("No saved resources yet.")).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("F5 submit link resource then approve in moderation queue", async ({ page }) => {
  const errors = trackConsole(page);
  const title = `E2E Link Submission ${Date.now()}`;
  await page.goto("/add");
  await page.locator("#a-title").fill(title);
  const subs = (await apiJson(page, "/api/subjects")).body.items as { id: string }[];
  await page.locator("#a-sub").selectOption(subs[0].id);
  await page.locator("#a-url").fill("https://example.com/e2e-link");
  await page.getByRole("button", { name: "Submit resource" }).click();
  await expect(page.getByText("Submitted for review")).toBeVisible();
  // approve via real admin UI
  await unlockAdmin(page);
  await page.goto("/admin/resources");
  const row = page.locator("article", { hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved done.")).toBeVisible();
  await page.goto(`/resources?q=${encodeURIComponent(title)}`);
  await expect(page.locator("article").first()).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("F6 upload file resource end to end", async ({ page }) => {
  const errors = trackConsole(page);
  const title = `E2E File Submission ${Date.now()}`;
  await page.goto("/add");
  await page.locator("#a-title").fill(title);
  await page.getByRole("radio", { name: /upload file/i }).click();
  await page.locator("#a-file").setInputFiles("tests/fixtures/note.txt");
  await expect(page.getByText("note.txt")).toBeVisible();
  await page.getByRole("button", { name: "Submit resource" }).click();
  await expect(page.getByText("Submitted for review")).toBeVisible();
  // approve + verify serve
  const found = await apiJson(page, `/api/resources?q=${encodeURIComponent(title)}&pageSize=5`, { headers: adminHeaders });
  const id = found.body.items[0].id as string;
  await page.request.patch(`/api/resources/${id}`, { headers: { "Content-Type": "application/json", ...adminHeaders }, data: { status: "PUBLISHED" } });
  await page.goto(`/resources/${id}`);
  await expect(page.getByRole("link", { name: /open \/ download/i })).toBeVisible();
  const fileId = found.body.items[0].fileId as string;
  const fileRes = await page.request.get(`/api/file-serve?id=${fileId}`);
  expect(fileRes.status()).toBe(200);
  expect(fileRes.headers()["content-type"]).toContain("text/plain");
  expectNoConsoleErrors(errors);
});

test("F7 owner edit goes back to review, then re-approved", async ({ page }) => {
  const errors = trackConsole(page);
  const created = await apiJson(page, "/api/resources", {
    headers: { "Content-Type": "application/json" }, method: "POST",
    body: JSON.stringify({ title: "E2E Owned Resource", resourceType: "NOTE", sourceType: "EXTERNAL_URL", url: "https://example.com/owned", contributorId: "dev_e2e_owner" }),
  });
  const id = created.body.id as string;
  await page.request.patch(`/api/resources/${id}`, { headers: { "Content-Type": "application/json", ...adminHeaders }, data: { status: "PUBLISHED" } });
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("crh_device_id", "dev_e2e_owner"));
  await page.goto(`/add?id=${id}`);
  await expect(page.locator("#a-title")).toHaveValue("E2E Owned Resource");
  await page.locator("#a-title").fill("E2E Owned Resource v2");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("sent for review")).toBeVisible();
  const check = await apiJson(page, `/api/resources/${id}`, { headers: adminHeaders });
  expect(check.body.resource.status).toBe("PENDING_REVIEW");
  expect(check.body.resource.title).toBe("E2E Owned Resource v2");
  expectNoConsoleErrors(errors);
});

test("F8 report broken resource and resolve as admin", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/resources/res_m1_notes");
  await page.getByRole("button", { name: "Report", exact: true }).click();
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText(/moderators will review/)).toBeVisible();
  await unlockAdmin(page);
  await page.goto("/admin/reports");
  const rep = page.locator("article", { hasText: "M-1 Matrices" }).first();
  await expect(rep).toBeVisible();
  await rep.getByRole("button", { name: /resolve \+ clear broken flag/i }).click();
  await expect(page.getByText("Report resolved.")).toBeVisible();
  const check = await apiJson(page, "/api/resources/res_m1_notes");
  expect(check.body.resource.isBroken).toBe(false);
  expectNoConsoleErrors(errors);
});

test("F9 admin manages subjects, topics and academic entries", async ({ page }) => {
  const errors = trackConsole(page);
  page.on("dialog", (d) => d.accept());
  await unlockAdmin(page);
  const code = `E2E${Date.now().toString(36).toUpperCase()}`;
  await page.goto("/admin/subjects");
  await page.getByLabel("Subject name").fill("E2E Test Subject");
  await page.getByLabel("Subject code").fill(code);
  await page.getByRole("button", { name: "Add subject", exact: true }).click();
  await expect(page.getByText("Subject added.")).toBeVisible();
  const subs = (await apiJson(page, "/api/subjects")).body.items as { id: string; code: string }[];
  const mine = subs.find((s) => s.code === code);
  expect(mine).toBeTruthy();
  await page.getByLabel("Topic subject").selectOption(mine!.id);
  await page.getByLabel("Topic name").fill("E2E Topic");
  await page.getByRole("button", { name: "Add topic", exact: true }).click();
  await expect(page.getByText("Topic added.")).toBeVisible();
  const topics = (await apiJson(page, `/api/topics?subjectId=${mine!.id}`)).body.items as { name: string }[];
  expect(topics.some((t) => t.name === "E2E Topic")).toBe(true);
  await page.goto(`/subjects/${mine!.id}`);
  await expect(page.getByRole("heading", { name: "E2E Test Subject" })).toBeVisible();
  // academic notice round-trip
  await page.goto("/admin/academic");
  await page.getByRole("tab", { name: "Notices" }).click();
  const noticeTitle = `E2E Notice ${Date.now()}`;
  await page.getByLabel("Title").fill(noticeTitle);
  await page.getByRole("button", { name: "Add entry" }).click();
  await expect(page.getByText("Entry added.")).toBeVisible();
  await page.goto("/academic/notices");
  await expect(page.getByText(noticeTitle)).toBeVisible();
  // delete subject (resources kept but unlinked)
  await page.goto("/admin/subjects");
  const row = page.locator("li", { hasText: code });
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Subject deleted.")).toBeVisible();
  expectNoConsoleErrors(errors);
});

test("F10 settings export, theme and admin lock", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/settings");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  const path = await (await dl).path();
  const data = JSON.parse(fs.readFileSync(path, "utf8"));
  expect(data.schemaVersion).toBe(1);
  expect(data.resources.every((x: { status: string }) => x.status === "PUBLISHED")).toBe(true);
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("radio", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await unlockAdmin(page);
  await page.getByRole("button", { name: "Lock" }).click();
  await expect(page.getByText("Admin locked.")).toBeVisible();
  await page.goto("/admin/resources");
  await expect(page.getByText("Admin access required")).toBeVisible();
  expectNoConsoleErrors(errors);
});
