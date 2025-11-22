import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../../supabase';
import { BodyAnalyticsService } from '../../utils/bodyAnalyticsService';
import { BodyService } from '../../utils/bodyService';

const { width } = Dimensions.get('window');

const BodyDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bodyData, setBodyData] = useState(null);
  const [stats, setStats] = useState({
    petitionsCount: 0,
    suggestionsCount: 0,
    informationRequestsCount: 0,
    contentCount: 0,
    teamSize: 1,
    membersCount: 0,
    pendingPetitions: 0,
    memberActions: 0,
  });
  const [trustMetrics, setTrustMetrics] = useState({
    trustScore: 0,
    overallRating: 0,
    totalRatings: 0,
  });
  const [rankings, setRankings] = useState(null);
  const [engagementData, setEngagementData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [bodyResult, statsResult, trustResult, rankingsResult, engagementResult] = 
        await Promise.all([
          BodyService.getBodyById(user.id),
          BodyAnalyticsService.getDashboardStats(user.id),
          BodyAnalyticsService.getTrustMetrics(user.id),
          BodyAnalyticsService.getRankings(user.id),
          fetchEngagementData(user.id),
        ]);

      if (bodyResult.success) setBodyData(bodyResult.body);
      if (statsResult.success) {
        setStats({
          ...statsResult.stats,
          suggestionsCount: statsResult.stats.suggestionsCount || 0,
          informationRequestsCount: statsResult.stats.informationRequestsCount || 0,
          contentCount: statsResult.stats.postsCount || 0,
          membersCount: statsResult.stats.followersCount || 0,
          memberActions: (statsResult.stats.petitionsCount || 0) + 
                        (statsResult.stats.suggestionsCount || 0) + 
                        (statsResult.stats.informationRequestsCount || 0),
        });
      }
      if (trustResult.success) setTrustMetrics(trustResult.metrics);
      if (rankingsResult.success) setRankings(rankingsResult.rankings);
      if (engagementResult) setEngagementData(engagementResult);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEngagementData = async (bodyId) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      // ✅ FIXED: Changed body_id to target_body_id
      const { data, error } = await supabase
        .from('petitions')
        .select('created_at')
        .eq('target_body_id', bodyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const engagementCounts = Array(7).fill(0);
      const today = endDate.getDay();

      data?.forEach(item => {
        const itemDate = new Date(item.created_at);
        const dayDiff = Math.floor((endDate - itemDate) / (1000 * 60 * 60 * 24));
        if (dayDiff < 7) {
          const index = (today - dayDiff + 7) % 7;
          engagementCounts[index]++;
        }
      });

      const mondayIndex = today === 0 ? 6 : today - 1;
      const reorderedData = [];
      const reorderedLabels = [];
      
      for (let i = 0; i < 7; i++) {
        const index = (mondayIndex + i) % 7;
        reorderedData.push(engagementCounts[index] || 0);
        reorderedLabels.push(dayLabels[index]);
      }

      return {
        labels: reorderedLabels,
        datasets: [
          {
            data: reorderedData.length > 0 ? reorderedData : [0, 0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`, strokeWidth: 2 }],
      };
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(95, 99, 104, ${opacity})`,
    style: {
      borderRadius: 10,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: '#1A73E8',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E8EAED',
      strokeWidth: 1,
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {bodyData?.name || 'Organization'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('BodySettingsScreen')}
        >
          <Ionicons name="settings-outline" size={22} color="#5F6368" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsGrid}>
          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('BodyPetitionsScreen')}
          >
            <View style={styles.metricIcon}>
              <Ionicons name="document-text-outline" size={18} color="#757575" />
            </View>
            <Text style={styles.metricValue}>{stats.petitionsCount}</Text>
            <Text style={styles.metricLabel}>Petitions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="bulb-outline" size={18} color="#757575" />
            </View>
            <Text style={styles.metricValue}>{stats.suggestionsCount}</Text>
            <Text style={styles.metricLabel}>Suggestions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="information-circle-outline" size={18} color="#757575" />
            </View>
            <Text style={styles.metricValue}>{stats.informationRequestsCount}</Text>
            <Text style={styles.metricLabel}>Info Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('BodyPostsScreen')}
          >
            <View style={styles.metricIcon}>
              <Ionicons name="create-outline" size={18} color="#757575" />
            </View>
            <Text style={styles.metricValue}>{stats.contentCount}</Text>
            <Text style={styles.metricLabel}>Content</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transparencyCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={16} color="#757575" />
            <Text style={styles.cardTitle}>T-Metrics</Text>
          </View>
          
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              {/* ✅ FIXED: Added null safety for toFixed */}
              <Text style={styles.scoreNumber}>
                {(trustMetrics?.trustScore || 0).toFixed(1)}
              </Text>
              <Text style={styles.scoreSubtext}>Trust Score</Text>
            </View>
            <View style={styles.scoreBox}>
              {/* ✅ FIXED: Added null safety for toFixed */}
              <Text style={styles.scoreNumber}>
                {(trustMetrics?.overallRating || 0).toFixed(1)} ⭐
              </Text>
              <Text style={styles.scoreSubtext}>Rating ({trustMetrics?.totalRatings || 0})</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNumber}>{stats.membersCount}</Text>
              <Text style={styles.scoreSubtext}>Members</Text>
            </View>
          </View>
        </View>

        {engagementData && (
          <View style={styles.engagementCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={16} color="#757575" />
              <Text style={styles.cardTitle}>Engagement Trend</Text>
            </View>
            <LineChart
              data={engagementData}
              width={width - 48}
              height={120}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              fromZero={true}
            />
            <Text style={styles.chartCaption}>Member interactions over the past week</Text>
          </View>
        )}

        <View style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Team')}
          >
            <Ionicons name="people-outline" size={16} color="#5F6368" />
            <Text style={styles.quickActionText}>Manage Team ({stats.teamSize})</Text>
            <Ionicons name="chevron-forward" size={16} color="#5F6368" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, styles.lastAction]}
            onPress={() => navigation.navigate('BodyAnalytics')}
          >
            <Ionicons name="analytics-outline" size={16} color="#5F6368" />
            <Text style={styles.quickActionText}>View Analytics</Text>
            <Ionicons name="chevron-forward" size={16} color="#5F6368" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#202124',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#5F6368',
    marginTop: 2,
  },
  settingsButton: {
    padding: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricCard: {
    width: (width - 32) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A73E8',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#5F6368',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
    marginLeft: 6,
  },
  transparencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A73E8',
    marginBottom: 2,
  },
  scoreSubtext: {
    fontSize: 9,
    color: '#5F6368',
    textAlign: 'center',
  },
  engagementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chart: {
    marginVertical: 4,
    borderRadius: 10,
  },
  chartCaption: {
    fontSize: 10,
    color: '#5F6368',
    textAlign: 'center',
    marginTop: 2,
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  lastAction: {
    borderBottomWidth: 0,
  },
  quickActionText: {
    flex: 1,
    fontSize: 12,
    color: '#5F6368',
    marginLeft: 8,
  },
});

export default BodyDashboardScreen;
