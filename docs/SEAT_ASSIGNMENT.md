# Seat Assignment Feature

## Overview

The seat assignment feature allows team owners and admins to manage which team members have access to the team's subscription seats. This provides granular control over who can use the team's paid features.

## Features

### Seat Assignment Management

- **Assign Seats**: Team owners and admins can assign seats to team members
- **Unassign Seats**: Remove seat assignments from team members (except owners)
- **Owner Seat Protection**: Team owners automatically get seats assigned and cannot have them unassigned
- **Seat Usage Tracking**: View how many seats are assigned vs. available
- **Seat Limit Enforcement**: Prevent assigning more seats than available in the subscription

### User Interface

- **Seat Assignment Dialog**: Dedicated dialog for managing seat assignments
- **Seat Status Display**: Visual indicators showing which members have assigned seats
- **Real-time Updates**: Seat assignments update immediately in the UI
- **Responsive Design**: Works on both desktop and mobile devices

## How It Works

### Data Structure

Each team member can have an optional `seatAssignment` field:

```typescript
interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
  invitedBy: string
  seatAssignment?: {
    assignedAt: Date
    assignedBy: string
    isActive: boolean
  }
}
```

### Seat Assignment Process

1. **Check Subscription**: Only teams with active subscriptions can assign seats
2. **Verify Permissions**: Only owners and admins can manage seat assignments
3. **Check Availability**: Cannot assign more seats than available in the subscription
4. **Update Database**: Seat assignment is stored in Firestore
5. **Update UI**: Real-time updates reflect the changes immediately

### Automatic Owner Seat Assignment

1. **Team Creation**: When a team is created, the owner automatically gets a seat assigned
2. **Owner Protection**: Owners cannot have their seats unassigned
3. **UI Indication**: Owners show "Owner seat required" instead of unassign button

### Seat Unassignment Process

1. **Verify Permissions**: Only owners and admins can unassign seats
2. **Owner Protection**: Cannot unassign seats from team owners
3. **Update Database**: Seat assignment is marked as inactive
4. **Update UI**: Real-time updates reflect the changes immediately

## API Functions

### Core Functions

- `assignSeat(teamId, memberId, assignedBy)`: Assign a seat to a team member
- `unassignSeat(teamId, memberId, unassignedBy)`: Unassign a seat from a team member
- `getAssignedSeats(teamId)`: Get all team members with active seat assignments

### Service Layer

The feature supports both Firestore (production) and local (testing) implementations:

- `src/services/team-service.firestore.ts`: Production implementation
- `src/services/team-service.local.ts`: Testing implementation

## User Experience

### For Team Owners/Admins

1. Navigate to the Team page
2. Go to the "Members" tab
3. Click "Seat Assignment" button
4. Use the dialog to assign/unassign seats
5. View real-time seat usage statistics

### For Team Members

- Members can see their seat assignment status in the team members list
- Members cannot assign or unassign seats themselves

## Security Considerations

### Permission Checks

- Only team owners and admins can manage seat assignments
- Members cannot assign or unassign seats
- Seat assignments are tied to the team's subscription status

### Data Validation

- Seat assignments are validated against subscription limits
- Cannot assign more seats than available in the subscription
- Owners automatically get seats assigned when teams are created
- Cannot unassign seats from team owners
- All operations are logged with user information

## Testing

### Unit Tests

- `src/components/team/__tests__/seat-assignment-dialog.test.tsx`: Tests for the seat assignment dialog
- Covers rendering, seat status display, button states, and error handling

### Manual Testing

1. Create a team with a subscription
2. Add team members
3. Test seat assignment and unassignment
4. Verify seat limit enforcement
5. Test with different user roles

## Future Enhancements

### Potential Improvements

- **Bulk Operations**: Assign/unassign multiple seats at once
- **Seat History**: Track seat assignment changes over time
- **Automatic Assignment**: Auto-assign seats when members join
- **Seat Scheduling**: Temporary seat assignments with expiration dates
- **Usage Analytics**: Track seat utilization patterns

### Integration Opportunities

- **Billing Integration**: Automatic seat count updates in Stripe
- **Notification System**: Notify members when seats are assigned/unassigned
- **Audit Trail**: Comprehensive logging of all seat assignment changes
