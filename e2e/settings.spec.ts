
import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
  });

  test('should update settings and reflect changes', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    await page.waitForURL('/settings');

    // Change default work hours from 7 to 8.5
    await page.getByLabel('Tägliche Standardarbeitszeit').fill('8.5');
    await page.getByRole('button', { name: 'Einstellungen speichern' }).click();
    await expect(page.locator('[data-testid="toast-title"]')).toContainText('Einstellungen gespeichert');

    // Go back and add a PTO day
    await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click();
    await page.waitForURL('/');

    await page.getByRole('button', { name: 'Urlaub' }).click();

    // Verify the new PTO entry uses the updated 8.5 hours
    const ptoCard = page.locator('[data-testid="time-entry-card-pto"]');
    await expect(ptoCard).toBeVisible();
    await expect(ptoCard.getByText('08:30:00')).toBeVisible();
  });
});
