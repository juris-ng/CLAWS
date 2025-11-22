import { useEffect, useState } from 'react';
import {
  Alert,
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
import { supabase } from '../../supabase';
import { PointsConversionService } from '../../utils/pointsConversionService';


const PointsRedemptionScreen = ({ navigation }) => {
  const [rewards, setRewards] = useState([]);
  const [memberPoints, setMemberPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      // Load member points
      const { data: { user } } = await supabase.auth.getUser();
      const { data: member } = await supabase
        .from('members')
        .select('points')
        .eq('id', user.id)
        .single();


      setMemberPoints(member?.points || 0);


      // Load available rewards
      const result = await PointsConversionService.getAvailableRewards();
      if (result.success) {
        setRewards(result.rewards);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };


  const handleRedeem = async (reward) => {
    const canAfford = memberPoints >= reward.points_cost;
    
    if (!canAfford) {
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.points_cost} points to redeem this reward. You currently have ${memberPoints} points.`
      );
      return;
    }


    Alert.alert(
      'Confirm Redemption',
      `Redeem "${reward.title}" for ${reward.points_cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const result = await PointsConversionService.redeemReward(user.id, reward.id);
            
            if (result.success) {
              Alert.alert('Success', result.message);
              loadData(); // Refresh data
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };


  const renderRewardItem = ({ item }) => {
    const canAfford = memberPoints >= item.points_cost;
    const isLimitReached = item.max_redemptions && 
                          item.total_redeemed >= item.max_redemptions;


    return (
      <View style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardIcon}>{item.icon}</Text>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardTitle}>{item.title}</Text>
            <Text style={styles.rewardDescription}>{item.description}</Text>
            <View style={styles.rewardMeta}>
              <Text style={styles.rewardType}>
                {item.reward_type.replace('_', ' ').toUpperCase()}
              </Text>
              {item.max_redemptions && (
                <Text style={styles.rewardLimit}>
                  {item.total_redeemed}/{item.max_redemptions} redeemed
                </Text>
              )}
            </View>
          </View>
        </View>


        <View style={styles.rewardFooter}>
          <Text style={[
            styles.rewardCost,
            !canAfford && styles.rewardCostDisabled
          ]}>
            {item.points_cost} points
          </Text>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              (!canAfford || isLimitReached) && styles.redeemButtonDisabled
            ]}
            onPress={() => handleRedeem(item)}
            disabled={!canAfford || isLimitReached}
          >
            <Text style={styles.redeemButtonText}>
              {isLimitReached ? 'Sold Out' : canAfford ? 'Redeem' : 'Not Enough Points'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rewards Store</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>Your Points:</Text>
            <Text style={styles.pointsValue}>{memberPoints}</Text>
          </View>
        </View>


        <FlatList
          data={rewards}
          renderItem={renderRewardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎁</Text>
              <Text style={styles.emptyText}>No rewards available</Text>
            </View>
          }
        />


        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ConversionHistory')}
        >
          <Text style={styles.historyButtonText}>View Redemption History</Text>
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
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rewardIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  rewardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rewardLimit: {
    fontSize: 11,
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardCost: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rewardCostDisabled: {
    color: '#CCCCCC',
  },
  redeemButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  historyButtonText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    color: '#666666',
  },
});


export default PointsRedemptionScreen;
