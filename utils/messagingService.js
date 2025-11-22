import { supabase } from '../supabase';
import { NotificationService } from './notificationService';

// ============================================================================
// MESSAGE TYPES
// ============================================================================
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  LOCATION: 'location',
  SYSTEM: 'system',
};

// ============================================================================
// CONVERSATION STATUS
// ============================================================================
export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  BLOCKED: 'blocked',
  DELETED: 'deleted',
};

// ============================================================================
// MESSAGING SERVICE
// ============================================================================
export const MessagingService = {
  /**
   * Get or create a conversation between two users
   */
  getOrCreateConversation: async (user1Id, user1Type, user2Id, user2Type) => {
    try {
      // Check if conversation exists (both participant orders)
      const { data: existing, error: existingError } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(participant_1.eq.${user1Id},participant_2.eq.${user2Id}),and(participant_1.eq.${user2Id},participant_2.eq.${user1Id})`
        )
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        return { success: true, conversation: existing };
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert([
          {
            participant_1: user1Id,
            participant_1_type: user1Type || 'member',
            participant_2: user2Id,
            participant_2_type: user2Type || 'member',
            status: CONVERSATION_STATUS.ACTIVE,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, conversation: newConversation };
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send a message
   */
  sendMessage: async (config) => {
    try {
      const {
        conversationId,
        senderId,
        senderType = 'member',
        messageText,
        messageType = MESSAGE_TYPES.TEXT,
        attachmentUrl = null,
        metadata = {},
        replyToId = null,
      } = config;

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            sender_type: senderType,
            message_text: messageText,
            message_type: messageType,
            attachment_url: attachmentUrl,
            metadata,
            reply_to_id: replyToId,
          },
        ])
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          last_message_type: messageType,
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      // Get recipient ID
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_1, participant_2')
        .eq('id', conversationId)
        .single();

      const recipientId =
        conversation.participant_1 === senderId ? conversation.participant_2 : conversation.participant_1;

      // Send notification
      await NotificationService.createNotification({
        userId: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: messageText.substring(0, 100),
        referenceId: conversationId,
        referenceType: 'conversation',
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user conversations with pagination
   */
  getUserConversations: async (userId, options = {}) => {
    try {
      const { limit = 50, offset = 0, status = CONVERSATION_STATUS.ACTIVE } = options;

      let query = supabase
        .from('conversations')
        .select(
          `
          *,
          participant_1_data:members!conversations_participant_1_fkey(id, full_name, email, avatar_url, is_anonymous, anonymous_display_name),
          participant_2_data:members!conversations_participant_2_fkey(id, full_name, email, avatar_url, is_anonymous, anonymous_display_name),
          unread_count:messages!messages_conversation_id_fkey(count)
        `,
          { count: 'exact' }
        )
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Format conversations
      const formattedData = (data || []).map((conv) => {
        const isParticipant1 = conv.participant_1 === userId;
        const otherParticipant = isParticipant1 ? conv.participant_2_data : conv.participant_1_data;

        return {
          ...conv,
          otherParticipant,
          otherParticipantName: MessagingService.getDisplayName(otherParticipant),
          otherParticipantAvatar: otherParticipant?.avatar_url,
          isOnline: false, // TODO: Add online status
        };
      });

      return { success: true, conversations: formattedData, total: count || 0 };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return { success: false, error: error.message, conversations: [], total: 0 };
    }
  },

  /**
   * Get messages in a conversation with pagination
   */
  getConversationMessages: async (conversationId, options = {}) => {
    try {
      const { limit = 50, offset = 0, beforeDate = null } = options;

      let query = supabase
        .from('messages')
        .select(
          `
          *,
          sender:members!messages_sender_id_fkey(id, full_name, email, avatar_url, is_anonymous, anonymous_display_name),
          reply_to:messages!messages_reply_to_id_fkey(id, message_text, sender_id),
          reactions:message_reactions(*)
        `,
          { count: 'exact' }
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (beforeDate) {
        query = query.lt('created_at', beforeDate);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Format messages
      const formattedData = (data || []).map((msg) => ({
        ...msg,
        senderDisplayName: MessagingService.getDisplayName(msg.sender),
        senderAvatar: msg.sender?.avatar_url,
      }));

      return { success: true, messages: formattedData, total: count || 0 };
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return { success: false, error: error.message, messages: [], total: 0 };
    }
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (conversationId, userId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (userId) => {
    try {
      // Get user's active conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('status', CONVERSATION_STATUS.ACTIVE);

      if (convError) throw convError;

      const conversationIds = (conversations || []).map((c) => c.id);

      if (conversationIds.length === 0) {
        return { success: true, count: 0 };
      }

      // Count unread messages
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (countError) throw countError;

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, count: 0, error: error.message };
    }
  },

  /**
   * Delete a message (soft delete)
   */
  deleteMessage: async (messageId, userId) => {
    try {
      // Verify user is sender
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (msgError) throw msgError;

      if (message.sender_id !== userId) {
        return { success: false, error: 'Not authorized to delete this message' };
      }

      // Soft delete
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Archive a conversation
   */
  archiveConversation: async (conversationId, userId) => {
    try {
      // Verify user is a participant
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant_1, participant_2')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      if (conversation.participant_1 !== userId && conversation.participant_2 !== userId) {
        return { success: false, error: 'Not authorized' };
      }

      const { error } = await supabase
        .from('conversations')
        .update({ status: CONVERSATION_STATUS.ARCHIVED })
        .eq('id', conversationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Unarchive a conversation
   */
  unarchiveConversation: async (conversationId) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: CONVERSATION_STATUS.ACTIVE })
        .eq('id', conversationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Block a conversation
   */
  blockConversation: async (conversationId, userId) => {
    try {
      // Verify user is a participant
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant_1, participant_2')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      if (conversation.participant_1 !== userId && conversation.participant_2 !== userId) {
        return { success: false, error: 'Not authorized' };
      }

      const { error } = await supabase
        .from('conversations')
        .update({ status: CONVERSATION_STATUS.BLOCKED })
        .eq('id', conversationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error blocking conversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Search conversations
   */
  searchConversations: async (userId, searchQuery) => {
    try {
      const { conversations } = await MessagingService.getUserConversations(userId);

      const filtered = conversations.filter((conv) =>
        conv.otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return { success: true, conversations: filtered };
    } catch (error) {
      console.error('Error searching conversations:', error);
      return { success: false, conversations: [], error: error.message };
    }
  },

  /**
   * Search messages within a conversation
   */
  searchMessages: async (conversationId, searchQuery) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .ilike('message_text', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return { success: true, messages: data || [] };
    } catch (error) {
      console.error('Error searching messages:', error);
      return { success: false, messages: [], error: error.message };
    }
  },

  /**
   * Add reaction to message
   */
  addReaction: async (messageId, userId, reaction) => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .insert([
          {
            message_id: messageId,
            user_id: userId,
            reaction,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, reaction: data };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove reaction from message
   */
  removeReaction: async (messageId, userId, reaction) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('reaction', reaction);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update typing status
   */
  updateTypingStatus: async (conversationId, userId, isTyping) => {
    try {
      const { error } = await supabase.from('typing_indicators').upsert(
        [
          {
            conversation_id: conversationId,
            user_id: userId,
            is_typing: isTyping,
            last_activity: new Date().toISOString(),
          },
        ],
        { onConflict: 'conversation_id,user_id' }
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating typing status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Subscribe to real-time messages
   */
  subscribeToMessages: (conversationId, callback) => {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping: (conversationId, callback) => {
    const subscription = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Unsubscribe from channel
   */
  unsubscribe: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  /**
   * Get display name for user (respects anonymous mode)
   */
  getDisplayName: (user) => {
    if (!user) return 'Unknown User';
    if (user.is_anonymous && user.anonymous_display_name) {
      return user.anonymous_display_name;
    }
    return user.full_name || user.email || 'Unknown User';
  },
};

// Export as default for backwards compatibility
export default MessagingService;
