// screens/inbox/InboxScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { MessagingService } from '../../utils/messagingService';

const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

export default function InboxScreen({ user, profile }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    const convos = await MessagingService.getUserConversations(user.id);

    const enrichedConvos = await Promise.all(
      convos.map(async (convo) => {
        const otherId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;
        const otherType = convo.participant_1 === user.id ? convo.participant_2_type : convo.participant_1_type;

        let name = 'Unknown';
        let avatar = '?';

        if (otherType === 'member') {
          const { data } = await supabase.from('members').select('full_name').eq('id', otherId).single();
          name = data?.full_name || 'Member';
          avatar = name.charAt(0).toUpperCase();
        } else if (otherType === 'lawyer') {
          const { data } = await supabase.from('lawyers').select('full_name').eq('user_id', otherId).single();
          name = data?.full_name || 'Lawyer';
          avatar = name.charAt(0).toUpperCase();
        } else if (otherType === 'body') {
          const { data } = await supabase.from('bodies').select('name').eq('user_id', otherId).single();
          name = data?.name || 'Body';
          avatar = name.charAt(0).toUpperCase();
        }

        return {
          ...convo,
          name,
          avatar,
          lastMessage: convo.last_message || 'No messages yet',
          time: new Date(convo.last_message_at).toLocaleDateString(),
          unread: 0,
        };
      })
    );

    setConversations(enrichedConvos);
    setLoading(false);
  };

  const loadMessages = async (conversationId, convo) => {
    const msgs = await MessagingService.getConversationMessages(conversationId);

    const formattedMessages = msgs.map((msg) => ({
      id: msg.id,
      sender: msg.sender_id === user.id ? 'You' : convo.name,
      text: msg.message_text,
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: msg.sender_id === user.id,
      isSecure: true,
    }));

    setMessages(formattedMessages);

    await MessagingService.markMessagesAsRead(conversationId, user.id);

    const otherId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;
    const otherType = convo.participant_1 === user.id ? convo.participant_2_type : convo.participant_1_type;
    setOtherParticipant({ id: otherId, type: otherType, name: convo.name, avatar: convo.avatar });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const message = await MessagingService.sendMessage(
      selectedConversation.id,
      user.id,
      profile.role || 'member',
      messageText
    );

    if (message) {
      const newMessage = {
        id: message.id,
        sender: 'You',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        isSecure: true,
      };

      setMessages([...messages, newMessage]);
      setMessageText('');
      loadConversations();
    }
  };

  // CHAT VIEW (Keep blue header for conversation)
  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.container}>
          {/* Chat Header (Blue) */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.chatHeaderAvatar}>
              <Text style={styles.chatHeaderAvatarText}>{selectedConversation.avatar}</Text>
            </View>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{selectedConversation.name}</Text>
              <View style={styles.secureStatusContainer}>
                <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.chatHeaderStatus}>End-to-end encrypted</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[styles.messageWrapper, message.isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}
              >
                {!message.isMe && (
                  <View style={styles.messageAvatar}>
                    <Text style={styles.messageAvatarText}>{selectedConversation.avatar}</Text>
                  </View>
                )}

                <View style={[styles.messageBubble, message.isMe ? styles.myMessage : styles.theirMessage]}>
                  <Text style={[styles.messageText, message.isMe && styles.myMessageText]}>{message.text}</Text>

                  <View style={styles.messageFooter}>
                    {message.isSecure && (
                      <Ionicons name="lock-closed" size={10} color={message.isMe ? 'rgba(255,255,255,0.6)' : COLORS.mediumGray} />
                    )}
                    <Text style={[styles.messageTime, message.isMe && styles.myMessageTime]}>{message.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="happy-outline" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>

            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              placeholderTextColor={COLORS.mediumGray}
            />

            <TouchableOpacity 
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSendMessage} 
              disabled={!messageText.trim()}
            >
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // INBOX LIST VIEW (Clean white header)
  return (
    <SafeAreaView style={styles.safeAreaWhite}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* CLEAN WHITE HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="search-outline" size={22} color={COLORS.darkGray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="create-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Conversations List */}
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationCard}
              onPress={() => {
                setSelectedConversation(item);
                loadMessages(item.id, item);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.conversationAvatar}>
                <Text style={styles.conversationAvatarText}>{item.avatar}</Text>
              </View>

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.conversationTime}>{item.time}</Text>
                </View>
                <View style={styles.messageRow}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.mediumGray} />
                  <Text style={styles.conversationMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
              </View>

              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={loadConversations} 
              colors={[COLORS.primary]} 
              tintColor={COLORS.primary} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptyText}>
                Start a conversation with organizations or lawyers to collaborate on petitions
              </Text>
              <TouchableOpacity style={styles.startChatButton}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.startChatButtonText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeAreaWhite: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // CLEAN WHITE HEADER
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },

  // Conversation Card
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: 'center',
    gap: 12,
  },
  conversationAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationAvatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conversationMessage: {
    fontSize: 14,
    color: COLORS.mediumGray,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  startChatButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // CHAT HEADER (Keep Blue)
  chatHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
  secureStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  moreButton: {
    padding: 4,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.darkGray,
  },
  myMessageText: {
    color: COLORS.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 8,
  },
  attachButton: {
    padding: 6,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: COLORS.darkGray,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
