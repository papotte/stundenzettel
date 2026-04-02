export const userSettingsKeys = {
  all: ['userSettings'] as const,
  detail: (uid: string) => [...userSettingsKeys.all, uid] as const,
}
