import {
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

export class TeamService {
  private static instance: TeamService

  private constructor() {}

  static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService()
    }
    return TeamService.instance
  }

  // Team CRUD operations
  async createTeam(
    name: string,
    description: string,
    ownerId: string,
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
    await this.addTeamMember(docRef.id, ownerId, 'owner', ownerId)

    return docRef.id
  }

  async getTeam(teamId: string): Promise<Team | null> {
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

  async updateTeam(
    teamId: string,
    updates: Partial<Pick<Team, 'name' | 'description'>>,
  ): Promise<void> {
    const docRef = doc(db, 'teams', teamId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  async deleteTeam(teamId: string): Promise<void> {
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
  async addTeamMember(
    teamId: string,
    userId: string,
    role: TeamMember['role'],
    invitedBy: string,
  ): Promise<void> {
    // Get user details from auth
    const userDoc = await getDoc(doc(db, 'users', userId))
    const userData = userDoc.data()

    const memberData = {
      email: userData?.email || '',
      role,
      joinedAt: serverTimestamp(),
      invitedBy,
    }

    await addDoc(collection(db, 'teams', teamId, 'members'), memberData)
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
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
    }))
  }

  async updateTeamMemberRole(
    teamId: string,
    memberId: string,
    role: TeamMember['role'],
  ): Promise<void> {
    const docRef = doc(db, 'teams', teamId, 'members', memberId)
    await updateDoc(docRef, { role })
  }

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    const batch = writeBatch(db)

    // Remove from members collection
    batch.delete(doc(db, 'teams', teamId, 'members', memberId))

    // Remove from users collection
    batch.delete(doc(db, 'teams', teamId, 'users', memberId))

    await batch.commit()
  }

  // Team invitations
  async createTeamInvitation(
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
      expiresAt,
      status: 'pending',
    }

    const docRef = await addDoc(
      collection(db, 'team-invitations'),
      invitationData,
    )
    return docRef.id
  }

  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
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

  async acceptTeamInvitation(
    invitationId: string,
    userId: string,
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
    await this.addTeamMember(
      teamId,
      userId,
      invitationData.role,
      invitationData.invitedBy,
    )

    await batch.commit()
  }

  async declineTeamInvitation(invitationId: string): Promise<void> {
    const docRef = doc(db, 'team-invitations', invitationId)
    await updateDoc(docRef, { status: 'expired' })
  }

  // User's team (single)
  async getUserTeam(userId: string): Promise<Team | null> {
    const membersQuery = query(
      collection(db, 'teams'),
      where('members', 'array-contains', userId),
    )

    const querySnapshot = await getDocs(membersQuery)
    if (querySnapshot.empty) return null
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  }

  // Team subscription
  async getTeamSubscription(teamId: string): Promise<Subscription | null> {
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
  onTeamMembersChange(
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

  onTeamSubscriptionChange(
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
}

export const teamService = TeamService.getInstance()
