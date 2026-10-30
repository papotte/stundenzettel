export const userSettingsKeys = {
  all: ['userSettings'] as const,
  detail: (uid: string) => [...userSettingsKeys.all, uid] as const,
}

export const projectKeys = {
  all: ['projects'] as const,
  user: (uid: string) => [...projectKeys.all, 'user', uid] as const,
  team: (teamId: string) => [...projectKeys.all, 'team', teamId] as const,
}
