import {
  FirestoreError,
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

import { sendTeamInvitationEmail } from './email-notification-service'

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
  const batch = writeBatch(db)

  // Delete team document
  batch.delete(doc(db, 'teams', teamId))

  // Delete team members
  const membersQuery = query(collection(db, 'teams', teamId, 'members'))
  const membersSnapshot = await getDocs(membersQuery)
  membersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  // Delete team users
  const usersQuery = query(collection(db, 'teams', teamId, 'users'))
  const usersSnapshot = await getDocs(usersQuery)
  usersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

  // Delete team subscription
  batch.delete(doc(db, 'teams', teamId, 'subscription', 'current'))

  await batch.commit()
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

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email,
    role: doc.data().role,
    joinedAt: doc.data().joinedAt?.toDate() || new Date(),
    invitedBy: doc.data().invitedBy,
    seatAssignment: doc.data().seatAssignment
      ? {
          assignedAt:
            doc.data().seatAssignment.assignedAt?.toDate() || new Date(),
          assignedBy: doc.data().seatAssignment.assignedBy,
          isActive: doc.data().seatAssignment.isActive,
        }
      : undefined,
  }))
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

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email,
    role: doc.data().role,
    joinedAt: doc.data().joinedAt?.toDate() || new Date(),
    invitedBy: doc.data().invitedBy,
    seatAssignment: doc.data().seatAssignment
      ? {
          assignedAt:
            doc.data().seatAssignment.assignedAt?.toDate() || new Date(),
          assignedBy: doc.data().seatAssignment.assignedBy,
          isActive: doc.data().seatAssignment.isActive,
        }
      : undefined,
  }))
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
      return handleFirebaseError(error, 'create team invitation')
    }
    throw error
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

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    teamId: doc.data().teamId,
    email: doc.data().email,
    role: doc.data().role,
    invitedBy: doc.data().invitedBy,
    invitedAt: doc.data().invitedAt?.toDate() || new Date(),
    expiresAt: doc.data().expiresAt?.toDate() || new Date(),
    status: doc.data().status,
  }))
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

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    teamId: doc.data().teamId,
    email: doc.data().email,
    role: doc.data().role,
    invitedBy: doc.data().invitedBy,
    invitedAt: doc.data().invitedAt?.toDate() || new Date(),
    expiresAt: doc.data().expiresAt?.toDate() || new Date(),
    status: doc.data().status,
  }))
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
  return {
    stripeSubscriptionId: data.stripeSubscriptionId,
    stripeCustomerId: data.stripeCustomerId,
    status: data.status,
    currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
    cancelAt: data.cancelAt?.toDate() || undefined,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    priceId: data.priceId,
    quantity: data.quantity,
    updatedAt: data.updatedAt?.toDate() || new Date(),
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
      const members = snapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role,
        joinedAt: doc.data().joinedAt?.toDate() || new Date(),
        invitedBy: doc.data().invitedBy,
      }))
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
    (doc) => {
      if (!doc.exists()) {
        callback(null)
        return
      }

      const data = doc.data()
      const subscription: Subscription = {
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
        cancelAt: data.cancelAt?.toDate() || undefined,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        priceId: data.priceId,
        quantity: data.quantity,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        planName: data.planName,
        planDescription: data.planDescription,
      }
      callback(subscription)
    },
  )
}
