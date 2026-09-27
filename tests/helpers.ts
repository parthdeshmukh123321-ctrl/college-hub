import { expect, type Page } from "@playwright/test";

export const ADMIN_KEY = "test-admin-key";
export const adminHeaders = { "x-admin-key": ADMIN_KEY };

export function trackConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

export function expectNoConsoleErrors(errors: string[]) {
  // "Failed to load resource" is network-level noise the browser logs for any
  // non-2xx fetch (expected when tests exercise 404/403 paths); real JS errors
  // (pageerror, React warnings, hydration mismatches) still fail the test.
  const real = errors.filter((e) => !e.includes("favicon") && !e.includes("Failed to load resource"));
  expect(real, `console errors:\n${errors.join("\n")}`).toEqual([]);
}

export async function unlockAdmin(page: Page) {
  await page.goto("/settings");
  await page.locator("#adm-key").fill(ADMIN_KEY);
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Admin unlocked.")).toBeVisible();
}

export async function apiJson(page: Page, path: string, init?: { headers?: Record<string, string>; method?: string; body?: string }) {
  const res = await page.request.fetch(path, { headers: init?.headers, method: init?.method, data: init?.body });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}
