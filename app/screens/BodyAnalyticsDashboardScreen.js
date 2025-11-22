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
import { BarChart, LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import { supabase } from '../../supabase';
import { BodyAnalyticsService } from '../../utils/bodyAnalyticsService';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0047AB',
  announcements: '#0047AB',
  projects: '#4CAF50',
  events: '#FF9800',
  discussions: '#9C27B0',
  success: '#4CAF50',
  error: '#F44336',
  purple: '#9C27B0',
  teal: '#00BCD4',
  white: '#FFFFFF',
  background: '#F5F5F5',
  darkGray: '#333333',
  mediumGray: '#666666',
  lightGray: '#E0E0E0',
  transparency: '#2196F3',
  accountability: '#FF5722',
  participation: '#4CAF50',
  trust: '#9C27B0',
};

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 71, 171, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#0047AB',
  },
};

const BodyAnalyticsDashboardScreen = ({ route, navigation }) => {
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [period, setPeriod] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chart data
  const [engagementData, setEngagementData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43, 50],
    }],
  });

  const [contentDistribution, setContentDistribution] = useState([
    { name: 'Announcements', population: 0, color: '#0047AB', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Projects', population: 0, color: '#4CAF50', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Events', population: 0, color: '#FF9800', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Discussions', population: 0, color: '#9C27B0', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  ]);

  const [completionProgress, setCompletionProgress] = useState({
    labels: ['Announcements', 'Projects', 'Events', 'Discussions'],
    data: [0.85, 0.75, 0.60, 0.90],
  });

  const [governanceMetrics, setGovernanceMetrics] = useState({
    labels: ['Transparency', 'Accountability', 'Participation', 'Trust'],
    datasets: [{
      data: [85, 78, 92, 88],
    }],
  });

  const [trustMetrics, setTrustMetrics] = useState({
    labels: ['Trust', 'Satisfaction', 'Response'],
    data: [0.88, 0.92, 0.75],
  });

  const periods = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '1year', label: '1 Year' },
  ];

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadAnalytics();
    }
  }, [bodyId, period]);

  const initializeBodyId = async () => {
    if (!bodyId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setBodyId(user.id);
      }
    }
  };

  const showToast = (message, type = 'success') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
      autoHide: true,
      bottomOffset: 100,
    });
  };

  const loadAnalytics = async () => {
    try {
      const [realtimeResult, statsResult, goalsResult] = await Promise.all([
        BodyAnalyticsService.getRealtimeAnalytics(bodyId),
        BodyAnalyticsService.getAggregatedStats(bodyId, period),
        BodyAnalyticsService.getGoals(bodyId, 'active'),
      ]);

      if (realtimeResult.success) {
        setAnalytics(realtimeResult.analytics);
        await loadChartData(realtimeResult.analytics);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      if (goalsResult.success) {
        setGoals(goalsResult.goals.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChartData = async (analyticsData) => {
    try {
      // Load engagement trend
      const engagementResult = await getEngagementTrend();
      if (engagementResult) {
        setEngagementData(engagementResult);
      }

      // Load content distribution - using real data
      const distributionData = [
        {
          name: 'Announcements',
          population: analyticsData.announcementCount || 0,
          color: COLORS.announcements,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          name: 'Projects',
          population: analyticsData.projectsCount || 0,
          color: COLORS.projects,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          name: 'Events',
          population: analyticsData.eventsCount || 0,
          color: COLORS.events,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          name: 'Discussions',
          population: analyticsData.discussionsCount || 0,
          color: COLORS.discussions,
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
      ];
      setContentDistribution(distributionData);

      // Load completion progress
      const progressResult = await getCompletionProgress();
      if (progressResult) {
        setCompletionProgress(progressResult);
      }

      // Load governance metrics - using service
      const governanceResult = await BodyAnalyticsService.getGovernanceMetrics(bodyId);
      if (governanceResult.success) {
        setGovernanceMetrics({
          labels: ['Transparency', 'Accountability', 'Participation', 'Trust'],
          datasets: [{
            data: [
              governanceResult.metrics.transparency,
              governanceResult.metrics.accountability,
              governanceResult.metrics.participation,
              governanceResult.metrics.trust,
            ],
          }],
        });
      }

      // Load trust metrics - using service
      const trustResult = await BodyAnalyticsService.getTrustMetrics(bodyId);
      if (trustResult.success) {
        setTrustMetrics({
          labels: ['Trust', 'Satisfaction', 'Response'],
          data: [
            trustResult.metrics.trust,
            trustResult.metrics.satisfaction,
            trustResult.metrics.response,
          ],
        });
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const getEngagementTrend = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase.rpc('get_daily_engagement', {
        p_body_id: bodyId,
        p_start_date: sevenDaysAgo.toISOString(),
      });

      if (error) {
        console.log('Using fallback engagement data');
        return null;
      }

      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dataPoints = data?.map(d => d.count) || [20, 45, 28, 80, 99, 43, 50];

      return {
        labels,
        datasets: [{ data: dataPoints.length > 0 ? dataPoints : [0, 0, 0, 0, 0, 0, 0] }],
      };
    } catch (error) {
      console.error('Engagement trend error:', error);
      return null;
    }
  };

  const getCompletionProgress = async () => {
    try {
      // Announcements completion (published vs drafts)
      const { count: publishedAnnouncements } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('post_type', 'announcement')
        .eq('status', 'published');

      const { count: totalAnnouncements } = await supabase
        .from('body_posts')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('post_type', 'announcement');

      const announcementRate = totalAnnouncements > 0 ? publishedAnnouncements / totalAnnouncements : 0.85;

      // Projects completion
      const { count: completedProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('status', 'completed');

      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const projectRate = totalProjects > 0 ? completedProjects / totalProjects : 0.75;

      // Events completion (past vs total)
      const { count: pastEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .lt('end_date', new Date().toISOString());

      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const eventRate = totalEvents > 0 ? pastEvents / totalEvents : 0.60;

      // Discussions completion (active responses)
      const { count: activeDiscussions } = await supabase
        .from('discussions')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId)
        .eq('status', 'active');

      const { count: totalDiscussions } = await supabase
        .from('discussions')
        .select('*', { count: 'exact', head: true })
        .eq('body_id', bodyId);

      const discussionRate = totalDiscussions > 0 ? activeDiscussions / totalDiscussions : 0.90;

      return {
        labels: ['Announcements', 'Projects', 'Events', 'Discussions'],
        data: [announcementRate, projectRate, eventRate, discussionRate],
      };
    } catch (error) {
      console.error('Completion progress error:', error);
      return null;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const renderGoalCard = (goal) => {
    const progress = goal.progress || 0;
    const progressColor = progress >= 100 ? COLORS.success : progress >= 50 ? COLORS.events : COLORS.primary;

    return (
      <TouchableOpacity
        key={goal.id}
        style={styles.goalCard}
        onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
        activeOpacity={0.7}
      >
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle} numberOfLines={1}>
            {goal.goal_title}
          </Text>
          <Text style={[styles.goalProgress, { color: progressColor }]}>{progress.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }]} />
        </View>
        <View style={styles.goalFooter}>
          <Text style={styles.goalMetric}>
            {goal.current_value} / {goal.target_value} {goal.target_metric}
          </Text>
          {goal.deadline && (
            <Text style={styles.goalDeadline}>
              Due: {new Date(goal.deadline).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.errorContainer}>
          <Ionicons name="bar-chart" size={64} color={COLORS.primary} style={styles.errorIcon} />
          <Text style={styles.errorText}>No analytics data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Analytics Dashboard</Text>
          <Text style={styles.pageSubtitle}>Democratic Governance & Performance Insights</Text>
        </View>

        <View style={styles.periodSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.periodButtonsContainer}>
              {periods.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.periodButton, period === p.value && styles.periodButtonActive]}
                  onPress={() => setPeriod(p.value)}
                >
                  <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Community Engagement Trend */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Community Engagement Trend</Text>
            <Ionicons name="trending-up" size={20} color={COLORS.primary} />
          </View>
          <LineChart
            data={engagementData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            fromZero
          />
          <Text style={styles.chartDescription}>
            Daily member interactions across all content types
          </Text>
        </View>

        {/* Content Distribution */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Content Distribution</Text>
            <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
          </View>
          <PieChart
            data={contentDistribution}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
          <View style={styles.legendContainer}>
            {contentDistribution.map((item) => (
              <View key={item.name} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.name}: {item.population}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Completion Progress */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Content Completion Rate</Text>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          </View>
          <ProgressChart
            data={completionProgress}
            width={width - 40}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1, index) => {
                const colors = [COLORS.announcements, COLORS.projects, COLORS.events, COLORS.discussions];
                return colors[index] ? `${colors[index]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : `rgba(0, 71, 171, ${opacity})`;
              },
            }}
            hideLegend={false}
            style={styles.chart}
          />
          <View style={styles.legendContainer}>
            {completionProgress.labels.map((label, index) => {
              const colors = [COLORS.announcements, COLORS.projects, COLORS.events, COLORS.discussions];
              return (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors[index] }]} />
                  <Text style={styles.legendText}>
                    {label}: {(completionProgress.data[index] * 100).toFixed(0)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Democratic Governance Metrics */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Democratic Governance Score</Text>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.transparency} />
          </View>
          <BarChart
            data={governanceMetrics}
            width={width - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            }}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
          <Text style={styles.chartDescription}>
            Transparency, Accountability, Participation & Trust metrics
          </Text>
        </View>

        {/* Trust & Community Metrics */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Trust & Satisfaction Metrics</Text>
            <Ionicons name="heart" size={20} color={COLORS.trust} />
          </View>
          <ProgressChart
            data={trustMetrics}
            width={width - 40}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
            }}
            hideLegend={false}
            style={styles.chart}
          />
          <View style={styles.legendContainer}>
            {trustMetrics.labels.map((label, index) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: COLORS.trust }]} />
                <Text style={styles.legendText}>
                  {label}: {(trustMetrics.data[index] * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Goals Preview */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Goals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AnalyticsGoals', { bodyId })}>
                <Text style={styles.viewAllLink}>View All →</Text>
              </TouchableOpacity>
            </View>
            {goals.map(renderGoalCard)}
          </View>
        )}

        {/* Detailed Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Analytics</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AnalyticsGoals', { bodyId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="trophy" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Goals & Targets</Text>
              <Text style={styles.actionDescription}>Set and track organizational goals</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ImpactTracking', { bodyId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.success}15` }]}>
              <Ionicons name="bar-chart" size={24} color={COLORS.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Impact Tracking</Text>
              <Text style={styles.actionDescription}>Measure community impact & outcomes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PerformanceReports', { bodyId })}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.events}15` }]}>
              <Ionicons name="document-text" size={24} color={COLORS.events} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Performance Reports</Text>
              <Text style={styles.actionDescription}>Generate & export detailed reports</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  titleSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  periodSelector: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  periodButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  periodButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  periodTextActive: {
    color: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  chartSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 12,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  goalCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginRight: 12,
  },
  goalProgress: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalMetric: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  goalDeadline: {
    fontSize: 12,
    color: '#999999',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  footer: {
    height: 40,
  },
});

export default BodyAnalyticsDashboardScreen;
