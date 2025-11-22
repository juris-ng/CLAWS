// utils/bodyContentService.js
import { supabase } from '../supabase';

export class BodyContentService {
  /**
   * Create new content for a body
   */
  static async createContent(contentData) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: bodyData, error: bodyError } = await supabase
        .from('bodies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (bodyError || !bodyData) {
        return { success: false, error: 'User does not have an associated body' };
      }

      const { data, error } = await supabase
        .from('body_content')
        .insert({
          body_id: bodyData.id,
          created_by: user.id,
          content_type: contentData.content_type,
          title: contentData.title,
          content: contentData.content,
          category: contentData.category || null,
          visibility: contentData.visibility || 'public',
          location: contentData.location || null,
          event_date: contentData.event_date || null,
          start_date: contentData.start_date || null,
          end_date: contentData.end_date || null,
        })
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url,
            body_type
          )
        `)
        .single();

      if (error) {
        console.error('Error creating content:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create content error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get content for a specific body with visibility filtering
   */
  static async getBodyContent(bodyId, userId = null, isBodyOwner = false) {
    try {
      let query = supabase
        .from('body_content')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url,
            body_type
          )
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      // Visibility filtering logic
      if (isBodyOwner) {
        // Body owner sees everything
      } else if (userId) {
        // Check if user is a member (WITHOUT status column)
        const { data: membership, error: memberError } = await supabase
          .from('body_members')
          .select('id')
          .eq('body_id', bodyId)
          .eq('user_id', userId)
          .maybeSingle();

        if (memberError) {
          console.error('Error checking membership:', memberError);
        }

        if (membership) {
          // Member sees public + followers content
          query = query.in('visibility', ['public', 'followers']);
        } else {
          // Non-member sees only public
          query = query.eq('visibility', 'public');
        }
      } else {
        // Unauthenticated users see only public
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching body content:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get body content error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get all content visible to a member across all bodies they follow
   */
  static async getMemberFeed(userId) {
    try {
      const { data: memberships, error: memberError } = await supabase
        .from('body_members')
        .select('body_id')
        .eq('user_id', userId);

      if (memberError) {
        console.error('Error fetching memberships:', memberError);
        throw memberError;
      }

      if (!memberships || memberships.length === 0) {
        return { success: true, data: [] };
      }

      const bodyIds = memberships.map((m) => m.body_id);

      const { data, error } = await supabase
        .from('body_content')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url,
            body_type
          )
        `)
        .in('body_id', bodyIds)
        .in('visibility', ['public', 'followers'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching member feed:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get member feed error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get public content from all bodies
   */
  static async getPublicContent(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('body_content')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url,
            body_type,
            is_verified
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching public content:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get public content error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get all content by type for a body
   */
  static async getContentByType(bodyId, contentType, userId = null, isBodyOwner = false) {
    try {
      let query = supabase
        .from('body_content')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url,
            body_type
          )
        `)
        .eq('body_id', bodyId)
        .eq('content_type', contentType)
        .order('created_at', { ascending: false });

      // Apply visibility filtering
      if (isBodyOwner) {
        // Body owner sees everything
      } else if (userId) {
        const { data: membership } = await supabase
          .from('body_members')
          .select('id')
          .eq('body_id', bodyId)
          .eq('user_id', userId)
          .maybeSingle();

        if (membership) {
          query = query.in('visibility', ['public', 'followers']);
        } else {
          query = query.eq('visibility', 'public');
        }
      } else {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching content by type:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get content by type error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get a single content item by ID
   */
  static async getContentById(contentId, userId = null) {
    try {
      const { data, error } = await supabase
        .from('body_content')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url,
            body_type,
            user_id
          )
        `)
        .eq('id', contentId)
        .single();

      if (error) {
        console.error('Error fetching content:', error);
        throw error;
      }

      if (!data) {
        return { success: false, error: 'Content not found' };
      }

      const isBodyOwner = userId && data.bodies.user_id === userId;

      if (data.visibility === 'private' && !isBodyOwner) {
        return { success: false, error: 'You do not have permission to view this content' };
      }

      if (data.visibility === 'followers' && !isBodyOwner) {
        const { data: membership } = await supabase
          .from('body_members')
          .select('id')
          .eq('body_id', data.body_id)
          .eq('user_id', userId)
          .maybeSingle();

        if (!membership) {
          return { success: false, error: 'You must be a member to view this content' };
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get content by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update existing content
   */
  static async updateContent(contentId, updateData, userId) {
    try {
      const { data: content, error: contentError } = await supabase
        .from('body_content')
        .select('body_id, bodies!inner(user_id)')
        .eq('id', contentId)
        .single();

      if (contentError || !content) {
        return { success: false, error: 'Content not found' };
      }

      if (content.bodies.user_id !== userId) {
        return { success: false, error: 'You do not have permission to update this content' };
      }

      const { data, error } = await supabase
        .from('body_content')
        .update(updateData)
        .eq('id', contentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating content:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update content error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete content
   */
  static async deleteContent(contentId, userId) {
    try {
      const { data: content, error: contentError } = await supabase
        .from('body_content')
        .select('body_id, bodies!inner(user_id)')
        .eq('id', contentId)
        .single();

      if (contentError || !content) {
        return { success: false, error: 'Content not found' };
      }

      if (content.bodies.user_id !== userId) {
        return { success: false, error: 'You do not have permission to delete this content' };
      }

      const { error } = await supabase.from('body_content').delete().eq('id', contentId);

      if (error) {
        console.error('Error deleting content:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Delete content error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get content stats for a body
   */
  static async getContentStats(bodyId) {
    try {
      const { data, error } = await supabase
        .from('body_content')
        .select('content_type, visibility')
        .eq('body_id', bodyId);

      if (error) {
        console.error('Error fetching content stats:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        announcements: data.filter((c) => c.content_type === 'announcement').length,
        projects: data.filter((c) => c.content_type === 'project').length,
        events: data.filter((c) => c.content_type === 'event').length,
        discussions: data.filter((c) => c.content_type === 'discussion').length,
        public: data.filter((c) => c.visibility === 'public').length,
        followers: data.filter((c) => c.visibility === 'followers').length,
        private: data.filter((c) => c.visibility === 'private').length,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get content stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's notifications
   */
  static async getNotifications(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadNotificationCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Get unread notification count error:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  /**
   * Get user's inbox messages
   */
  static async getInboxMessages(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select(`
          *,
          bodies!inner(
            id,
            name,
            logo_url
          ),
          body_content!inner(
            id,
            title,
            content,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching inbox messages:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get inbox messages error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Mark inbox message as read
   */
  static async markInboxMessageAsRead(messageId) {
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Mark inbox message as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread inbox message count
   */
  static async getUnreadInboxCount(userId) {
    try {
      const { count, error } = await supabase
        .from('inbox_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread inbox count:', error);
        throw error;
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Get unread inbox count error:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }
}
