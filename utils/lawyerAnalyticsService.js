import { supabase } from '../supabase';

export const LawyerAnalyticsService = {
  /**
   * Get lawyer performance metrics
   */
  getPerformanceMetrics: async (lawyerId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_performance_metrics')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return { success: true, metrics: data || [] };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { success: false, error: error.message, metrics: [] };
    }
  },

  /**
   * Get specialization analytics
   */
  getSpecializationAnalytics: async (lawyerId) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_specialization_analytics')
        .select(`
          *,
          practice_area:practice_areas(name, icon)
        `)
        .eq('lawyer_id', lawyerId)
        .order('total_cases', { ascending: false });

      if (error) throw error;
      return { success: true, analytics: data || [] };
    } catch (error) {
      console.error('Error getting specialization analytics:', error);
      return { success: false, error: error.message, analytics: [] };
    }
  },

  /**
   * Get revenue tracking
   */
  getRevenue: async (lawyerId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_revenue_tracking')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return { success: true, revenue: data || [] };
    } catch (error) {
      console.error('Error getting revenue:', error);
      return { success: false, error: error.message, revenue: [] };
    }
  },

  /**
   * Get total revenue
   */
  getTotalRevenue: async (lawyerId) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_revenue_tracking')
        .select('amount')
        .eq('lawyer_id', lawyerId);

      if (error) throw error;
      
      const total = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      return { success: true, total };
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return { success: false, error: error.message, total: 0 };
    }
  },

  /**
   * Get client satisfaction ratings
   */
  getSatisfactionRatings: async (lawyerId) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_client_satisfaction')
        .select(`
          *,
          client:members(full_name, avatar_url)
        `)
        .eq('lawyer_id', lawyerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, ratings: data || [] };
    } catch (error) {
      console.error('Error getting satisfaction ratings:', error);
      return { success: false, error: error.message, ratings: [] };
    }
  },

  /**
   * Submit satisfaction rating
   */
  submitSatisfactionRating: async (lawyerId, ratingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('lawyer_client_satisfaction')
        .insert({
          lawyer_id: lawyerId,
          client_id: user.id,
          case_id: ratingData.caseId,
          consultation_id: ratingData.consultationId,
          overall_rating: ratingData.overallRating,
          professionalism: ratingData.professionalism,
          communication: ratingData.communication,
          expertise: ratingData.expertise,
          value_for_money: ratingData.valueForMoney,
          responsiveness: ratingData.responsiveness,
          would_recommend: ratingData.wouldRecommend,
          feedback_text: ratingData.feedbackText
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, rating: data };
    } catch (error) {
      console.error('Error submitting rating:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get lawyer badges
   */
  getLawyerBadges: async (lawyerId) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_earned_badges')
        .select(`
          *,
          badge:lawyer_achievement_badges(*)
        `)
        .eq('lawyer_id', lawyerId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return { success: true, badges: data || [] };
    } catch (error) {
      console.error('Error getting badges:', error);
      return { success: false, error: error.message, badges: [] };
    }
  },

  /**
   * Get all available badges
   */
  getAllBadges: async () => {
    try {
      const { data, error } = await supabase
        .from('lawyer_achievement_badges')
        .select('*')
        .order('badge_name');

      if (error) throw error;
      return { success: true, badges: data || [] };
    } catch (error) {
      console.error('Error getting all badges:', error);
      return { success: false, error: error.message, badges: [] };
    }
  },

  /**
   * Get analytics summary
   */
  getAnalyticsSummary: async (lawyerId) => {
    try {
      const [metricsResult, specializationResult, satisfactionResult, badgesResult] = await Promise.all([
        this.getPerformanceMetrics(lawyerId, 
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
        this.getSpecializationAnalytics(lawyerId),
        this.getSatisfactionRatings(lawyerId),
        this.getLawyerBadges(lawyerId)
      ]);

      const summary = {
        recentMetrics: metricsResult.success ? metricsResult.metrics : [],
        specializations: specializationResult.success ? specializationResult.analytics : [],
        recentRatings: satisfactionResult.success ? satisfactionResult.ratings.slice(0, 5) : [],
        badges: badgesResult.success ? badgesResult.badges : []
      };

      // Calculate aggregates
      if (summary.recentMetrics.length > 0) {
        const latest = summary.recentMetrics[summary.recentMetrics.length - 1];
        summary.activeCases = latest.active_cases_count || 0;
        summary.totalCasesWon = latest.cases_won_count || 0;
        summary.averageRating = latest.average_rating || 0;
      }

      if (summary.specializations.length > 0) {
        summary.topSpecialization = summary.specializations[0];
      }

      if (summary.recentRatings.length > 0) {
        const avgRating = summary.recentRatings.reduce((sum, r) => sum + r.overall_rating, 0) / summary.recentRatings.length;
        summary.clientSatisfaction = avgRating.toFixed(1);
      }

      return { success: true, summary };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update daily metrics
   */
  updateDailyMetrics: async (lawyerId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.rpc('update_lawyer_daily_metrics', {
        p_lawyer_id: lawyerId,
        p_date: today
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating daily metrics:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Track revenue
   */
  trackRevenue: async (lawyerId, revenueData) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_revenue_tracking')
        .insert({
          lawyer_id: lawyerId,
          case_id: revenueData.caseId,
          consultation_id: revenueData.consultationId,
          revenue_type: revenueData.revenueType,
          amount: revenueData.amount,
          currency: revenueData.currency || 'KES',
          payment_date: revenueData.paymentDate,
          payment_method: revenueData.paymentMethod,
          description: revenueData.description
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, revenue: data };
    } catch (error) {
      console.error('Error tracking revenue:', error);
      return { success: false, error: error.message };
    }
  }
};
