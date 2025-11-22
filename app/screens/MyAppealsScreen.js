import { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { DecisionReviewService } from '../../utils/decisionReviewService';

const MyAppealsScreen = ({ navigation }) => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      const result = await DecisionReviewService.getUserAppeals();
      if (result.success) {
        setAppeals(result.appeals);
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppeals();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'under_review': return '#2196F3';
      case 'upheld': return '#F44336';
      case 'overturned': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'under_review': return '🔍';
      case 'upheld': return '❌';
      case 'overturned': return '✅';
      case 'rejected': return '🚫';
      default: return '📋';
    }
  };

  const renderAppeal = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <View style={styles.appealCard}>
        <View style={styles.appealHeader}>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
          <View style={styles.appealInfo}>
            <Text style={[styles.status, { color: statusColor }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.decisionType}>
              Appeal for: {item.decision?.decision_type}
            </Text>
          </View>
        </View>

        <Text style={styles.appealReason} numberOfLines={3}>
          {item.appeal_reason}
        </Text>

        {item.admin_response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Admin Response:</Text>
            <Text style={styles.responseText}>{item.admin_response}</Text>
            {item.reviewed_by_user && (
              <Text style={styles.reviewedBy}>
                Reviewed by: {item.reviewed_by_user.full_name}
              </Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.date}>
            Submitted: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.reviewed_at && (
            <Text style={styles.reviewedDate}>
              Reviewed: {new Date(item.reviewed_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appeals</Text>
        <Text style={styles.headerSubtitle}>
          Track your decision appeals
        </Text>
      </View>

      <FlatList
        data={appeals}
        renderItem={renderAppeal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No appeals yet</Text>
            <Text style={styles.emptySubtext}>
              Your decision appeals will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066FF',
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  listContent: {
    padding: 16,
  },
  appealCard: {
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
  appealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  appealInfo: {
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  decisionType: {
    fontSize: 13,
    color: '#666666',
  },
  appealReason: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  responseContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066FF',
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 6,
  },
  responseText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 6,
  },
  reviewedBy: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  reviewedDate: {
    fontSize: 12,
    color: '#666666',
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
});

export default MyAppealsScreen;
