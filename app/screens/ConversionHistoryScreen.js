import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { PointsConversionService } from '../../utils/pointsConversionService';


const ConversionHistoryScreen = () => {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadHistory();
  }, []);


  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = await PointsConversionService.getConversionHistory(user.id);
      
      if (result.success) {
        setConversions(result.conversions);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'completed': return '#0066FF';
      default: return '#666666';
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  };


  const renderConversionItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const date = new Date(item.created_at).toLocaleDateString();


    return (
      <View style={styles.conversionCard}>
        <View style={styles.conversionHeader}>
          <Text style={styles.rewardIcon}>{item.reward?.icon}</Text>
          <View style={styles.conversionInfo}>
            <Text style={styles.rewardTitle}>{item.reward?.title}</Text>
            <Text style={styles.conversionDate}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIcon}>{statusIcon}</Text>
          </View>
        </View>


        <View style={styles.conversionFooter}>
          <Text style={styles.pointsSpent}>-{item.points_spent} points</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>


        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Redemption History</Text>
        </View>


        <FlatList
          data={conversions}
          renderItem={renderConversionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No redemptions yet</Text>
              <Text style={styles.emptySubtext}>
                Start redeeming rewards to see your history here
              </Text>
            </View>
          }
        />
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  conversionCard: {
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
  conversionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rewardIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  conversionInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  conversionDate: {
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
  },
  conversionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsSpent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
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
});


export default ConversionHistoryScreen;
