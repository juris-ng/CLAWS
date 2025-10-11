import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { MessagingService } from '../../utils/messagingService';

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
    
    // Enrich conversations with participant names
    const enrichedConvos = await Promise.all(
      convos.map(async (convo) => {
        const otherId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;
        const otherType = convo.participant_1 === user.id ? convo.participant_2_type : convo.participant_1_type;
        
        let name = 'Unknown';
        let avatar = '?';
        
        // Fetch name based on type
        if (otherType === 'member') {
          const { data } = await supabase.from('members').select('full_name').eq('id', otherId).single();
          name = data?.full_name || 'Member';
          avatar = name.charAt(0).toUpperCase();
        } else if (otherType === 'lawyer') {
          const { data } = await supabase.from('lawyers').select('full_name').eq('user_id', otherId).single();
          name = data?.full_name || 'Lawyer';
          avatar = '⚖️';
        } else if (otherType === 'body') {
          const { data } = await supabase.from('bodies').select('name').eq('user_id', otherId).single();
          name = data?.name || 'Body';
          avatar = '🏢';
        }
        
        return {
          ...convo,
          name,
          avatar,
          lastMessage: convo.last_message || 'No messages yet',
          time: new Date(convo.last_message_at).toLocaleDateString(),
          unread: 0, // TODO: Calculate unread count
        };
      })
    );
    
    setConversations(enrichedConvos);
    setLoading(false);
  };

  const loadMessages = async (conversationId, convo) => {
    const msgs = await MessagingService.getConversationMessages(conversationId);
    
    // Format messages for display
    const formattedMessages = msgs.map(msg => ({
      id: msg.id,
      sender: msg.sender_id === user.id ? 'You' : convo.name,
      text: msg.message_text,
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: msg.sender_id === user.id,
      isSecure: true, // All messages are secure by default
    }));
    
    setMessages(formattedMessages);
    
    // Mark as read
    await MessagingService.markMessagesAsRead(conversationId, user.id);
    
    // Set other participant info
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
      loadConversations(); // Refresh to update last message
    }
  };

  if (selectedConversation) {
    return (
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            onPress={() => setSelectedConversation(null)}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedConversation.name}</Text>
            <Text style={styles.chatHeaderStatus}>Secure messaging</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <ScrollView style={styles.messagesContainer}>
          {messages.map((message) => (
            <View 
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isMe ? styles.myMessageWrapper : styles.theirMessageWrapper
              ]}
            >
              {!message.isMe && (
                <View style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>
                    {selectedConversation.avatar}
                  </Text>
                </View>
              )}
              
              <View style={[
                styles.messageBubble,
                message.isMe ? styles.myMessage : styles.theirMessage
              ]}>
                {!message.isMe && (
                  <Text style={styles.messageSender}>{message.sender}</Text>
                )}
                <Text style={[
                  styles.messageText,
                  message.isMe && styles.myMessageText
                ]}>
                  {message.text}
                </Text>
                
                {message.tags && (
                  <View style={styles.messageTags}>
                    {message.tags.map((tag, index) => (
                      <View 
                        key={index}
                        style={[
                          styles.messageTag,
                          tag === 'Evidence' && styles.evidenceTag,
                          tag === 'Redacted' && styles.redactedTag,
                          tag === 'Highlighted' && styles.highlightedTag
                        ]}
                      >
                        <Text style={styles.messageTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.messageFooter}>
                  {message.isSecure && (
                    <Text style={styles.secureIcon}>🔒</Text>
                  )}
                  {message.isPinned && (
                    <Text style={styles.pinnedIcon}>📌</Text>
                  )}
                  <Text style={[
                    styles.messageTime,
                    message.isMe && styles.myMessageTime
                  ]}>
                    {message.time}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            placeholderTextColor="#8E8E93"
          />
          
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIcon}>🔒</Text>
            <Text style={styles.actionText}>End-to-End Encrypted</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.moreActionsIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0).toUpperCase() || 'M'}
              </Text>
            </View>
          </TouchableOpacity>
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
          >
            <View style={styles.conversationAvatar}>
              <Text style={styles.conversationAvatarText}>{item.avatar}</Text>
            </View>
            
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{item.name}</Text>
                <Text style={styles.conversationTime}>{item.time}</Text>
              </View>
              <Text style={styles.conversationMessage} numberOfLines={2}>
                {item.lastMessage}
              </Text>
            </View>
            
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadConversations} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptyText}>
              Start a conversation with a body or lawyer to collaborate on petitions
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    padding: 5,
  },
  notificationIcon: {
    fontSize: 24,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  conversationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#0066FF',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatHeaderStatus: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 2,
  },
  moreButton: {
    padding: 5,
  },
  moreIcon: {
    fontSize: 24,
    color: '#8E8E93',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#3C3C43',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3C3C43',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  messageTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  evidenceTag: {
    backgroundColor: '#34C759',
  },
  redactedTag: {
    backgroundColor: '#FF3B30',
  },
  highlightedTag: {
    backgroundColor: '#FF9500',
  },
  messageTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  secureIcon: {
    fontSize: 10,
  },
  pinnedIcon: {
    fontSize: 10,
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 10,
  },
  attachButton: {
    padding: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 16,
    color: '#fff',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 13,
    color: '#3C3C43',
    fontWeight: '600',
  },
  moreActionsIcon: {
    fontSize: 20,
    color: '#8E8E93',
  },
});
