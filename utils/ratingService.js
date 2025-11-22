import { supabase } from '../supabase';

export const RatingService = {
  /**
   * Calculate reputation score based on member activities
   * Reputation is different from points - it measures trust and quality
   */
  calculateReputation: async (memberId) => {
    try {
      // Get member's petitions with their vote ratios
      const { data: petitions } = await supabase
        .from('petitions')
        .select('votes_for, votes_against')
        .eq('creator_id', memberId);

      // Get member's comments
      const { data: comments } = await supabase
        .from('comments')
        .select('id')
        .eq('member_id', memberId);

      // Get votes cast by member
      const { data: votes } = await supabase
        .from('votes')
        .select('id')
        .eq('member_id', memberId);

      // Calculate reputation components
      let reputation = 0;

      // 1. Petition quality (based on support ratio)
      if (petitions && petitions.length > 0) {
        petitions.forEach(petition => {
          const totalVotes = petition.votes_for + petition.votes_against;
          if (totalVotes > 0) {
            const supportRatio = petition.votes_for / totalVotes;
            // High support ratio = high reputation
            reputation += Math.floor(supportRatio * 100);
          }
        });
      }

      // 2. Engagement (comments and votes)
      reputation += (comments?.length || 0) * 3; // 3 points per comment
      reputation += (votes?.length || 0) * 1; // 1 point per vote

      // 3. Activity consistency (petitions created)
      reputation += (petitions?.length || 0) * 10; // 10 points per petition

      return Math.min(reputation, 10000); // Cap at 10,000
    } catch (error) {
      console.error('Error calculating reputation:', error);
      return 0;
    }
  },

  /**
   * Update member's reputation score
   */
  updateReputation: async (memberId) => {
    try {
      const reputation = await RatingService.calculateReputation(memberId);
      
      const { data, error } = await supabase
        .from('members')
        .update({ reputation_score: reputation })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, reputation };
    } catch (error) {
      console.error('Error updating reputation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Calculate trust rating (0.00 to 5.00 stars)
   */
  calculateTrustRating: (reputationScore) => {
    // Convert reputation (0-10000) to trust rating (0-5)
    const rating = (reputationScore / 10000) * 5;
    return Math.min(Math.max(rating, 0), 5).toFixed(2);
  },

  /**
   * Get reputation level name
   */
  getReputationLevel: (reputationScore) => {
    if (reputationScore >= 8000) return { name: 'Champion', color: '#FFD700' };
    if (reputationScore >= 5000) return { name: 'Leader', color: '#FF6B35' };
    if (reputationScore >= 2500) return { name: 'Activist', color: '#4ECDC4' };
    if (reputationScore >= 1000) return { name: 'Contributor', color: '#95E1D3' };
    if (reputationScore >= 500) return { name: 'Participant', color: '#C7CEEA' };
    return { name: 'Newcomer', color: '#E0E0E0' };
  },

  /**
   * Get reputation badge emoji
   */
  getReputationBadge: (reputationScore) => {
    if (reputationScore >= 8000) return '🏆';
    if (reputationScore >= 5000) return '⭐';
    if (reputationScore >= 2500) return '🎖️';
    if (reputationScore >= 1000) return '🥉';
    if (reputationScore >= 500) return '📍';
    return '🌱';
  },

  /**
   * Update all members' reputation scores (admin function)
   */
  updateAllReputations: async () => {
    try {
      const { data: members } = await supabase
        .from('members')
        .select('id');

      if (!members) return { success: false, error: 'No members found' };

      const updates = await Promise.all(
        members.map(member => RatingService.updateReputation(member.id))
      );

      return { 
        success: true, 
        updated: updates.filter(u => u.success).length,
        failed: updates.filter(u => !u.success).length
      };
    } catch (error) {
      console.error('Error updating all reputations:', error);
      return { success: false, error: error.message };
    }
  }
};
