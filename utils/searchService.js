import { supabase } from '../supabase';

// ============================================================================
// SEARCH TYPES
// ============================================================================
export const SEARCH_TYPES = {
  ALL: 'all',
  PETITIONS: 'petitions',
  MEMBERS: 'members',
  BODIES: 'bodies',
  LAWYERS: 'lawyers',
  CASES: 'cases',
  RESOURCES: 'resources',
  IDEAS: 'ideas',
};

// ============================================================================
// SORT OPTIONS
// ============================================================================
export const SORT_OPTIONS = {
  RELEVANCE: 'relevance',
  RECENT: 'recent',
  OLDEST: 'oldest',
  POPULAR: 'popular',
  ALPHABETICAL: 'alphabetical',
};

// ============================================================================
// CATEGORIES
// ============================================================================
export const CATEGORIES = [
  { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️', color: '#FF6B6B' },
  { id: 'education', name: 'Education', icon: '📚', color: '#4ECDC4' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#45B7D1' },
  { id: 'environment', name: 'Environment', icon: '🌍', color: '#52B788' },
  { id: 'security', name: 'Security', icon: '🛡️', color: '#F4A261' },
  { id: 'economy', name: 'Economy', icon: '💰', color: '#F7DC6F' },
  { id: 'social', name: 'Social Issues', icon: '👥', color: '#BB8FCE' },
  { id: 'governance', name: 'Governance', icon: '⚖️', color: '#85C1E2' },
  { id: 'human_rights', name: 'Human Rights', icon: '✊', color: '#E74C3C' },
  { id: 'corruption', name: 'Anti-Corruption', icon: '🚫', color: '#E67E22' },
  { id: 'other', name: 'Other', icon: '📋', color: '#95A5A6' },
];

// ============================================================================
// SEARCH SERVICE
// ============================================================================
export const SearchService = {
  /**
   * Universal search across all entities
   */
  searchAll: async (query, options = {}) => {
    try {
      const { limit = 20, type = SEARCH_TYPES.ALL } = options;

      if (!query || query.trim().length === 0) {
        return { success: true, results: [] };
      }

      const searchQuery = query.trim();
      let results = [];

      // Search different types based on filter
      if (type === SEARCH_TYPES.ALL || type === SEARCH_TYPES.PETITIONS) {
        const petitions = await SearchService.searchPetitions(searchQuery, { limit });
        results.push(...petitions.map((p) => ({ ...p, type: 'petition' })));
      }

      if (type === SEARCH_TYPES.ALL || type === SEARCH_TYPES.MEMBERS) {
        const members = await SearchService.searchMembers(searchQuery, { limit });
        results.push(...members.map((m) => ({ ...m, type: 'member' })));
      }

      if (type === SEARCH_TYPES.ALL || type === SEARCH_TYPES.BODIES) {
        const bodies = await SearchService.searchBodies(searchQuery, { limit });
        results.push(...bodies.map((b) => ({ ...b, type: 'body' })));
      }

      if (type === SEARCH_TYPES.ALL || type === SEARCH_TYPES.LAWYERS) {
        const lawyers = await SearchService.searchLawyers(searchQuery, { limit });
        results.push(...lawyers.map((l) => ({ ...l, type: 'lawyer' })));
      }

      // Save search to history
      await SearchService.saveSearchHistory(searchQuery);

      return { success: true, results, query: searchQuery };
    } catch (error) {
      console.error('Error in searchAll:', error);
      return { success: false, error: error.message, results: [] };
    }
  },

  /**
   * Search petitions with advanced filters
   */
  searchPetitions: async (query, filters = {}) => {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null,
        category = null,
        startDate = null,
        endDate = null,
        sortBy = SORT_OPTIONS.RECENT,
        minSignatures = null,
        maxSignatures = null,
      } = filters;

      let queryBuilder = supabase
        .from('petitions')
        .select(
          `
          *,
          member:members!petitions_member_id_fkey(id, full_name, avatar_url, is_anonymous, anonymous_display_name),
          signatures:petition_signatures(count),
          comments:comments(count)
        `,
          { count: 'exact' }
        )
        .range(offset, offset + limit - 1);

      // Text search
      if (query && query.trim()) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
        );
      }

      // Filters
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      if (startDate) {
        queryBuilder = queryBuilder.gte('created_at', startDate);
      }

      if (endDate) {
        queryBuilder = queryBuilder.lte('created_at', endDate);
      }

      // Sort
      switch (sortBy) {
        case SORT_OPTIONS.RECENT:
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
          break;
        case SORT_OPTIONS.OLDEST:
          queryBuilder = queryBuilder.order('created_at', { ascending: true });
          break;
        case SORT_OPTIONS.ALPHABETICAL:
          queryBuilder = queryBuilder.order('title', { ascending: true });
          break;
        case SORT_OPTIONS.POPULAR:
          queryBuilder = queryBuilder.order('signature_count', { ascending: false });
          break;
        default:
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
      }

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      // Apply signature filters (post-query)
      let filtered = data || [];
      if (minSignatures !== null) {
        filtered = filtered.filter((p) => p.signature_count >= minSignatures);
      }
      if (maxSignatures !== null) {
        filtered = filtered.filter((p) => p.signature_count <= maxSignatures);
      }

      return { success: true, petitions: filtered, total: count || 0 };
    } catch (error) {
      console.error('Error searching petitions:', error);
      return { success: false, error: error.message, petitions: [], total: 0 };
    }
  },

  /**
   * Search members
   */
  searchMembers: async (query, options = {}) => {
    try {
      const { limit = 20, offset = 0 } = options;

      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, email, avatar_url, is_anonymous, anonymous_display_name, level, total_points')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,anonymous_display_name.ilike.%${query}%`)
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (error) throw error;

      return { success: true, members: data || [] };
    } catch (error) {
      console.error('Error searching members:', error);
      return { success: false, error: error.message, members: [] };
    }
  },

  /**
   * Search bodies/organizations
   */
  searchBodies: async (query, options = {}) => {
    try {
      const { limit = 20, offset = 0, verified = null } = options;

      let queryBuilder = supabase
        .from('bodies')
        .select('id, organization_name, organization_type, description, logo_url, is_verified')
        .or(`organization_name.ilike.%${query}%,description.ilike.%${query}%`)
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (verified !== null) {
        queryBuilder = queryBuilder.eq('is_verified', verified);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return { success: true, bodies: data || [] };
    } catch (error) {
      console.error('Error searching bodies:', error);
      return { success: false, error: error.message, bodies: [] };
    }
  },

  /**
   * Search lawyers
   */
  searchLawyers: async (query, options = {}) => {
    try {
      const { limit = 20, offset = 0, specialization = null } = options;

      let queryBuilder = supabase
        .from('lawyers')
        .select(`
          *,
          member:members!lawyers_member_id_fkey(full_name, avatar_url, email)
        `)
        .or(`bar_number.ilike.%${query}%`)
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (specialization) {
        queryBuilder = queryBuilder.contains('specializations', [specialization]);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return { success: true, lawyers: data || [] };
    } catch (error) {
      console.error('Error searching lawyers:', error);
      return { success: false, error: error.message, lawyers: [] };
    }
  },

  /**
   * Search cases
   */
  searchCases: async (query, options = {}) => {
    try {
      const { limit = 20, offset = 0, status = null } = options;

      let queryBuilder = supabase
        .from('legal_cases')
        .select('*')
        .or(`case_title.ilike.%${query}%,description.ilike.%${query}%`)
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return { success: true, cases: data || [] };
    } catch (error) {
      console.error('Error searching cases:', error);
      return { success: false, error: error.message, cases: [] };
    }
  },

  /**
   * Get search suggestions (autocomplete)
   */
  getSearchSuggestions: async (query, type = SEARCH_TYPES.PETITIONS) => {
    try {
      if (!query || query.length < 2) {
        return { success: true, suggestions: [] };
      }

      let suggestions = [];

      if (type === SEARCH_TYPES.PETITIONS) {
        const { data } = await supabase
          .from('petitions')
          .select('title')
          .ilike('title', `%${query}%`)
          .limit(5);

        suggestions = (data || []).map((p) => p.title);
      } else if (type === SEARCH_TYPES.MEMBERS) {
        const { data } = await supabase
          .from('members')
          .select('full_name')
          .ilike('full_name', `%${query}%`)
          .limit(5);

        suggestions = (data || []).map((m) => m.full_name);
      }

      return { success: true, suggestions };
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return { success: false, error: error.message, suggestions: [] };
    }
  },

  /**
   * Get trending topics
   */
  getTrendingTopics: async (limit = 10) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('petitions')
        .select('id, title, category, signature_count, created_at')
        .eq('status', 'active')
        .gte('created_at', sevenDaysAgo)
        .order('signature_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, trending: data || [] };
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return { success: false, error: error.message, trending: [] };
    }
  },

  /**
   * Get popular searches
   */
  getPopularSearches: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('query, count(*)')
        .not('query', 'is', null)
        .order('count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, searches: data || [] };
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return { success: false, error: error.message, searches: [] };
    }
  },

  /**
   * Save search to history
   */
  saveSearchHistory: async (query, userId = null) => {
    try {
      if (!query || query.trim().length === 0) return;

      const { error } = await supabase.from('search_history').insert([
        {
          query: query.trim(),
          user_id: userId,
          searched_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error saving search history:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user search history
   */
  getUserSearchHistory: async (userId, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, history: data || [] };
    } catch (error) {
      console.error('Error getting search history:', error);
      return { success: false, error: error.message, history: [] };
    }
  },

  /**
   * Clear user search history
   */
  clearSearchHistory: async (userId) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error clearing search history:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get categories
   */
  getCategories: () => {
    return { success: true, categories: CATEGORIES };
  },

  /**
   * Get category by ID
   */
  getCategoryById: (categoryId) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return { success: true, category: category || null };
  },

  /**
   * Search by category
   */
  searchByCategory: async (categoryId, options = {}) => {
    try {
      const { limit = 50, offset = 0 } = options;

      const { data, error, count } = await supabase
        .from('petitions')
        .select('*', { count: 'exact' })
        .eq('category', categoryId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, petitions: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error searching by category:', error);
      return { success: false, error: error.message, petitions: [], total: 0 };
    }
  },

  /**
   * Get related searches
   */
  getRelatedSearches: async (query) => {
    try {
      // Get searches that contain similar keywords
      const keywords = query.toLowerCase().split(' ');

      const { data, error } = await supabase
        .from('search_history')
        .select('query')
        .limit(20);

      if (error) throw error;

      // Filter related searches
      const related = (data || [])
        .filter((s) =>
          keywords.some((keyword) => s.query.toLowerCase().includes(keyword))
        )
        .map((s) => s.query)
        .slice(0, 5);

      return { success: true, related: [...new Set(related)] };
    } catch (error) {
      console.error('Error getting related searches:', error);
      return { success: false, error: error.message, related: [] };
    }
  },
};

// Export as default for backwards compatibility
export default SearchService;
