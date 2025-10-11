import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function PointsHistory({ user, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadTransactions();
    loadTotalPoints();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (data) {
      setTransactions(data);
    }
  };

  const loadTotalPoints = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('points')
      .eq('id', user.id)
      .single();

    if (data) {
      setTotalPoints(data.points);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'create_petition': return '📝';
      case 'vote': return '🗳️';
      case 'petition_upvoted': return '⭐';
      default: return '💎';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getActionIcon(item.action_type)}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.actionType}>
          {item.action_type.replace(/_/g, ' ').toUpperCase()}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.points, item.points > 0 && styles.pointsPositive]}>
        +{item.points}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={styles.backButton} />
      </View>

      {/* Total Points Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Points</Text>
        <Text style={styles.totalPoints}>{totalPoints}</Text>
        <Text style={styles.totalSubtext}>
          Keep engaging to earn more!
        </Text>
      </View>

      {/* Points Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>How to Earn Points</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownAction}>📝 Create a petition</Text>
          <Text style={styles.breakdownPoints}>+10 points</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownAction}>⭐ Receive an upvote</Text>
          <Text style={styles.breakdownPoints}>+5 points</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownAction}>🗳️ Vote on petition</Text>
          <Text style={styles.breakdownPoints}>+2 points</Text>
        </View>
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptySubtext}>Start creating and voting on petitions!</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalCard: {
    backgroundColor: '#007bff',
    margin: 20,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  totalPoints: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  totalSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownAction: {
    fontSize: 14,
    color: '#666',
  },
  breakdownPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  actionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  pointsPositive: {
    color: '#28a745',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});
