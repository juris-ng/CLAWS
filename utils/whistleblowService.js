import { supabase } from '../supabase';

export const WhistleblowService = {
  /**
   * Create a whistleblow report
   */
  createReport: async (reportData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('whistleblow_reports')
        .insert({
          reporter_id: user.id,
          is_anonymous: reportData.isAnonymous,
          title: reportData.title,
          description: reportData.description,
          category: reportData.category,
          severity: reportData.severity,
          location: reportData.location,
          target_entity: reportData.targetEntity,
          evidence_urls: reportData.evidenceUrls || []
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, report: data };
    } catch (error) {
      console.error('Error creating report:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all whistleblow reports
   */
  getAllReports: async (filters = {}) => {
    try {
      let query = supabase
        .from('whistleblow_reports')
        .select(`
          *,
          reporter:members!whistleblow_reports_reporter_id_fkey(id, full_name, is_anonymous, anonymous_display_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, reports: data || [] };
    } catch (error) {
      console.error('Error getting reports:', error);
      return { success: false, error: error.message, reports: [] };
    }
  },

  /**
   * Get single report by ID
   */
  getReportById: async (reportId) => {
    try {
      const { data, error } = await supabase
        .from('whistleblow_reports')
        .select(`
          *,
          reporter:members!whistleblow_reports_reporter_id_fkey(id, full_name, is_anonymous, anonymous_display_name),
          verified_by_user:members!whistleblow_reports_verified_by_fkey(full_name)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('whistleblow_reports')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', reportId);

      return { success: true, report: data };
    } catch (error) {
      console.error('Error getting report:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Support a report (like/upvote)
   */
  supportReport: async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if already supported
      const { data: existing } = await supabase
        .from('whistleblow_votes')
        .select('id')
        .eq('report_id', reportId)
        .eq('member_id', user.id)
        .single();

      if (existing) {
        return { success: false, error: 'Already supported this report' };
      }

      const { error } = await supabase
        .from('whistleblow_votes')
        .insert({
          report_id: reportId,
          member_id: user.id
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error supporting report:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove support from a report
   */
  unsupportReport: async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('whistleblow_votes')
        .delete()
        .eq('report_id', reportId)
        .eq('member_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing support:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if user has supported a report
   */
  hasUserSupported: async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data } = await supabase
        .from('whistleblow_votes')
        .select('id')
        .eq('report_id', reportId)
        .eq('member_id', user.id)
        .single();

      return { success: true, hasSupported: !!data };
    } catch (error) {
      return { success: true, hasSupported: false };
    }
  },

  /**
   * Add comment to report
   */
  addComment: async (reportId, content, isAnonymous = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('whistleblow_comments')
        .insert({
          report_id: reportId,
          commenter_id: user.id,
          is_anonymous: isAnonymous,
          content
        })
        .select(`
          *,
          commenter:members!whistleblow_comments_commenter_id_fkey(id, full_name, is_anonymous, anonymous_display_name)
        `)
        .single();

      if (error) throw error;
      return { success: true, comment: data };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get comments for a report
   */
  getReportComments: async (reportId) => {
    try {
      const { data, error } = await supabase
        .from('whistleblow_comments')
        .select(`
          *,
          commenter:members!whistleblow_comments_commenter_id_fkey(id, full_name, is_anonymous, anonymous_display_name)
        `)
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, comments: data || [] };
    } catch (error) {
      console.error('Error getting comments:', error);
      return { success: false, error: error.message, comments: [] };
    }
  },

  /**
   * Update report status (admin only)
   */
  updateReportStatus: async (reportId, status, adminNotes = null) => {
    try {
      const updates = { status };
      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('whistleblow_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, report: data };
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verify report (admin only)
   */
  verifyReport: async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('whistleblow_reports')
        .update({
          is_verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, report: data };
    } catch (error) {
      console.error('Error verifying report:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's own reports
   */
  getUserReports: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('whistleblow_reports')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, reports: data || [] };
    } catch (error) {
      console.error('Error getting user reports:', error);
      return { success: false, error: error.message, reports: [] };
    }
  }
};
