import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should log in and display the main tracker page', async ({ page }) => {
    await page.goto('/');
    // In test mode, we expect to see the mock user login screen.
    // The language is still English here, before a user is selected.
    await expect(page.getByRole('heading', { name: 'TimeWise Tracker (Test Mode)' })).toBeVisible();

    // Log in as the first mock user (Raquel, who uses German).
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');

    // Verify landing on the main tracker page by checking for key elements in German.
    await expect(page.getByText('Live-Zeiterfassung')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Erfassung starten' })).toBeVisible();
    await expect(page.getByText('Heutige Einträge')).toBeVisible();
  });
});
