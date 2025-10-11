import { supabase } from '../supabase';
import { UploadService } from './uploadService';

export const ProfileService = {
  // Get user profile
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  },

  // Update profile
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload avatar
  uploadAvatar: async (userId, imageUri) => {
    try {
      // Delete old avatar if exists
      const profile = await ProfileService.getProfile(userId);
      if (profile?.avatar_url) {
        await UploadService.deleteFile(profile.avatar_url);
      }

      // Upload new avatar
      const avatarUrl = await UploadService.uploadFile(
        userId,
        imageUri,
        'avatar.jpg'
      );

      // Update profile with new avatar URL
      await ProfileService.updateProfile(userId, { avatar_url: avatarUrl });

      return { success: true, avatarUrl };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get activity history
  getActivityHistory: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('member_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get activity error:', error);
      return [];
    }
  },

  // Log activity
  logActivity: async (userId, activityType, activityData = {}) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          member_id: userId,
          activity_type: activityType,
          activity_data: activityData,
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Log activity error:', error);
      return false;
    }
  },

  // Get user's petitions
  getUserPetitions: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          votes:petition_votes(count),
          comments:comments(count)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user petitions error:', error);
      return [];
    }
  },

  // Get user's votes
  getUserVotes: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('petition_votes')
        .select(`
          *,
          petition:petitions(*)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user votes error:', error);
      return [];
    }
  },

  // Get user's comments
  getUserComments: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          petition:petitions(title)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user comments error:', error);
      return [];
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (userId, preferences) => {
    return await ProfileService.updateProfile(userId, {
      notification_preferences: preferences
    });
  },

  // Update privacy settings
  updatePrivacySettings: async (userId, settings) => {
    return await ProfileService.updateProfile(userId, {
      privacy_settings: settings
    });
  },

  // Change password
  changePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete account
  deleteAccount: async (userId) => {
    try {
      // Delete user data (cascades will handle related records)
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message };
    }
  },
};
