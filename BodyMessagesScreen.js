import { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BodyCollaborationService } from '../../utils/bodyCollaborationService';

const BodyMessagesScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;

  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { value: 'all', label: 'All', icon: '💬' },
    { value: 'inbox', label: 'Inbox', icon: '📥' },
    { value: 'sent', label: 'Sent', icon: '📤' }
  ];

  useEffect(() => {
    loadMessages();
  }, [bodyId, filter]);

  const loadMessages = async () => {
    try {
      const result = await BodyCollaborationService.getMessages(bodyId, filter);
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleMessagePress = async (message) => {
    if (!message.is_read && message.receiver_body_id === bodyId) {
      await BodyCollaborationService.markMessageAsRead(message.id);
    }
    navigation.navigate('MessageDetail', { messageId: message.id, bodyId });
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'partnership_inquiry': return '🤝';
      case 'resource_request': return '📦';
      case 'campaign_invitation': return '🚀';
      default: return '💬';
    }
  };

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filter === item.value && styles.filterChipActive
      ]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[
        styles.filterText,
        filter === item.value && styles.filterTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isInbox = item.receiver_body_id === bodyId;
    const otherBody = isInbox ? item.sender_body : item.receiver_body;
    const typeIcon = getMessageTypeIcon(item.message_type);

    return (
      <TouchableOpacity
        style={[
          styles.messageCard,
          !item.is_read && isInbox && styles.unreadMessage
        ]}
        onPress={() => handleMessagePress(item)}
      >
        <View style={styles.messageHeader}>
          {otherBody?.logo_url ? (
            <Image source={{ uri: otherBody.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>
                {otherBody?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.messageInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.bodyName}>{otherBody?.name}</Text>
              {!item.is_read && isInbox && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.direction}>
              {isInbox ? '📥 From' : '📤 To'}
            </Text>
          </View>
        </View>

        <View style={styles.typeRow}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={styles.messageType}>
            {item.message_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {item.subject && (
          <Text style={styles.subject}>{item.subject}</Text>
        )}

        <Text style={styles.preview} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.senderName}>
            By: {item.sender_member?.full_name}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          renderItem={renderFilter}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages</Text>
            <Text style={styles.emptySubtext}>
              Messages with other organizations will appear here
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.composeButton}
        onPress={() => navigation.navigate('ComposeMessage', { bodyId })}
      >
        <Text style={styles.composeButtonText}>✉️ Compose</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  bodyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  direction: {
    fontSize: 13,
    color: '#666666',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  messageType: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  subject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  senderName: {
    fontSize: 13,
    color: '#999999',
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  composeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  composeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BodyMessagesScreen;
