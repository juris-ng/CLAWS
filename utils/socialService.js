import { supabase } from '../supabase';
import { NotificationService } from './notificationService';

export const SocialService = {
  // ============================================
  // FOLLOW/UNFOLLOW USERS
  // ============================================

  // Check if user is following another user
  isFollowing: async (followerId, followingId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  },

  // Follow a user
  followUser: async (followerId, followingId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .insert([{
          follower_id: followerId,
          following_id: followingId
        }])
        .select()
        .single();

      if (error) throw error;

      // Send notification to followed user
      const { data: followerData } = await supabase
        .from('members')
        .select('full_name')
        .eq('id', followerId)
        .single();

      await NotificationService.createNotification(
        followingId,
        'member',
        'follow',
        'New Follower',
        `${followerData?.full_name || 'Someone'} started following you`,
        'user',
        followerId
      );

      return { success: true, data };
    } catch (error) {
      console.error('Follow user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Unfollow a user
  unfollowUser: async (followerId, followingId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Unfollow user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's followers
  getFollowers: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          follower:members!follows_follower_id_fkey(
            id, full_name, avatar_url, total_points, level, followers_count
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get followers error:', error);
      return [];
    }
  },

  // Get users that user is following
  getFollowing: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at,
          following:members!follows_following_id_fkey(
            id, full_name, avatar_url, total_points, level, followers_count
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get following error:', error);
      return [];
    }
  },

  // Get suggested users to follow
  getSuggestedUsers: async (userId, limit = 10) => {
    try {
      // Get users the current user is NOT following
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, avatar_url, total_points, level, followers_count')
        .neq('id', userId)
        .eq('is_banned', false)
        .order('followers_count', { ascending: false })
        .order('total_points', { ascending: false })
        .limit(limit * 2); // Get more to filter

      if (error) throw error;

      // Filter out users already following
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);
      const suggested = data?.filter(u => !followingIds.has(u.id)).slice(0, limit) || [];

      return suggested;
    } catch (error) {
      console.error('Get suggested users error:', error);
      return [];
    }
  },

  // ============================================
  // PETITION FOLLOWING
  // ============================================

  // Follow a petition
  followPetition: async (memberId, petitionId) => {
    try {
      const { data, error } = await supabase
        .from('petition_followers')
        .insert([{
          member_id: memberId,
          petition_id: petitionId
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Follow petition error:', error);
      return { success: false, error: error.message };
    }
  },

  // Unfollow a petition
  unfollowPetition: async (memberId, petitionId) => {
    try {
      const { error } = await supabase
        .from('petition_followers')
        .delete()
        .eq('member_id', memberId)
        .eq('petition_id', petitionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Unfollow petition error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if following petition
  isFollowingPetition: async (memberId, petitionId) => {
    try {
      const { data, error } = await supabase
        .from('petition_followers')
        .select('id')
        .eq('member_id', memberId)
        .eq('petition_id', petitionId)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  },

  // Get petitions user is following
  getFollowedPetitions: async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('petition_followers')
        .select(`
          petition_id,
          created_at,
          petition:petitions(
            *,
            member:members(full_name, avatar_url),
            votes:petition_votes(count),
            comments:comments(count)
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(pf => pf.petition) || [];
    } catch (error) {
      console.error('Get followed petitions error:', error);
      return [];
    }
  },

  // ============================================
  // LEADERBOARD
  // ============================================

  // Get leaderboard (all time, monthly, weekly)
  getLeaderboard: async (timeframe = 'all_time', limit = 50) => {
    try {
      let viewName = 'leaderboard_all_time';
      if (timeframe === 'monthly') viewName = 'leaderboard_monthly';
      if (timeframe === 'weekly') viewName = 'leaderboard_weekly';

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return [];
    }
  },

  // Get most followed users
  getMostFollowedUsers: async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('most_followed_users')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get most followed users error:', error);
      return [];
    }
  },

  // Get user's leaderboard position
  getUserRank: async (userId, timeframe = 'all_time') => {
    try {
      let viewName = 'leaderboard_all_time';
      if (timeframe === 'monthly') viewName = 'leaderboard_monthly';
      if (timeframe === 'weekly') viewName = 'leaderboard_weekly';

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get user rank error:', error);
      return null;
    }
  },

  // ============================================
  // SOCIAL SHARING
  // ============================================

  // Track petition share
  trackShare: async (petitionId, memberId, platform) => {
    try {
      const { data, error } = await supabase
        .from('petition_shares')
        .insert([{
          petition_id: petitionId,
          member_id: memberId,
          platform
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Track share error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get petition share count
  getShareCount: async (petitionId) => {
    try {
      const { count, error } = await supabase
        .from('petition_shares')
        .select('*', { count: 'exact', head: true })
        .eq('petition_id', petitionId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get share count error:', error);
      return 0;
    }
  },

  // Get share analytics
  getShareAnalytics: async (petitionId) => {
    try {
      const { data, error } = await supabase
        .from('petition_shares')
        .select('platform, created_at')
        .eq('petition_id', petitionId);

      if (error) throw error;

      // Group by platform
      const platformCounts = {};
      data?.forEach(share => {
        platformCounts[share.platform] = (platformCounts[share.platform] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        byPlatform: platformCounts,
        shares: data || []
      };
    } catch (error) {
      console.error('Get share analytics error:', error);
      return { total: 0, byPlatform: {}, shares: [] };
    }
  },
};
