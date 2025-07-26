# Team Management and Subscription System

This document provides a comprehensive overview of the team management and subscription system in the TimeWise Tracker application.

## Overview

The team management and subscription system allows users to create teams, invite members, manage roles and permissions, and handle subscription billing through Stripe. The system supports both individual and team-based subscriptions with seat-based licensing.

## Table of Contents

1. [Team Management](#team-management)
2. [Subscription System](#subscription-system)
3. [Role-Based Access Control](#role-based-access-control)
4. [Team Invitations](#team-invitations)
5. [Seat Assignment](#seat-assignment)
6. [Billing and Payments](#billing-and-payments)
7. [API Functions](#api-functions)
8. [Data Models](#data-models)
9. [Security](#security)
10. [Testing](#testing)
11. [Future Enhancements](#future-enhancements)

## Team Management

### Team Creation

- **Team Owner**: The user who creates the team becomes the owner
- **Team Information**: Name, description, and metadata
- **Automatic Setup**: Owner is automatically added as the first member with full permissions
- **Team ID**: Unique identifier for team operations

### Team Structure

- **Owner**: Full control over team settings, members, and subscription
- **Admin**: Can manage members, invitations, and some team settings
- **Member**: Basic access to team features and data

### Team Operations

- **Create Team**: Initialize a new team with owner
- **Update Team**: Modify team name and description
- **Delete Team**: Remove team and all associated data
- **Get Team**: Retrieve team information and metadata

## Subscription System

### Subscription Types

- **Individual Subscriptions**: Single-user plans for personal use
- **Team Subscriptions**: Multi-user plans with seat-based licensing
- **Trial Support**: Free trial periods for new subscriptions
- **Billing Cycles**: Monthly and yearly billing options

### Subscription Features

- **Seat Management**: Assign and unassign seats to team members
- **Usage Tracking**: Monitor seat usage vs. available seats
- **Billing Integration**: Direct integration with Stripe for payments
- **Customer Portal**: Self-service billing management

### Subscription States

- **Active**: Fully functional subscription with valid payment
- **Trialing**: Free trial period with limited features
- **Past Due**: Payment failed, subscription suspended
- **Canceled**: Subscription terminated
- **Incomplete**: Payment pending or failed

## Role-Based Access Control

### Role Hierarchy

1. **Owner**: Full system access
   - Create and manage teams
   - Manage all team members and roles
   - Control subscription and billing
   - Delete team and data
   - Assign/unassign seats

2. **Admin**: Team management access
   - Invite and remove team members
   - Manage member roles (except owner)
   - View team settings and subscription
   - Assign/unassign seats

3. **Member**: Basic team access
   - View team information
   - Access team features
   - Cannot manage team settings

### Permission Matrix

| Action               | Owner | Admin | Member |
| -------------------- | ----- | ----- | ------ |
| Create Team          | ✅    | ❌    | ❌     |
| Update Team Settings | ✅    | ❌    | ❌     |
| Delete Team          | ✅    | ❌    | ❌     |
| Invite Members       | ✅    | ✅    | ❌     |
| Remove Members       | ✅    | ✅    | ❌     |
| Change Member Roles  | ✅    | ✅    | ❌     |
| Manage Subscription  | ✅    | ❌    | ❌     |
| Assign Seats         | ✅    | ✅    | ❌     |
| View Team Data       | ✅    | ✅    | ✅     |

## Team Invitations

### Invitation Process

1. **Create Invitation**: Owner or admin sends invitation
2. **Email Notification**: Invitee receives email with invitation link
3. **Accept/Decline**: Invitee can accept or decline invitation
4. **Role Assignment**: Accepted invitation assigns specified role
5. **Team Access**: New member gains access to team features

### Invitation Features

- **Role Selection**: Choose between admin and member roles
- **Expiration**: Invitations expire after 7 days
- **Resend**: Ability to resend expired invitations
- **Cancel**: Cancel pending invitations
- **Status Tracking**: Track invitation status (pending, accepted, expired)

### Invitation Management

- **Pending Invitations**: View and manage outstanding invitations
- **Invitation History**: Track all sent invitations
- **Bulk Operations**: Cancel multiple invitations
- **Email Validation**: Ensure valid email addresses

## Seat Assignment

### Seat Management

- **Automatic Assignment**: Owners automatically get seats assigned
- **Manual Assignment**: Admins can assign seats to members
- **Seat Limits**: Cannot exceed subscription seat limit
- **Owner Protection**: Owners cannot have seats unassigned

### Seat Operations

- **Assign Seat**: Grant access to team features
- **Unassign Seat**: Remove access (except for owners)
- **Seat Usage**: Track assigned vs. available seats
- **Seat Validation**: Ensure seat limits are respected

### Seat Features

- **Usage Tracking**: Real-time seat usage monitoring
- **Limit Enforcement**: Prevent exceeding subscription limits
- **Owner Protection**: Automatic seat assignment for owners
- **Visual Indicators**: Clear seat status display

## Billing and Payments

### Stripe Integration

- **Checkout Sessions**: Secure payment processing
- **Customer Management**: Automatic customer creation and linking
- **Subscription Management**: Handle subscription lifecycle
- **Webhook Processing**: Real-time subscription updates

### Payment Features

- **Multiple Plans**: Individual and team pricing plans
- **Trial Support**: Free trial periods for new subscriptions
- **Promotion Codes**: Support for discount codes
- **Payment Methods**: Credit card and other payment options

### Billing Management

- **Customer Portal**: Self-service billing management
- **Invoice History**: View past invoices and payments
- **Payment Method Updates**: Update payment information
- **Subscription Changes**: Upgrade, downgrade, or cancel

## API Functions

### Team Management API

```typescript
// Team operations
createTeam(name: string, description: string, ownerId: string, ownerEmail: string): Promise<string>
getTeam(teamId: string): Promise<Team | null>
updateTeam(teamId: string, updates: Partial<Team>): Promise<void>
deleteTeam(teamId: string): Promise<void>

// Member operations
addTeamMember(teamId: string, userId: string, role: TeamMember['role'], invitedBy: string, userEmail?: string): Promise<void>
getTeamMembers(teamId: string): Promise<TeamMember[]>
updateTeamMemberRole(teamId: string, memberId: string, newRole: TeamMember['role']): Promise<void>
removeTeamMember(teamId: string, memberId: string): Promise<void>

// Invitation operations
createTeamInvitation(teamId: string, email: string, role: TeamInvitation['role'], invitedBy: string): Promise<string>
getTeamInvitations(teamId: string): Promise<TeamInvitation[]>
getUserInvitations(userEmail: string): Promise<TeamInvitation[]>
acceptTeamInvitation(invitationId: string, userId: string, userEmail: string): Promise<void>
declineTeamInvitation(invitationId: string): Promise<void>
cancelTeamInvitation(invitationId: string): Promise<void>
resendTeamInvitation(invitationId: string): Promise<void>

// Seat assignment operations
assignSeat(teamId: string, memberId: string, assignedBy: string): Promise<void>
unassignSeat(teamId: string, memberId: string, unassignedBy: string): Promise<void>
getAssignedSeats(teamId: string): Promise<TeamMember[]>
```

### Subscription API

```typescript
// Subscription operations
createCheckoutSession(userId: string, userEmail: string, priceId: string, successUrl?: string, cancelUrl?: string): Promise<{ sessionId: string; url: string }>
createTeamCheckoutSession(userId: string, teamId: string, priceId: string, quantity: number, successUrl?: string, cancelUrl?: string): Promise<{ sessionId: string; url: string }>
createCustomerPortalSession(customerEmail: string, returnUrl: string): Promise<{ url: string }>
getSubscription(userId: string): Promise<Subscription | null>
getTeamSubscription(teamId: string): Promise<Subscription | null>
```

## Data Models

### Team

```typescript
interface Team {
  id: string
  name: string
  description: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}
```

### TeamMember

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

### TeamInvitation

```typescript
interface TeamInvitation {
  id: string
  teamId: string
  email: string
  role: 'admin' | 'member'
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: 'pending' | 'accepted' | 'expired'
}
```

### Subscription

```typescript
interface Subscription {
  id: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  currentPeriodStart: Date
  cancelAt?: Date
  cancelAtPeriodEnd: boolean
  priceId: string
  quantity: number
  updatedAt: Date
}
```

## Security

### Authentication

- **Firebase Auth**: User authentication and session management
- **Team Access Control**: Role-based permissions for team operations
- **Invitation Validation**: Secure invitation acceptance process

### Authorization

- **Role-Based Access**: Different permissions for owner, admin, and member roles
- **Resource Protection**: Users can only access their team's data
- **API Security**: All API endpoints validate user permissions

### Data Protection

- **Firestore Rules**: Database-level security rules
- **Input Validation**: Server-side validation of all inputs
- **Error Handling**: Secure error messages without data leakage

### Payment Security

- **Stripe Security**: PCI-compliant payment processing
- **Webhook Verification**: Secure webhook signature validation
- **Customer Isolation**: Separate customer accounts for each user

## Testing

### Unit Tests

- **Component Testing**: Test all team management components
- **Service Testing**: Test team and subscription service functions
- **API Testing**: Test all API endpoints and error handling

### Integration Tests

- **Team Workflow**: Test complete team creation and management flow
- **Subscription Flow**: Test subscription creation and management
- **Invitation Process**: Test invitation creation, acceptance, and rejection

### E2E Tests

- **Team Management**: End-to-end team creation and management
- **Subscription Billing**: Complete subscription and billing flow
- **Role Management**: Test role changes and permission updates

### Test Coverage

- **Component Coverage**: 90%+ coverage for all team components
- **Service Coverage**: 95%+ coverage for team and subscription services
- **API Coverage**: 100% coverage for all API endpoints

## Future Enhancements

### Planned Features

- **Team Templates**: Pre-configured team setups for different use cases
- **Advanced Analytics**: Team usage analytics and reporting
- **Bulk Operations**: Bulk member management and seat assignment
- **Team Hierarchies**: Support for nested team structures
- **Custom Roles**: User-defined roles with custom permissions

### Technical Improvements

- **Real-time Updates**: WebSocket-based real-time team updates
- **Offline Support**: Offline team management capabilities
- **Mobile Optimization**: Enhanced mobile team management interface
- **API Rate Limiting**: Implement rate limiting for team operations
- **Audit Logging**: Comprehensive audit trail for team changes

### Business Features

- **Team Analytics**: Usage analytics and team performance metrics
- **Advanced Billing**: Usage-based billing and cost optimization
- **Team Marketplace**: Team templates and configurations marketplace
- **Integration APIs**: Third-party integrations for team management
- **Advanced Security**: Multi-factor authentication and advanced security features

## Conclusion

The team management and subscription system provides a comprehensive solution for collaborative time tracking with robust role-based access control, flexible subscription management, and secure payment processing. The system is designed to scale from small teams to large organizations while maintaining security and usability.

For more information about specific features, refer to the individual documentation files:

- [Seat Assignment Documentation](./SEAT_ASSIGNMENT.md)
- [Payment Setup Guide](./PAYMENT_SETUP.md)
- [API Documentation](./API.md)
