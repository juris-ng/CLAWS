import { supabase } from '../supabase';

export const SearchService = {
  // Search petitions with advanced filters
  searchPetitions: async (query, filters = {}) => {
    let queryBuilder = supabase
      .from('petitions')
      .select(`
        *,
        member:members(full_name, avatar_url),
        votes:petition_votes(count),
        comments:comments(count)
      `);

    // Text search
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Status filter
    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status);
    }

    // Category filter
    if (filters.category) {
      queryBuilder = queryBuilder.eq('category', filters.category);
    }

    // Date range filter
    if (filters.startDate) {
      queryBuilder = queryBuilder.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      queryBuilder = queryBuilder.lte('created_at', filters.endDate);
    }

    // Sort options
    if (filters.sortBy === 'popular') {
      // This will need a separate query to count votes
      const { data } = await queryBuilder;
      return data?.sort((a, b) => 
        (b.votes?.[0]?.count || 0) - (a.votes?.[0]?.count || 0)
      ) || [];
    } else if (filters.sortBy === 'recent') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    } else if (filters.sortBy === 'oldest') {
      queryBuilder = queryBuilder.order('created_at', { ascending: true });
    }

    const { data, error } = await queryBuilder;
    return data || [];
  },

  // Search members
  searchMembers: async (query) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    return data || [];
  },

  // Get categories
  getCategories: async () => {
    return [
      { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' },
      { id: 'education', name: 'Education', icon: '📚' },
      { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
      { id: 'environment', name: 'Environment', icon: '🌍' },
      { id: 'security', name: 'Security', icon: '🛡️' },
      { id: 'economy', name: 'Economy', icon: '💰' },
      { id: 'social', name: 'Social Issues', icon: '👥' },
      { id: 'governance', name: 'Governance', icon: '⚖️' },
      { id: 'other', name: 'Other', icon: '📋' },
    ];
  },

  // Get trending topics
  getTrendingTopics: async () => {
    const { data } = await supabase
      .from('petitions')
      .select(`
        *,
        votes:petition_votes(count)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    return data?.sort((a, b) => 
      (b.votes?.[0]?.count || 0) - (a.votes?.[0]?.count || 0)
    ).slice(0, 5) || [];
  },
};
