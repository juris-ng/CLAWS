import { supabase } from '../supabase';
import { PointsService } from './pointsService';

export class ModerationService {
  // Moderation thresholds
  static THRESHOLDS = {
    DORMANCY_DAYS: 30,
    DOWNVOTE_RATIO: 0.6, // 60% downvotes
    ESCALATION_UPVOTES: 100,
    ESCALATION_RATIO: 0.7, // 70% upvotes
  };

  /**
   * Run auto-moderation checks on all active petitions
   */
  static async runAutoModeration() {
    console.log('Running auto-moderation...');

    // Get all active petitions
    const { data: petitions } = await supabase
      .from('petitions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!petitions || petitions.length === 0) {
      console.log('No petitions to moderate');
      return;
    }

    for (const petition of petitions) {
      // Check dormancy
      await this.checkDormancy(petition);

      // Check downvote ratio
      await this.checkDownvoteRatio(petition);

      // Check escalation criteria
      await this.checkEscalation(petition);
    }

    console.log('Auto-moderation complete');
  }

  /**
   * Check if petition is dormant (no activity for 30+ days)
   */
  static async checkDormancy(petition) {
    const lastActivity = new Date(petition.last_activity_at || petition.created_at);
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity >= this.THRESHOLDS.DORMANCY_DAYS) {
      await this.archivePetition(petition, 'dormancy', `No activity for ${Math.floor(daysSinceActivity)} days`);
    }
  }

  /**
   * Check if petition has excessive downvotes
   */
  static async checkDownvoteRatio(petition) {
    const totalVotes = petition.upvotes + petition.downvotes;
    
    if (totalVotes < 10) return; // Need minimum votes to moderate

    const downvoteRatio = petition.downvotes / totalVotes;

    if (downvoteRatio >= this.THRESHOLDS.DOWNVOTE_RATIO) {
      await this.pullDownPetition(
        petition, 
        'downvote_ratio', 
        `${Math.round(downvoteRatio * 100)}% downvotes (${petition.downvotes}/${totalVotes})`
      );
    }
  }

  /**
   * Check if petition should be escalated (high support)
   */
  static async checkEscalation(petition) {
    const totalVotes = petition.upvotes + petition.downvotes;
    
    if (petition.upvotes < this.THRESHOLDS.ESCALATION_UPVOTES) return;

    const upvoteRatio = totalVotes > 0 ? petition.upvotes / totalVotes : 0;

    if (upvoteRatio >= this.THRESHOLDS.ESCALATION_RATIO) {
      await this.escalatePetition(
        petition,
        'upvote_threshold',
        `${petition.upvotes} supporters with ${Math.round(upvoteRatio * 100)}% approval`
      );
    }
  }

  /**
   * Archive a petition
   */
  static async archivePetition(petition, triggeredBy, reason) {
    // Check if already archived
    const { data: existingLog } = await supabase
      .from('petition_moderation_logs')
      .select('*')
      .eq('petition_id', petition.id)
      .eq('action_type', 'archived')
      .single();

    if (existingLog) return; // Already archived

    // Update petition status
    await supabase
      .from('petitions')
      .update({ status: 'archived' })
      .eq('id', petition.id);

    // Log moderation action
    await supabase
      .from('petition_moderation_logs')
      .insert([{
        petition_id: petition.id,
        action_type: 'archived',
        reason: reason,
        triggered_by: triggeredBy,
        metadata: {
          upvotes: petition.upvotes,
          downvotes: petition.downvotes,
          last_activity: petition.last_activity_at,
        },
      }]);

    console.log(`Petition ${petition.id} archived: ${reason}`);
  }

  /**
   * Pull down (reject) a petition
   */
  static async pullDownPetition(petition, triggeredBy, reason) {
    // Check if already pulled down
    const { data: existingLog } = await supabase
      .from('petition_moderation_logs')
      .select('*')
      .eq('petition_id', petition.id)
      .eq('action_type', 'pulled_down')
      .single();

    if (existingLog) return;

    // Update petition status
    await supabase
      .from('petitions')
      .update({ status: 'rejected' })
      .eq('id', petition.id);

    // Log moderation action
    await supabase
      .from('petition_moderation_logs')
      .insert([{
        petition_id: petition.id,
        action_type: 'pulled_down',
        reason: reason,
        triggered_by: triggeredBy,
        metadata: {
          upvotes: petition.upvotes,
          downvotes: petition.downvotes,
          total_votes: petition.upvotes + petition.downvotes,
        },
      }]);

    console.log(`Petition ${petition.id} pulled down: ${reason}`);
  }

  /**
   * Escalate a petition (mark as successful)
   */
  static async escalatePetition(petition, triggeredBy, reason) {
    // Check if already escalated
    const { data: existingLog } = await supabase
      .from('petition_moderation_logs')
      .select('*')
      .eq('petition_id', petition.id)
      .eq('action_type', 'escalated')
      .single();

    if (existingLog) return;

    // Update petition status
    await supabase
      .from('petitions')
      .update({ status: 'approved' })
      .eq('id', petition.id);

    // Award bonus points to petition creator
    await PointsService.awardPoints(
      petition.member_id,
      'member',
      'petition_approved',
      petition.id
    );

    // Log moderation action
    await supabase
      .from('petition_moderation_logs')
      .insert([{
        petition_id: petition.id,
        action_type: 'escalated',
        reason: reason,
        triggered_by: triggeredBy,
        metadata: {
          upvotes: petition.upvotes,
          downvotes: petition.downvotes,
          total_votes: petition.upvotes + petition.downvotes,
        },
      }]);

    console.log(`Petition ${petition.id} escalated: ${reason}`);
  }

  /**
   * Get moderation history for a petition
   */
  static async getModerationHistory(petitionId) {
    const { data } = await supabase
      .from('petition_moderation_logs')
      .select('*')
      .eq('petition_id', petitionId)
      .order('performed_at', { ascending: false });

    return data || [];
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats() {
    const { data: archived } = await supabase
      .from('petition_moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'archived');

    const { data: pulledDown } = await supabase
      .from('petition_moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'pulled_down');

    const { data: escalated } = await supabase
      .from('petition_moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'escalated');

    return {
      archived: archived || 0,
      pulledDown: pulledDown || 0,
      escalated: escalated || 0,
    };
  }
}
