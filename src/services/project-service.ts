import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { clearUndefinedValues } from '@/lib/firestore-sanitizer'
import type { Project } from '@/lib/types'

/**
 * Projects can be scoped to a single user or shared across a team.
 * Team projects are used when the team's tracking mode is `projects`.
 */
export type ProjectScope =
  | { kind: 'user'; userId: string }
  | { kind: 'team'; teamId: string }

function projectsCollection(scope: ProjectScope) {
  return scope.kind === 'team'
    ? collection(db, 'teams', scope.teamId, 'projects')
    : collection(db, 'users', scope.userId, 'projects')
}

function projectDoc(scope: ProjectScope, projectId: string) {
  return scope.kind === 'team'
    ? doc(db, 'teams', scope.teamId, 'projects', projectId)
    : doc(db, 'users', scope.userId, 'projects', projectId)
}

const fromFirestore = (id: string, docData: unknown): Project => {
  if (typeof docData !== 'object' || docData === null) {
    throw new Error('Invalid Firestore data')
  }
  const data = { ...(docData as Record<string, unknown>) }
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate()
  }
  if (!('name' in data) || typeof data.name !== 'string') {
    throw new Error('Missing required Project fields')
  }
  return { ...data, id } as unknown as Project
}

export const getProjects = async (scope: ProjectScope): Promise<Project[]> => {
  if (scope.kind === 'user' && !scope.userId) return []
  if (scope.kind === 'team' && !scope.teamId) return []
  const querySnapshot = await getDocs(projectsCollection(scope))
  return querySnapshot.docs
    .map((docSnap) => fromFirestore(docSnap.id, docSnap.data()))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const addProject = async (
  scope: ProjectScope,
  name: string,
): Promise<Project> => {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Project name is required')
  if (trimmed.length < 2) {
    throw new Error('Project name must be at least 2 characters')
  }
  const existing = await getProjects(scope)
  if (existing.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('A project with this name already exists')
  }
  const data = clearUndefinedValues({
    name: trimmed,
    archived: false,
    createdAt: Timestamp.fromDate(new Date()),
  }) as Record<string, unknown>
  const docRef = await addDoc(projectsCollection(scope), data)
  return {
    id: docRef.id,
    name: trimmed,
    archived: false,
    createdAt: new Date(),
  }
}

export const updateProject = async (
  scope: ProjectScope,
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'archived'>>,
): Promise<void> => {
  if (!projectId) throw new Error('Project ID is required')
  const trimmed = updates.name?.trim()
  if (trimmed !== undefined) {
    if (trimmed.length < 2) {
      throw new Error('Project name must be at least 2 characters')
    }
    const existing = await getProjects(scope)
    if (
      existing.some(
        (p) =>
          p.id !== projectId && p.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      throw new Error('A project with this name already exists')
    }
    updates = { ...updates, name: trimmed }
  }
  const data = clearUndefinedValues({ ...updates }) as {
    [key: string]: unknown
  }
  await updateDoc(projectDoc(scope, projectId), data)
}

export const deleteProject = async (
  scope: ProjectScope,
  projectId: string,
): Promise<void> => {
  if (!projectId) throw new Error('Project ID is required')
  await deleteDoc(projectDoc(scope, projectId))
}
