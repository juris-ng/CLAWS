import { supabase } from '../supabase';

export class MessagingService {
  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(user1Id, user1Type, user2Id, user2Type) {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${user1Id},participant_2.eq.${user2Id}),and(participant_1.eq.${user2Id},participant_2.eq.${user1Id})`)
      .single();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert([{
        participant_1: user1Id,
        participant_1_type: user1Type,
        participant_2: user2Id,
        participant_2_type: user2Type,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return newConversation;
  }

  /**
   * Send a message
   */
  static async sendMessage(conversationId, senderId, senderType, messageText, attachmentUrl = null) {
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        message_text: messageText,
        attachment_url: attachmentUrl,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return message;
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    return data || [];
  }

  /**
   * Get messages in a conversation
   */
  static async getConversationMessages(conversationId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return data || [];
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId, userId) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(userId) {
    // Get user's conversations
    const conversations = await this.getUserConversations(userId);
    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) return 0;

    // Count unread messages
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', userId);

    return count || 0;
  }
}
