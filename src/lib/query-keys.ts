/**
 * Centralized query keys for React Query.
 * Use these in useQuery, useMutation, invalidateQueries, and setQueryData.
 */
export const queryKeys = {
  /** User subscription (individual or team). */
  subscription: (userId: string) => ['subscription', userId] as const,

  /** Pending team invitations for the current user (by email). */
  userInvitations: (email: string) => ['userInvitations', email] as const,

  /** Time entries for a user. */
  timeEntries: (userId: string) => ['timeEntries', userId] as const,

  /** User settings. */
  userSettings: (userId: string) => ['userSettings', userId] as const,

  /** Published month data for a team member. */
  publishedMonth: (teamId: string, memberId: string, monthKey: string) =>
    ['publishedMonth', teamId, memberId, monthKey] as const,

  /** Member summaries for team reports (teamId + sorted member ids + month key). */
  memberSummaries: (teamId: string, memberIdsKey: string, monthKey: string) =>
    ['memberSummaries', teamId, memberIdsKey, monthKey] as const,

  /** Export preview initial data (entries + userSettings + userTeam). */
  exportPreviewData: (userId: string) => ['exportPreviewData', userId] as const,

  /** User's team (if any). */
  team: (userId: string) => ['team', userId] as const,

  /** Team page data (team, members, invitations, subscription, role, userInvitations). */
  teamPageData: (userId: string) => ['teamPageData', userId] as const,

  /** A single team by id. */
  teamById: (teamId: string) => ['teamById', teamId] as const,

  /** A single team invitation by id. */
  teamInvitation: (invitationId: string) =>
    ['teamInvitation', invitationId] as const,

  /** Display names for a set of member ids (sorted, comma-joined). */
  memberDisplayNames: (memberIdsKey: string) =>
    ['memberDisplayNames', memberIdsKey] as const,

  /** Team members. */
  teamMembers: (teamId: string) => ['teamMembers', teamId] as const,

  /** Team invitations. */
  teamInvitations: (teamId: string) => ['teamInvitations', teamId] as const,

  /** Team subscription. */
  teamSubscription: (teamId: string) => ['teamSubscription', teamId] as const,

  /** Stripe pricing plans (global, no args). */
  pricingPlans: () => ['pricingPlans'] as const,

  /** Resolved project scope for a user (team vs personal). */
  projectScope: (userId: string) => ['projectScope', userId] as const,

  /** Projects scoped to a user or team. */
  projects: {
    user: (userId: string) => ['projects', 'user', userId] as const,
    team: (teamId: string) => ['projects', 'team', teamId] as const,
  },
} as const
