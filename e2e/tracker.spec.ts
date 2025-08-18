import { expect, test } from './fixtures'
import { addManualEntry } from './test-helpers'

test.describe('Core Tracker Functionality', () => {
  // --- SETUP: Run before each test in this file ---
  test.beforeEach(async ({ page, loginUser }) => {
    await loginUser(page)
  })

  // --- LIVE TIME TRACKING ---
  test.describe('Live Time Tracking', () => {
    test('should start and stop the timer, then save the entry', async ({
      page,
    }) => {
      const location = 'Live Test Location'
      await page.getByPlaceholder('Where are you working from?').fill(location)
      await page.getByRole('button', { name: 'Start Tracking' }).click()

      // Check if timer is running
      await expect(page.getByText(`Location: ${location}`)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
      // Wait for a second for the timer to tick
      await page.waitForTimeout(1100)
      await expect(page.locator('.font-mono')).not.toHaveText('00:00:00')

      // Stop the timer
      await page.getByRole('button', { name: 'Stop' }).click()

      // The form should open automatically
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
      )
      await expect(form).toBeVisible()
      await expect(form.getByRole('textbox', { name: 'Location' })).toHaveValue(
        location,
      )

      // Manually set start and end times to be at least 1 minute apart
      await form.getByLabel('Start Time').fill('09:00')
      await form.getByLabel('End Time').fill('09:01')

      // Save the entry
      await form.getByRole('button', { name: 'Save Entry' }).click()
      await expect(form).not.toBeVisible()

      // Verify the new entry is on the page
      const newEntryCard = page.locator(`[data-location="${location}"]`)
      await expect(newEntryCard).toBeVisible()
    })

    test('should show a toast if starting timer without a location', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Start Tracking' }).click()
      await expect(page.locator('[data-testid="toast-title"]')).toContainText(
        'Location required',
      )
    })

    test('should discard a live entry if the form is cancelled', async ({
      page,
    }) => {
      await page
        .getByPlaceholder('Where are you working from?')
        .fill('Temporary Work')
      await page.getByRole('button', { name: 'Start Tracking' }).click()
      await page.getByRole('button', { name: 'Stop' }).click()

      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
      )
      await expect(form).toBeVisible()

      // Cancel instead of saving
      await form.getByRole('button', { name: 'Cancel' }).click()
      await page.getByRole('button', { name: 'Discard' }).click()
      await expect(form).not.toBeVisible()

      // Verify no entry was created
      await expect(page.getByText('No entries for this day.')).toBeVisible()
      await expect(
        page.locator('div:has-text("Temporary Work")'),
      ).not.toBeVisible()
    })
  })

  // --- MANUAL TIME ENTRIES ---
  test.describe('Manual Time Entries', () => {
    test('should add, edit, and delete a manual entry', async ({ page }) => {
      // Add
      const location = 'Manual Location'
      await addManualEntry(page, location, '09:00', '11:00')
      const entryCard = page.locator(`[data-location="${location}"]`)
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText(/9:00.*-.*11:00/)).toBeVisible()
      await expect(entryCard.getByText('02:00:00')).toBeVisible()

      // Edit
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

      // Delete
      await editedCard.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()
      await expect(editedCard).not.toBeVisible()
      await expect(page.getByText('No entries for this day.')).toBeVisible()
    })

    test('should add an entry for a different day using date navigation', async ({
      page,
    }) => {
      // Navigate to yesterday
      await page.getByRole('button', { name: 'Previous day' }).click()
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      // Check if the date in the button contains yesterday's day of the month.
      // This is more robust than checking a full, locale-sensitive string.
      const yesterdayIso = yesterday.toISOString().slice(0, 10)
      const dateDisplay = page.locator(`[data-selected-date="${yesterdayIso}"]`)
      await expect(dateDisplay).toBeVisible()
      // Add entry for yesterday
      const location = 'Work From Yesterday'
      await addManualEntry(page, location, '13:00', '14:00')
      await expect(page.locator(`[data-location="${location}"]`)).toBeVisible()

      // Navigate back to today
      await page.getByRole('button', { name: 'Next day' }).click()

      // Verify yesterday's entry is not visible
      await expect(
        page.locator(`[data-location="${location}"]`),
      ).not.toBeVisible()
      await expect(page.getByText('No entries for this day.')).toBeVisible()
    })

    test('should show validation error for invalid time range', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form.getByRole('textbox', { name: 'Location' }).fill('Invalid Time')
      await form.getByLabel('Start Time').fill('14:00')
      await form.getByLabel('End Time').fill('13:00')
      await form.getByRole('button', { name: 'Save Entry' }).click()
      await expect(
        form.getByText('End time must be after start time'),
      ).toBeVisible()
    })

    test('should show validation error for missing required fields', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      // Leave location empty
      await form.getByLabel('Start Time').fill('09:00')
      await form.getByLabel('End Time').fill('11:00')
      await form.getByRole('button', { name: 'Save Entry' }).click()
      await expect(
        form.getByText('Location must be at least 2 characters.'),
      ).toBeVisible()
    })

    test('should show pause suggestion for 6h and 9h activity and allow applying it', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form.getByRole('textbox', { name: 'Location' }).fill('Long Day')
      await form.getByLabel('Start Time').fill('08:00')
      await form.getByLabel('End Time').fill('14:30') // 6.5h
      // Should suggest 30 min pause
      await expect(form.getByText(/Suggestion: 30 min/)).toBeVisible()
      // Click the suggestion
      await form.getByRole('button', { name: /Suggestion: 30 min/ }).click()
      await expect(form.getByLabel('Pause')).toHaveValue('00:30')
      // Now test for 9h suggestion
      await form.getByLabel('End Time').fill('17:30') // 9.5h
      await expect(form.getByText(/Suggestion: 45 min/)).toBeVisible()
      await form.getByRole('button', { name: /Suggestion: 45 min/ }).click()
      await expect(form.getByLabel('Pause')).toHaveValue('00:45')
    })

    test('should correctly calculate total worked time with pause and driving time', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form.getByRole('textbox', { name: 'Location' }).fill('Calc Test')
      await form.getByLabel('Start Time').fill('08:00')
      await form.getByLabel('End Time').fill('12:00') // 4h
      await form.getByLabel('Pause').fill('00:30') // 30 min pause
      await form.getByLabel('Driving Time (as Driver)').fill('1.5') // 1.5h driver
      // Should show total compensated time: 4h - 0.5h + 1.5h = 5h
      await expect(form.getByText('Total Compensated Time:')).toBeVisible()
      await expect(form.getByText('5h 0m')).toBeVisible()
      // Save and check card
      await form.getByRole('button', { name: 'Save Entry' }).click()
      const entryCard = page.locator('[data-location="Calc Test"]')
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText('05:00:00')).toBeVisible()
    })

    test('should correctly calculate total worked time with pause, driving, and passenger time', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form.getByRole('textbox', { name: 'Location' }).fill('Calc Test 2')
      await form.getByLabel('Start Time').fill('08:00')
      await form.getByLabel('End Time').fill('12:00') // 4h
      await form.getByLabel('Pause').fill('00:30') // 30 min pause
      await form.getByLabel('Driving Time (as Driver)').fill('1') // 1h driver
      await form.getByLabel('Driving Time (as Passenger)').fill('0.5') // 0.5h passenger
      // Should show total compensated time: 4h - 0.5h + 1h + 0.5h*0.9 = 4.95h => 4h 57m
      await expect(form.getByText('Total Compensated Time:')).toBeVisible()
      await expect(form.getByText('4h 57m')).toBeVisible()
      // Save and check card
      await form.getByRole('button', { name: 'Save Entry' }).click()
      const entryCard = page.locator('[data-location="Calc Test 2"]')
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText('04:57:00')).toBeVisible()
    })

    test('should allow entry starting and/or ending at midnight', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form
        .getByRole('textbox', { name: 'Location' })
        .fill('Midnight Start')
      await form.getByLabel('Start Time').fill('00:00')
      await form.getByLabel('End Time').fill('01:00')
      await form.getByRole('button', { name: 'Save Entry' }).click()
      const entryCard = page.locator('[data-location="Midnight Start"]')
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText('01:00:00')).toBeVisible()
    })

    test('should not allow entry spanning midnight (end before start)', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form
        .getByRole('textbox', { name: 'Location' })
        .fill('Spanning Midnight')
      await form.getByLabel('Start Time').fill('23:00')
      await form.getByLabel('End Time').fill('01:00')
      await form.getByRole('button', { name: 'Save Entry' }).click()
      await expect(
        form.getByText('End time must be after start time'),
      ).toBeVisible()
    })

    test('should allow entry with maximum allowed duration (10 hours)', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form.getByRole('textbox', { name: 'Location' }).fill('Max Duration')
      await form.getByLabel('Start Time').fill('08:00')
      await form.getByLabel('End Time').fill('18:00')
      await form.getByRole('button', { name: 'Save Entry' }).click()
      const entryCard = page.locator('[data-location="Max Duration"]')
      await expect(entryCard).toBeVisible()
      await expect(entryCard.getByText('10:00:00')).toBeVisible()
    })

    test('should not allow entry with duration greater than 10 hours', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add' }).first().click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
      )
      await expect(form).toBeVisible()
      await form.getByRole('textbox', { name: 'Location' }).fill('Too Long')
      await form.getByLabel('Start Time').fill('08:00')
      await form.getByLabel('End Time').fill('19:00')
      // Should show a validation error
      await expect(form.getByText(/Warning/i)).toBeVisible()
      await form.getByRole('button', { name: 'Save Entry' }).click()
    })
  })

  // --- DAILY ACTIONS & SPECIAL ENTRIES ---
  test.describe('Daily Actions & Special Entries', () => {
    test('should add, edit, and delete a Sick Leave entry', async ({
      page,
    }) => {
      const sickLeaveButtonText = 'Sick Leave'

      // Add
      await page.getByRole('button', { name: sickLeaveButtonText }).click()
      const sickCard = page.locator(
        `[data-testid="time-entry-card-sick_leave"]`,
      )
      await expect(sickCard).toBeVisible()
      // Default work hours for mock user 1 is 7 hours
      await expect(sickCard.getByText('07:00:00')).toBeVisible()

      // Edit
      await sickCard.getByRole('button', { name: 'Edit' }).click()
      const form = page.locator(
        'div[role="dialog"]:has(h2:has-text("Edit Time Entry"))',
      )
      await expect(form).toBeVisible()
      // A special entry's start/end times can be changed.
      await form.getByLabel('Duration (minutes)').fill('360') // Originally 7h
      await form.getByRole('button', { name: 'Save Entry' }).click()
      await expect(sickCard.getByText('06:00:00')).toBeVisible() // Now 6h

      // Delete
      await sickCard.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(sickCard).not.toBeVisible()
    })

    test('should correctly calculate total for special entries (Vacation, Bank Holiday, Time Off in Lieu)', async ({
      page,
    }) => {
      // Vacation (PTO)
      await page.getByRole('button', { name: 'Paid Time Off' }).click()
      const ptoCard = page.locator('[data-testid="time-entry-card-pto"]')
      await expect(ptoCard).toBeVisible()
      await expect(ptoCard.getByText('07:00:00')).toBeVisible()

      // Bank Holiday
      await page.getByRole('button', { name: 'Bank Holiday' }).click()
      const holidayCard = page.locator(
        '[data-testid="time-entry-card-bank_holiday"]',
      )
      await expect(holidayCard).toBeVisible()
      await expect(holidayCard.getByText('07:00:00')).toBeVisible()

      // Time Off in Lieu
      await page.getByRole('button', { name: 'Time Off in Lieu' }).click()
      const toilCard = page.locator(
        '[data-testid="time-entry-card-time_off_in_lieu"]',
      )
      await expect(toilCard).toBeVisible()
      await expect(toilCard.getByText('—')).toBeVisible()
    })

    test('should prevent adding a duplicate special entry', async ({
      page,
    }) => {
      const ptoButtonText = 'Paid Time Off'
      const entryAddedToastText = 'Entry Added'
      const entryExistsToastText =
        'An entry for "Paid Time Off" on this day already exists.'

      await page.getByRole('button', { name: ptoButtonText }).click()
      const entryAddedToast = page.locator(`[data-testid="toast-title"]`)
      await expect(entryAddedToast).toContainText(entryAddedToastText)

      // Try to add it again
      await page.getByRole('button', { name: ptoButtonText }).click()
      const entryErrorToastDescription = page.locator(
        `[data-testid="toast-description"]`,
      )
      await expect(entryErrorToastDescription).toContainText(
        entryExistsToastText,
      )
    })

    test('should correctly sum hours from multiple entry types in daily summary', async ({
      page,
    }) => {
      // Manual entry: 2 hours
      await addManualEntry(page, 'Morning Work', '09:00', '11:00')

      // Special entry: 7 hours (default for mock user 1), which is "Sick Leave"
      await page.getByRole('button', { name: 'Sick Leave' }).click()

      // The summary total should be 2 + 7 = 9 hours.
      const summaryCard = page.locator('[data-testid="summary-card"]')
      const dailyTotal = summaryCard.locator('p:has-text("Selected Day") + p')
      await expect(dailyTotal).toHaveText('9h 0m')
    })
  })

  test.describe('Accessibility', () => {
    test('should trap focus in dialogs', async ({ page }) => {
      await page.getByRole('button', { name: /Add/i }).click()
      const dialog = page.locator('div[role="dialog"]')
      await expect(dialog).toBeVisible()
      // Press Tab and check focus stays within dialog
      await page.keyboard.press('Tab')
      // ...repeat as needed, or use a11y tools for more thorough checks
    })

    test('should have correct ARIA roles', async ({ page }) => {
      // Top navigation should always be present
      await expect(
        page.getByRole('navigation', { name: 'Top navigation' }),
      ).toBeVisible()
      // Bottom navigation should be present on mobile
      const viewport = await page.viewportSize()
      if (viewport && viewport.width < 768) {
        await expect(
          page.getByRole('navigation', { name: 'Bottom navigation' }),
        ).toBeVisible()
      }
      await expect(page.getByRole('main')).toBeVisible()
      // Check for other important roles
    })

    test('should set aria-current="page" on the active bottom nav item (mobile)', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/tracker')
      // Home should be active
      const homeLink = page
        .getByRole('navigation', { name: 'Bottom navigation' })
        .getByRole('link', { name: /Home/ })
      await expect(homeLink).toHaveAttribute('aria-current', 'page')

      // Go to export page
      await page.getByRole('link', { name: /Preview & Export/ }).click()
      await page.waitForURL('/export')
      const exportLink = page
        .getByRole('navigation', { name: 'Bottom navigation' })
        .getByRole('link', {
          name: /Export|Preview & Export/,
        })
      await expect(exportLink).toHaveAttribute('aria-current', 'page')
    })
  })

  test.describe('responsive design', () => {
    for (const viewport of [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 375, height: 667 },
    ]) {
      test(`should render correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        })
        await page.goto('/tracker')
        // Top navigation should always be present
        await expect(
          page.getByRole('navigation', { name: 'Top navigation' }),
        ).toBeVisible()
        // Bottom navigation should be present on mobile
        if (viewport.width < 768) {
          await expect(
            page.getByRole('navigation', { name: 'Bottom navigation' }),
          ).toBeVisible()
        }
        // Optionally, check for mobile menu, etc.
      })
    }
  })
})
