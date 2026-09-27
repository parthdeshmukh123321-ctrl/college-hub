import { test, expect } from "@playwright/test";
import { ADMIN_KEY, adminHeaders, apiJson } from "./helpers";

test("anonymous users cannot see non-published resources anywhere", async ({ page }) => {
  // list leak closed: status param ignored for anonymous
  let r = await apiJson(page, "/api/resources?status=PENDING_REVIEW&pageSize=50");
  expect(r.res.status()).toBe(200);
  expect(r.body.items.every((x: { status: string }) => x.status === "PUBLISHED")).toBe(true);
  // detail gate
  r = await apiJson(page, "/api/resources/res_mech_assign");
  expect(r.res.status()).toBe(404);
  // export gate
  r = await apiJson(page, "/api/data");
  expect(r.res.status()).toBe(200);
  expect(r.body.resources.every((x: { status: string }) => x.status === "PUBLISHED")).toBe(true);
  // admin CAN see them
  r = await apiJson(page, "/api/resources?status=PENDING_REVIEW&pageSize=50", { headers: adminHeaders });
  expect(r.body.total).toBeGreaterThanOrEqual(1);
  r = await apiJson(page, "/api/resources/res_mech_assign", { headers: adminHeaders });
  expect(r.res.status()).toBe(200);
});

test("resource edits require real ownership", async ({ page }) => {
  const bad = { headers: { "Content-Type": "application/json" } };
  // seed row: not editable anonymously even with matching contributorId
  let r = await apiJson(page, "/api/resources/res_m1_notes", {
    ...bad, method: "PATCH", body: JSON.stringify({ title: "HACK", contributorId: "seed" }),
  });
  expect(r.res.status()).toBe(403);
  // wrong device
  r = await apiJson(page, "/api/resources/res_m1_notes", {
    ...bad, method: "PATCH", body: JSON.stringify({ title: "HACK", contributorId: "dev_evil" }),
  });
  expect(r.res.status()).toBe(403);
  // owner flow: create -> edit with same device -> re-queued
  r = await apiJson(page, "/api/resources", {
    ...bad, method: "POST",
    body: JSON.stringify({ title: "SecTest Own Me", resourceType: "NOTE", sourceType: "EXTERNAL_URL", url: "https://example.com/sec", contributorId: "dev_sec_owner" }),
  });
  expect(r.res.status()).toBe(201);
  const id = r.body.id as string;
  r = await apiJson(page, `/api/resources/${id}`, {
    ...bad, method: "PATCH", body: JSON.stringify({ title: "SecTest Own Me v2", contributorId: "dev_sec_owner" }),
  });
  expect(r.res.status()).toBe(200);
  expect(r.body.status).toBe("PENDING_REVIEW");
  // admin can edit anything
  r = await apiJson(page, `/api/resources/${id}`, {
    headers: { "Content-Type": "application/json", ...adminHeaders }, method: "PATCH",
    body: JSON.stringify({ status: "PUBLISHED" }),
  });
  expect(r.res.status()).toBe(200);
});

test("writes validate references and payloads", async ({ page }) => {
  const json = { headers: { "Content-Type": "application/json" } };
  for (const [path, body] of [
    ["/api/bookmarks", { resourceId: "nope", deviceId: "d" }],
    ["/api/history", { resourceId: "nope", deviceId: "d" }],
    ["/api/reports", { resourceId: "nope", reason: "Other" }],
  ] as const) {
    const r = await apiJson(page, path, { ...json, method: "POST", body: JSON.stringify(body) });
    expect(r.res.status(), path).toBe(404);
  }
  let r = await apiJson(page, "/api/topics", {
    headers: { "Content-Type": "application/json", ...adminHeaders }, method: "POST",
    body: JSON.stringify({ name: "T", subjectId: "nope" }),
  });
  expect(r.res.status()).toBe(404);
  // bad payload: missing title, bad url, bad year
  r = await apiJson(page, "/api/resources", {
    ...json, method: "POST",
    body: JSON.stringify({ title: "", resourceType: "NOTE", sourceType: "EXTERNAL_URL", url: "not-a-url", year: 1800 }),
  });
  expect(r.res.status()).toBe(400);
  expect(r.body.errors.title).toBeTruthy();
  expect(r.body.errors.url).toBeTruthy();
  expect(r.body.errors.year).toBeTruthy();
  // javascript: URL rejected
  r = await apiJson(page, "/api/resources", {
    ...json, method: "POST",
    body: JSON.stringify({ title: "XSS", resourceType: "NOTE", sourceType: "EXTERNAL_URL", url: "javascript:alert(1)" }),
  });
  expect(r.res.status()).toBe(400);
  // bogus subject/topic/file references rejected, not 500
  r = await apiJson(page, "/api/resources", {
    ...json, method: "POST",
    body: JSON.stringify({ title: "Ref", resourceType: "NOTE", sourceType: "EXTERNAL_URL", url: "https://example.com/r", subjectId: "nope" }),
  });
  expect(r.res.status()).toBe(400);
});

test("admin endpoints reject bad keys", async ({ page }) => {
  for (const key of ["wrong", "admin123", ""]) {
    const r = await apiJson(page, "/api/admin", { headers: { "x-admin-key": key } });
    expect(r.res.status(), `key=${key}`).toBe(403);
  }
  const ok = await apiJson(page, "/api/admin", { headers: adminHeaders });
  expect(ok.res.status()).toBe(200);
  expect(ok.body.totals.resources).toBeGreaterThan(0);
  void ADMIN_KEY;
});

test("view counting is honest", async ({ page }) => {
  const before = (await apiJson(page, "/api/resources/res_m1_notes")).body.resource.viewCount as number;
  // anonymous view increments
  await page.request.post("/api/resources/res_m1_notes", { data: { event: "VIEW" } });
  const after = (await apiJson(page, "/api/resources/res_m1_notes")).body.resource.viewCount as number;
  expect(after).toBe(before + 1);
  // admin preview does not increment
  await page.request.post("/api/resources/res_m1_notes", { headers: adminHeaders, data: { event: "VIEW" } });
  const afterAdmin = (await apiJson(page, "/api/resources/res_m1_notes")).body.resource.viewCount as number;
  expect(afterAdmin).toBe(after);
});

test("import/export round-trips honestly", async ({ page }) => {
  const json = { headers: { "Content-Type": "application/json", ...adminHeaders } };
  const exp = await apiJson(page, "/api/data?deviceId=d", { headers: adminHeaders });
  expect(exp.body.schemaVersion).toBe(1);
  // re-merge reports zeros, not fake counts
  let r = await apiJson(page, "/api/data?mode=merge", { ...json, method: "POST", body: JSON.stringify(exp.body) });
  expect(r.res.status()).toBe(200);
  expect(r.body.imported.resources).toBe(0);
  // bad mode + missing confirm rejected
  r = await apiJson(page, "/api/data?mode=bogus", { ...json, method: "POST", body: JSON.stringify(exp.body) });
  expect(r.res.status()).toBe(400);
  r = await apiJson(page, "/api/data?mode=replace", { ...json, method: "POST", body: JSON.stringify(exp.body) });
  expect(r.res.status()).toBe(400);
});
