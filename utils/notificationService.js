import { supabase } from '../supabase';

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(userId, userType, type, title, message, referenceId = null, referenceType = null) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        user_type: userType,
        notification_type: type,
        title: title,
        message: message,
        reference_id: referenceId,
        reference_type: referenceType,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, limit = 50) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return count || 0;
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId) {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
  }

  /**
   * Notify petition update
   */
  static async notifyPetitionUpdate(petitionId, petitionTitle, updateType) {
    // Get all users who voted on this petition
    const { data: votes } = await supabase
      .from('votes')
      .select('member_id')
      .eq('petition_id', petitionId);

    if (!votes || votes.length === 0) return;

    const userIds = [...new Set(votes.map(v => v.member_id))];

    // Create notifications
    for (const userId of userIds) {
      await this.createNotification(
        userId,
        'member',
        'petition_update',
        'Petition Update',
        `"${petitionTitle}" has been ${updateType}`,
        petitionId,
        'petition'
      );
    }
  }

  /**
   * Notify new comment
   */
  static async notifyNewComment(petitionId, commenterId, commenterName) {
    // Get petition creator
    const { data: petition } = await supabase
      .from('petitions')
      .select('member_id, title')
      .eq('id', petitionId)
      .single();

    if (!petition || petition.member_id === commenterId) return;

    await this.createNotification(
      petition.member_id,
      'member',
      'comment',
      'New Comment',
      `${commenterName} commented on your petition "${petition.title}"`,
      petitionId,
      'petition'
    );
  }

  /**
   * Notify lawyer invitation
   */
  static async notifyLawyerInvitation(lawyerId, petitionTitle, inviterName) {
    await this.createNotification(
      lawyerId,
      'lawyer',
      'invitation',
      'New Invitation',
      `${inviterName} invited you to support "${petitionTitle}"`,
      lawyerId,
      'invitation'
    );
  }
}
