import { fileURLToPath } from 'node:url';
import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const SCRIPT = fileURLToPath(new URL('../dist/index.global.js', import.meta.url));

type Api = {
  createNotice: (o: { text: string; onDismiss?: () => void }) => { dismiss: () => void };
};
declare global {
  interface Window {
    Web?: Api;
    dismissed?: number;
  }
}

/** A blank page with the script-tag build loaded, the way a site would use it. */
async function loadScriptTag(page: Page, css = '') {
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body><main><h1>Host page</h1></main></body></html>`
  );
  await page.addScriptTag({ path: SCRIPT });
}

test('the script tag exposes the API and does nothing until called', async ({ page }) => {
  await loadScriptTag(page);
  expect(await page.evaluate(() => typeof window.Web?.createNotice)).toBe('function');
  await expect(page.locator('[data-web]')).toHaveCount(0);
});

test('text is shown as text, never parsed as HTML', async ({ page }) => {
  await loadScriptTag(page);
  await page.evaluate(() =>
    window.Web?.createNotice({ text: '<img src=x onerror="window.pwned=1">' })
  );
  await expect(page.getByRole('status')).toHaveText(/<img src=x/);
  expect(
    await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)
  ).toBeUndefined();
});

test('host page CSS cannot restyle the notice', async ({ page }) => {
  await loadScriptTag(
    page,
    'div, span, button { background: red !important; color: red !important; }'
  );
  await page.evaluate(() => window.Web?.createNotice({ text: 'Hello' }));
  const notice = page.getByRole('status');
  await expect(notice).toHaveCSS('background-color', 'rgb(20, 32, 46)');
  await expect(notice).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('dismiss is a 44px button that removes the notice once', async ({ page }) => {
  await loadScriptTag(page);
  await page.evaluate(() => {
    window.dismissed = 0;
    window.Web?.createNotice({
      text: 'Hello',
      onDismiss: () => {
        window.dismissed = (window.dismissed ?? 0) + 1;
      },
    });
  });
  const button = page.getByRole('button', { name: 'Dismiss' });
  const box = await button.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await button.click();
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(await page.evaluate(() => window.dismissed)).toBe(1);
});

test('no accessibility violations', async ({ page }) => {
  await loadScriptTag(page);
  await page.evaluate(() => window.Web?.createNotice({ text: 'Hello' }));
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
