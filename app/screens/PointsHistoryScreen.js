import { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../supabase';
import { BADGES } from '../../utils/pointsService';

export default function PointsHistoryScreen({ user, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('History');

  const tabs = ['History', 'Badges'];

  useEffect(() => {
    loadTransactions();
    loadBadges();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const loadBadges = async () => {
    const { data } = await supabase
      .from('user_levels')
      .select('badges')
      .eq('user_id', user.id)
      .eq('user_type', 'member')
      .single();

    const unlockedBadgeIds = data?.badges || [];
    
    // Map to badge objects
    const badgeList = Object.values(BADGES).map(badge => ({
      ...badge,
      unlocked: unlockedBadgeIds.includes(badge.id),
    }));

    setBadges(badgeList);
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {item.points > 0 ? '🎯' : '💰'}
        </Text>
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      <View style={styles.transactionPoints}>
        <Text style={[
          styles.transactionPointsText,
          item.points > 0 ? styles.pointsPositive : styles.pointsNegative
        ]}>
          {item.points > 0 ? '+' : ''}{item.points}
        </Text>
      </View>
    </View>
  );

  const renderBadge = ({ item }) => (
    <View style={[
      styles.badgeCard,
      !item.unlocked && styles.badgeCardLocked
    ]}>
      <View style={[
        styles.badgeIconContainer,
        !item.unlocked && styles.badgeIconLocked
      ]}>
        <Text style={styles.badgeIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.badgeName}>{item.name}</Text>
      <Text style={styles.badgeDescription}>{item.description}</Text>
      {!item.unlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedIcon}>🔒</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points & Badges</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'History' ? (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Start creating petitions to earn points!</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={badges}
          renderItem={renderBadge}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.badgesRow}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 60,
  },
  backIcon: {
    fontSize: 24,
    color: '#0066FF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 15,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionPoints: {
    marginLeft: 12,
  },
  transactionPointsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsPositive: {
    color: '#34C759',
  },
  pointsNegative: {
    color: '#FF3B30',
  },
  badgesRow: {
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#34C759',
    alignItems: 'center',
    position: 'relative',
  },
  badgeCardLocked: {
    borderColor: '#E5E5EA',
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconLocked: {
    backgroundColor: '#F2F2F7',
  },
  badgeIconText: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  lockedIcon: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
