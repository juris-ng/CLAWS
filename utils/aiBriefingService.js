import { supabase } from '../supabase';

export class AIBriefingService {
  /**
   * Generate personalized AI briefing for a user
   */
  static async generateBriefing(userId, userType = 'member') {
    const insights = [];

    // Get user statistics
    const stats = await this.getUserAnalytics(userId, userType);

    // Analyze activity patterns
    const activityInsight = this.analyzeActivityPattern(stats);
    if (activityInsight) insights.push(activityInsight);

    // Analyze interests based on categories
    const interestInsight = await this.analyzeInterests(userId, stats);
    if (interestInsight) insights.push(interestInsight);

    // Provide actionable suggestions
    const actionInsight = this.generateActionSuggestion(stats);
    if (actionInsight) insights.push(actionInsight);

    // Highlight achievements
    const achievementInsight = this.highlightAchievements(stats);
    if (achievementInsight) insights.push(achievementInsight);

    // Return the most relevant insight
    return insights.length > 0 ? insights[0] : this.getDefaultBriefing();
  }

  /**
   * Get comprehensive user analytics
   */
  static async getUserAnalytics(userId, userType) {
    const analytics = {
      petitionsCreated: 0,
      commentsPosted: 0,
      votesGiven: 0,
      bodiesJoined: 0,
      consecutiveDaysActive: 0,
      mostActiveCategory: null,
      recentActivity: [],
      points: 0,
      level: 1,
    };

    // Count petitions created
    const { count: petitionsCount } = await supabase
      .from('petitions')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', userId);
    analytics.petitionsCreated = petitionsCount || 0;

    // Count comments posted
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', userId);
    analytics.commentsPosted = commentsCount || 0;

    // Count votes given
    const { count: votesCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', userId);
    analytics.votesGiven = votesCount || 0;

    // Count bodies joined
    const { count: bodiesCount } = await supabase
      .from('body_members')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', userId);
    analytics.bodiesJoined = bodiesCount || 0;

    // Get user points and level
    const { data: userData } = await supabase
      .from('members')
      .select('points')
      .eq('id', userId)
      .single();
    analytics.points = userData?.points || 0;

    // Get most active category from petitions
    const { data: categoryData } = await supabase
      .from('petitions')
      .select('category')
      .eq('member_id', userId)
      .limit(10);

    if (categoryData && categoryData.length > 0) {
      const categoryCount = {};
      categoryData.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      });
      analytics.mostActiveCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b
      );
    }

    // Get recent activity
    const { data: recentPetitions } = await supabase
      .from('petitions')
      .select('created_at')
      .eq('member_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    analytics.recentActivity = recentPetitions || [];

    return analytics;
  }

  /**
   * Analyze user activity patterns
   */
  static analyzeActivityPattern(stats) {
    const totalActivity = stats.petitionsCreated + stats.commentsPosted + stats.votesGiven;

    if (totalActivity === 0) {
      return {
        type: 'welcome',
        title: 'Welcome to MAU2!',
        message: 'Start your civic engagement journey by creating your first petition or joining a local body. Every action earns you points and makes a difference in your community.',
        icon: '👋',
        action: 'Create your first petition',
      };
    }

    if (stats.petitionsCreated >= 5 && stats.commentsPosted < 5) {
      return {
        type: 'engagement',
        title: 'Engagement Opportunity',
        message: `You've created ${stats.petitionsCreated} petitions but haven't engaged much with others. Consider commenting on community petitions to build support and earn more points.`,
        icon: '💬',
        action: 'Browse and comment on petitions',
      };
    }

    if (stats.votesGiven >= 20 && stats.petitionsCreated === 0) {
      return {
        type: 'creator',
        title: 'Time to Lead',
        message: `You've supported ${stats.votesGiven} petitions! Your engagement shows strong community interest. Consider creating your own petition to champion the causes you care about.`,
        icon: '🚀',
        action: 'Create a petition',
      };
    }

    if (stats.bodiesJoined === 0 && totalActivity >= 10) {
      return {
        type: 'community',
        title: 'Join a Community',
        message: 'Your activism is growing! Joining a local body will amplify your impact and connect you with like-minded advocates working on similar issues.',
        icon: '🏢',
        action: 'Browse local bodies',
      };
    }

    return null;
  }

  /**
   * Analyze user interests based on activity
   */
  static async analyzeInterests(userId, stats) {
    if (!stats.mostActiveCategory) return null;

    // Suggest related petitions or bodies
    const { data: relatedPetitions } = await supabase
      .from('petitions')
      .select('id, title')
      .eq('category', stats.mostActiveCategory)
      .neq('member_id', userId)
      .eq('status', 'pending')
      .order('upvotes', { ascending: false })
      .limit(3);

    if (relatedPetitions && relatedPetitions.length > 0) {
      const categoryLabel = stats.mostActiveCategory.replace('_', ' ');
      return {
        type: 'interest',
        title: 'Recommended for You',
        message: `Based on your activity in ${categoryLabel}, we found ${relatedPetitions.length} trending petitions that might interest you. Your support could make a significant impact!`,
        icon: '🎯',
        action: 'Explore recommendations',
      };
    }

    return null;
  }

  /**
   * Generate actionable suggestions
   */
  static generateActionSuggestion(stats) {
    const nextMilestone = this.calculateNextMilestone(stats.points);

    if (nextMilestone) {
      return {
        type: 'milestone',
        title: 'Next Milestone',
        message: `You're ${nextMilestone.pointsNeeded} points away from reaching ${nextMilestone.name} level! ${nextMilestone.suggestion}`,
        icon: '🎖️',
        action: nextMilestone.actionText,
      };
    }

    return null;
  }

  /**
   * Calculate next milestone
   */
  static calculateNextMilestone(currentPoints) {
    const milestones = [
      { threshold: 50, name: 'Advocate', suggestion: 'Create more petitions and engage with the community.', actionText: 'Earn points' },
      { threshold: 200, name: 'Champion', suggestion: 'Focus on quality petitions that gain strong community support.', actionText: 'Create impactful petitions' },
      { threshold: 500, name: 'Leader', suggestion: 'Your expertise is valuable - mentor others and lead initiatives.', actionText: 'Lead the community' },
      { threshold: 1000, name: 'Hero', suggestion: 'You\'re a community pillar! Continue inspiring civic engagement.', actionText: 'Keep making impact' },
    ];

    for (const milestone of milestones) {
      if (currentPoints < milestone.threshold) {
        return {
          ...milestone,
          pointsNeeded: milestone.threshold - currentPoints,
        };
      }
    }

    return null;
  }

  /**
   * Highlight recent achievements
   */
  static highlightAchievements(stats) {
    if (stats.petitionsCreated >= 10) {
      return {
        type: 'achievement',
        title: 'Community Champion',
        message: `Impressive! You've created ${stats.petitionsCreated} petitions, making you one of the most active members. Your dedication to civic engagement is inspiring the community.`,
        icon: '⭐',
        action: 'View your impact',
      };
    }

    if (stats.commentsPosted >= 50) {
      return {
        type: 'achievement',
        title: 'Engagement Expert',
        message: `You've posted ${stats.commentsPosted} comments! Your thoughtful contributions are strengthening community discourse and building consensus.`,
        icon: '💡',
        action: 'Continue engaging',
      };
    }

    return null;
  }

  /**
   * Get default briefing for new users
   */
  static getDefaultBriefing() {
    return {
      type: 'default',
      title: 'Get Started',
      message: 'Welcome to MAU2! Your voice matters in shaping local governance. Start by exploring trending petitions, joining bodies that align with your values, or creating your own petition.',
      icon: '🌟',
      action: 'Explore the platform',
    };
  }

  /**
   * Get suggested actions based on briefing type
   */
  static getSuggestedActions(briefingType) {
    const actions = {
      welcome: ['Create Petition', 'Browse Bodies', 'Explore Petitions'],
      engagement: ['Browse Petitions', 'Comment on Issues', 'Join Discussion'],
      creator: ['Create Petition', 'Invite Lawyer', 'Start Initiative'],
      community: ['Browse Bodies', 'Join Community', 'Connect with Advocates'],
      interest: ['View Recommendations', 'Support Petitions', 'Share Issues'],
      milestone: ['View Progress', 'Earn Points', 'Level Up'],
      achievement: ['View Stats', 'Share Success', 'Mentor Others'],
      default: ['Create Petition', 'Browse Bodies', 'View Leaderboards'],
    };

    return actions[briefingType] || actions.default;
  }
}
