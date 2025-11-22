import { supabase } from '../supabase';

export const BodyDashboardService = {
  /**
   * Get dashboard stats for a body
   */
  getDashboardStats: async (bodyId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_body_dashboard_stats', { target_body_id: bodyId });

      if (error) throw error;
      return { success: true, stats: data || {} };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { success: false, stats: {} };
    }
  },

  /**
   * Create a body post/announcement
   */
  createPost: async (bodyId, postData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_posts')
        .insert({
          body_id: bodyId,
          author_id: user.id,
          title: postData.title,
          content: postData.content,
          post_type: postData.postType || 'announcement',
          visibility: postData.visibility || 'public',
          is_pinned: postData.isPinned || false,
          attachments: postData.attachments || null
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_body_activity', {
        target_body_id: bodyId,
        action_text: 'created_post',
        action_details: { post_id: data.id, title: postData.title }
      });

      return { success: true, post: data };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get body posts (FIXED - without JOIN)
   */
  getBodyPosts: async (bodyId, limit = 20) => {
    try {
      // Fetch posts first
      const { data: posts, error } = await supabase
        .from('body_posts')
        .select('*')
        .eq('body_id', bodyId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // If posts exist, fetch author details separately
      if (posts && posts.length > 0) {
        const authorIds = [...new Set(posts.map(p => p.author_id).filter(Boolean))];
        
        if (authorIds.length > 0) {
          const { data: authors } = await supabase
            .from('members')
            .select('id, full_name, avatar_url')
            .in('id', authorIds);

          // Attach author data to each post
          posts.forEach(post => {
            post.author = authors?.find(a => a.id === post.author_id) || null;
          });
        }
      }

      return { success: true, posts: posts || [] };
    } catch (error) {
      console.error('Error getting posts:', error);
      return { success: false, error: error.message, posts: [] };
    }
  },

  /**
   * Respond to a petition
   */
  respondToPetition: async (bodyId, petitionId, responseData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_responses')
        .insert({
          body_id: bodyId,
          petition_id: petitionId,
          responder_id: user.id,
          response_type: responseData.responseType,
          response_text: responseData.responseText,
          action_plan: responseData.actionPlan || null,
          timeline: responseData.timeline || null,
          attachments: responseData.attachments || null
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_body_activity', {
        target_body_id: bodyId,
        action_text: 'responded_to_petition',
        action_details: { petition_id: petitionId, response_type: responseData.responseType }
      });

      return { success: true, response: data };
    } catch (error) {
      console.error('Error responding to petition:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get petitions directed at body (FIXED - without JOIN)
   */
  getBodyPetitions: async (bodyId, status = 'approved') => {
    try {
      // Fetch petitions first
      const { data: petitions, error } = await supabase
        .from('petitions')
        .select('*')
        .eq('target_body_id', bodyId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If petitions exist, fetch creator details separately
      if (petitions && petitions.length > 0) {
        const memberIds = [...new Set(petitions.map(p => p.member_id).filter(Boolean))];
        
        if (memberIds.length > 0) {
          const { data: members } = await supabase
            .from('members')
            .select('id, full_name, is_anonymous, anonymous_display_name')
            .in('id', memberIds);

          // Attach creator data to each petition
          petitions.forEach(petition => {
            petition.creator = members?.find(m => m.id === petition.member_id) || null;
          });
        }
      }

      return { success: true, petitions: petitions || [] };
    } catch (error) {
      console.error('Error getting body petitions:', error);
      return { success: false, error: error.message, petitions: [] };
    }
  },

  /**
   * Get activity log (FIXED - without JOIN)
   */
  getActivityLog: async (bodyId, limit = 50) => {
    try {
      // Fetch activity log first
      const { data: activities, error } = await supabase
        .from('body_activity_log')
        .select('*')
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // If activities exist, fetch member details separately
      if (activities && activities.length > 0) {
        const memberIds = [...new Set(activities.map(a => a.member_id).filter(Boolean))];
        
        if (memberIds.length > 0) {
          const { data: members } = await supabase
            .from('members')
            .select('id, full_name')
            .in('id', memberIds);

          // Attach member data to each activity
          activities.forEach(activity => {
            activity.member = members?.find(m => m.id === activity.member_id) || null;
          });
        }
      }

      return { success: true, activities: activities || [] };
    } catch (error) {
      console.error('Error getting activity log:', error);
      return { success: false, error: error.message, activities: [] };
    }
  },

  /**
   * Update body settings
   */
  updateSettings: async (bodyId, settings) => {
    try {
      const { error } = await supabase
        .from('body_profiles')
        .update({ settings })
        .eq('id', bodyId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_body_activity', {
        target_body_id: bodyId,
        action_text: 'updated_settings',
        action_details: settings
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get body team members (FIXED - without JOIN)
   */
  getTeamMembers: async (bodyId) => {
    try {
      // Fetch body_members first
      const { data: bodyMembers, error } = await supabase
        .from('body_members')
        .select('*')
        .eq('body_id', bodyId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // If body_members exist, fetch member details separately
      if (bodyMembers && bodyMembers.length > 0) {
        const memberIds = [...new Set(bodyMembers.map(bm => bm.member_id).filter(Boolean))];
        
        if (memberIds.length > 0) {
          const { data: members } = await supabase
            .from('members')
            .select('id, full_name, email, avatar_url')
            .in('id', memberIds);

          // Attach member data to each body_member
          bodyMembers.forEach(bodyMember => {
            bodyMember.member = members?.find(m => m.id === bodyMember.member_id) || null;
          });
        }
      }

      return { success: true, members: bodyMembers || [] };
    } catch (error) {
      console.error('Error getting team members:', error);
      return { success: false, error: error.message, members: [] };
    }
  },

  /**
   * Update team member permissions
   */
  updateMemberPermissions: async (bodyMemberId, permissions) => {
    try {
      const { error } = await supabase
        .from('body_members')
        .update({
          role: permissions.role,
          can_post: permissions.canPost,
          can_respond: permissions.canRespond,
          can_manage_members: permissions.canManageMembers
        })
        .eq('id', bodyMemberId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating member permissions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove team member
   */
  removeMember: async (bodyMemberId) => {
    try {
      const { error } = await supabase
        .from('body_members')
        .delete()
        .eq('id', bodyMemberId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing member:', error);
      return { success: false, error: error.message };
    }
  }
};
