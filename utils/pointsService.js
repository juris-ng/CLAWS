import { supabase } from '../supabase';

// ============================================================================
// BADGE DEFINITIONS - EXPANDED
// ============================================================================
export const BADGES = {
  // Petition Badges
  FIRST_PETITION: {
    id: 'first_petition',
    name: 'First Petition',
    description: 'Created your first petition',
    icon: '✍️',
    category: 'petitions',
    rarity: 'common',
  },
  PETITION_MASTER: {
    id: 'petition_master',
    name: 'Petition Master',
    description: 'Created 10 petitions',
    icon: '🏆',
    category: 'petitions',
    rarity: 'rare',
  },
  PETITION_HERO: {
    id: 'petition_hero',
    name: 'Petition Hero',
    description: 'Created 50 petitions',
    icon: '🦸',
    category: 'petitions',
    rarity: 'epic',
  },

  // Voting Badges
  FIRST_VOTE: {
    id: 'first_vote',
    name: 'First Vote',
    description: 'Voted on your first petition',
    icon: '🗳️',
    category: 'voting',
    rarity: 'common',
  },
  SUPER_VOTER: {
    id: 'super_voter',
    name: 'Super Voter',
    description: 'Voted on 50 petitions',
    icon: '🎖️',
    category: 'voting',
    rarity: 'rare',
  },
  VOTING_CHAMPION: {
    id: 'voting_champion',
    name: 'Voting Champion',
    description: 'Voted on 200 petitions',
    icon: '👑',
    category: 'voting',
    rarity: 'epic',
  },

  // Engagement Badges
  COMMENTATOR: {
    id: 'commentator',
    name: 'Commentator',
    description: 'Posted 20 comments',
    icon: '💬',
    category: 'engagement',
    rarity: 'common',
  },
  DISCUSSION_LEADER: {
    id: 'discussion_leader',
    name: 'Discussion Leader',
    description: 'Posted 100 comments',
    icon: '🎤',
    category: 'engagement',
    rarity: 'rare',
  },

  // Level Badges
  RISING_STAR: {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reached Level 5',
    icon: '⭐',
    category: 'level',
    rarity: 'common',
  },
  COMMUNITY_LEADER: {
    id: 'level_10',
    name: 'Community Leader',
    description: 'Reached Level 10',
    icon: '👑',
    category: 'level',
    rarity: 'rare',
  },
  LEGENDARY: {
    id: 'level_20',
    name: 'Legendary',
    description: 'Reached Level 20',
    icon: '🔥',
    category: 'level',
    rarity: 'legendary',
  },

  // Special Badges
  EARLY_ADOPTER: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined in the first month',
    icon: '🚀',
    category: 'special',
    rarity: 'rare',
  },
  VERIFIED_USER: {
    id: 'verified_user',
    name: 'Verified User',
    description: 'Completed profile verification',
    icon: '✅',
    category: 'special',
    rarity: 'common',
  },
  WHISTLEBLOWER: {
    id: 'whistleblower',
    name: 'Whistleblower',
    description: 'Submitted a whistleblow report',
    icon: '🔔',
    category: 'special',
    rarity: 'rare',
  },
};

// Convert badges object to array
export const BADGES_ARRAY = Object.values(BADGES);

// ============================================================================
// POINT VALUES
// ============================================================================
export const POINT_VALUES = {
  // Petition Actions
  petition_created: 10,
  petition_signed: 2,
  petition_shared: 3,
  petition_goal_reached: 50,

  // Engagement
  comment_posted: 3,
  comment_liked: 1,
  post_created: 5,

  // Voting
  vote_cast: 1,

  // Social
  profile_completed: 20,
  profile_verified: 50,
  user_followed: 2,

  // Special
  badge_earned: 15,
  whistleblow_submitted: 25,
  case_created: 20,
  consultation_booked: 10,

  // Daily/Streak
  daily_login: 5,
  weekly_streak: 25,
  monthly_streak: 100,
};

// ============================================================================
// LEVEL CONFIGURATION
// ============================================================================
export const LEVEL_CONFIG = {
  baseMultiplier: 10,
  maxLevel: 100,
};

// ============================================================================
// POINTS SERVICE
// ============================================================================
export const PointsService = {
  /**
   * Award points for an action
   */
  awardPoints: async (memberId, action, metadata = {}) => {
    try {
      const points = POINT_VALUES[action] || 0;

      if (points === 0) {
        console.warn(`No points defined for action: ${action}`);
        return { success: false, error: 'Invalid action' };
      }

      // Create points transaction
      const { error: pointsError } = await supabase.from('member_points').insert([
        {
          member_id: memberId,
          points,
          action,
          reference_id: metadata.referenceId || null,
          description: metadata.description || null,
        },
      ]);

      if (pointsError) throw pointsError;

      // Get current member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('total_points, level')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      const currentPoints = memberData?.total_points || 0;
      const currentLevel = memberData?.level || 1;
      const newTotalPoints = currentPoints + points;

      // Calculate new level
      const newLevel = PointsService.calculateLevel(newTotalPoints);

      // Update member points and level
      const { error: updateError } = await supabase
        .from('members')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (updateError) throw updateError;

      // Check for level up
      const leveledUp = newLevel > currentLevel;
      if (leveledUp) {
        await PointsService.handleLevelUp(memberId, currentLevel, newLevel);
      }

      // Check and award badges
      await PointsService.checkAndAwardBadges(memberId);

      return {
        success: true,
        points,
        newTotalPoints,
        newLevel,
        leveledUp,
        oldLevel: currentLevel,
      };
    } catch (error) {
      console.error('Award points error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Calculate level based on points
   */
  calculateLevel: (points) => {
    const level = Math.floor(Math.sqrt(points / LEVEL_CONFIG.baseMultiplier)) + 1;
    return Math.min(level, LEVEL_CONFIG.maxLevel);
  },

  /**
   * Get points needed for a specific level
   */
  getPointsForLevel: (level) => {
    return Math.pow(level - 1, 2) * LEVEL_CONFIG.baseMultiplier;
  },

  /**
   * Get points needed for next level
   */
  getPointsForNextLevel: (currentLevel) => {
    return PointsService.getPointsForLevel(currentLevel + 1);
  },

  /**
   * Handle level up event
   */
  handleLevelUp: async (memberId, oldLevel, newLevel) => {
    try {
      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: memberId,
          type: 'level_up',
          title: '🎉 Level Up!',
          message: `Congratulations! You've reached Level ${newLevel}`,
          data: { old_level: oldLevel, new_level: newLevel },
        },
      ]);

      // Award bonus points for milestone levels
      if (newLevel % 5 === 0) {
        const bonusPoints = newLevel * 10;
        await PointsService.awardPoints(memberId, 'level_milestone', {
          description: `Milestone bonus for reaching Level ${newLevel}`,
          referenceId: `level_${newLevel}`,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Handle level up error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get member statistics
   */
  getMemberStats: async (memberId) => {
    try {
      // Get member data
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('total_points, level, created_at')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Get earned badges
      const { data: memberBadges, error: badgesError } = await supabase
        .from('member_badges')
        .select('badge_id, earned_at')
        .eq('member_id', memberId);

      if (badgesError) throw badgesError;

      const earnedBadges =
        memberBadges?.map((mb) => ({
          ...BADGES_ARRAY.find((b) => b.id === mb.badge_id),
          earned_at: mb.earned_at,
        })) || [];

      // Get activity counts
      const [petitions, votes, comments] = await Promise.all([
        supabase
          .from('petitions')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId),
        supabase
          .from('petition_votes')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId),
      ]);

      // Calculate level progress
      const totalPoints = member?.total_points || 0;
      const currentLevel = member?.level || 1;
      const pointsForCurrentLevel = PointsService.getPointsForLevel(currentLevel);
      const pointsForNextLevel = PointsService.getPointsForNextLevel(currentLevel);
      const progressPoints = totalPoints - pointsForCurrentLevel;
      const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
      const progressPercentage = (progressPoints / pointsNeeded) * 100;

      return {
        success: true,
        stats: {
          total_points: totalPoints,
          level: currentLevel,
          points_for_current_level: pointsForCurrentLevel,
          points_for_next_level: pointsForNextLevel,
          progress_points: progressPoints,
          points_needed: pointsNeeded,
          progress_percentage: Math.min(progressPercentage, 100),
          badges: earnedBadges,
          badges_earned: earnedBadges.length,
          total_badges: BADGES_ARRAY.length,
          total_petitions: petitions.count || 0,
          total_votes: votes.count || 0,
          total_comments: comments.count || 0,
          member_since: member?.created_at,
        },
      };
    } catch (error) {
      console.error('Get member stats error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check and award badges
   */
  checkAndAwardBadges: async (memberId) => {
    try {
      const statsResult = await PointsService.getMemberStats(memberId);
      if (!statsResult.success) return;

      const stats = statsResult.stats;
      const earnedBadgeIds = stats.badges.map((b) => b.id);

      // Check each badge
      for (const badge of BADGES_ARRAY) {
        if (earnedBadgeIds.includes(badge.id)) continue;

        let shouldAward = false;

        // Badge criteria
        switch (badge.id) {
          // Petition badges
          case 'first_petition':
            shouldAward = stats.total_petitions >= 1;
            break;
          case 'petition_master':
            shouldAward = stats.total_petitions >= 10;
            break;
          case 'petition_hero':
            shouldAward = stats.total_petitions >= 50;
            break;

          // Voting badges
          case 'first_vote':
            shouldAward = stats.total_votes >= 1;
            break;
          case 'super_voter':
            shouldAward = stats.total_votes >= 50;
            break;
          case 'voting_champion':
            shouldAward = stats.total_votes >= 200;
            break;

          // Engagement badges
          case 'commentator':
            shouldAward = stats.total_comments >= 20;
            break;
          case 'discussion_leader':
            shouldAward = stats.total_comments >= 100;
            break;

          // Level badges
          case 'level_5':
            shouldAward = stats.level >= 5;
            break;
          case 'level_10':
            shouldAward = stats.level >= 10;
            break;
          case 'level_20':
            shouldAward = stats.level >= 20;
            break;

          // Special badges
          case 'early_adopter':
            const daysSinceJoin = Math.floor(
              (new Date() - new Date(stats.member_since)) / (1000 * 60 * 60 * 24)
            );
            shouldAward = daysSinceJoin <= 30;
            break;
        }

        if (shouldAward) {
          await PointsService.awardBadge(memberId, badge);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Check badges error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Award a badge to a member
   */
  awardBadge: async (memberId, badge) => {
    try {
      // Insert badge
      const { error: badgeError } = await supabase.from('member_badges').insert([
        {
          member_id: memberId,
          badge_id: badge.id,
        },
      ]);

      if (badgeError) {
        // Check if already awarded
        if (badgeError.code === '23505') {
          return { success: false, error: 'Badge already awarded' };
        }
        throw badgeError;
      }

      // Award points for earning badge
      await PointsService.awardPoints(memberId, 'badge_earned', {
        description: `Earned badge: ${badge.name}`,
        referenceId: badge.id,
      });

      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: memberId,
          type: 'badge_earned',
          title: `🏆 Badge Unlocked!`,
          message: `You've earned the "${badge.name}" badge!`,
          data: { badge_id: badge.id, badge_name: badge.name },
        },
      ]);

      return { success: true, badge };
    } catch (error) {
      console.error('Award badge error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get points history
   */
  getPointsHistory: async (memberId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('member_points')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, history: data || [] };
    } catch (error) {
      console.error('Get points history error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get leaderboard
   */
  getLeaderboard: async (limit = 50, timeframe = 'all') => {
    try {
      let query = supabase
        .from('members')
        .select('id, full_name, avatar_url, total_points, level')
        .order('total_points', { ascending: false })
        .limit(limit);

      // Add timeframe filter if needed
      if (timeframe === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('updated_at', weekAgo);
      } else if (timeframe === 'month') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('updated_at', monthAgo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add rank to each member
      const leaderboard = (data || []).map((member, index) => ({
        ...member,
        rank: index + 1,
      }));

      return { success: true, leaderboard };
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get member rank
   */
  getMemberRank: async (memberId) => {
    try {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('total_points')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      const { count, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', member?.total_points || 0);

      if (countError) throw countError;

      const rank = (count || 0) + 1;

      return { success: true, rank };
    } catch (error) {
      console.error('Get member rank error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all available badges with earned status
   */
  getAllBadges: async (memberId) => {
    try {
      const { data: earnedBadges, error } = await supabase
        .from('member_badges')
        .select('badge_id, earned_at')
        .eq('member_id', memberId);

      if (error) throw error;

      const earnedBadgeIds = earnedBadges?.map((b) => b.badge_id) || [];

      const badges = BADGES_ARRAY.map((badge) => ({
        ...badge,
        earned: earnedBadgeIds.includes(badge.id),
        earned_at: earnedBadges?.find((b) => b.badge_id === badge.id)?.earned_at || null,
      }));

      return { success: true, badges };
    } catch (error) {
      console.error('Get all badges error:', error);
      return { success: false, error: error.message };
    }
  },
};
