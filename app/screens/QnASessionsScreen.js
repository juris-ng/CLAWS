import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BodyMemberService } from '../../utils/bodyMemberService';


const QnASessionsScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;


  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const filters = [
    { value: 'all', label: 'All', icon: '💬' },
    { value: 'scheduled', label: 'Upcoming', icon: '📅' },
    { value: 'live', label: 'Live', icon: '🔴' },
    { value: 'ended', label: 'Past', icon: '✅' }
  ];


  useEffect(() => {
    loadSessions();
  }, [bodyId, filter]);


  const loadSessions = async () => {
    try {
      const statusFilter = filter === 'all' ? null : filter;
      const result = await BodyMemberService.getQnASessions(bodyId, statusFilter);
      if (result.success) {
        setSessions(result.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };


  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'live': return '#F44336';
      case 'scheduled': return '#4CAF50';
      case 'ended': return '#9E9E9E';
      case 'cancelled': return '#FF9800';
      default: return '#666666';
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


  const renderSession = ({ item }) => {
    const statusColor = getSessionStatusColor(item.status);
    const isLive = item.status === 'live';


    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => navigation.navigate('QnASessionDetail', { 
          sessionId: item.id,
          bodyId 
        })}
      >
        <View style={styles.sessionHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {isLive && '🔴 '}
              {item.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.session_type === 'live' ? '📹 LIVE' : '💬 ASYNC'}
            </Text>
          </View>
        </View>


        <Text style={styles.sessionTitle}>{item.title}</Text>


        {item.description && (
          <Text style={styles.sessionDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}


        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {new Date(item.scheduled_start).toLocaleDateString()} at{' '}
              {new Date(item.scheduled_start).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>


          {item.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}


          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>
              {item.current_participants || 0}
              {item.max_participants && ` / ${item.max_participants}`} participants
            </Text>
          </View>
        </View>


        {item.body && (
          <View style={styles.bodyInfo}>
            <Text style={styles.bodyLabel}>Hosted by:</Text>
            <Text style={styles.bodyName}>{item.body.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
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
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No Q&A sessions</Text>
              <Text style={styles.emptySubtext}>
                Check back for upcoming town halls and Q&A events
              </Text>
            </View>
          }
        />


        {bodyId && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateQnASession', { bodyId })}
          >
            <Text style={styles.createButtonText}>+ Create Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
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
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  typeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  bodyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bodyLabel: {
    fontSize: 13,
    color: '#999999',
    marginRight: 6,
  },
  bodyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
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
  createButton: {
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
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default QnASessionsScreen;
