import { expect, test, type Page } from "@playwright/test";

async function mockAdminState(page: Page, authenticated: boolean) {
  await page.route("**/api/admin/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: authenticated
          ? {
              id: "qa-admin",
              name: "QA Admin",
              username: "qa",
              role: "admin",
            }
          : null,
      }),
    });
  });
}

test.describe("mobile viewport stability", () => {
  test("theme and dialog interactions produce zero unexpected CLS", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as typeof window & { __coursePilotCls: number };
      state.__coursePilotCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!shift.hadRecentInput) state.__coursePilotCls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await mockAdminState(page, false);
    await page.goto("/");
    await page.evaluate(async () => {
      await document.fonts.ready;
      (window as typeof window & { __coursePilotCls: number }).__coursePilotCls = 0;
    });

    await page.getByRole("button", { name: "Toggle light and dark theme" }).click();
    await page.getByRole("button", { name: "Admin" }).click();
    await page.getByRole("button", { name: "Close sign in" }).click();
    await page.waitForTimeout(350);

    const cls = await page.evaluate(
      () => (window as typeof window & { __coursePilotCls: number }).__coursePilotCls,
    );
    expect(cls).toBeLessThanOrEqual(0.001);
  });

  test("admin login remains centered and uncropped", async ({ page }) => {
    await mockAdminState(page, false);
    await page.goto("/");
    await page.getByRole("button", { name: "Admin" }).click();

    const dialog = page.getByRole("dialog", { name: /welcome back/i });
    await expect(dialog).toBeVisible();

    const geometry = await dialog.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        centerX: box.left + box.width / 2,
        centerY: box.top + box.height / 2,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        backdropScrollHeight: element.parentElement?.scrollHeight ?? 0,
        backdropClientHeight: element.parentElement?.clientHeight ?? 0,
      };
    });

    expect(Math.abs(geometry.centerX - geometry.viewportWidth / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.centerY - geometry.viewportHeight / 2)).toBeLessThanOrEqual(3);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.backdropScrollHeight).toBeLessThanOrEqual(
      geometry.backdropClientHeight + 1,
    );

    await page.getByLabel("Password").focus();
    await expect(dialog).toBeInViewport();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
      .toBe(true);
  });

  test("backdrop click closes login without shifting the page", async ({ page }) => {
    await mockAdminState(page, false);
    await page.goto("/");

    const main = page.locator("main");
    const before = await main.boundingBox();

    await page.getByRole("button", { name: "Admin" }).click();
    const dialog = page.getByRole("dialog", { name: /welcome back/i });
    await expect(dialog).toBeVisible();

    await dialog.locator("..").click({ position: { x: 3, y: 3 } });
    await expect(dialog).toHaveCount(0);

    const after = await main.boundingBox();
    expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
    expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
    expect(after?.width).toBeCloseTo(before?.width ?? 0, 0);
  });

  test("delete cancel and outside click unmount cleanly", async ({ page }) => {
    await mockAdminState(page, true);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Subject actions" }).first()).toBeVisible();

    const main = page.locator("main");
    const before = await main.boundingBox();

    const openDelete = async () => {
      await page.getByRole("button", { name: "Subject actions" }).first().click();
      await page.getByRole("button", { name: "Delete", exact: true }).first().click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
    };

    await openDelete();
    const cancel = page.getByRole("button", { name: "Keep subject" });
    await cancel.focus();
    await cancel.click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.isConnected)).toBe(true);

    await openDelete();
    const dialog = page.getByRole("alertdialog");
    await dialog.locator("..").click({ position: { x: 3, y: 3 } });
    await expect(dialog).toHaveCount(0);

    const after = await main.boundingBox();
    expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
    expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
    expect(after?.width).toBeCloseTo(before?.width ?? 0, 0);
  });
});
