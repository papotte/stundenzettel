import {
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
    return docRef.id
  } catch (error) {
    console.error('Error creating invitation:', error)
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
  } catch (e) {
    console.error('Error fetching user team:', e)
    return { error: e instanceof Error ? e : new Error('Unknown error occurred') }
  }

  return null
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
