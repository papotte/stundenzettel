import { syncTeamWithStripe } from '@/services/stripe'
import {
  getMockStripeInstance,
  setupStripeEnv,
} from '@/test-utils/stripe-mocks'

// Mock Stripe module with shared mock instance
jest.mock('stripe', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockStripeInstance } = require('@/test-utils/stripe-mocks')
  return jest.fn().mockImplementation(() => mockStripeInstance)
})

setupStripeEnv()

// Get the mocked instance for test assertions
const mockStripeInstance = getMockStripeInstance()

describe('syncTeamWithStripe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates existing customer metadata with team_id', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [
        {
          id: 'cus_1',
          metadata: { firebase_uid: 'firebase-uid-123', other_key: 'value' },
        },
      ],
    })
    mockStripeInstance.customers.update.mockResolvedValue({ id: 'cus_1' })

    await syncTeamWithStripe({
      userEmail: 'user@example.com',
      firebaseUid: 'firebase-uid-123',
      teamId: 'team-123',
    })

    expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
      email: 'user@example.com',
      limit: 1,
    })
    expect(mockStripeInstance.customers.update).toHaveBeenCalledWith('cus_1', {
      metadata: {
        firebase_uid: 'firebase-uid-123',
        other_key: 'value',
        team_id: 'team-123',
      },
    })
  })

  it('preserves existing firebase_uid when updating customer', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [
        {
          id: 'cus_1',
          metadata: { firebase_uid: 'existing-uid' },
        },
      ],
    })
    mockStripeInstance.customers.update.mockResolvedValue({ id: 'cus_1' })

    await syncTeamWithStripe({
      userEmail: 'user@example.com',
      firebaseUid: 'new-uid',
      teamId: 'team-123',
    })

    // Should preserve existing firebase_uid, not use the new one
    expect(mockStripeInstance.customers.update).toHaveBeenCalledWith('cus_1', {
      metadata: {
        firebase_uid: 'existing-uid',
        team_id: 'team-123',
      },
    })
  })

  it('creates new customer with metadata when customer does not exist', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({ data: [] })
    mockStripeInstance.customers.create.mockResolvedValue({ id: 'cus_2' })

    await syncTeamWithStripe({
      userEmail: 'newuser@example.com',
      firebaseUid: 'firebase-uid-456',
      teamId: 'team-456',
    })

    expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      limit: 1,
    })
    expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      metadata: {
        firebase_uid: 'firebase-uid-456',
        team_id: 'team-456',
      },
    })
  })

  it('throws error when userEmail is missing', async () => {
    await expect(
      syncTeamWithStripe({
        userEmail: '',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team-123',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws error when firebaseUid is missing', async () => {
    await expect(
      syncTeamWithStripe({
        userEmail: 'user@example.com',
        firebaseUid: '',
        teamId: 'team-123',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws error when teamId is missing', async () => {
    await expect(
      syncTeamWithStripe({
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: '',
      }),
    ).rejects.toThrow('Missing required parameters')
  })

  it('throws error when Stripe list customers fails', async () => {
    mockStripeInstance.customers.list.mockRejectedValue(
      new Error('Stripe API error'),
    )

    await expect(
      syncTeamWithStripe({
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team-123',
      }),
    ).rejects.toThrow('Stripe API error')
  })

  it('throws error when Stripe update customer fails', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({
      data: [
        {
          id: 'cus_1',
          metadata: { firebase_uid: 'firebase-uid-123' },
        },
      ],
    })
    mockStripeInstance.customers.update.mockRejectedValue(
      new Error('Update failed'),
    )

    await expect(
      syncTeamWithStripe({
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team-123',
      }),
    ).rejects.toThrow('Update failed')
  })

  it('throws error when Stripe create customer fails', async () => {
    mockStripeInstance.customers.list.mockResolvedValue({ data: [] })
    mockStripeInstance.customers.create.mockRejectedValue(
      new Error('Create failed'),
    )

    await expect(
      syncTeamWithStripe({
        userEmail: 'user@example.com',
        firebaseUid: 'firebase-uid-123',
        teamId: 'team-123',
      }),
    ).rejects.toThrow('Create failed')
  })
})
