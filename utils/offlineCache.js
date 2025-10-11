import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  PETITIONS: '@petitions_cache',
  USER_PROFILE: '@user_profile_cache',
  NOTIFICATIONS: '@notifications_cache',
  SETTINGS: '@settings_cache',
  LAST_SYNC: '@last_sync_time',
};

export const OfflineCache = {
  // Save data to cache
  saveToCache: async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Save to cache error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get data from cache
  getFromCache: async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get from cache error:', error);
      return null;
    }
  },

  // Remove from cache
  removeFromCache: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Remove from cache error:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear all cache
  clearCache: async () => {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Clear cache error:', error);
      return { success: false, error: error.message };
    }
  },

  // Save petitions to cache
  cachePetitions: async (petitions) => {
    await OfflineCache.saveToCache(CACHE_KEYS.PETITIONS, petitions);
    await OfflineCache.saveToCache(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  },

  // Get cached petitions
  getCachedPetitions: async () => {
    return await OfflineCache.getFromCache(CACHE_KEYS.PETITIONS);
  },

  // Cache user profile
  cacheUserProfile: async (profile) => {
    await OfflineCache.saveToCache(CACHE_KEYS.USER_PROFILE, profile);
  },

  // Get cached user profile
  getCachedUserProfile: async () => {
    return await OfflineCache.getFromCache(CACHE_KEYS.USER_PROFILE);
  },

  // Cache notifications
  cacheNotifications: async (notifications) => {
    await OfflineCache.saveToCache(CACHE_KEYS.NOTIFICATIONS, notifications);
  },

  // Get cached notifications
  getCachedNotifications: async () => {
    return await OfflineCache.getFromCache(CACHE_KEYS.NOTIFICATIONS);
  },

  // Save app settings
  saveSettings: async (settings) => {
    await OfflineCache.saveToCache(CACHE_KEYS.SETTINGS, settings);
  },

  // Get app settings
  getSettings: async () => {
    const defaultSettings = {
      theme: 'system',
      language: 'en',
      notifications: {
        enabled: true,
        petition_updates: true,
        comments: true,
        votes: true,
        messages: true,
        system: true,
      },
      privacy: {
        show_email: false,
        show_phone: false,
        show_activity: true,
      },
    };

    const settings = await OfflineCache.getFromCache(CACHE_KEYS.SETTINGS);
    return settings || defaultSettings;
  },

  // Get last sync time
  getLastSyncTime: async () => {
    return await OfflineCache.getFromCache(CACHE_KEYS.LAST_SYNC);
  },

  // Check if cache is stale (older than 5 minutes)
  isCacheStale: async () => {
    const lastSync = await OfflineCache.getLastSyncTime();
    if (!lastSync) return true;

    const lastSyncTime = new Date(lastSync).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;

    return (now - lastSyncTime) > fiveMinutes;
  },
};
