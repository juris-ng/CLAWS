// utils/petitionService.js

import { supabase } from '../supabase';
import { getRandomCategoryImage } from './petitionCategoriesService';

/**
 * Petition Service - All petition-related operations
 */
export const PetitionService = {
  /**
   * Create a new petition
   * @param {object} petitionData - Petition data object
   * @returns {object} Success/error response
   */
  createPetition: async (petitionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Generate or use provided image
      let imageUrl = petitionData.imageUrl;
      let isAutoImage = false;

      if (!imageUrl) {
        // Auto-generate image if not provided
        imageUrl = getRandomCategoryImage(petitionData.category);
        isAutoImage = true;
      }

      const { data, error } = await supabase
        .from('petitions')
        .insert([
          {
            member_id: user.id,
            title: petitionData.title?.trim(),
            description: petitionData.description?.trim(),
            category: petitionData.category?.toLowerCase() || 'other',
            image_url: imageUrl,
            is_auto_image: isAutoImage,
            is_anonymous: petitionData.isAnonymous || false,
            anonymous_reason: petitionData.anonymousReason?.trim() || null,
            status: 'pending',
            upvotes: 0,
            downvotes: 0,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      console.log('✅ Petition created successfully:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error creating petition:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all petitions with filters
   * @param {object} filters - Filter options
   * @returns {object} Petitions data or error
   */
  getPetitions: async (filters = {}) => {
    try {
      let query = supabase
        .from('petitions')
        .select(`
          *,
          creator:members!petitions_member_id_fkey(
            id,
            full_name,
            avatar_url,
            is_anonymous,
            anonymous_display_name
          ),
          target_body:bodies!petitions_target_body_id_fkey(
            id,
            organization_name,
            logo_url
          ),
          comments:comments(count)
        `);

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq('category', filters.category.toLowerCase());
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      const orderBy = filters.orderBy || 'created_at';
      const ascending = filters.ascending !== undefined ? filters.ascending : false;
      query = query.order(orderBy, { ascending });

      // Apply limit and offset
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      // Ensure all petitions have images
      const petitionsWithImages = (data || []).map(petition => ({
        ...petition,
        image_url: petition.image_url || getRandomCategoryImage(petition.category),
      }));

      return { success: true, data: petitionsWithImages };
    } catch (error) {
      console.error('❌ Error fetching petitions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get single petition by ID
   * @param {string} petitionId - Petition ID
   * @returns {object} Petition data or error
   */
  getPetitionById: async (petitionId) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          creator:members!petitions_member_id_fkey(
            id,
            full_name,
            avatar_url,
            is_anonymous,
            anonymous_display_name
          ),
          target_body:bodies!petitions_target_body_id_fkey(
            id,
            organization_name,
            logo_url
          ),
          comments:comments(*)
        `)
        .eq('id', petitionId)
        .single();

      if (error) throw error;

      // Ensure petition has image
      if (!data.image_url) {
        data.image_url = getRandomCategoryImage(data.category);
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error fetching petition:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update petition
   * @param {string} petitionId - Petition ID
   * @param {object} updates - Fields to update
   * @returns {object} Updated petition or error
   */
  updatePetition: async (petitionId, updates) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', petitionId)
        .select();

      if (error) throw error;

      console.log('✅ Petition updated successfully');
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error updating petition:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete petition
   * @param {string} petitionId - Petition ID
   * @returns {object} Success or error
   */
  deletePetition: async (petitionId) => {
    try {
      const { error } = await supabase
        .from('petitions')
        .delete()
        .eq('id', petitionId);

      if (error) throw error;

      console.log('✅ Petition deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting petition:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upvote a petition
   * @param {string} petitionId - Petition ID
   * @param {string} memberId - Member ID
   * @returns {object} Success or error
   */
  upvotePetition: async (petitionId, memberId) => {
    try {
      // Check if already upvoted
      const { data: existing } = await supabase
        .from('petition_upvotes')
        .select('id')
        .eq('petition_id', petitionId)
        .eq('member_id', memberId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Already upvoted this petition' };
      }

      // Insert upvote
      const { error: upvoteError } = await supabase
        .from('petition_upvotes')
        .insert({
          petition_id: petitionId,
          member_id: memberId,
        });

      if (upvoteError) throw upvoteError;

      // Update upvote count
      const { error: updateError } = await supabase.rpc(
        'increment_upvotes',
        { petition_id: petitionId }
      );

      if (updateError) throw updateError;

      console.log('✅ Petition upvoted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error upvoting petition:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get trending petitions
   * @param {number} limit - Number of results
   * @returns {object} Trending petitions or error
   */
  getTrendingPetitions: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          creator:members!petitions_member_id_fkey(
            id,
            full_name,
            avatar_url,
            is_anonymous
          )
        `)
        .eq('status', 'active')
        .gte('upvotes', 10)
        .order('upvotes', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Ensure all petitions have images
      const petitionsWithImages = (data || []).map(petition => ({
        ...petition,
        image_url: petition.image_url || getRandomCategoryImage(petition.category),
      }));

      return { success: true, data: petitionsWithImages };
    } catch (error) {
      console.error('❌ Error fetching trending petitions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get petitions by category
   * @param {string} category - Category name
   * @param {number} limit - Number of results
   * @returns {object} Petitions or error
   */
  getPetitionsByCategory: async (category, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          creator:members!petitions_member_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('category', category.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Ensure all petitions have images
      const petitionsWithImages = (data || []).map(petition => ({
        ...petition,
        image_url: petition.image_url || getRandomCategoryImage(petition.category),
      }));

      return { success: true, data: petitionsWithImages };
    } catch (error) {
      console.error('❌ Error fetching category petitions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Search petitions
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {object} Search results or error
   */
  searchPetitions: async (query, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          creator:members!petitions_member_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('upvotes', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Ensure all petitions have images
      const petitionsWithImages = (data || []).map(petition => ({
        ...petition,
        image_url: petition.image_url || getRandomCategoryImage(petition.category),
      }));

      return { success: true, data: petitionsWithImages };
    } catch (error) {
      console.error('❌ Error searching petitions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get petitions by user
   * @param {string} userId - User/Member ID
   * @returns {object} User's petitions or error
   */
  getPetitionsByUser: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          comments:comments(count)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure all petitions have images
      const petitionsWithImages = (data || []).map(petition => ({
        ...petition,
        image_url: petition.image_url || getRandomCategoryImage(petition.category),
      }));

      return { success: true, data: petitionsWithImages };
    } catch (error) {
      console.error('❌ Error fetching user petitions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if petition title exists
   * @param {string} title - Petition title
   * @returns {boolean} True if exists
   */
  checkTitleExists: async (title) => {
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select('id')
        .ilike('title', title)
        .maybeSingle();

      if (error) throw error;

      return data ? true : false;
    } catch (error) {
      console.error('❌ Error checking title:', error);
      return false;
    }
  },
};
