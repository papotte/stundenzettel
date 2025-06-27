import type { UserSettings } from '@/lib/types';

let userSettings: { [userId: string]: UserSettings } = {
    'mock-user-1': { defaultWorkHours: 8 },
    'mock-user-2': { defaultWorkHours: 7.5 },
};

const defaultSettings: UserSettings = {
  defaultWorkHours: 7,
};

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
    if (userSettings[userId]) {
        return userSettings[userId];
    }
    return defaultSettings;
};

export const setUserSettings = async (userId: string, settings: UserSettings): Promise<void> => {
    userSettings[userId] = settings;
};
