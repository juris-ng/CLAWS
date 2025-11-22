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
import { supabase } from '../../supabase';
import { CaseService } from '../../utils/caseService';
import { ConsultationService } from '../../utils/consultationService';
import { LawyerService } from '../../utils/lawyerService';

const { width } = Dimensions.get('window');

const LawyerAnalyticsDashboardScreen = ({ navigation }) => {
  const [lawyerId, setLawyerId] = useState(null);
  const [stats, setStats] = useState(null);
  const [caseStats, setCaseStats] = useState(null);
  const [consultationStats, setConsultationStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [badges, setBadges] = useState([]);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCurrentLawyer();
  }, []);

  useEffect(() => {
    if (lawyerId) {
      loadAnalytics();
    }
  }, [lawyerId, timeRange]);

  const getCurrentLawyer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLawyerId(user.id);
      }
    } catch (error) {
      console.error('Error getting current lawyer:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [
        statsResult,
        caseStatsResult,
        consultationStatsResult,
        badgesResult,
      ] = await Promise.all([
        LawyerService.getLawyerStats(lawyerId),
        CaseService.getCaseStats(lawyerId),
        ConsultationService.getConsultationStats(lawyerId),
        LawyerService.getLawyerBadges(lawyerId),
      ]);

      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      if (caseStatsResult.success) {
        setCaseStats(caseStatsResult.stats);
      }

      if (consultationStatsResult.success) {
        setConsultationStats(consultationStatsResult.stats);
      }

      if (badgesResult.success) {
        setBadges(badgesResult.badges);
      }

      // Load revenue data
      await loadRevenueData();

      // Check and award new badges
      await LawyerService.checkAndAwardBadges(lawyerId);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const result = await LawyerService.getRevenueTracking(
        lawyerId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (result.success) {
        setRevenueData(result.revenue || []);
      }
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const calculateSuccessRate = () => {
    if (!caseStats || caseStats.totalCases === 0) return 0;
    return ((caseStats.closedCases / caseStats.totalCases) * 100).toFixed(1);
  };

  const calculateTotalRevenue = () => {
    return revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const renderStatCard = (title, value, icon, color, subtitle = null) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderBadge = (badge) => (
    <View key={badge.id} style={styles.badgeItem}>
      <View style={styles.badgeIconContainer}>
        <Text style={styles.badgeIcon}>{badge.badge?.icon || '🏆'}</Text>
      </View>
      <Text style={styles.badgeName} numberOfLines={2}>
        {badge.badge?.name}
      </Text>
      <Text style={styles.badgeDate}>
        {new Date(badge.earned_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your performance</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            style={[styles.timeButton, timeRange === 'week' && styles.timeButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'week' && styles.timeButtonTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeButton, timeRange === 'month' && styles.timeButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'month' && styles.timeButtonTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeButton, timeRange === 'year' && styles.timeButtonActive]}
            onPress={() => setTimeRange('year')}
          >
            <Text style={[styles.timeButtonText, timeRange === 'year' && styles.timeButtonTextActive]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Cases',
              caseStats?.totalCases || 0,
              '⚖️',
              '#2196F3',
              `${caseStats?.activeCases || 0} active`
            )}
            {renderStatCard(
              'Consultations',
              consultationStats?.total || 0,
              '📅',
              '#FF9800',
              `${consultationStats?.upcoming || 0} upcoming`
            )}
            {renderStatCard(
              'Success Rate',
              `${calculateSuccessRate()}%`,
              '🎯',
              '#4CAF50',
              `${caseStats?.closedCases || 0} closed`
            )}
            {renderStatCard(
              'Client Rating',
              stats?.averageRating?.toFixed(1) || '0.0',
              '⭐',
              '#FFD700',
              `${stats?.totalReviews || 0} reviews`
            )}
          </View>
        </View>

        {/* Revenue Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueAmount}>
                KES {calculateTotalRevenue().toLocaleString()}
              </Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueDetails}>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Cases</Text>
                <Text style={styles.revenueDetailValue}>
                  {revenueData.filter(r => r.source === 'case').length}
                </Text>
              </View>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Consultations</Text>
                <Text style={styles.revenueDetailValue}>
                  {revenueData.filter(r => r.source === 'consultation').length}
                </Text>
              </View>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Avg/Case</Text>
                <Text style={styles.revenueDetailValue}>
                  {caseStats?.totalCases > 0
                    ? Math.round(calculateTotalRevenue() / caseStats.totalCases).toLocaleString()
                    : 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Case Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Status Breakdown</Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, styles.breakdownOpen]}>
                <Text style={styles.breakdownValue}>{caseStats?.openCases || 0}</Text>
              </View>
              <Text style={styles.breakdownLabel}>Open</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, styles.breakdownActive]}>
                <Text style={styles.breakdownValue}>{caseStats?.activeCases || 0}</Text>
              </View>
              <Text style={styles.breakdownLabel}>Active</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, styles.breakdownClosed]}>
                <Text style={styles.breakdownValue}>{caseStats?.closedCases || 0}</Text>
              </View>
              <Text style={styles.breakdownLabel}>Closed</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, styles.breakdownUrgent]}>
                <Text style={styles.breakdownValue}>{caseStats?.urgentCases || 0}</Text>
              </View>
              <Text style={styles.breakdownLabel}>Urgent</Text>
            </View>
          </View>
        </View>

        {/* Achievement Badges */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievement Badges ({badges.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgesContainer}>
                {badges.map(renderBadge)}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Cases')}
            >
              <Text style={styles.actionIcon}>⚖️</Text>
              <Text style={styles.actionText}>View Cases</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Consultations')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Consultations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PerformanceReports')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E9',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  revenueCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  revenueHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  revenueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  revenueDetailItem: {
    alignItems: 'center',
  },
  revenueDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  revenueDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  breakdownContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownBar: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownOpen: {
    backgroundColor: '#2196F3',
  },
  breakdownActive: {
    backgroundColor: '#FF9800',
  },
  breakdownClosed: {
    backgroundColor: '#4CAF50',
  },
  breakdownUrgent: {
    backgroundColor: '#F44336',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeItem: {
    width: 100,
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 10,
    color: '#999',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    height: 20,
  },
});

export default LawyerAnalyticsDashboardScreen;
