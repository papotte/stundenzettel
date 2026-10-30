import {
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'

import {
  type ProjectScope,
  addProject,
  deleteProject,
  getProjects,
  updateProject,
} from '../project-service'

jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
    })),
  },
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>

const userScope: ProjectScope = { kind: 'user', userId: 'user-1' }
const teamScope: ProjectScope = { kind: 'team', teamId: 'team-1' }

const mockCollectionRef = {} as CollectionReference
const mockDocRef = {} as DocumentReference

function projectDocSnapshot(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  } as unknown as DocumentSnapshot
}

describe('Project Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCollection.mockReturnValue(mockCollectionRef)
    mockDoc.mockReturnValue(mockDocRef)
  })

  describe('getProjects', () => {
    it('returns sorted projects for a user scope', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          projectDocSnapshot('p2', { name: 'Zeta' }),
          projectDocSnapshot('p1', { name: 'Alpha' }),
        ],
      } as unknown as QuerySnapshot)

      const result = await getProjects(userScope)

      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'users',
        'user-1',
        'projects',
      )
      expect(result.map((p) => p.name)).toEqual(['Alpha', 'Zeta'])
    })

    it('queries the team projects collection for a team scope', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [projectDocSnapshot('p1', { name: 'Only' })],
      } as unknown as QuerySnapshot)

      const result = await getProjects(teamScope)

      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'teams',
        'team-1',
        'projects',
      )
      expect(result).toHaveLength(1)
    })

    it('returns empty list for empty ids', async () => {
      expect(await getProjects({ kind: 'user', userId: '' })).toEqual([])
      expect(await getProjects({ kind: 'team', teamId: '' })).toEqual([])
      expect(mockGetDocs).not.toHaveBeenCalled()
    })
  })

  describe('addProject', () => {
    beforeEach(() => {
      mockGetDocs.mockResolvedValue({ docs: [] } as unknown as QuerySnapshot)
      mockAddDoc.mockResolvedValue({ id: 'new-id' } as DocumentReference)
    })

    it('creates a project and returns it', async () => {
      const result = await addProject(userScope, '  Alpha  ')

      expect(mockAddDoc).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({ name: 'Alpha', archived: false }),
      )
      expect(result).toMatchObject({
        id: 'new-id',
        name: 'Alpha',
        archived: false,
      })
    })

    it('rejects empty or too short names', async () => {
      await expect(addProject(userScope, '   ')).rejects.toThrow(
        'Project name is required',
      )
      await expect(addProject(userScope, 'a')).rejects.toThrow(
        'at least 2 characters',
      )
    })

    it('rejects duplicate names case-insensitively', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [projectDocSnapshot('p1', { name: 'Alpha' })],
      } as unknown as QuerySnapshot)

      await expect(addProject(userScope, 'ALPHA')).rejects.toThrow(
        'already exists',
      )
    })
  })

  describe('updateProject', () => {
    beforeEach(() => {
      mockGetDocs.mockResolvedValue({ docs: [] } as unknown as QuerySnapshot)
    })

    it('writes the update to the project document', async () => {
      await updateProject(teamScope, 'p1', { name: 'Beta', archived: true })

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'teams',
        'team-1',
        'projects',
        'p1',
      )
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        name: 'Beta',
        archived: true,
      })
    })

    it('throws when projectId is missing', async () => {
      await expect(updateProject(userScope, '', { name: 'x' })).rejects.toThrow(
        'Project ID is required',
      )
    })

    it('rejects a name already used by another project', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [projectDocSnapshot('p2', { name: 'Beta' })],
      } as unknown as QuerySnapshot)

      await expect(
        updateProject(userScope, 'p1', { name: ' beta ' }),
      ).rejects.toThrow('already exists')
      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })

    it('allows keeping the same name on the same project', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [projectDocSnapshot('p1', { name: 'Alpha' })],
      } as unknown as QuerySnapshot)

      await updateProject(userScope, 'p1', { name: 'ALPHA' })
      expect(mockUpdateDoc).toHaveBeenCalled()
    })
  })

  describe('deleteProject', () => {
    it('deletes the project document', async () => {
      await deleteProject(userScope, 'p1')

      expect(mockDoc).toHaveBeenCalledWith(
        {},
        'users',
        'user-1',
        'projects',
        'p1',
      )
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocRef)
    })
  })
})
