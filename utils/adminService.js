import { supabase } from '../supabase';

export const AdminService = {
  // ============================================
  // ADMIN DASHBOARD STATS
  // ============================================

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return null;
    }
  },

  // Get recent activity
  getRecentActivity: async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select(`
          *,
          moderator:members!moderation_logs_moderator_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get recent activity error:', error);
      return [];
    }
  },

  // Get user growth data
  getUserGrowthData: async (days = 30) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_growth', { days_back: days });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user growth error:', error);
      return [];
    }
  },

  // ============================================
  // USER MANAGEMENT
  // ============================================

  // Get all users with filters
  getAllUsers: async (filters = {}) => {
    try {
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.isBanned !== undefined) {
        query = query.eq('is_banned', filters.isBanned);
      }
      if (filters.searchQuery) {
        query = query.or(
          `full_name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  },

  // Ban user
  banUser: async (userId, reason, duration = null) => {
    try {
      const banned_until = duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: updateError } = await supabase
        .from('members')
        .update({
          is_banned: true,
          ban_reason: reason,
          banned_until,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('moderation_logs').insert([{
        moderator_id: user.id,
        action: 'ban_user',
        target_type: 'user',
        target_id: userId,
        reason,
        details: { banned_until },
      }]);

      return { success: true };
    } catch (error) {
      console.error('Ban user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Unban user
  unbanUser: async (userId) => {
    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_until: null,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('moderation_logs').insert([{
        moderator_id: user.id,
        action: 'unban_user',
        target_type: 'user',
        target_id: userId,
        reason: 'Manual unban',
      }]);

      return { success: true };
    } catch (error) {
      console.error('Unban user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user role
  updateUserRole: async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('moderation_logs').insert([{
        moderator_id: user.id,
        action: 'update_role',
        target_type: 'user',
        target_id: userId,
        details: { new_role: newRole },
      }]);

      return { success: true };
    } catch (error) {
      console.error('Update user role error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // REPORTS MANAGEMENT
  // ============================================

  // Get all reports
  getAllReports: async (filters = {}) => {
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:members!reports_reporter_id_fkey(full_name, email),
          reviewed_by_user:members!reports_reviewed_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all reports error:', error);
      return [];
    }
  },

  // Create report
  createReport: async (reportData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: user.id,
          ...reportData,
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create report error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update report status
  updateReportStatus: async (reportId, status, actionTaken, adminNotes = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('reports')
        .update({
          status,
          action_taken: actionTaken,
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Update report status error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // CONTENT MODERATION
  // ============================================

  // Get pending petitions
  getPendingPetitions: async () => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          member:members(full_name, email)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get pending petitions error:', error);
      return [];
    }
  },

  // Get flagged petitions
  getFlaggedPetitions: async () => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          member:members(full_name, email)
        `)
        .eq('is_flagged', true)
        .order('flag_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get flagged petitions error:', error);
      return [];
    }
  },

  // Moderate petition
  moderatePetition: async (petitionId, status, notes = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('petitions')
        .update({
          moderation_status: status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: notes,
          is_flagged: false,
        })
        .eq('id', petitionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Moderate petition error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete petition
  deletePetition: async (petitionId, reason) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Log the action first
      await supabase.from('moderation_logs').insert([{
        moderator_id: user.id,
        action: 'delete_petition',
        target_type: 'petition',
        target_id: petitionId,
        reason,
      }]);

      const { error } = await supabase
        .from('petitions')
        .delete()
        .eq('id', petitionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete petition error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get flagged comments
  getFlaggedComments: async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          member:members(full_name, email),
          petition:petitions(title)
        `)
        .eq('is_flagged', true)
        .order('flag_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get flagged comments error:', error);
      return [];
    }
  },

  // Delete comment
  deleteComment: async (commentId, reason) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Log the action first
      await supabase.from('moderation_logs').insert([{
        moderator_id: user.id,
        action: 'delete_comment',
        target_type: 'comment',
        target_id: commentId,
        reason,
      }]);

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete comment error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // ANALYTICS
  // ============================================

  // Get engagement metrics
  getEngagementMetrics: async (days = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .rpc('get_engagement_metrics', { 
          start_date: startDate.toISOString() 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get engagement metrics error:', error);
      return null;
    }
  },

  // Check if user is admin
  isAdmin: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.role === 'admin' || data?.role === 'moderator';
    } catch (error) {
      console.error('Check admin error:', error);
      return false;
    }
  },
};
