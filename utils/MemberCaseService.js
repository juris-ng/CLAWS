import { supabase } from '../supabase';

export const MemberCaseService = {
  // Get member's escalated cases
  async getMemberCases(memberId) {
    try {
      const { data: escalations, error: eError } = await supabase
        .from('case_member_escalations')
        .select('case_id')
        .eq('member_id', memberId);

      if (eError) throw eError;

      if (!escalations?.length) return { success: true, cases: [] };

      const caseIds = escalations.map((e) => e.case_id);

      const { data: cases, error: cError } = await supabase
        .from('legal_cases')
        .select('*')
        .in('id', caseIds)
        .order('escalation_date', { ascending: false });

      if (cError) throw cError;

      return { success: true, cases };
    } catch (error) {
      console.error('Error getting member cases:', error);
      return { success: false, error: error.message };
    }
  },

  // Get case timeline
  async getCaseTimeline(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_timeline')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, timeline: data };
    } catch (error) {
      console.error('Error getting case timeline:', error);
      return { success: false, error: error.message };
    }
  },

  // Add timeline event
  async addTimelineEvent(caseId, memberId, eventType, description) {
    try {
      const { data, error } = await supabase
        .from('case_timeline')
        .insert({
          case_id: caseId,
          created_by: memberId,
          event_type: eventType,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, event: data };
    } catch (error) {
      console.error('Error adding timeline event:', error);
      return { success: false, error: error.message };
    }
  },

  // Update case status
  async updateCaseStatus(caseId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .update({ status: newStatus })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, case: data };
    } catch (error) {
      console.error('Error updating case status:', error);
      return { success: false, error: error.message };
    }
  },

  // Get case participants (lawyers, judges, etc.)
  async getCaseParticipants(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_participants')
        .select('*')
        .eq('case_id', caseId);

      if (error) throw error;

      return { success: true, participants: data };
    } catch (error) {
      console.error('Error getting case participants:', error);
      return { success: false, error: error.message };
    }
  },

  // Add member to case escalation
  async addMemberToCase(caseId, memberId) {
    try {
      const { data, error } = await supabase
        .from('case_member_escalations')
        .insert({ case_id: caseId, member_id: memberId })
        .select()
        .single();

      if (error) throw error;

      return { success: true, escalation: data };
    } catch (error) {
      console.error('Error adding member to case:', error);
      return { success: false, error: error.message };
    }
  },

  // Get members involved in case
  async getCaseMembers(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_member_escalations')
        .select(`
          *,
          members(id, full_name, email, profile_image)
        `)
        .eq('case_id', caseId);

      if (error) throw error;

      return { success: true, members: data };
    } catch (error) {
      console.error('Error getting case members:', error);
      return { success: false, error: error.message };
    }
  },
};
