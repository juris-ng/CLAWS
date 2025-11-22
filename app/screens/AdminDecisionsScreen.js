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
import { DecisionReviewService } from '../../utils/decisionReviewService';


const AdminDecisionsScreen = ({ navigation }) => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadDecisions();
  }, []);


  const loadDecisions = async () => {
    try {
      const result = await DecisionReviewService.getUserDecisions();
      if (result.success) {
        setDecisions(result.decisions);
      }
    } catch (error) {
      console.error('Error loading decisions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadDecisions();
  };


  const handleDecisionPress = (decision) => {
    navigation.navigate('ReviewDecision', { decisionId: decision.id });
  };


  const getDecisionColor = (decisionType) => {
    switch (decisionType) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'suspended': return '#FF9800';
      case 'deleted': return '#F44336';
      case 'warning': return '#FFC107';
      default: return '#9E9E9E';
    }
  };


  const getDecisionIcon = (decisionType) => {
    switch (decisionType) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'suspended': return '⏸️';
      case 'deleted': return '🗑️';
      case 'warning': return '⚠️';
      default: return '📋';
    }
  };


  const getTargetTypeLabel = (targetType) => {
    switch (targetType) {
      case 'petition': return 'Petition';
      case 'whistleblow': return 'Whistleblow Report';
      case 'comment': return 'Comment';
      case 'member': return 'Account';
      default: return 'Item';
    }
  };


  const renderDecision = ({ item }) => {
    const color = getDecisionColor(item.decision_type);
    const icon = getDecisionIcon(item.decision_type);
    const canAppeal = item.is_appealable && 
                     (!item.appeal_deadline || new Date(item.appeal_deadline) > new Date());


    return (
      <TouchableOpacity
        style={[styles.decisionCard, { borderLeftColor: color }]}
        onPress={() => handleDecisionPress(item)}
      >
        <View style={styles.decisionHeader}>
          <Text style={styles.decisionIcon}>{icon}</Text>
          <View style={styles.decisionInfo}>
            <Text style={[styles.decisionType, { color }]}>
              {item.decision_type.toUpperCase()}
            </Text>
            <Text style={styles.targetType}>
              {getTargetTypeLabel(item.target_type)}
            </Text>
          </View>
          {canAppeal && (
            <View style={styles.appealableBadge}>
              <Text style={styles.appealableText}>Can Appeal</Text>
            </View>
          )}
        </View>


        <Text style={styles.reason} numberOfLines={2}>
          {item.reason}
        </Text>


        <View style={styles.footer}>
          <Text style={styles.adminName}>
            By: {item.admin?.full_name || 'Admin'}
          </Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Decisions</Text>
          <Text style={styles.headerSubtitle}>
            Decisions affecting your content
          </Text>
        </View>


        <FlatList
          data={decisions}
          renderItem={renderDecision}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No decisions yet</Text>
              <Text style={styles.emptySubtext}>
                Admin decisions will appear here
              </Text>
            </View>
          }
        />


        <TouchableOpacity
          style={styles.viewAppealsButton}
          onPress={() => navigation.navigate('MyAppeals')}
        >
          <Text style={styles.viewAppealsText}>View My Appeals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
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
  decisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  decisionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  decisionInfo: {
    flex: 1,
  },
  decisionType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  targetType: {
    fontSize: 13,
    color: '#666666',
  },
  appealableBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appealableText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reason: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminName: {
    fontSize: 12,
    color: '#666666',
  },
  date: {
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
  viewAppealsButton: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  viewAppealsText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default AdminDecisionsScreen;
