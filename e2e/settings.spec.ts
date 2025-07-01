
import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
  });

  test('should update settings and reflect changes', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL('/settings');

    // Change default work hours from 7 to 8.5
    await page.getByLabel('Default daily work hours').fill('8.5');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.locator('div:has-text("Settings Saved")')).toBeVisible();

    // Go back and add a PTO day
    await page.getByRole('link', { name: 'Back to Tracker' }).click();
    await page.waitForURL('/');
    
    // Clear any existing data for a clean test run
    const clearDataButton = page.getByRole('button', { name: 'Clear all data' });
    await clearDataButton.click();
    await page.getByRole('button', { name: 'Yes, delete everything' }).click();
    await expect(page.locator('div:has-text("Data Cleared")')).toBeVisible();
    await expect(page.locator('div:has-text("Data Cleared")')).not.toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'PTO' }).click();

    // Verify the new PTO entry uses the updated 8.5 hours
    const ptoCard = page.locator('div:has-text("PTO")');
    await expect(ptoCard).toBeVisible();
    await expect(ptoCard.getByText('08:30:00')).toBeVisible();
  });
});
