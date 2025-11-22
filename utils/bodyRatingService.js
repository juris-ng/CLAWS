import { supabase } from '../supabase';

export const BodyRatingService = {
  /**
   * Rate a body/organization
   */
  rateBody: async (bodyId, category, rating, reviewText = null, isAnonymous = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if rating already exists
      const { data: existing } = await supabase
        .from('body_ratings')
        .select('id')
        .eq('rater_id', user.id)
        .eq('body_id', bodyId)
        .eq('category', category)
        .single();

      if (existing) {
        // Update existing rating
        const { data, error } = await supabase
          .from('body_ratings')
          .update({
            rating,
            review_text: reviewText,
            is_anonymous: isAnonymous,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, rating: data, updated: true };
      } else {
        // Create new rating
        const { data, error } = await supabase
          .from('body_ratings')
          .insert({
            rater_id: user.id,
            body_id: bodyId,
            category,
            rating,
            review_text: reviewText,
            is_anonymous: isAnonymous
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, rating: data, updated: false };
      }
    } catch (error) {
      console.error('Error rating body:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all ratings for a body
   */
  getBodyRatings: async (bodyId, category = null) => {
    try {
      let query = supabase
        .from('body_ratings')
        .select(`
          *,
          rater:members!body_ratings_rater_id_fkey(id, full_name, is_anonymous, anonymous_display_name)
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, ratings: data || [] };
    } catch (error) {
      console.error('Error getting body ratings:', error);
      return { success: false, error: error.message, ratings: [] };
    }
  },

  /**
   * Get body's average rating
   */
  getBodyAverageRating: async (bodyId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_body_average_rating', { target_body_id: bodyId });

      if (error) throw error;
      
      return { 
        success: true, 
        avgRating: data?.[0]?.avg_rating || 0,
        totalRatings: data?.[0]?.total_ratings || 0,
        categoryBreakdown: data?.[0]?.category_breakdown || {}
      };
    } catch (error) {
      console.error('Error getting average rating:', error);
      return { success: false, avgRating: 0, totalRatings: 0 };
    }
  },

  /**
   * Get user's rating for a body
   */
  getUserRating: async (bodyId, category) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_ratings')
        .select('*')
        .eq('rater_id', user.id)
        .eq('body_id', bodyId)
        .eq('category', category)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, rating: data };
    } catch (error) {
      console.error('Error getting user rating:', error);
      return { success: false, rating: null };
    }
  },

  /**
   * Delete rating
   */
  deleteRating: async (ratingId) => {
    try {
      const { error } = await supabase
        .from('body_ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting rating:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's own ratings
   */
  getUserRatings: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_ratings')
        .select('*')
        .eq('rater_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, ratings: data || [] };
    } catch (error) {
      console.error('Error getting user ratings:', error);
      return { success: false, error: error.message, ratings: [] };
    }
  }
};
