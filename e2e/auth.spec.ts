
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should log in and display the main tracker page', async ({ page }) => {
    await page.goto('/');
    // In test mode, we expect to see the mock user login screen.
    await expect(page.getByRole('heading', { name: 'TimeWise Tracker (Test Mode)' })).toBeVisible();
    
    // Log in as the first mock user.
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
    
    // Verify landing on the main tracker page by checking for key elements.
    await expect(page.getByRole('heading', { name: 'Live Time Tracking' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Tracking' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's Entries" })).toBeVisible();
  });
});
