import {
  FirestoreError,
  type QueryDocumentSnapshot,
  Timestamp,
  type Unsubscribe,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'
import { toDate } from '@/lib/utils'

import { sendTeamInvitationEmail } from './email-notification-service'

// Helper function to map Firestore document to TeamMember
function mapDocToTeamMember(docSnap: QueryDocumentSnapshot): TeamMember {
  return {
    id: docSnap.id,
    email: docSnap.data().email,
    role: docSnap.data().role,
    joinedAt: docSnap.data().joinedAt?.toDate() || new Date(),
    invitedBy: docSnap.data().invitedBy,
    seatAssignment: docSnap.data().seatAssignment
      ? {
          assignedAt:
            docSnap.data().seatAssignment.assignedAt?.toDate() || new Date(),
          assignedBy: docSnap.data().seatAssignment.assignedBy,
          isActive: docSnap.data().seatAssignment.isActive,
        }
      : undefined,
  }
}

// Helper function to map Firestore document to TeamInvitation
function mapDocToTeamInvitation(
  docSnap: QueryDocumentSnapshot,
): TeamInvitation {
  return {
    id: docSnap.id,
    teamId: docSnap.data().teamId,
    email: docSnap.data().email,
    role: docSnap.data().role,
    invitedBy: docSnap.data().invitedBy,
    invitedAt: docSnap.data().invitedAt?.toDate() || new Date(),
    expiresAt: docSnap.data().expiresAt?.toDate() || new Date(),
    status: docSnap.data().status,
  }
}

// Utility type for Firestore document data based on TeamMember
type TeamMemberFirestoreData = Omit<
  TeamMember,
  'id' | 'joinedAt' | 'seatAssignment'
> & {
  joinedAt: ReturnType<typeof serverTimestamp>
  seatAssignment?: {
    assignedAt: ReturnType<typeof serverTimestamp>
    assignedBy: string
    isActive: boolean
  }
}

// Firebase error handling utility
function handleFirebaseError(error: unknown, context: string): never {
  console.error(`Error in ${context}:`, error)

  // Handle specific Firebase errors
  if (error instanceof FirestoreError) {
    const errorMessages: Record<string, string> = {
      'permission-denied':
        'You do not have permission to perform this action. Please check your authentication.',
      'not-found':
        'The requested resource was not found. It may have been deleted or you may not have access to it.',
      unavailable:
        'Service temporarily unavailable. Please try again in a few moments.',
      'deadline-exceeded':
        'Request timed out. Please check your connection and try again.',
      'resource-exhausted': 'Service quota exceeded. Please try again later.',
      'failed-precondition':
        'Invalid request. Please verify your authentication and try again.',
      aborted: 'Request was aborted. Please try again.',
      'out-of-range': 'Invalid data provided.',
      unimplemented: 'This functionality is not available in this environment.',
      internal:
        'An internal error occurred. Please try again or contact support if the problem persists.',
      'data-loss': 'Data corruption detected. Please try again.',
      unauthenticated: 'You must be logged in to perform this action.',
    }

    const message =
      errorMessages[error.code] ||
      `Failed to ${context} (${error.code}). Please try again.`
    throw new Error(message)
  }

  // Handle other errors
  if (error instanceof Error) {
    if (
      error.message.includes('network') ||
      error.message.includes('connection')
    ) {
      throw new Error(
        'Network connection error. Please check your internet connection and try again.',
      )
    }
    if (error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.')
    }
    throw new Error(`Failed to ${context}: ${error.message}`)
  }

  throw new Error(
    `An unexpected error occurred while ${context}. Please try again.`,
  )
}

// Team CRUD operations
export async function createTeam(
  name: string,
  description: string,
  ownerId: string,
  ownerEmail: string,
): Promise<string> {
  const teamData = {
    name,
    description,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'teams'), teamData)

  // Add owner as first member
  await addTeamMember(docRef.id, ownerId, 'owner', ownerId, ownerEmail)

  // Create user-team mapping for owner
  await setDoc(doc(db, 'user-teams', ownerId), {
    teamId: docRef.id,
    role: 'owner',
    joinedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const docRef = doc(db, 'teams', teamId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}

export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description'>>,
): Promise<void> {
  const docRef = doc(db, 'teams', teamId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTeam(teamId: string): Promise<void> {
  // IMPORTANT: We intentionally delete subcollections + related documents first,
  // then delete the team document in a second batch. Some security rules reference
  // the parent team document when authorizing deletes in subcollections.

  // Safety: prevent deleting a team while it still has an active subscription record.
  // This avoids orphaning billing on Stripe. Users should cancel via the customer portal first.
  const subscriptionSnap = await getDoc(
    doc(db, 'teams', teamId, 'subscription', 'current'),
  )
  if (subscriptionSnap.exists()) {
    const data = subscriptionSnap.data()
    const status = data.status as string | undefined
    if (status && status !== 'canceled') {
      throw new Error(
        'Please cancel the team subscription before deleting the team.',
      )
    }
  }

  const cleanupBatch = writeBatch(db)

  // Delete team members and their user-team mappings
  const membersSnapshot = await getDocs(
    query(collection(db, 'teams', teamId, 'members')),
  )
  membersSnapshot.docs.forEach((memberDoc) => {
    cleanupBatch.delete(memberDoc.ref)
    // Remove user-team mapping so members no longer point to a deleted team
    cleanupBatch.delete(doc(db, 'user-teams', memberDoc.id))
  })

  // Delete team users (legacy/auxiliary collection)
  const usersSnapshot = await getDocs(
    query(collection(db, 'teams', teamId, 'users')),
  )
  usersSnapshot.docs.forEach((userDoc) => {
    cleanupBatch.delete(userDoc.ref)
  })

  // Delete team subscription document (if present)
  cleanupBatch.delete(doc(db, 'teams', teamId, 'subscription', 'current'))

  // Delete team payments (if any)
  const paymentsSnapshot = await getDocs(
    query(collection(db, 'teams', teamId, 'payments')),
  )
  paymentsSnapshot.docs.forEach((paymentDoc) => {
    cleanupBatch.delete(paymentDoc.ref)
  })

  // Delete pending invitations for this team (top-level collection)
  const invitationsSnapshot = await getDocs(
    query(collection(db, 'team-invitations'), where('teamId', '==', teamId)),
  )
  invitationsSnapshot.docs.forEach((invitationDoc) => {
    cleanupBatch.delete(invitationDoc.ref)
  })

  await cleanupBatch.commit()

  // Finally delete the team document
  const teamBatch = writeBatch(db)
  teamBatch.delete(doc(db, 'teams', teamId))
  await teamBatch.commit()
}

// Team member operations
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamMember['role'],
  invitedBy: string,
  userEmail?: string,
): Promise<void> {
  const memberData: TeamMemberFirestoreData = {
    email: userEmail || '',
    role,
    joinedAt: serverTimestamp(),
    invitedBy,
  }

  // Automatically assign seat to owners
  if (role === 'owner') {
    memberData.seatAssignment = {
      assignedAt: serverTimestamp(),
      assignedBy: invitedBy,
      isActive: true,
    }
  }

  // Use userId as document ID for proper Firestore rules
  await setDoc(doc(db, 'teams', teamId, 'members', userId), memberData)

  // Create user-team mapping for efficient lookups
  await setDoc(doc(db, 'user-teams', userId), {
    teamId,
    role,
    joinedAt: serverTimestamp(),
  })
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, 'teams', teamId, 'members'),
      orderBy('joinedAt', 'desc'),
    ),
  )

  return querySnapshot.docs.map(mapDocToTeamMember)
}

export async function updateTeamMemberRole(
  teamId: string,
  memberId: string,
  role: TeamMember['role'],
): Promise<void> {
  const docRef = doc(db, 'teams', teamId, 'members', memberId)
  await updateDoc(docRef, { role })
}

export async function removeTeamMember(
  teamId: string,
  memberId: string,
): Promise<void> {
  const batch = writeBatch(db)

  // Remove from members collection
  batch.delete(doc(db, 'teams', teamId, 'members', memberId))

  // Remove from users collection if it exists
  batch.delete(doc(db, 'teams', teamId, 'users', memberId))

  // Remove user-team mapping
  batch.delete(doc(db, 'user-teams', memberId))

  await batch.commit()
}

// Seat assignment operations
export async function assignSeat(
  teamId: string,
  memberId: string,
  assignedBy: string,
): Promise<void> {
  const docRef = doc(db, 'teams', teamId, 'members', memberId)
  await updateDoc(docRef, {
    seatAssignment: {
      assignedAt: serverTimestamp(),
      assignedBy,
      isActive: true,
    },
  })
}

export async function unassignSeat(
  teamId: string,
  memberId: string,
  unassignedBy: string,
): Promise<void> {
  const docRef = doc(db, 'teams', teamId, 'members', memberId)
  await updateDoc(docRef, {
    seatAssignment: {
      assignedAt: serverTimestamp(),
      assignedBy: unassignedBy,
      isActive: false,
    },
  })
}

export async function getAssignedSeats(teamId: string): Promise<TeamMember[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, 'teams', teamId, 'members'),
      where('seatAssignment.isActive', '==', true),
      orderBy('seatAssignment.assignedAt', 'desc'),
    ),
  )

  return querySnapshot.docs.map(mapDocToTeamMember)
}

// Team invitations
export async function createTeamInvitation(
  teamId: string,
  email: string,
  role: TeamInvitation['role'],
  invitedBy: string,
): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

  const invitationData = {
    teamId,
    email,
    role,
    invitedBy,
    invitedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    status: 'pending',
  }

  try {
    const docRef = await addDoc(
      collection(db, 'team-invitations'),
      invitationData,
    )

    // Send email invitation
    try {
      // Get team information for the email
      const team = await getTeam(teamId)
      if (!team) {
        console.warn('Team not found for email invitation:', teamId)
        return docRef.id
      }

      // Get inviter information
      let inviterName = invitedBy
      try {
        const inviterDoc = await getDoc(
          doc(db, 'teams', teamId, 'members', invitedBy),
        )
        if (inviterDoc.exists()) {
          const inviterData = inviterDoc.data()
          inviterName = inviterData.email || invitedBy
        }
      } catch (error) {
        console.warn('Could not get inviter information:', error)
        // Continue with invitation ID as fallback
      }

      // Create invitation object for email
      const invitation: TeamInvitation = {
        id: docRef.id,
        teamId,
        email,
        role,
        invitedBy,
        invitedAt: new Date(),
        expiresAt: expiresAt,
        status: 'pending',
      }

      // Send the email invitation
      await sendTeamInvitationEmail(invitation, team.name, inviterName)

      console.info('Team invitation email sent successfully', {
        invitationId: docRef.id,
        email,
        teamName: team.name,
      })
    } catch (emailError) {
      // Log email error and propagate so UI can show failure state
      throw emailError
    }

    return docRef.id
  } catch (error: unknown) {
    // If it's a Firestore error, format it; otherwise, propagate (e.g., email send failure)
    if (error instanceof FirestoreError) {
      handleFirebaseError(error, 'create team invitation')
    }
    throw error
  }
}

export async function getTeamInvitation(
  invitationId: string,
): Promise<TeamInvitation | null> {
  try {
    const docRef = doc(db, 'team-invitations', invitationId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return mapDocToTeamInvitation(docSnap as QueryDocumentSnapshot)
  } catch (error: unknown) {
    handleFirebaseError(error, 'get team invitation')
  }
}

export async function getTeamInvitations(
  teamId: string,
): Promise<TeamInvitation[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, 'team-invitations'),
      where('teamId', '==', teamId),
      where('status', '==', 'pending'),
      orderBy('invitedAt', 'desc'),
    ),
  )

  return querySnapshot.docs.map(mapDocToTeamInvitation)
}

export async function getUserInvitations(
  userEmail: string,
): Promise<TeamInvitation[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, 'team-invitations'),
      where('email', '==', userEmail),
      where('status', '==', 'pending'),
      orderBy('invitedAt', 'desc'),
    ),
  )

  return querySnapshot.docs.map(mapDocToTeamInvitation)
}

export async function acceptTeamInvitation(
  invitationId: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  const invitationRef = doc(db, 'team-invitations', invitationId)
  const invitationSnap = await getDoc(invitationRef)

  if (!invitationSnap.exists()) {
    throw new Error('Invitation not found')
  }

  const invitationData = invitationSnap.data()
  const teamId = invitationData.teamId

  const batch = writeBatch(db)

  // Update invitation status
  batch.update(invitationRef, { status: 'accepted' })

  // Add user to team
  await addTeamMember(
    teamId,
    userId,
    invitationData.role,
    invitationData.invitedBy,
    userEmail,
  )

  // Create user-team mapping
  batch.set(doc(db, 'user-teams', userId), {
    teamId,
    role: invitationData.role,
    joinedAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function declineTeamInvitation(
  invitationId: string,
): Promise<void> {
  const docRef = doc(db, 'team-invitations', invitationId)
  await updateDoc(docRef, { status: 'expired' })
}

// User's team (single)
export async function getUserTeam(userId: string): Promise<Team | null> {
  try {
    // First, check if user has a team mapping (most efficient)
    const userTeamDoc = await getDoc(doc(db, 'user-teams', userId))

    if (userTeamDoc.exists()) {
      const userTeamData = userTeamDoc.data()
      const teamId = userTeamData.teamId

      // Get the team details
      const teamDoc = await getDoc(doc(db, 'teams', teamId))

      if (teamDoc.exists()) {
        const data = teamDoc.data()
        return {
          id: teamDoc.id,
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      }
    }

    // Fallback: Check if user is owner of any team (for backward compatibility)
    const teamsQuery = query(
      collection(db, 'teams'),
      where('ownerId', '==', userId),
    )

    const teamsSnapshot = await getDocs(teamsQuery)

    if (!teamsSnapshot.empty) {
      const teamDoc = teamsSnapshot.docs[0] // User should only have one team as owner
      const data = teamDoc.data()
      return {
        id: teamDoc.id,
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    }

    // User has no team - this is a valid state, not an error
    return null
  } catch (error: unknown) {
    return handleFirebaseError(error, 'fetch team data')
  }
}

// Team subscription
export async function getTeamSubscription(
  teamId: string,
): Promise<Subscription | null> {
  const docRef = doc(db, 'teams', teamId, 'subscription', 'current')
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  // Teams have a placeholder subscription doc created on team creation.
  // Treat placeholder/inactive/missing Stripe IDs as "no subscription" in the UI.
  if (!data.stripeSubscriptionId || data.status === 'inactive') {
    return null
  }

  return {
    stripeSubscriptionId: data.stripeSubscriptionId,
    stripeCustomerId: data.stripeCustomerId,
    status: data.status,
    currentPeriodStart: toDate(data.currentPeriodStart),
    cancelAt: data.cancelAt ? toDate(data.cancelAt) : undefined,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    priceId: data.priceId,
    quantity: data.quantity,
    updatedAt: toDate(data.updatedAt),
    planName: data.planName,
    planDescription: data.planDescription,
  }
}

// Real-time listeners
export function onTeamMembersChange(
  teamId: string,
  callback: (members: TeamMember[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'teams', teamId, 'members'),
      orderBy('joinedAt', 'desc'),
    ),
    (snapshot) => {
      const members = snapshot.docs.map(mapDocToTeamMember)
      callback(members)
    },
  )
}

export function onTeamSubscriptionChange(
  teamId: string,
  callback: (subscription: Subscription | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'teams', teamId, 'subscription', 'current'),
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null)
        return
      }

      const data = docSnap.data()
      // Teams have a placeholder subscription doc created on team creation.
      // Treat placeholder/inactive/missing Stripe IDs as "no subscription" in the UI.
      if (!data.stripeSubscriptionId || data.status === 'inactive') {
        callback(null)
        return
      }
      const subscription: Subscription = {
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
        status: data.status,
        currentPeriodStart: toDate(data.currentPeriodStart),
        cancelAt: data.cancelAt ? toDate(data.cancelAt) : undefined,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        priceId: data.priceId,
        quantity: data.quantity,
        updatedAt: toDate(data.updatedAt),
        planName: data.planName,
        planDescription: data.planDescription,
      }
      callback(subscription)
    },
  )
}
