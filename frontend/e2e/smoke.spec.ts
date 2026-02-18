import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('Decal Applier smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /broken wing racing league/i })).toBeVisible();
  });

  test('car model dropdown is present and eventually populated', async ({ page }) => {
    const select = page.getByLabel(/car model/i);
    await expect(select).toBeVisible();
    // Wait for config to load — options beyond the placeholder should appear
    await expect(page.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeVisible({
      timeout: 5000,
    });
  });

  test('Apply button is disabled on load', async ({ page }) => {
    await expect(page.getByRole('button', { name: /apply decals/i })).toBeDisabled();
  });

  test('driver class selector hidden initially', async ({ page }) => {
    await expect(page.getByLabel(/driver class/i)).not.toBeVisible();
  });

  test('driver class selector appears when class-decal car is selected', async ({ page }) => {
    await page.getByLabel(/car model/i).selectOption('ferrari-296-gt3');
    await expect(page.getByLabel(/driver class/i)).toBeVisible();
  });

  test('driver class selector hidden for car without class decals', async ({ page }) => {
    await page.getByLabel(/car model/i).selectOption('porsche-911-gt3-r');
    await expect(page.getByLabel(/driver class/i)).not.toBeVisible();
  });

  test('completes the full apply flow and downloads a PNG', async ({ page }) => {
    const fixturePath = path.join(import.meta.dirname, 'fixtures', 'minimal.png');

    await page.getByLabel(/car model/i).selectOption('porsche-911-gt3-r');
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /apply decals/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('livery-with-decals.png');
  });
});
