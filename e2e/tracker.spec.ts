import { expect, test } from './fixtures'
import { addActiveSubscription } from './subscription-helpers'
import { addDurationEntry, addManualEntry } from './test-helpers'

test.describe('Core Tracker Functionality', () => {
  test.beforeEach(async ({ page, loginUser }) => {
    // Set up subscription mock before login to ensure it's available when the page loads
    await addActiveSubscription(page)

    await loginUser(page)
    await page.waitForURL('/tracker')
  })

  test.describe('Live Time Tracking', () => {
    test('should start, stop, and save a live entry; and discard when form is cancelled', async ({
      page,
    }) => {
      const location = 'Live Test Location'
      await page.getByPlaceholder('Where are you working from?').fill(location)
      await page.getByRole('button', { name: 'Start Tracking' }).click()

      await expect(page.getByText(`Location: ${location}`)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
      await page.waitForTimeout(1100)
      await expect(page.locator('.font-mono')).not.toHaveText('00:00:00')

      await page.getByRole('button', { name: 'Stop' }).click()

      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
      )
      await expect(form).toBeVisible()
      await expect(form.getByRole('textbox', { name: 'Location' })).toHaveValue(
        location,
      )

      await form.getByLabel('Start Time').fill('09:00')
      await form.getByLabel('End Time').fill('09:01')
      await form.getByRole('button', { name: 'Save Entry' }).click()
      await expect(form).not.toBeVisible()

      const newEntryCard = page.locator(`[data-location="${location}"]`)
      await expect(newEntryCard).toBeVisible()

      // Discard flow: start again, stop, cancel
      await page
        .getByPlaceholder('Where are you working from?')
        .fill('Discard Me')
      await page.getByRole('button', { name: 'Start Tracking' }).click()
      await page.getByRole('button', { name: 'Stop' }).click()
      await expect(form).toBeVisible()
      await form.getByRole('button', { name: 'Cancel' }).click()
      await page.getByRole('button', { name: 'Discard' }).click()
      await expect(form).not.toBeVisible()
      await expect(
        page.locator('[data-location="Discard Me"]'),
      ).not.toBeVisible()
      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible()
    })
  })

  test.describe('Manual Time Entries', () => {
    test('should add, edit, and delete a manual entry', async ({ page }) => {
      const location = 'Manual Location'
      await addManualEntry(page, location, '09:00', '11:00')
      const entryCard = page.locator(`[data-location="${location}"]`)
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText(/9:00.*-.*11:00/)).toBeVisible()
      await expect(entryCard.getByText('02:00:00')).toBeVisible()

      await entryCard.getByRole('button', { name: 'Edit' }).click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form
        .getByRole('textbox', { name: 'Location' })
        .fill('Edited Manual Location')
      await form.getByLabel('End Time').fill('11:30')
      await form.getByRole('button', { name: 'Save Entry' }).click()

      const newLocation = 'Edited Manual Location'
      const editedCard = page.locator(`[data-location="${newLocation}"]`)
      await expect(editedCard).toBeVisible()
      await expect(editedCard.getByText('02:30:00')).toBeVisible()

      await editedCard.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()
      await expect(editedCard).not.toBeVisible()
      await expect(page.getByText('No entries for this day.')).toBeVisible()
    })

    test('should add, display, and delete a duration-only entry', async ({
      page,
    }) => {
      const location = 'Duration Only E2E'
      const duration = 90
      await addDurationEntry(page, location, duration)
      const entryCard = page.locator(`[data-location="${location}"]`)
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText(/Duration: 90 min/)).toBeVisible()
      await expect(entryCard.getByText('01:30:00')).toBeVisible()
      await entryCard.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()
      await expect(entryCard).not.toBeVisible()
    })

    test('should add an entry for a different day using date navigation', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Previous day' }).click()
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      const yesterdayIso = yesterday.toISOString().slice(0, 10)
      const dateDisplay = page.locator(`[data-selected-date="${yesterdayIso}"]`)
      await expect(dateDisplay).toBeVisible()

      const location = 'Work From Yesterday'
      await addManualEntry(page, location, '13:00', '14:00')
      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible()

      await page.getByRole('button', { name: 'Next day' }).click()
      await expect(
        page.locator(`[data-location="${location}"]`),
      ).not.toBeVisible()
      await expect(page.getByText('No entries for this day.')).toBeVisible()
    })
  })

  test.describe('Daily Actions & Special Entries', () => {
    test('should add, edit, and delete a Sick Leave entry', async ({
      page,
    }) => {
      await expect(page.getByTestId('daily-actions-card')).toBeVisible()

      const sickLeaveButton = page.getByRole('button', { name: 'Sick Leave' })
      await expect(sickLeaveButton).toBeEnabled()
      await sickLeaveButton.click()

      const sickCard = page.locator(
        '[data-testid="time-entry-card-sick_leave"]',
      )
      await expect(sickCard).toBeVisible({ timeout: 10000 })
      await expect(sickCard.getByText('08:00:00')).toBeVisible({
        timeout: 5000,
      })

      await page.waitForTimeout(500)

      const editButton = sickCard.getByRole('button', { name: 'Edit' })
      await expect(editButton).toBeEnabled()
      await editButton.click()

      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
      )
      await expect(form).toBeVisible({ timeout: 5000 })
      await expect(form.getByLabel('Duration (minutes)')).toBeVisible()

      await form.getByLabel('Duration (minutes)').fill('360')
      await form.getByRole('button', { name: 'Save Entry' }).click()

      await expect(form).not.toBeVisible({ timeout: 5000 })
      await expect(sickCard.getByText('06:00:00')).toBeVisible({
        timeout: 5000,
      })

      const deleteButton = sickCard.getByRole('button', { name: 'Delete' })
      await expect(deleteButton).toBeEnabled()
      await deleteButton.click()

      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible({
        timeout: 5000,
      })
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(sickCard).not.toBeVisible({ timeout: 5000 })
    })

    test('should sum manual and special entry hours in daily summary', async ({
      page,
    }) => {
      await addManualEntry(page, 'Morning Work', '09:00', '11:00')
      await page.getByRole('button', { name: 'Sick Leave' }).click()

      const summaryCard = page.locator('[data-testid="summary-card"]')
      const dailyTotal = summaryCard.locator('p:has-text("Selected Day") + p')
      await expect(dailyTotal).toHaveText('10h 0m')
    })
  })

  test.describe('Copy / Duplicate Entries', () => {
    test('should copy all entries from yesterday into today', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Previous day' }).click()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const location = 'Yesterday Entry'
      await addManualEntry(page, location, '09:00', '12:00')
      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible()

      await page.getByRole('button', { name: 'Next day' }).click()
      await expect(page.getByTestId('copy-from-yesterday-button')).toBeVisible()
      await page.getByTestId('copy-from-yesterday-button').click()

      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible({
        timeout: 5000,
      })
    })

    test('should copy a single entry to another day via Copy to…', async ({
      page,
    }) => {
      const location = 'To Copy Single'
      await addManualEntry(page, location, '10:00', '11:00')
      const card = page.locator(`[data-location="${location}"]`)
      await expect(card).toBeVisible()

      await card.getByRole('button', { name: 'Copy to…' }).click()
      const popover = page.getByTestId('copy-to-date-picker-popover')
      await expect(popover).toBeVisible()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dayNum = yesterday.getDate()
      await popover
        .getByRole('button', { name: String(dayNum) })
        .first()
        .click()
      await popover.getByRole('button', { name: 'Copy' }).click()
      await expect(popover).not.toBeVisible()

      await page.getByRole('button', { name: 'Previous day' }).click()
      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible({
        timeout: 5000,
      })
    })

    test('should copy all entries of the day to another date via Copy to…', async ({
      page,
    }) => {
      await addManualEntry(page, 'Day Copy A', '09:00', '10:00')
      await addManualEntry(page, 'Day Copy B', '11:00', '12:00')
      await expect(page.locator('[data-location="Day Copy A"]')).toBeVisible()
      await expect(page.locator('[data-location="Day Copy B"]')).toBeVisible()

      await page.getByTestId('copy-day-to-button').click()
      const popover = page.getByTestId('copy-to-date-picker-popover')
      await expect(popover).toBeVisible()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dayNum = yesterday.getDate()
      await popover
        .getByRole('button', { name: String(dayNum) })
        .first()
        .click()
      await popover.getByRole('button', { name: 'Copy' }).click()
      await expect(popover).not.toBeVisible()

      await page.getByRole('button', { name: 'Previous day' }).click()
      await expect(page.locator('[data-location="Day Copy A"]')).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('[data-location="Day Copy B"]')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Layout', () => {
    test('should show top nav and main; bottom nav on mobile', async ({
      page,
    }) => {
      await expect(
        page.getByRole('navigation', { name: 'Top navigation' }),
      ).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 })

      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/tracker')
      await expect(
        page.getByRole('navigation', { name: 'Bottom navigation' }),
      ).toBeVisible()
    })
  })
})
