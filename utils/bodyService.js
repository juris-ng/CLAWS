import { supabase } from '../supabase';

export const BodyService = {
  // ============================================================================
  // BODY PROFILE & REGISTRATION
  // ============================================================================

  /**
   * Get body profile by ID with all related data (FIXED - without JOINs)
   */
  async getBodyById(bodyId) {
    try {
      // 1. Fetch body first
      const { data, error } = await supabase
        .from('bodies')
        .select('*')
        .eq('id', bodyId)
        .single();

      if (error) throw error;

      // 2. Fetch body_members separately
      const { data: bodyMembersData } = await supabase
        .from('body_members')
        .select('id, role, member_id')
        .eq('body_id', bodyId);

      // 3. Get member IDs
      const memberIds = [...new Set(bodyMembersData?.map(bm => bm.member_id).filter(Boolean) || [])];

      // 4. Fetch member details
      let membersData = [];
      if (memberIds.length > 0) {
        const { data: members } = await supabase
          .from('members')
          .select('id, full_name, avatar_url')
          .in('id', memberIds);
        membersData = members || [];
      }

      // 5. Attach member data to body_members
      const bodyMembers = bodyMembersData?.map(bm => ({
        ...bm,
        member: membersData.find(m => m.id === bm.member_id) || null
      })) || [];

      // 6. Get follower count
      const { count: followerCount } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // 7. Get average rating
      const { data: ratings } = await supabase
        .from('body_ratings')
        .select('rating')
        .eq('body_id', bodyId);

      const avgRating = ratings?.length
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      return {
        success: true,
        body: {
          ...data,
          body_members: bodyMembers,
          followerCount: followerCount || 0,
          averageRating: avgRating,
          totalRatings: ratings?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching body:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create new body (registration) - FIXED
   */
  async createBody(bodyData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create body with the user's auth ID as the body ID
      const { data: body, error: bodyError } = await supabase
        .from('bodies')
        .insert([
          {
            id: user.id,  // Use auth user ID as body ID
            ...bodyData,
            created_by: user.id,
            is_verified: false,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (bodyError) throw bodyError;

      // Don't insert into body_members during registration
      // That table is for staff/team members added later

      return {
        success: true,
        body,
      };
    } catch (error) {
      console.error('Error creating body:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update body profile
   */
  async updateBody(bodyId, updates) {
    try {
      const { data, error } = await supabase
        .from('bodies')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bodyId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        body: data,
      };
    } catch (error) {
      console.error('Error updating body:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // BODY DISCOVERY & SEARCH
  // ============================================================================

  /**
   * Get all verified bodies
   */
  async getAllBodies(options = {}) {
    try {
      let query = supabase
        .from('bodies')
        .select(`
          *,
          body_members!body_members_body_id_fkey (count)
        `)
        .eq('is_verified', true)
        .eq('is_active', true);

      // Apply sorting
      const sortBy = options.sortBy || 'name';
      const sortOrder = options.sortOrder || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        bodies: data || [],
      };
    } catch (error) {
      console.error('Error fetching bodies:', error);
      return {
        success: true,
        bodies: [],
      };
    }
  },

  /**
   * Search bodies with advanced filters
   */
  async searchBodies(query = '', filters = {}) {
    try {
      let queryBuilder = supabase
        .from('bodies')
        .select('*')
        .eq('is_verified', true)
        .eq('is_active', true);

      // Text search
      if (query && query.trim().length > 0) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,focus_areas.cs.{${query}}`
        );
      }

      // Filters
      if (filters.bodyType) {
        queryBuilder = queryBuilder.eq('body_type', filters.bodyType);
      }

      if (filters.city) {
        queryBuilder = queryBuilder.ilike('city', `%${filters.city}%`);
      }

      if (filters.country) {
        queryBuilder = queryBuilder.eq('country', filters.country);
      }

      if (filters.focusArea) {
        queryBuilder = queryBuilder.contains('focus_areas', [filters.focusArea]);
      }

      if (filters.minRating) {
        // Note: This requires a computed column or join
        queryBuilder = queryBuilder.gte('average_rating', filters.minRating);
      }

      const { data, error } = await queryBuilder.order('name', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        bodies: data || [],
      };
    } catch (error) {
      console.error('Error searching bodies:', error);
      return {
        success: true,
        bodies: [],
      };
    }
  },

  /**
   * Get bodies by category/type
   */
  async getBodiesByType(bodyType) {
    try {
      const { data, error } = await supabase
        .from('bodies')
        .select('*')
        .eq('body_type', bodyType)
        .eq('is_verified', true)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        bodies: data || [],
      };
    } catch (error) {
      console.error('Error fetching bodies by type:', error);
      return {
        success: true,
        bodies: [],
      };
    }
  },

  // ============================================================================
  // RATINGS & REVIEWS
  // ============================================================================

  /**
   * Rate a body
   */
  async rateBody(bodyId, rating, review = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('body_ratings')
        .upsert(
          [
            {
              body_id: bodyId,
              member_id: user.id,
              rating,
              review,
            },
          ],
          { onConflict: 'body_id,member_id' }
        )
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        rating: data,
      };
    } catch (error) {
      console.error('Error rating body:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get body ratings
   */
  async getBodyRatings(bodyId) {
    try {
      const { data, error } = await supabase
        .from('body_ratings')
        .select(`
          *,
          member:members!body_ratings_member_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        ratings: data || [],
      };
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return {
        success: true,
        ratings: [],
      };
    }
  },

  // ============================================================================
  // FOLLOWER SYSTEM
  // ============================================================================

  /**
   * Follow a body
   */
  async followBody(bodyId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('body_followers')
        .insert([
          {
            body_id: bodyId,
            member_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        follow: data,
      };
    } catch (error) {
      console.error('Error following body:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Unfollow a body
   */
  async unfollowBody(bodyId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('body_followers')
        .delete()
        .eq('body_id', bodyId)
        .eq('member_id', user.id);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error unfollowing body:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Check if user follows body
   */
  async isFollowing(bodyId, userId) {
    try {
      const { data, error } = await supabase
        .from('body_followers')
        .select('id')
        .eq('body_id', bodyId)
        .eq('member_id', userId)
        .single();

      return {
        success: true,
        isFollowing: !!data,
      };
    } catch (error) {
      return {
        success: true,
        isFollowing: false,
      };
    }
  },

  /**
   * Get body followers
   */
  async getBodyFollowers(bodyId) {
    try {
      const { data, error } = await supabase
        .from('body_followers')
        .select(`
          *,
          member:members!body_followers_member_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        followers: data || [],
      };
    } catch (error) {
      console.error('Error fetching followers:', error);
      return {
        success: true,
        followers: [],
      };
    }
  },

  // ============================================================================
  // TEAM MANAGEMENT
  // ============================================================================

  /**
   * Get body members/team
   */
  async getBodyMembers(bodyId) {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .select(`
          *,
          member:members!body_members_member_id_fkey (
            id,
            full_name,
            email,
            avatar_url,
            phone_number
          )
        `)
        .eq('body_id', bodyId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        members: data || [],
      };
    } catch (error) {
      console.error('Error fetching body members:', error);
      return {
        success: true,
        members: [],
      };
    }
  },

  /**
   * Add member to body (invite)
   */
  async addBodyMember(bodyId, memberId, role = 'member', permissions = {}) {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .insert([
          {
            body_id: bodyId,
            member_id: memberId,
            role,
            permissions,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        member: data,
      };
    } catch (error) {
      console.error('Error adding body member:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update member role/permissions
   */
  async updateBodyMember(bodyId, memberId, updates) {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .update(updates)
        .eq('body_id', bodyId)
        .eq('member_id', memberId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        member: data,
      };
    } catch (error) {
      console.error('Error updating member:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Remove member from body
   */
  async removeBodyMember(bodyId, memberId) {
    try {
      const { error } = await supabase
        .from('body_members')
        .update({ is_active: false })
        .eq('body_id', bodyId)
        .eq('member_id', memberId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error removing body member:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // PETITIONS & RESPONSES
  // ============================================================================

  /**
   * Get body petition responses (FIXED - without JOINs)
   */
  async getBodyPetitions(bodyId) {
    try {
      // 1. Fetch petition responses first
      const { data: responses, error } = await supabase
        .from('body_petition_responses')
        .select('*')
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!responses || responses.length === 0) {
        return {
          success: true,
          petitions: [],
        };
      }

      // 2. Get all unique petition IDs
      const petitionIds = [...new Set(responses.map(r => r.petition_id).filter(Boolean))];

      // 3. Fetch petitions separately
      const { data: petitions } = await supabase
        .from('petitions')
        .select('id, title, description, status, created_at, support_count, creator_id')
        .in('id', petitionIds);

      // 4. Get all unique creator IDs from petitions
      const creatorIds = [...new Set(petitions?.map(p => p.creator_id).filter(Boolean) || [])];

      // 5. Get all unique responder IDs from responses
      const responderIds = [...new Set(responses.map(r => r.responder_id).filter(Boolean))];

      // 6. Fetch all members (creators and responders)
      const allMemberIds = [...new Set([...creatorIds, ...responderIds])];
      const { data: members } = await supabase
        .from('members')
        .select('id, full_name')
        .in('id', allMemberIds);

      // 7. Attach petition data to each response
      responses.forEach(response => {
        const petition = petitions?.find(p => p.id === response.petition_id);
        if (petition) {
          const creator = members?.find(m => m.id === petition.creator_id);
          response.petition = {
            ...petition,
            creator: creator || null
          };
        }
        const responder = members?.find(m => m.id === response.responder_id);
        response.responder = responder || null;
      });

      return {
        success: true,
        petitions: responses,
      };
    } catch (error) {
      console.error('Error fetching body petitions:', error);
      return {
        success: true,
        petitions: [],
      };
    }
  },

  /**
   * Respond to petition
   */
  async respondToPetition(bodyId, petitionId, responseData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('body_petition_responses')
        .insert([
          {
            body_id: bodyId,
            petition_id: petitionId,
            response_text: responseData.text,
            response_type: responseData.type || 'official',
            responder_id: user.id,
            action_taken: responseData.actionTaken || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        response: data,
      };
    } catch (error) {
      console.error('Error responding to petition:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // BODY POSTS & CONTENT
  // ============================================================================

  /**
   * Get body posts
   */
  async getBodyPosts(bodyId) {
    try {
      const { data, error } = await supabase
        .from('body_posts')
        .select(`
          *,
          author:members!body_posts_author_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        posts: data || [],
      };
    } catch (error) {
      console.error('Error fetching body posts:', error);
      return {
        success: true,
        posts: [],
      };
    }
  },

  /**
   * Create body post
   */
  async createBodyPost(bodyId, postData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('body_posts')
        .insert([
          {
            body_id: bodyId,
            author_id: user.id,
            ...postData,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        post: data,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // ANALYTICS & STATISTICS
  // ============================================================================

  /**
   * Get comprehensive body analytics
   */
  async getBodyAnalytics(bodyId) {
    try {
      // Petition responses
      const { count: responsesCount } = await supabase
        .from('body_petition_responses')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Team size
      const { count: teamCount } = await supabase
        .from('body_members')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('is_active', true);

      // Followers
      const { count: followersCount } = await supabase
        .from('body_followers')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Posts
      const { count: postsCount } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      // Recent activity
      const { data: recentActivity } = await supabase
        .from('body_petition_responses')
        .select('created_at')
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false })
        .limit(30);

      // Average rating
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
          totalResponses: responsesCount || 0,
          teamSize: teamCount || 0,
          followersCount: followersCount || 0,
          postsCount: postsCount || 0,
          averageRating: avgRating,
          totalRatings: ratings?.length || 0,
          recentActivityCount: recentActivity?.length || 0,
          lastActivity: recentActivity?.[0]?.created_at || null,
        },
      };
    } catch (error) {
      console.error('Error fetching body analytics:', error);
      return {
        success: true,
        analytics: {
          totalResponses: 0,
          teamSize: 0,
          followersCount: 0,
          postsCount: 0,
          averageRating: 0,
          totalRatings: 0,
          recentActivityCount: 0,
          lastActivity: null,
        },
      };
    }
  },

  /**
   * Get body dashboard stats
   */
  async getBodyDashboardStats(bodyId) {
    try {
      const analytics = await this.getBodyAnalytics(bodyId);
      
      // Get pending petitions
      const { count: pendingPetitions } = await supabase
        .from('petitions')
        .select('*', { count: 'exact', head: true })
        .eq('target_body_id', bodyId)
        .eq('status', 'active');

      return {
        success: true,
        stats: {
          ...analytics.analytics,
          pendingPetitions: pendingPetitions || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ============================================================================
  // PERMISSIONS & ROLES
  // ============================================================================

  /**
   * Check if user is body admin/owner
   */
  async isBodyAdmin(bodyId, userId) {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .select('role')
        .eq('body_id', bodyId)
        .eq('member_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return {
        success: true,
        isAdmin: data?.role === 'admin' || data?.role === 'owner',
        role: data?.role,
      };
    } catch (error) {
      return {
        success: true,
        isAdmin: false,
        role: null,
      };
    }
  },

  /**
   * Check specific permission
   */
  async hasPermission(bodyId, userId, permission) {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .select('role, permissions')
        .eq('body_id', bodyId)
        .eq('member_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Owners and admins have all permissions
      if (data?.role === 'owner' || data?.role === 'admin') {
        return { success: true, hasPermission: true };
      }

      // Check specific permission
      const hasPermission = data?.permissions?.[permission] === true;

      return {
        success: true,
        hasPermission,
      };
    } catch (error) {
      return {
        success: true,
        hasPermission: false,
      };
    }
  },

  // ============================================================================
  // BODY TYPES & CATEGORIES
  // ============================================================================

  /**
   * Get body types (categories)
   */
  async getBodyTypes() {
    return {
      success: true,
      types: [
        { value: 'government', label: 'Government Agency', icon: '🏛️' },
        { value: 'ngo', label: 'NGO / Non-Profit', icon: '🤝' },
        { value: 'civil_society', label: 'Civil Society Organization', icon: '👥' },
        { value: 'educational', label: 'Educational Institution', icon: '🎓' },
        { value: 'corporate', label: 'Corporate / Business', icon: '🏢' },
        { value: 'media', label: 'Media Organization', icon: '📺' },
        { value: 'advocacy', label: 'Advocacy Group', icon: '📢' },
        { value: 'community', label: 'Community Organization', icon: '🏘️' },
        { value: 'religious', label: 'Religious Organization', icon: '⛪' },
        { value: 'other', label: 'Other', icon: '🔷' },
      ],
    };
  },

  /**
   * Get focus areas
   */
  async getFocusAreas() {
    return {
      success: true,
      areas: [
        'Human Rights',
        'Environmental Protection',
        'Education',
        'Healthcare',
        'Economic Development',
        'Social Justice',
        'Gender Equality',
        'Child Welfare',
        'Good Governance',
        'Anti-Corruption',
        'Community Development',
        'Disability Rights',
        'Youth Empowerment',
        'Arts & Culture',
        'Technology & Innovation',
      ],
    };
  },

  // ============================================================================
  // BODY EVENTS & PROJECTS (NEW - FOR PARTNERSHIPS SCREEN)
  // ============================================================================

  /**
   * Get all events created by this body
   */
  async getBodyEvents(bodyId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        events: data || [],
      };
    } catch (error) {
      console.error('Error fetching body events:', error);
      return {
        success: true,
        events: [],
      };
    }
  },

  /**
   * Get all projects created by this body
   */
  async getBodyProjects(bodyId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        projects: data || [],
      };
    } catch (error) {
      console.error('Error fetching body projects:', error);
      return {
        success: true,
        projects: [],
      };
    }
  },

  /**
   * Get combined events and projects (for partnerships content tab)
   */
  async getBodyContent(bodyId) {
    try {
      const eventsResult = await this.getBodyEvents(bodyId);
      const projectsResult = await this.getBodyProjects(bodyId);

      // Combine and tag with type
      const content = [
        ...(eventsResult.events || []).map(e => ({ ...e, type: 'event' })),
        ...(projectsResult.projects || []).map(p => ({ ...p, type: 'project' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return {
        success: true,
        content,
      };
    } catch (error) {
      console.error('Error fetching body content:', error);
      return {
        success: true,
        content: [],
      };
    }
  },
  // ============================================================================
  // TEAM INVITATION & MANAGEMENT (NEW)
  // ============================================================================

  /**
   * Invite a member to join the body team (administrative team)
   */
  async inviteMember(bodyId, inviteData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Check if member exists by email
      const { data: existingMember, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('email', inviteData.email)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (!existingMember) {
        return {
          success: false,
          error: 'No user found with this email address. They must create an account first.',
        };
      }

      // 2. Check if already a team member
      const { data: existingTeamMember } = await supabase
        .from('body_members')
        .select('id')
        .eq('body_id', bodyId)
        .eq('member_id', existingMember.id)
        .eq('is_active', true)
        .single();

      if (existingTeamMember) {
        return {
          success: false,
          error: 'This user is already a team member',
        };
      }

      // 3. Add to team
      const { data, error } = await supabase
        .from('body_members')
        .insert([
          {
            body_id: bodyId,
            member_id: existingMember.id,
            role: inviteData.role || 'member',
            title: inviteData.title || null,
            can_post: inviteData.can_post || false,
            can_respond: inviteData.can_respond || false,
            can_manage_members: inviteData.can_manage_members || false,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        member: data,
      };
    } catch (error) {
      console.error('Error inviting member:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update team member permissions
   */
  async updateMemberPermissions(bodyId, memberId, permissions) {
    try {
      const { data, error } = await supabase
        .from('body_members')
        .update({
          role: permissions.role,
          can_post: permissions.can_post,
          can_respond: permissions.can_respond,
          can_manage_members: permissions.can_manage_members,
        })
        .eq('body_id', bodyId)
        .eq('member_id', memberId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        member: data,
      };
    } catch (error) {
      console.error('Error updating member permissions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Alias for removeBodyMember (for consistency with team screen)
   */
  async removeMember(bodyId, memberId) {
    return this.removeBodyMember(bodyId, memberId);
  },
};
