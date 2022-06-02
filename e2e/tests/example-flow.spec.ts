import { TranslocoService } from '@ngneat/transloco';
import { test } from '@playwright/test';

let translocoSvc: TranslocoService;
test.describe(`testing playwright`, () => {
  test.beforeEach(async ({ page, headless }) => {});

  test('first test', async ({ page }) => {
    await Promise.all([page.waitForNavigation({ url: 'someurl' })]);
  });
});
