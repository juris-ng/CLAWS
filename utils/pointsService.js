import { supabase } from '../supabase';

// Badge definitions
const badges = [
  {
    id: 'first_petition',
    name: 'First Petition',
    description: 'Created your first petition',
    icon: '✍️',
  },
  {
    id: 'petition_master',
    name: 'Petition Master',
    description: 'Created 10 petitions',
    icon: '🏆',
  },
  {
    id: 'super_voter',
    name: 'Super Voter',
    description: 'Voted on 50 petitions',
    icon: '🗳️',
  },
  {
    id: 'commentator',
    name: 'Commentator',
    description: 'Posted 20 comments',
    icon: '💬',
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reached Level 5',
    icon: '⭐',
  },
  {
    id: 'level_10',
    name: 'Community Leader',
    description: 'Reached Level 10',
    icon: '👑',
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined in the first month',
    icon: '🚀',
  },
];

// Point values for different actions
const pointValues = {
  petition_created: 5,
  petition_voted: 1,
  comment_posted: 2,
  badge_earned: 10,
};

// Import ProfileService for activity logging
let ProfileService;
// Lazy load to avoid circular dependency
const getProfileService = async () => {
  if (!ProfileService) {
    ProfileService = (await import('./profileService')).ProfileService;
  }
  return ProfileService;
};

export const PointsService = {
  // Award points for an action
  awardPoints: async (memberId, memberType, action, referenceId = null) => {
    try {
      const points = pointValues[action] || 0;

      // Add points to member_points table
      const { error } = await supabase
        .from('member_points')
        .insert([{
          member_id: memberId,
          points,
          action,
          reference_id: referenceId,
        }]);

      if (error) throw error;

      // Update total points in members table
      const { data: memberData } = await supabase
        .from('members')
        .select('total_points')
        .eq('id', memberId)
        .single();

      const newTotalPoints = (memberData?.total_points || 0) + points;

      await supabase
        .from('members')
        .update({ total_points: newTotalPoints })
        .eq('id', memberId);

      // Calculate and update level
      const newLevel = PointsService.calculateLevel(newTotalPoints);
      const { data: currentMember } = await supabase
        .from('members')
        .select('level')
        .eq('id', memberId)
        .single();

      const currentLevel = currentMember?.level || 1;

      if (newLevel > currentLevel) {
        await supabase
          .from('members')
          .update({ level: newLevel })
          .eq('id', memberId);

        // Log level up activity
        const profileService = await getProfileService();
        await profileService.logActivity(memberId, 'level_up', {
          level: newLevel,
          previous_level: currentLevel,
          timestamp: new Date().toISOString(),
        });
      }

      // Check and award badges
      await PointsService.checkAndAwardBadges(memberId, memberType);

      return { success: true, points, newTotalPoints };
    } catch (error) {
      console.error('Award points error:', error);
      return { success: false, error: error.message };
    }
  },

  // Calculate level based on points
  calculateLevel: (points) => {
    // Level formula: Level = floor(sqrt(points / 10)) + 1
    return Math.floor(Math.sqrt(points / 10)) + 1;
  },

  // Get points needed for next level
  getPointsForNextLevel: (currentLevel) => {
    // Points needed = (level - 1)^2 * 10
    return Math.pow(currentLevel, 2) * 10;
  },

  // Get member stats
  getMemberStats: async (memberId) => {
    try {
      // Get member data
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      // Get badges
      const { data: memberBadges } = await supabase
        .from('member_badges')
        .select('badge_id, earned_at')
        .eq('member_id', memberId);

      const earnedBadges = memberBadges?.map(mb => ({
        ...badges.find(b => b.id === mb.badge_id),
        earned_at: mb.earned_at,
      })) || [];

      // Get petition count
      const { count: petitionCount } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId);

      // Get vote count
      const { count: voteCount } = await supabase
        .from('petition_votes')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId);

      // Get comment count
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId);

      const currentLevel = member?.level || 1;
      const totalPoints = member?.total_points || 0;
      const pointsForNextLevel = PointsService.getPointsForNextLevel(currentLevel);
      const pointsForCurrentLevel = PointsService.getPointsForNextLevel(currentLevel - 1);
      const progressToNextLevel = totalPoints - pointsForCurrentLevel;
      const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;

      return {
        total_points: totalPoints,
        level: currentLevel,
        badges: earnedBadges,
        badges_earned: earnedBadges.length,
        total_petitions: petitionCount || 0,
        total_votes: voteCount || 0,
        total_comments: commentCount || 0,
        points_for_next_level: pointsForNextLevel,
        progress_to_next_level: progressToNextLevel,
        points_needed_for_next_level: pointsNeededForNextLevel,
        progress_percentage: (progressToNextLevel / pointsNeededForNextLevel) * 100,
        created_at: member?.created_at,
      };
    } catch (error) {
      console.error('Get member stats error:', error);
      return null;
    }
  },

  // Check and award badges
  checkAndAwardBadges: async (memberId, memberType) => {
    try {
      const stats = await PointsService.getMemberStats(memberId);
      const currentBadges = stats.badges || [];
      const currentBadgeIds = currentBadges.map(b => b.id);

      // Check each badge criteria
      for (const badge of badges) {
        if (currentBadgeIds.includes(badge.id)) continue;

        let earned = false;

        switch (badge.id) {
          case 'first_petition':
            if (stats.total_petitions >= 1) earned = true;
            break;
          case 'petition_master':
            if (stats.total_petitions >= 10) earned = true;
            break;
          case 'super_voter':
            if (stats.total_votes >= 50) earned = true;
            break;
          case 'commentator':
            if (stats.total_comments >= 20) earned = true;
            break;
          case 'level_5':
            if (stats.level >= 5) earned = true;
            break;
          case 'level_10':
            if (stats.level >= 10) earned = true;
            break;
          case 'early_adopter':
            const daysSinceJoin = Math.floor(
              (new Date() - new Date(stats.created_at)) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceJoin <= 30) earned = true;
            break;
        }

        if (earned) {
          // Award badge
          const { error } = await supabase
            .from('member_badges')
            .insert([{
              member_id: memberId,
              badge_id: badge.id,
            }]);

          if (!error) {
            // Award points for earning badge
            await PointsService.awardPoints(memberId, memberType, 'badge_earned', badge.id);

            // Log badge activity
            const profileService = await getProfileService();
            await profileService.logActivity(memberId, 'badge_earned', {
              badge_id: badge.id,
              badge_name: badge.name,
              badge_description: badge.description,
              badge_icon: badge.icon,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Check badges error:', error);
    }
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, avatar_url, total_points, level')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return [];
    }
  },
};
