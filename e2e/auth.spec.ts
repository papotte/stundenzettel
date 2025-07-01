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

  test('should log out and redirect to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
    // Click the logout button (icon with aria-label or tooltip 'Abmelden' or 'Sign Out')
    await page.getByRole('button', { name: /Abmelden|Sign Out/ }).click();
    // Should be redirected to login page
    await expect(page.getByRole('heading', { name: /TimeWise Tracker/ })).toBeVisible();
  });

  test('should redirect to login if accessing protected pages when not logged in', async ({ page }) => {
    // Try to access main tracker page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /TimeWise Tracker/ })).toBeVisible();

    // Try to access settings page
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /TimeWise Tracker/ })).toBeVisible();

    // Try to access export page
    await page.goto('/export');
    await expect(page.getByRole('heading', { name: /TimeWise Tracker/ })).toBeVisible();
  });
});
