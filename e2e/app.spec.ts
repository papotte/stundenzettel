import { test, expect } from '@playwright/test';

test.describe('TimeWise App E2E', () => {
  test('should navigate to the mock login page and login as a mock user', async ({ page }) => {
    // Start from the index page
    await page.goto('/');

    // The page should contain an H1 with "TimeWise Tracker (Test Mode)"
    await expect(page.locator('h1')).toContainText('TimeWise Tracker (Test Mode)');
    
    // Find the button for the first mock user and click it
    const loginButton = page.getByRole('button', { name: /Log in as/ }).first();
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // After login, the URL should be the root
    await page.waitForURL('/');

    // The main tracker page should be visible
    await expect(page.getByRole('heading', { name: 'Live Time Tracking' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Tracking' })).toBeVisible();
  });
  
  test('should allow adding a manual time entry', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
    
    // Open the "Add" entry form
    await page.getByRole('button', { name: 'Add' }).click();
    
    // The form sheet should be visible. We identify it by its child heading.
    const sheet = page.locator('div:has(> h2:has-text("Add Time Entry"))');
    await expect(sheet).toBeVisible();
    
    // Fill out the form
    await sheet.getByLabel('Location').fill('E2E Test Location');
    await sheet.getByLabel('Start time').fill('09:30');
    await sheet.getByLabel('End time').fill('12:00');
    
    // Save the entry
    await sheet.getByRole('button', { name: 'Save Entry' }).click();

    // The sheet should close
    await expect(sheet).not.toBeVisible();
    
    // The new entry should appear on the page
    const newEntryCard = page.locator('div:has-text("E2E Test Location")');
    await expect(newEntryCard).toBeVisible();
    await expect(newEntryCard.getByText(/9:30.*-.*12:00/i)).toBeVisible();
  });
});
