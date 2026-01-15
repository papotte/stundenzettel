import { type Page, expect } from '@playwright/test'

import { format, isSameMonth, parse } from 'date-fns'
import { getApps } from 'firebase/app'
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'

// Helper function to create a new manual entry for the currently selected day
// ⚠️ REQUIRES SUBSCRIPTION: This function uses the "Add" button which is a SubscriptionGuardButton.
// Make sure to call addActiveSubscription(page) in your test's beforeEach hook.
export const addManualEntry = async (
  page: Page,
  location: string,
  startTime: string,
  endTime: string,
) => {
  await page.getByRole('button', { name: 'Add' }).first().click()
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
  )
  await expect(form).toBeVisible()
  await form.getByRole('textbox', { name: 'Location' }).fill(location)
  await form.getByLabel('Start Time').fill(startTime)
  await form.getByLabel('End Time').fill(endTime)
  await form.getByRole('button', { name: 'Save Entry' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to create a new duration-only entry for the currently selected day
// ⚠️ REQUIRES SUBSCRIPTION: This function uses the "Add" button which is a SubscriptionGuardButton.
// Make sure to call addActiveSubscription(page) in your test's beforeEach hook.
export const addDurationEntry = async (
  page: Page,
  location: string,
  duration: number, // in minutes
) => {
  await page.getByRole('button', { name: 'Add' }).first().click()
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
  )
  await expect(form).toBeVisible()
  await form.getByRole('textbox', { name: 'Location' }).fill(location)
  // Switch to duration mode (Radix Switch)
  await form.getByTestId('mode-switch').click()
  await form.getByLabel('Duration (minutes)').fill(duration.toString())
  await form.getByRole('button', { name: 'Save Entry' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to navigate to team page and verify it loads
export const navigateToTeamPage = async (page: Page) => {
  await page.goto('/team')
  await page.waitForURL('/team')
  await expect(
    page.getByRole('heading', { name: /Team Management/ }),
  ).toBeVisible()
}

// Helper function to navigate to a specific month in the export view
export const navigateToMonth = async (page: Page, targetDate: Date) => {
  // Get current month from the page
  const getCurrentMonth = async (): Promise<Date | null> => {
    const monthText = await page.locator('h2').textContent()
    if (!monthText) return null

    try {
      // Parse month text (e.g., "August 2025") using date-fns
      const currentDate = parse(monthText, 'MMMM yyyy', new Date())
      return isNaN(currentDate.getTime()) ? null : currentDate
    } catch {
      return null
    }
  }

  // Navigate to the target month
  let currentDate = await getCurrentMonth()
  let attempts = 0
  const maxAttempts = 24 // Prevent infinite loops (2 years max)

  while (currentDate && attempts < maxAttempts) {
    if (isSameMonth(currentDate, targetDate)) {
      break // We've reached the target month
    }

    if (currentDate < targetDate) {
      // Need to go forward
      await page.getByTestId('export-preview-next-month-button').click()
    } else {
      // Need to go backward
      await page.getByTestId('export-preview-previous-month-button').click()
    }

    // Wait a bit for the page to update
    await page.waitForTimeout(100)

    currentDate = await getCurrentMonth()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error(
      `Failed to navigate to ${format(targetDate, 'MMMM yyyy')} after ${maxAttempts} attempts`,
    )
  }
}

// Helper function to add an entry for a specific date in the export view
// ⚠️ REQUIRES SUBSCRIPTION: This function uses the "Add" button which is a SubscriptionGuardButton.
// Make sure to call addActiveSubscription(page) in your test's beforeEach hook.
export const addExportEntry = async (
  page: Page,
  date: Date,
  location: string,
  startTime: string,
  endTime: string,
) => {
  // Wait for the export page to load
  await expect(page.getByTestId('export-preview-card')).toBeVisible()

  // Wait for the timesheet to load
  await expect(page.getByTestId('export-preview-month')).toBeVisible()

  // Workaround for Sunday: if the date is a Sunday, add one day since empty Sundays are not rendered
  let targetDate = date
  if (date.getDay() === 0) {
    targetDate = new Date(date)
    targetDate.setDate(targetDate.getDate() + 1)
  }

  // Format the date as YYYY-MM-DD for the test ID
  const yyyy = targetDate.getFullYear()
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0')
  const dd = String(targetDate.getDate()).padStart(2, '0')
  const dateId = `timesheet-day-${yyyy}-${mm}-${dd}`

  // Find the row for the specific date and click the add button
  const dayRow = page.getByTestId(dateId)
  const addButton = dayRow.getByRole('button', {
    name: /Add entry|Add/,
  })
  await addButton.click()

  // Fill out the form
  const form = page.locator(
    'div[role="dialog"]:has(h2:has-text("Add Time Entry"))',
  )
  await expect(form).toBeVisible()
  await form.getByRole('textbox', { name: 'Location' }).fill(location)
  await form.getByLabel('Start Time').fill(startTime)
  await form.getByLabel('End Time').fill(endTime)
  await form.getByRole('button', { name: 'Save Entry' }).click()
  await expect(form).not.toBeVisible()
}

// Helper function to test authentication redirect
export const testAuthRedirect = async (page: Page, protectedPath: string) => {
  await page.goto(protectedPath)

  // Should be redirected to login page with returnUrl parameter
  await page.waitForURL(/\/login\?returnUrl=/)

  // Verify we're on the login page
  await expect(
    page.getByRole('heading', { name: /TimeWise Tracker/ }),
  ).toBeVisible()

  // Verify the returnUrl parameter points to the protected path
  const currentUrl = page.url()
  expect(currentUrl).toContain('returnUrl=')
  expect(currentUrl).toContain(protectedPath.replace('/', ''))
}

// Helper function to create a complete test setup (team + invitation) directly in the database
export const createTestTeamWithInvitation = async (
  teamName: string,
  teamDescription: string,
  ownerId: string,
  ownerEmail: string,
  inviteeEmail: string,
  inviteeRole: 'member' | 'admin' = 'member',
): Promise<{ teamId: string; invitationId: string }> => {
  try {
    // Get Firestore instance (same as in auth-utils.ts)
    const db = getFirestore(getApps()[0], 'test-database')

    // Create team directly in database
    const teamData = {
      name: teamName,
      description: teamDescription,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const teamDocRef = await addDoc(collection(db, 'teams'), teamData)
    const teamId = teamDocRef.id

    // Add owner as first member
    const memberData = {
      email: ownerEmail,
      role: 'owner',
      joinedAt: serverTimestamp(),
      invitedBy: ownerId,
      seatAssignment: {
        assignedAt: serverTimestamp(),
        assignedBy: ownerId,
        isActive: true,
      },
    }

    await setDoc(doc(db, 'teams', teamId, 'members', ownerId), memberData)

    // Create user-team mapping for owner
    await setDoc(doc(db, 'user-teams', ownerId), {
      teamId,
      role: 'owner',
      joinedAt: serverTimestamp(),
    })

    // Create invitation directly in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    const invitationData = {
      teamId,
      email: inviteeEmail,
      role: inviteeRole,
      invitedBy: ownerId,
      invitedAt: serverTimestamp(),
      expiresAt,
      status: 'pending',
    }

    const invitationDocRef = await addDoc(
      collection(db, 'team-invitations'),
      invitationData,
    )
    const invitationId = invitationDocRef.id

    return { teamId, invitationId }
  } catch (error) {
    console.error('Failed to create test team with invitation:', error)
    throw error
  }
}

// Helper function to create a user subscription directly in Firestore
export const createUserSubscription = async (
  userId: string,
  options: {
    status?: 'active' | 'trialing' | 'past_due' | 'canceled'
    planName?: string
    planDescription?: string
    priceId?: string
    quantity?: number
    stripeSubscriptionId?: string
    stripeCustomerId?: string
  } = {},
): Promise<{
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
  priceId: string
}> => {
  try {
    const db = getFirestore(getApps()[0], 'test-database')

    const {
      status = 'active',
      planName = 'Team Plan',
      planDescription = 'Team subscription plan',
      priceId = 'price_team_monthly',
      quantity = 5,
      stripeSubscriptionId = `sub_test_${Date.now()}`,
      stripeCustomerId = `cus_test_${Date.now()}`,
    } = options

    const subscriptionData = {
      stripeSubscriptionId,
      stripeCustomerId,
      status,
      currentPeriodStart: serverTimestamp(),
      cancelAtPeriodEnd: false,
      priceId,
      quantity,
      planName,
      planDescription,
      updatedAt: serverTimestamp(),
    }

    // Write subscription to user's subscription collection
    await setDoc(
      doc(db, 'users', userId, 'subscription', 'current'),
      subscriptionData,
    )

    return {
      stripeSubscriptionId,
      stripeCustomerId,
      status,
      priceId,
    }
  } catch (error) {
    console.error('Failed to create user subscription:', error)
    throw error
  }
}
