import { test, expect, type Page } from '@playwright/test';
import { addManualEntry } from './test-helpers';

test.describe('Export Page', () => {
    
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log in as the first mock user (language is German)
    await page.goto('/');
    await page.getByRole('button', { name: /Log in as/ }).first().click();
    await page.waitForURL('/');
  });

  test('should display entries on the export preview', async ({ page }) => {
    // Add an entry to make sure the export page has data
    await addManualEntry(page, 'Export Test Entry', '10:00', '14:00');
    
    // Navigate to export page
    await page.getByRole('link', { name: 'Vorschau & Export' }).click();
    await page.waitForURL('/export');

    // Check for the entry in the preview table
    const preview = page.locator('.printable-area');
    await expect(preview).toBeVisible();
    await expect(preview.getByText('Export Test Entry')).toBeVisible();
    await expect(preview.getByText('10:00')).toBeVisible();
    await expect(preview.getByText('14:00')).toBeVisible();
    // 4 hours = 4.00
    await expect(preview.getByTestId('timesheet-week-0-total')).toContainText('4.00');
    await expect(preview.getByTestId('timesheet-month-total')).toContainText('4.00');

    // Navigate months
    const currentMonth = await page.locator('h2').textContent();
    await page.getByTestId('export-preview-next-month-button').click();
    const nextMonth = await page.locator('h2').textContent();
    expect(currentMonth).not.toEqual(nextMonth);
  });

  test('should download Excel export file', async ({ page, context }) => {
    // Add an entry so export is enabled
    await addManualEntry(page, 'Export Test Entry', '10:00', '14:00');
    
    await page.goto('/export');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Excel/i }).click(),
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('should show warning or disable export when there are no entries', async ({ page }) => {
    await page.goto('/export');
    // Export button should be disabled 
    await expect(page.getByRole('button', { name: /Excel/i })).toBeDisabled();
    // Export button should have a tooltip
    const tooltipTrigger = page.locator('span:has([data-testid="export-preview-export-button"])');
    await tooltipTrigger.hover();
    await expect(page.getByText('Keine Daten für den Export in diesem Monat verfügbar.')).toBeVisible();
  });

  test('should have a working PDF export button', async ({ page }) => {
    await addManualEntry(page, 'Export Test Entry', '10:00', '14:00');
    await page.goto('/export');
    const pdfButton = page.getByRole('button', { name: /PDF/i });
    await expect(pdfButton).toBeEnabled();
    await pdfButton.click();
  });
});
