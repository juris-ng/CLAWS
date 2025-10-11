import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://ylwptxqmnlgaokukmcqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3B0eHFtbmxnYW9rdWttY3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzM4MjIsImV4cCI6MjA3NTQwOTgyMn0.SkdUk3ctUYumQnb8Vi0XAOkLC3mhCgvYmzGyS-uV6TQ';

// Custom storage that works on both web and mobile
class SupabaseStorage {
  async getItem(key) {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem(key);
    }
    // Use AsyncStorage for mobile
    return AsyncStorage.getItem(key);
  }

  async removeItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.removeItem(key);
    }
    return AsyncStorage.removeItem(key);
  }

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      return localStorage.setItem(key, value);
    }
    return AsyncStorage.setItem(key, value);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new SupabaseStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
