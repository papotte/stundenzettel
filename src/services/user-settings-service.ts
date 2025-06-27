import * as firestoreService from './user-settings-service.firestore';
import * as localService from './user-settings-service.local';
import type { UserSettings } from '@/lib/types';

interface UserSettingsService {
    getUserSettings: (userId: string) => Promise<UserSettings>;
    setUserSettings: (userId: string, settings: UserSettings) => Promise<void>;
}

let service: UserSettingsService;

const useMockService = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (useMockService) {
  console.log("Using local user settings service for testing.");
  service = localService;
} else {
  service = firestoreService;
}

export const { 
  getUserSettings,
  setUserSettings,
} = service;
