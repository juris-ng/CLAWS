import { supabase } from '../supabase';

export const BodyAnalyticsService = {
  // ============================================================================
  // ANALYTICS SNAPSHOTS (EXISTING)
  // ============================================================================

  /**
   * Get analytics snapshots for a date range
   */
  getAnalyticsSnapshots: async (bodyId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('body_analytics_snapshots')
        .select('*')
        .eq('body_id', bodyId)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: true });

      if (error) throw error;
      return { success: true, snapshots: data || [] };
    } catch (error) {
      console.error('Error getting analytics snapshots:', error);
      return { success: false, error: error.message, snapshots: [] };
    }
  },

  /**
   * Generate analytics snapshot for a date
   */
  generateSnapshot: async (bodyId, date) => {
    try {
      const { error } = await supabase.rpc('generate_daily_analytics_snapshot', {
        p_body_id: bodyId,
        p_date: date,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error generating snapshot:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // REAL-TIME ANALYTICS (UPDATED)
  // ============================================================================

  /**
   * Get real-time analytics summary with trend data
   */
  getRealtimeAnalytics: async (bodyId) => {
    try {
      // Get followers count and recent growth
      const { count: followersCount } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Get followers from last 7 days for growth calculation
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentFollowers } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get posts count (all posts)
      const { count: postsCount } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // ✅ NEW: Get announcements count
      const { count: announcementCount } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('post_type', 'announcement');

      // ✅ NEW: Get projects count
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // ✅ NEW: Get events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // ✅ NEW: Get discussions count
      const { count: discussionsCount } = await supabase
        .from('discussions')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Get petitions count
      const { count: petitionsCount } = await supabase
        .from('body_petition_responses')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Get partnerships count
      const { data: partnerships } = await supabase
        .from('body_partnerships')
        .select('id')
        .or(`initiator_body_id.eq.${bodyId},partner_body_id.eq.${bodyId}`)
        .eq('status', 'accepted');

      // Get surveys count
      const { count: surveysCount } = await supabase
        .from('body_surveys')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Get Q&A sessions count
      const { count: sessionsCount } = await supabase
        .from('qna_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Get team size
      const { count: teamSize } = await supabase
        .from('body_members')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('is_active', true);

      // Get average rating
      const { data: ratings } = await supabase
        .from('body_ratings')
        .select('rating')
        .eq('body_id', bodyId);

      const avgRating = ratings?.length
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      return {
        success: true,
        analytics: {
          followersCount: followersCount || 0,
          followersGrowth: recentFollowers || 0,
          postsCount: postsCount || 0,
          announcementCount: announcementCount || 0,
          projectsCount: projectsCount || 0,
          eventsCount: eventsCount || 0,
          discussionsCount: discussionsCount || 0,
          petitionsCount: petitionsCount || 0,
          partnershipsCount: partnerships?.length || 0,
          surveysCount: surveysCount || 0,
          sessionsCount: sessionsCount || 0,
          teamSize: teamSize || 0,
          averageRating: avgRating,
          totalRatings: ratings?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error getting realtime analytics:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get dashboard summary stats
   */
  getDashboardStats: async (bodyId) => {
    try {
      const analytics = await BodyAnalyticsService.getRealtimeAnalytics(bodyId);

      // Get pending petitions
      const { count: pendingPetitions } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('target_body_id', bodyId)
        .eq('status', 'active');

      // Get active surveys
      const { count: activeSurveys } = await supabase
        .from('body_surveys')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('status', 'active');

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentPosts } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        success: true,
        stats: {
          ...analytics.analytics,
          pendingPetitions: pendingPetitions || 0,
          activeSurveys: activeSurveys || 0,
          recentPosts: recentPosts || 0,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // ENGAGEMENT METRICS (EXISTING)
  // ============================================================================

  /**
   * Record engagement metric
   */
  recordEngagement: async (bodyId, metricType, metricValue = 1, metadata = null) => {
    try {
      const { error } = await supabase.from('body_engagement_metrics').insert({
        body_id: bodyId,
        metric_type: metricType,
        metric_value: metricValue,
        metadata,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error recording engagement:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get engagement metrics for date range
   */
  getEngagementMetrics: async (bodyId, startDate, endDate, metricType = null) => {
    try {
      let query = supabase
        .from('body_engagement_metrics')
        .select('*')
        .eq('body_id', bodyId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: true });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, metrics: data || [] };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return { success: false, error: error.message, metrics: [] };
    }
  },

  /**
   * Get engagement summary
   */
  getEngagementSummary: async (bodyId, period = '30days') => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const metrics = await BodyAnalyticsService.getEngagementMetrics(
        bodyId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (!metrics.success) {
        return metrics;
      }

      // Aggregate by type
      const summary = {};
      metrics.metrics.forEach((metric) => {
        if (!summary[metric.metric_type]) {
          summary[metric.metric_type] = {
            count: 0,
            totalValue: 0,
          };
        }
        summary[metric.metric_type].count += 1;
        summary[metric.metric_type].totalValue += metric.metric_value;
      });

      return {
        success: true,
        period,
        summary,
      };
    } catch (error) {
      console.error('Error getting engagement summary:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // PERFORMANCE REPORTS (EXISTING)
  // ============================================================================

  /**
   * Create performance report
   */
  createReport: async (bodyId, reportData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_performance_reports')
        .insert({
          body_id: bodyId,
          report_type: reportData.reportType,
          report_period_start: reportData.periodStart,
          report_period_end: reportData.periodEnd,
          generated_by: user.id,
          report_data: reportData.data,
          summary_text: reportData.summary,
          status: reportData.status || 'draft',
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
   * Get performance reports
   */
  getReports: async (bodyId, reportType = null) => {
    try {
      let query = supabase
        .from('body_performance_reports')
        .select(`
          *,
          generator:members!body_performance_reports_generated_by_fkey(
            id,
            full_name
          )
        `)
        .eq('body_id', bodyId)
        .order('report_period_start', { ascending: false });

      if (reportType) {
        query = query.eq('report_type', reportType);
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
   * Update report status
   */
  updateReportStatus: async (reportId, status) => {
    try {
      const { data, error } = await supabase
        .from('body_performance_reports')
        .update({ status })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, report: data };
    } catch (error) {
      console.error('Error updating report status:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // IMPACT TRACKING (EXISTING)
  // ============================================================================

  /**
   * Track impact
   */
  trackImpact: async (bodyId, impactData) => {
    try {
      const { data, error } = await supabase
        .from('body_impact_tracking')
        .insert({
          body_id: bodyId,
          impact_type: impactData.impactType,
          title: impactData.title,
          description: impactData.description,
          impact_category: impactData.category,
          beneficiaries_count: impactData.beneficiariesCount,
          quantitative_metrics: impactData.quantitativeMetrics,
          qualitative_data: impactData.qualitativeData,
          evidence_urls: impactData.evidenceUrls,
          recorded_date: impactData.recordedDate || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, impact: data };
    } catch (error) {
      console.error('Error tracking impact:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get impact records
   */
  getImpactRecords: async (bodyId, startDate = null, endDate = null, category = null) => {
    try {
      let query = supabase
        .from('body_impact_tracking')
        .select('*')
        .eq('body_id', bodyId)
        .order('recorded_date', { ascending: false });

      if (startDate) {
        query = query.gte('recorded_date', startDate);
      }
      if (endDate) {
        query = query.lte('recorded_date', endDate);
      }
      if (category) {
        query = query.eq('impact_category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, impacts: data || [] };
    } catch (error) {
      console.error('Error getting impact records:', error);
      return { success: false, error: error.message, impacts: [] };
    }
  },

  /**
   * Get impact summary
   */
  getImpactSummary: async (bodyId, period = 'all') => {
    try {
      let startDate = null;
      
      if (period !== 'all') {
        startDate = new Date();
        switch (period) {
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }
      }

      const impacts = await BodyAnalyticsService.getImpactRecords(
        bodyId,
        startDate ? startDate.toISOString() : null,
        null
      );

      if (!impacts.success) {
        return impacts;
      }

      // Calculate summary
      const summary = {
        totalImpacts: impacts.impacts.length,
        totalBeneficiaries: 0,
        byCategory: {},
        byType: {},
      };

      impacts.impacts.forEach((impact) => {
        summary.totalBeneficiaries += impact.beneficiaries_count || 0;

        // By category
        if (!summary.byCategory[impact.impact_category]) {
          summary.byCategory[impact.impact_category] = 0;
        }
        summary.byCategory[impact.impact_category] += 1;

        // By type
        if (!summary.byType[impact.impact_type]) {
          summary.byType[impact.impact_type] = 0;
        }
        summary.byType[impact.impact_type] += 1;
      });

      return {
        success: true,
        summary,
      };
    } catch (error) {
      console.error('Error getting impact summary:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // GOALS & TARGETS (EXISTING)
  // ============================================================================

  /**
   * Create analytics goal
   */
  createGoal: async (bodyId, goalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_analytics_goals')
        .insert({
          body_id: bodyId,
          goal_type: goalData.goalType,
          goal_title: goalData.title,
          target_metric: goalData.targetMetric,
          target_value: goalData.targetValue,
          current_value: goalData.currentValue || 0,
          deadline: goalData.deadline,
          description: goalData.description,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, goal: data };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get analytics goals
   */
  getGoals: async (bodyId, status = 'active') => {
    try {
      let query = supabase
        .from('body_analytics_goals')
        .select(`
          *,
          creator:members!body_analytics_goals_created_by_fkey(
            id,
            full_name
          )
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate progress percentage
      const goalsWithProgress = data.map((goal) => ({
        ...goal,
        progress: goal.target_value > 0 
          ? Math.min(100, (goal.current_value / goal.target_value) * 100)
          : 0,
      }));

      return { success: true, goals: goalsWithProgress || [] };
    } catch (error) {
      console.error('Error getting goals:', error);
      return { success: false, error: error.message, goals: [] };
    }
  },

  /**
   * Update goal progress
   */
  updateGoalProgress: async (goalId, currentValue) => {
    try {
      const { data, error } = await supabase
        .from('body_analytics_goals')
        .update({ current_value: currentValue })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      // Check if goal is achieved
      if (data.current_value >= data.target_value && data.status === 'active') {
        await supabase
          .from('body_analytics_goals')
          .update({
            status: 'achieved',
            achieved_at: new Date().toISOString(),
          })
          .eq('id', goalId);
      }

      return { success: true, goal: data };
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update goal status
   */
  updateGoalStatus: async (goalId, status) => {
    try {
      const updateData = { status };
      
      if (status === 'achieved') {
        updateData.achieved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('body_analytics_goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, goal: data };
    } catch (error) {
      console.error('Error updating goal status:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // AGGREGATED STATISTICS (UPDATED)
  // ============================================================================

  /**
   * Get aggregated statistics for period
   */
  getAggregatedStats: async (bodyId, period = '30days') => {
    try {
      const now = new Date();
      let startDate = new Date();

      // Calculate start date based on period
      switch (period) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get follower growth
      const { count: currentFollowers } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const { count: previousFollowers } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .lt('created_at', startDate.toISOString());

      const followerGrowth = previousFollowers > 0
        ? Math.round(((currentFollowers - previousFollowers) / previousFollowers) * 100)
        : 0;

      // Calculate engagement rate
      const { count: totalContent } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .gte('created_at', startDate.toISOString());

      const { data: interactions } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('body_id', bodyId)
        .gte('created_at', startDate.toISOString());

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const totalInteractions = (interactions?.length || 0) + (commentsCount || 0);
      const avgEngagementRate = currentFollowers > 0 && totalContent > 0
        ? (totalInteractions / (currentFollowers * totalContent)) * 100
        : 0;

      // Get response rate (petitions responded to)
      const { count: totalPetitions } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('target_body_id', bodyId);

      const { count: respondedPetitions } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('target_body_id', bodyId)
        .not('response', 'is', null);

      const responseRate = totalPetitions > 0
        ? (respondedPetitions / totalPetitions) * 100
        : 0;

      return {
        success: true,
        stats: {
          followerGrowth,
          avgEngagementRate: Math.min(avgEngagementRate, 100),
          responseRate,
          period,
        },
      };
    } catch (error) {
      console.error('Error fetching aggregated stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get comparison stats (current vs previous period)
   */
  getComparisonStats: async (bodyId, period = '30days') => {
    try {
      const currentStats = await BodyAnalyticsService.getAggregatedStats(bodyId, period);
      
      return {
        success: true,
        current: currentStats.stats,
      };
    } catch (error) {
      console.error('Error getting comparison stats:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // 🆕 NEW: DEMOCRATIC GOVERNANCE METRICS
  // ============================================================================

  /**
   * Get democratic governance metrics
   */
  getGovernanceMetrics: async (bodyId) => {
    try {
      // Transparency: public content ratio
      const { count: publicContent } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('visibility', 'public');

      const { count: totalContent } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const transparencyScore = totalContent > 0 ? (publicContent / totalContent) * 100 : 85;

      // Accountability: completed projects/goals ratio
      const { count: completedProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('status', 'completed');

      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const accountabilityScore = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 78;

      // Participation: active members ratio
      const { count: followers } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Get active participants (those who interacted in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeUsers } = await supabase
        .from('post_reactions')
        .select('member_id')
        .eq('body_id', bodyId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUsers?.map(u => u.member_id) || []);
      const participationScore = followers > 0 
        ? (uniqueActiveUsers.size / followers) * 100 
        : 50;

      // Trust: average rating
      const { data: ratings } = await supabase
        .from('body_ratings')
        .select('rating')
        .eq('body_id', bodyId);

      const trustScore = ratings && ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 20
        : 85;

      return {
        success: true,
        metrics: {
          transparency: Math.round(transparencyScore),
          accountability: Math.round(accountabilityScore),
          participation: Math.round(Math.min(participationScore, 100)),
          trust: Math.round(trustScore),
        },
      };
    } catch (error) {
      console.error('Error fetching governance metrics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // 🆕 NEW: TRUST METRICS
  // ============================================================================

  /**
   * Get trust metrics
   */
  getTrustMetrics: async (bodyId) => {
    try {
      // Trust score from ratings
      const { data: ratings } = await supabase
        .from('body_ratings')
        .select('rating')
        .eq('body_id', bodyId);

      const trustScore = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / (ratings.length * 5)
        : 0.85;

      // Satisfaction: positive ratings (4-5 stars)
      const { count: positiveRatings } = await supabase
        .from('body_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .gte('rating', 4);

      const { count: totalRatings } = await supabase
        .from('body_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const satisfactionScore = totalRatings > 0 
        ? positiveRatings / totalRatings 
        : 0.90;

      // Response rate: petitions with responses
      const { count: totalPetitions } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('target_body_id', bodyId);

      const { count: respondedPetitions } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('target_body_id', bodyId)
        .not('response', 'is', null);

      const responseScore = totalPetitions > 0 
        ? respondedPetitions / totalPetitions 
        : 0.75;

      return {
        success: true,
        metrics: {
          trust: trustScore,
          satisfaction: satisfactionScore,
          response: responseScore,
        },
      };
    } catch (error) {
      console.error('Error fetching trust metrics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // 🆕 NEW: CONTENT ANALYTICS
  // ============================================================================

  /**
   * Get content analytics
   */
  getContentAnalytics: async (bodyId, contentType, period = '30days') => {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      let tableName = '';
      switch (contentType) {
        case 'announcements':
          tableName = 'body_posts';
          break;
        case 'projects':
          tableName = 'projects';
          break;
        case 'events':
          tableName = 'events';
          break;
        case 'discussions':
          tableName = 'discussions';
          break;
        default:
          tableName = 'body_posts';
      }

      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq('body_id', bodyId)
        .gte('created_at', startDate.toISOString());

      if (contentType === 'announcements') {
        query = query.eq('post_type', 'announcement');
      }

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: count || 0,
        items: data || [],
      };
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
        items: [],
      };
    }
  },

  // ============================================================================
  // TRANSPARENCY & TRUST FEATURES (EXISTING)
  // ============================================================================

  /**
   * Calculate and update trust score for a body
   */
  calculateTrustScore: async (bodyId) => {
    try {
      // Get ratings data
      const { data: ratings } = await supabase
        .from('body_ratings')
        .select('rating')
        .eq('body_id', bodyId);

      // Get interactions data
      const { count: totalInteractions } = await supabase
        .from('body_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const { count: positiveInteractions } = await supabase
        .from('body_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .in('interaction_type', ['like', 'share', 'attend']);

      // Calculate components
      let ratingScore = 0;
      let interactionScore = 0;
      let responseScore = 0;

      // Rating component (40% weight)
      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        ratingScore = (avgRating / 5.0) * 40;
      }

      // Interaction component (30% weight)
      if (totalInteractions > 0) {
        const positiveRatio = positiveInteractions / totalInteractions;
        interactionScore = positiveRatio * 30;
      }

      // Response rate component (30% weight)
      const { count: totalPetitions } = await supabase
        .from('body_petition_responses')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const { count: respondedPetitions } = await supabase
        .from('body_petition_responses')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .not('response_text', 'is', null);

      if (totalPetitions > 0) {
        const responseRate = respondedPetitions / totalPetitions;
        responseScore = responseRate * 30;
      }

      const trustScore = Math.round((ratingScore + interactionScore + responseScore) * 10) / 10;

      // Update body with trust score
      const { error } = await supabase
        .from('bodies')
        .update({ trust_score: trustScore })
        .eq('id', bodyId);

      if (error) throw error;

      return { success: true, trustScore };
    } catch (error) {
      console.error('Error calculating trust score:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Record user interaction with body content
   */
  recordInteraction: async (bodyId, userId, interactionType, contentId = null, metadata = null) => {
    try {
      const { error } = await supabase
        .from('body_interactions')
        .insert({
          body_id: bodyId,
          user_id: userId,
          interaction_type: interactionType,
          content_id: contentId,
          metadata: metadata,
        });

      if (error) throw error;

      // Update trust score after interaction
      await BodyAnalyticsService.calculateTrustScore(bodyId);

      return { success: true };
    } catch (error) {
      console.error('Error recording interaction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit rating for a body
   */
  submitRating: async (bodyId, userId, rating, feedback = null) => {
    try {
      const { data, error } = await supabase
        .from('body_ratings')
        .upsert({
          body_id: bodyId,
          user_id: userId,
          rating: rating,
          feedback: feedback,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'body_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Update trust score after rating
      await BodyAnalyticsService.calculateTrustScore(bodyId);

      return { success: true, rating: data };
    } catch (error) {
      console.error('Error submitting rating:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get body rankings
   */
  getRankings: async (bodyId) => {
    try {
      const { data: body } = await supabase
        .from('bodies')
        .select('category, region, trust_score')
        .eq('id', bodyId)
        .single();

      if (!body) {
        return { success: false, error: 'Body not found' };
      }

      // Get national rank (all bodies)
      const { count: nationalRank } = await supabase
        .from('bodies')
        .select('*', { count: 'exact', head: true })
        .gt('trust_score', body.trust_score);

      // Get regional rank
      let regionalRank = null;
      if (body.region) {
        const { count } = await supabase
          .from('bodies')
          .select('*', { count: 'exact', head: true })
          .eq('region', body.region)
          .gt('trust_score', body.trust_score);
        regionalRank = count + 1;
      }

      // Get category rank
      let categoryRank = null;
      if (body.category) {
        const { count } = await supabase
          .from('bodies')
          .select('*', { count: 'exact', head: true })
          .eq('category', body.category)
          .gt('trust_score', body.trust_score);
        categoryRank = count + 1;
      }

      // Update rankings in database
      await supabase
        .from('bodies')
        .update({
          national_rank: nationalRank + 1,
          regional_rank: regionalRank,
          category_rank: categoryRank,
        })
        .eq('id', bodyId);

      return {
        success: true,
        rankings: {
          national: nationalRank + 1,
          regional: regionalRank,
          category: categoryRank,
        },
      };
    } catch (error) {
      console.error('Error getting rankings:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get analytics insights with AI-style recommendations
   */
  getAnalyticsInsights: async (bodyId) => {
    try {
      const stats = await BodyAnalyticsService.getDashboardStats(bodyId);
      const governanceMetrics = await BodyAnalyticsService.getGovernanceMetrics(bodyId);

      if (!stats.success || !governanceMetrics.success) {
        return { success: false, error: 'Failed to load analytics data' };
      }

      const insights = [];

      // Trust score insights
      if (governanceMetrics.metrics.trust < 50) {
        insights.push({
          type: 'warning',
          title: 'Low Trust Score',
          message: 'Your trust score is below average. Consider responding to more petitions and engaging with your community.',
          icon: 'alert-circle',
        });
      } else if (governanceMetrics.metrics.trust > 75) {
        insights.push({
          type: 'success',
          title: 'Excellent Trust Score',
          message: 'You have a strong trust rating! Keep up the great work.',
          icon: 'checkmark-circle',
        });
      }

      // Pending petitions insight
      if (stats.stats.pendingPetitions > 5) {
        insights.push({
          type: 'action',
          title: `${stats.stats.pendingPetitions} Pending Petitions`,
          message: 'You have several petitions awaiting response. Address them to improve engagement.',
          icon: 'document-text',
        });
      }

      // Follower growth insight
      if (stats.stats.followersGrowth > 10) {
        insights.push({
          type: 'success',
          title: 'Growing Community',
          message: `You gained ${stats.stats.followersGrowth} new followers recently!`,
          icon: 'trending-up',
        });
      } else if (stats.stats.followersGrowth < 2) {
        insights.push({
          type: 'tip',
          title: 'Boost Visibility',
          message: 'Post more content and engage with citizens to grow your audience.',
          icon: 'bulb',
        });
      }

      // Rating insight
      if (stats.stats.totalRatings < 10) {
        insights.push({
          type: 'tip',
          title: 'Collect More Ratings',
          message: 'Encourage citizens to rate your organization for better credibility.',
          icon: 'star',
        });
      }

      return {
        success: true,
        insights,
      };
    } catch (error) {
      console.error('Error getting insights:', error);
      return { success: false, error: error.message };
    }
  },
};
