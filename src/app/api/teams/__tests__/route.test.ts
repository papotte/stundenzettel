import { NextRequest } from 'next/server'

import { GET, POST } from '../route'

// Mock the team service
jest.mock('@/services/team-service', () => ({
  teamService: {
    getUserTeam: jest.fn(),
    createTeam: jest.fn(),
    getTeam: jest.fn(),
  },
}))

const mockTeamService = require('@/services/team-service').teamService

describe('/api/teams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return team for valid userId', async () => {
      const mockTeam = {
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTeamService.getUserTeam.mockResolvedValue(mockTeam)

      const request = new NextRequest(
        'http://localhost/api/teams?userId=user123',
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.team).toEqual(mockTeam)
      expect(mockTeamService.getUserTeam).toHaveBeenCalledWith('user123')
    })

    it('should return 400 for missing userId', async () => {
      const request = new NextRequest('http://localhost/api/teams')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing userId parameter')
    })

    it('should handle service errors', async () => {
      mockTeamService.getUserTeam.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest(
        'http://localhost/api/teams?userId=user123',
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get team')
    })
  })

  describe('POST', () => {
    it('should create team successfully', async () => {
      const mockTeam = {
        id: 'team123',
        name: 'Test Team',
        description: 'Test Description',
        ownerId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTeamService.createTeam.mockResolvedValue('team123')
      mockTeamService.getTeam.mockResolvedValue(mockTeam)

      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Team',
          description: 'Test Description',
          ownerId: 'user123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.team).toEqual(mockTeam)
      expect(mockTeamService.createTeam).toHaveBeenCalledWith(
        'Test Team',
        'Test Description',
        'user123',
      )
    })

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test Description',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: name, ownerId')
    })

    it('should handle creation errors', async () => {
      mockTeamService.createTeam.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Team',
          ownerId: 'user123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create team')
    })
  })
})
