import { supabase } from '../supabase';

export class TrustMetricsService {
  /**
   * Calculate comprehensive trust metrics for a body
   */
  static async calculateTrustMetrics(bodyId) {
    const metrics = {
      trust_score: 0,
      response_rate: 0,
      resolution_rate: 0,
      member_satisfaction: 0,
      transparency_score: 0,
      total_petitions_handled: 0,
      total_petitions_resolved: 0,
      average_response_time_hours: 0,
    };

    // Get all petitions related to this body
    const { data: petitions } = await supabase
      .from('petitions')
      .select('*')
      .eq('body_id', bodyId);

    if (!petitions || petitions.length === 0) {
      await this.saveTrustMetrics(bodyId, metrics);
      return metrics;
    }

    metrics.total_petitions_handled = petitions.length;

    // Calculate response rate (petitions with comments from body)
    const { count: respondedCount } = await supabase
      .from('comments')
      .select('petition_id', { count: 'exact', head: true })
      .in('petition_id', petitions.map(p => p.id))
      .eq('is_body_response', true);

    metrics.response_rate = (respondedCount / petitions.length) * 100;

    // Calculate resolution rate
    const resolvedPetitions = petitions.filter(p => 
      p.status === 'approved' || p.status === 'implemented'
    );
    metrics.total_petitions_resolved = resolvedPetitions.length;
    metrics.resolution_rate = (resolvedPetitions.length / petitions.length) * 100;

    // Calculate member satisfaction (based on upvotes vs downvotes)
    const totalUpvotes = petitions.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    const totalDownvotes = petitions.reduce((sum, p) => sum + (p.downvotes || 0), 0);
    const totalVotes = totalUpvotes + totalDownvotes;
    
    if (totalVotes > 0) {
      metrics.member_satisfaction = (totalUpvotes / totalVotes) * 100;
    }

    // Calculate average response time
    const responseTimes = [];
    for (const petition of petitions) {
      const { data: comments } = await supabase
        .from('comments')
        .select('created_at')
        .eq('petition_id', petition.id)
        .eq('is_body_response', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (comments && comments.length > 0) {
        const petitionTime = new Date(petition.created_at);
        const responseTime = new Date(comments[0].created_at);
        const hoursDiff = (responseTime - petitionTime) / (1000 * 60 * 60);
        responseTimes.push(hoursDiff);
      }
    }

    if (responseTimes.length > 0) {
      metrics.average_response_time_hours = 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Calculate transparency score (based on frequency of updates)
    const { count: updateCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('petition_id', petitions.map(p => p.id))
      .eq('is_body_response', true);

    metrics.transparency_score = Math.min(100, (updateCount / petitions.length) * 20);

    // Calculate overall trust score (weighted average)
    metrics.trust_score = (
      metrics.response_rate * 0.25 +
      metrics.resolution_rate * 0.30 +
      metrics.member_satisfaction * 0.25 +
      metrics.transparency_score * 0.20
    );

    // Save metrics
    await this.saveTrustMetrics(bodyId, metrics);

    return metrics;
  }

  /**
   * Save trust metrics to database
   */
  static async saveTrustMetrics(bodyId, metrics) {
    const { data: existing } = await supabase
      .from('body_trust_metrics')
      .select('id')
      .eq('body_id', bodyId)
      .single();

    const metricsData = {
      body_id: bodyId,
      ...metrics,
      last_calculated: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('body_trust_metrics')
        .update(metricsData)
        .eq('body_id', bodyId);
    } else {
      await supabase
        .from('body_trust_metrics')
        .insert([metricsData]);
    }
  }

  /**
   * Get trust metrics for a body
   */
  static async getTrustMetrics(bodyId) {
    const { data } = await supabase
      .from('body_trust_metrics')
      .select('*')
      .eq('body_id', bodyId)
      .single();

    return data;
  }

  /**
   * Get trust rating description
   */
  static getTrustRating(score) {
    if (score >= 80) return { label: 'Excellent', color: '#34C759', icon: '⭐' };
    if (score >= 60) return { label: 'Good', color: '#0066FF', icon: '👍' };
    if (score >= 40) return { label: 'Fair', color: '#FF9500', icon: '⚠️' };
    return { label: 'Needs Improvement', color: '#FF3B30', icon: '⚠️' };
  }
}
