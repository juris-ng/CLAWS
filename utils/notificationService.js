import { supabase } from '../supabase';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================
export const NOTIFICATION_TYPES = {
  // Petition Notifications
  PETITION_SIGNED: 'petition_signed',
  PETITION_MILESTONE: 'petition_milestone',
  PETITION_UPDATE: 'petition_update',
  PETITION_SUCCESS: 'petition_success',
  PETITION_COMMENT: 'petition_comment',
  PETITION_SHARED: 'petition_shared',

  // Social Notifications
  NEW_FOLLOWER: 'new_follower',
  COMMENT_REPLY: 'comment_reply',
  COMMENT_LIKE: 'comment_like',
  MENTION: 'mention',

  // Gamification Notifications
  LEVEL_UP: 'level_up',
  BADGE_EARNED: 'badge_earned',
  POINTS_AWARDED: 'points_awarded',
  LEADERBOARD_RANK: 'leaderboard_rank',

  // Legal Notifications
  CASE_UPDATE: 'case_update',
  CONSULTATION_BOOKED: 'consultation_booked',
  CONSULTATION_REMINDER: 'consultation_reminder',
  LAWYER_INVITATION: 'lawyer_invitation',
  LAWYER_RESPONSE: 'lawyer_response',

  // Body/Organization Notifications
  BODY_INVITATION: 'body_invitation',
  BODY_POST: 'body_post',
  BODY_UPDATE: 'body_update',
  PARTNERSHIP_REQUEST: 'partnership_request',

  // System Notifications
  ACCOUNT_VERIFIED: 'account_verified',
  APPEAL_STATUS: 'appeal_status',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  SECURITY_ALERT: 'security_alert',

  // Messages
  NEW_MESSAGE: 'new_message',
  MESSAGE_REPLY: 'message_reply',
};

// ============================================================================
// NOTIFICATION ICONS
// ============================================================================
export const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.PETITION_SIGNED]: '✍️',
  [NOTIFICATION_TYPES.PETITION_MILESTONE]: '🎯',
  [NOTIFICATION_TYPES.PETITION_UPDATE]: '📝',
  [NOTIFICATION_TYPES.PETITION_SUCCESS]: '🎉',
  [NOTIFICATION_TYPES.PETITION_COMMENT]: '💬',
  [NOTIFICATION_TYPES.NEW_FOLLOWER]: '👤',
  [NOTIFICATION_TYPES.LEVEL_UP]: '⬆️',
  [NOTIFICATION_TYPES.BADGE_EARNED]: '🏆',
  [NOTIFICATION_TYPES.CASE_UPDATE]: '⚖️',
  [NOTIFICATION_TYPES.CONSULTATION_BOOKED]: '📅',
  [NOTIFICATION_TYPES.NEW_MESSAGE]: '✉️',
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: '📢',
};

// ============================================================================
// NOTIFICATION PRIORITIES
// ============================================================================
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
export const NotificationService = {
  /**
   * Create a notification
   */
  createNotification: async (config) => {
    try {
      const {
        userId,
        userType = 'member',
        type,
        title,
        message,
        referenceId = null,
        referenceType = null,
        priority = NOTIFICATION_PRIORITY.MEDIUM,
        data = {},
        icon = null,
      } = config;

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            user_type: userType,
            notification_type: type,
            title,
            message,
            reference_id: referenceId,
            reference_type: referenceType,
            priority,
            data,
            icon: icon || NOTIFICATION_ICONS[type] || '🔔',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, notification };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create bulk notifications
   */
  createBulkNotifications: async (notifications) => {
    try {
      const notificationData = notifications.map((notif) => ({
        user_id: notif.userId,
        user_type: notif.userType || 'member',
        notification_type: notif.type,
        title: notif.title,
        message: notif.message,
        reference_id: notif.referenceId || null,
        reference_type: notif.referenceType || null,
        priority: notif.priority || NOTIFICATION_PRIORITY.MEDIUM,
        data: notif.data || {},
        icon: notif.icon || NOTIFICATION_ICONS[notif.type] || '🔔',
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) throw error;

      return { success: true, notifications: data };
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user notifications
   */
  getUserNotifications: async (userId, options = {}) => {
    try {
      const {
        limit = 50,
        offset = 0,
        unreadOnly = false,
        type = null,
        priority = null,
      } = options;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type) {
        query = query.eq('notification_type', type);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { success: true, notifications: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: error.message, notifications: [], total: 0 };
    }
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (userId) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: error.message, count: 0 };
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: async (notificationIds) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking multiple as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete multiple notifications
   */
  deleteMultipleNotifications: async (notificationIds) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear all read notifications
   */
  clearReadNotifications: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications: (userId, callback) => {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  // ============================================================================
  // SPECIFIC NOTIFICATION HELPERS
  // ============================================================================

  /**
   * Notify petition signers of update
   */
  notifyPetitionUpdate: async (petitionId, updateType, updateMessage) => {
    try {
      // Get petition details
      const { data: petition, error: petitionError } = await supabase
        .from('petitions')
        .select('title, member_id')
        .eq('id', petitionId)
        .single();

      if (petitionError) throw petitionError;

      // Get all signers except creator
      const { data: signatures, error: signaturesError } = await supabase
        .from('petition_signatures')
        .select('member_id')
        .eq('petition_id', petitionId)
        .neq('member_id', petition.member_id);

      if (signaturesError) throw signaturesError;

      const uniqueSigners = [...new Set(signatures.map((s) => s.member_id))];

      // Create notifications for all signers
      const notifications = uniqueSigners.map((signerId) => ({
        userId: signerId,
        userType: 'member',
        type: NOTIFICATION_TYPES.PETITION_UPDATE,
        title: 'Petition Update',
        message: updateMessage || `"${petition.title}" has been ${updateType}`,
        referenceId: petitionId,
        referenceType: 'petition',
        priority: NOTIFICATION_PRIORITY.MEDIUM,
      }));

      return await NotificationService.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Error notifying petition update:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify petition milestone
   */
  notifyPetitionMilestone: async (petitionId, milestone) => {
    try {
      const { data: petition, error } = await supabase
        .from('petitions')
        .select('title, member_id')
        .eq('id', petitionId)
        .single();

      if (error) throw error;

      return await NotificationService.createNotification({
        userId: petition.member_id,
        type: NOTIFICATION_TYPES.PETITION_MILESTONE,
        title: '🎯 Milestone Reached!',
        message: `Your petition "${petition.title}" reached ${milestone} signatures!`,
        referenceId: petitionId,
        referenceType: 'petition',
        priority: NOTIFICATION_PRIORITY.HIGH,
        data: { milestone },
      });
    } catch (error) {
      console.error('Error notifying milestone:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify new follower
   */
  notifyNewFollower: async (userId, followerId, followerName) => {
    try {
      return await NotificationService.createNotification({
        userId,
        type: NOTIFICATION_TYPES.NEW_FOLLOWER,
        title: 'New Follower',
        message: `${followerName} started following you`,
        referenceId: followerId,
        referenceType: 'user',
        priority: NOTIFICATION_PRIORITY.LOW,
      });
    } catch (error) {
      console.error('Error notifying new follower:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify new comment
   */
  notifyNewComment: async (petitionId, commenterId, commenterName, commentText) => {
    try {
      const { data: petition, error } = await supabase
        .from('petitions')
        .select('member_id, title')
        .eq('id', petitionId)
        .single();

      if (error) throw error;

      // Don't notify if commenting on own petition
      if (petition.member_id === commenterId) {
        return { success: true, skipped: true };
      }

      return await NotificationService.createNotification({
        userId: petition.member_id,
        type: NOTIFICATION_TYPES.PETITION_COMMENT,
        title: 'New Comment',
        message: `${commenterName} commented on "${petition.title}"`,
        referenceId: petitionId,
        referenceType: 'petition',
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        data: { comment_preview: commentText.substring(0, 100) },
      });
    } catch (error) {
      console.error('Error notifying new comment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify case update
   */
  notifyCaseUpdate: async (caseId, memberId, updateMessage) => {
    try {
      return await NotificationService.createNotification({
        userId: memberId,
        type: NOTIFICATION_TYPES.CASE_UPDATE,
        title: 'Case Update',
        message: updateMessage,
        referenceId: caseId,
        referenceType: 'case',
        priority: NOTIFICATION_PRIORITY.HIGH,
      });
    } catch (error) {
      console.error('Error notifying case update:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify consultation reminder
   */
  notifyConsultationReminder: async (consultationId, memberId, lawyerName, dateTime) => {
    try {
      return await NotificationService.createNotification({
        userId: memberId,
        type: NOTIFICATION_TYPES.CONSULTATION_REMINDER,
        title: 'Consultation Reminder',
        message: `Your consultation with ${lawyerName} is scheduled for ${dateTime}`,
        referenceId: consultationId,
        referenceType: 'consultation',
        priority: NOTIFICATION_PRIORITY.URGENT,
      });
    } catch (error) {
      console.error('Error notifying consultation reminder:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify system announcement
   */
  notifySystemAnnouncement: async (userIds, title, message) => {
    try {
      const notifications = userIds.map((userId) => ({
        userId,
        type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        priority: NOTIFICATION_PRIORITY.HIGH,
      }));

      return await NotificationService.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Error sending system announcement:', error);
      return { success: false, error: error.message };
    }
  },
};
