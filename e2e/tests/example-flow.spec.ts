import { TranslocoService } from '@ngneat/transloco';
import { test } from '@playwright/test';
import { loadTranslocoService } from '../transloco-e2e';

let translocoSvc: TranslocoService;
test.describe(`testing playwright`, () => {
  test.beforeEach(async ({ page, headless }) => {
    translocoSvc = loadTranslocoService();
  });

  test('first test', async ({ page }) => {});
});
