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
import { supabase } from '../../supabase';
import { AnonymousService } from '../../utils/anonymousService';
import RatingDisplay from '../components/RatingDisplay';


const ReputationLeaderboardScreen = ({ navigation }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadLeaderboard();
  }, []);


  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, reputation_score, is_anonymous, anonymous_display_name, avatar_url')
        .order('reputation_score', { ascending: false })
        .limit(100);


      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };


  const renderLeaderItem = ({ item, index }) => {
    const displayName = AnonymousService.getDisplayName(item);
    const rank = index + 1;
    
    let rankStyle = styles.rankNumber;
    let rankBadge = null;


    if (rank === 1) {
      rankBadge = '🥇';
      rankStyle = [styles.rankNumber, styles.goldRank];
    } else if (rank === 2) {
      rankBadge = '🥈';
      rankStyle = [styles.rankNumber, styles.silverRank];
    } else if (rank === 3) {
      rankBadge = '🥉';
      rankStyle = [styles.rankNumber, styles.bronzeRank];
    }


    return (
      <TouchableOpacity 
        style={styles.leaderItem}
        onPress={() => navigation.navigate('PublicProfile', { memberId: item.id })}
      >
        <View style={styles.rankContainer}>
          {rankBadge ? (
            <Text style={styles.rankBadge}>{rankBadge}</Text>
          ) : (
            <Text style={rankStyle}>{rank}</Text>
          )}
        </View>


        <View style={styles.leaderInfo}>
          <Text style={styles.leaderName}>{displayName}</Text>
          <RatingDisplay 
            reputationScore={item.reputation_score || 0}
            showDetails={false}
            size="small"
          />
        </View>


        <Text style={styles.reputationNumber}>
          {(item.reputation_score || 0).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reputation Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Top activists by reputation</Text>
        </View>


        <FlatList
          data={leaders}
          renderItem={renderLeaderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No data available</Text>
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
    paddingTop: 12,
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
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadge: {
    fontSize: 32,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
  },
  goldRank: {
    color: '#FFD700',
  },
  silverRank: {
    color: '#C0C0C0',
  },
  bronzeRank: {
    color: '#CD7F32',
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  reputationNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});


export default ReputationLeaderboardScreen;
