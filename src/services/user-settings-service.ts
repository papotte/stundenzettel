import * as firestoreService from './user-settings-service.firestore';
import * as localService from './user-settings-service.local';
import type { UserSettings } from '@/lib/types';

const useMockService = process.env.NEXT_PUBLIC_ENVIRONMENT === 'test';

const service = useMockService ? localService : firestoreService;

if (useMockService) {
  console.log("Using local user settings service for testing (NEXT_PUBLIC_ENVIRONMENT=test).");
}

export const getUserSettings = (userId: string): Promise<UserSettings> => {
  return service.getUserSettings(userId);
};

export const setUserSettings = (userId: string, settings: UserSettings): Promise<void> => {
    return service.setUserSettings(userId, settings);
};
