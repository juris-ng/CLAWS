import { supabase } from '../supabase';

export const DecisionReviewService = {
  /**
   * Get decisions affecting the current user
   */
  getUserDecisions: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('admin_decisions')
        .select(`
          *,
          admin:members!admin_decisions_admin_id_fkey(full_name, email)
        `)
        .or(`
          target_id.eq.${user.id},
          target_id.in.(
            select id from petitions where member_id='${user.id}'
          ),
          target_id.in.(
            select id from whistleblow_reports where reporter_id='${user.id}'
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, decisions: data || [] };
    } catch (error) {
      console.error('Error getting user decisions:', error);
      return { success: false, error: error.message, decisions: [] };
    }
  },

  /**
   * Get single decision by ID
   */
  getDecisionById: async (decisionId) => {
    try {
      const { data, error } = await supabase
        .from('admin_decisions')
        .select(`
          *,
          admin:members!admin_decisions_admin_id_fkey(full_name, email)
        `)
        .eq('id', decisionId)
        .single();

      if (error) throw error;
      return { success: true, decision: data };
    } catch (error) {
      console.error('Error getting decision:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if decision can be appealed
   */
  canAppealDecision: async (decisionId) => {
    try {
      const { data, error } = await supabase
        .rpc('can_appeal_decision', { decision_id: decisionId });

      if (error) throw error;
      return { success: true, canAppeal: data };
    } catch (error) {
      console.error('Error checking appeal eligibility:', error);
      return { success: false, canAppeal: false };
    }
  },

  /**
   * Create an appeal/review for a decision
   */
  createAppeal: async (decisionId, appealReason, supportingEvidence = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if already appealed
      const { data: existing } = await supabase
        .from('decision_reviews')
        .select('id')
        .eq('decision_id', decisionId)
        .eq('member_id', user.id)
        .single();

      if (existing) {
        return { success: false, error: 'You have already appealed this decision' };
      }

      const { data, error } = await supabase
        .from('decision_reviews')
        .insert({
          decision_id: decisionId,
          member_id: user.id,
          appeal_reason: appealReason,
          supporting_evidence: supportingEvidence
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, review: data };
    } catch (error) {
      console.error('Error creating appeal:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's appeals
   */
  getUserAppeals: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('decision_reviews')
        .select(`
          *,
          decision:admin_decisions(
            *,
            admin:members!admin_decisions_admin_id_fkey(full_name)
          ),
          reviewed_by_user:members!decision_reviews_reviewed_by_fkey(full_name)
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, appeals: data || [] };
    } catch (error) {
      console.error('Error getting user appeals:', error);
      return { success: false, error: error.message, appeals: [] };
    }
  },

  /**
   * Get pending appeals (admin only)
   */
  getPendingAppeals: async () => {
    try {
      const { data, error } = await supabase
        .from('decision_reviews')
        .select(`
          *,
          member:members!decision_reviews_member_id_fkey(full_name, email),
          decision:admin_decisions(
            *,
            admin:members!admin_decisions_admin_id_fkey(full_name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, appeals: data || [] };
    } catch (error) {
      console.error('Error getting pending appeals:', error);
      return { success: false, error: error.message, appeals: [] };
    }
  },

  /**
   * Update appeal status (admin only)
   */
  updateAppealStatus: async (reviewId, status, adminResponse) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('decision_reviews')
        .update({
          status,
          admin_response: adminResponse,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, review: data };
    } catch (error) {
      console.error('Error updating appeal:', error);
      return { success: false, error: error.message };
    }
  }
};
