import { useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AdminService } from '../../../utils/adminService';
import { ResponsiveUtils } from '../../../utils/responsive';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ user, profile, onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await AdminService.getDashboardStats();
    setStats(data);
    setLoading(false);
  };

  const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const calculateGrowth = (current, previous) => {
    if (!previous) return 100;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAnalytics} />
        }
      >
        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Overview</Text>
          
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>👥</Text>
              <Text style={styles.overviewValue}>{stats?.total_users || 0}</Text>
              <Text style={styles.overviewLabel}>Total Users</Text>
              {stats?.new_users_30d > 0 && (
                <Text style={styles.overviewGrowth}>
                  +{stats.new_users_30d} this month
                </Text>
              )}
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>📋</Text>
              <Text style={styles.overviewValue}>{stats?.total_petitions || 0}</Text>
              <Text style={styles.overviewLabel}>Petitions</Text>
              <Text style={styles.overviewGrowth}>
                {stats?.active_petitions || 0} active
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>👍</Text>
              <Text style={styles.overviewValue}>{stats?.total_votes || 0}</Text>
              <Text style={styles.overviewLabel}>Total Votes</Text>
              {stats?.total_petitions > 0 && (
                <Text style={styles.overviewGrowth}>
                  {(stats.total_votes / stats.total_petitions).toFixed(1)} avg/petition
                </Text>
              )}
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>💬</Text>
              <Text style={styles.overviewValue}>{stats?.total_comments || 0}</Text>
              <Text style={styles.overviewLabel}>Comments</Text>
              {stats?.total_petitions > 0 && (
                <Text style={styles.overviewGrowth}>
                  {(stats.total_comments / stats.total_petitions).toFixed(1)} avg/petition
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Engagement Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Engagement Metrics</Text>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Petition Engagement Rate</Text>
              <Text style={styles.metricValue}>
                {calculatePercentage(
                  (stats?.total_votes || 0) + (stats?.total_comments || 0),
                  (stats?.total_petitions || 1) * (stats?.total_users || 1)
                )}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(calculatePercentage(
                      (stats?.total_votes || 0) + (stats?.total_comments || 0),
                      (stats?.total_petitions || 1) * (stats?.total_users || 1)
                    ), 100)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricDescription}>
              Percentage of user interactions per petition
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Active User Rate</Text>
              <Text style={styles.metricValue}>
                {calculatePercentage(stats?.active_petitions || 0, stats?.total_users || 1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(calculatePercentage(
                      stats?.active_petitions || 0, 
                      stats?.total_users || 1
                    ), 100)}%`,
                    backgroundColor: '#34C759'
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricDescription}>
              Users who have created at least one petition
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Comment to Vote Ratio</Text>
              <Text style={styles.metricValue}>
                1:{stats?.total_votes && stats?.total_comments 
                  ? (stats.total_votes / stats.total_comments).toFixed(1) 
                  : '0'}
              </Text>
            </View>
            <Text style={styles.metricDescription}>
              {stats?.total_votes || 0} votes to {stats?.total_comments || 0} comments
            </Text>
          </View>
        </View>

        {/* Moderation Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Moderation Statistics</Text>

          <View style={styles.moderationGrid}>
            <View style={styles.moderationCard}>
              <Text style={styles.moderationValue}>{stats?.pending_petitions || 0}</Text>
              <Text style={styles.moderationLabel}>Pending Approval</Text>
              <View style={[styles.moderationIndicator, { backgroundColor: '#FF9500' }]} />
            </View>

            <View style={styles.moderationCard}>
              <Text style={styles.moderationValue}>{stats?.flagged_petitions || 0}</Text>
              <Text style={styles.moderationLabel}>Flagged Petitions</Text>
              <View style={[styles.moderationIndicator, { backgroundColor: '#FF3B30' }]} />
            </View>

            <View style={styles.moderationCard}>
              <Text style={styles.moderationValue}>{stats?.flagged_comments || 0}</Text>
              <Text style={styles.moderationLabel}>Flagged Comments</Text>
              <View style={[styles.moderationIndicator, { backgroundColor: '#FF3B30' }]} />
            </View>

            <View style={styles.moderationCard}>
              <Text style={styles.moderationValue}>{stats?.pending_reports || 0}</Text>
              <Text style={styles.moderationLabel}>Pending Reports</Text>
              <View style={[styles.moderationIndicator, { backgroundColor: '#FF9500' }]} />
            </View>

            <View style={styles.moderationCard}>
              <Text style={styles.moderationValue}>{stats?.under_review_reports || 0}</Text>
              <Text style={styles.moderationLabel}>Under Review</Text>
              <View style={[styles.moderationIndicator, { backgroundColor: '#0066FF' }]} />
            </View>

            <View style={styles.moderationCard}>
              <Text style={styles.moderationValue}>{stats?.banned_users || 0}</Text>
              <Text style={styles.moderationLabel}>Banned Users</Text>
              <View style={[styles.moderationIndicator, { backgroundColor: '#8E8E93' }]} />
            </View>
          </View>
        </View>

        {/* Health Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💚 Platform Health</Text>

          <View style={styles.healthCard}>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Content Moderation Load</Text>
              <View style={styles.healthValue}>
                {(stats?.pending_petitions || 0) + (stats?.flagged_petitions || 0) < 10 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#34C759' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#34C759' }]}>Low</Text>
                  </>
                ) : (stats?.pending_petitions || 0) + (stats?.flagged_petitions || 0) < 50 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF9500' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF9500' }]}>Medium</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF3B30' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF3B30' }]}>High</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>User Engagement</Text>
              <View style={styles.healthValue}>
                {calculatePercentage(
                  (stats?.total_votes || 0) + (stats?.total_comments || 0),
                  (stats?.total_users || 1)
                ) > 50 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#34C759' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#34C759' }]}>Excellent</Text>
                  </>
                ) : calculatePercentage(
                  (stats?.total_votes || 0) + (stats?.total_comments || 0),
                  (stats?.total_users || 1)
                ) > 20 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF9500' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF9500' }]}>Good</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF3B30' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF3B30' }]}>Needs Attention</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Report Response Time</Text>
              <View style={styles.healthValue}>
                {(stats?.pending_reports || 0) < 5 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#34C759' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#34C759' }]}>Fast</Text>
                  </>
                ) : (stats?.pending_reports || 0) < 20 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF9500' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF9500' }]}>Average</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF3B30' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF3B30' }]}>Slow</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Ban Rate</Text>
              <View style={styles.healthValue}>
                {calculatePercentage(stats?.banned_users || 0, stats?.total_users || 1) < 1 ? (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#34C759' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#34C759' }]}>
                      {calculatePercentage(stats?.banned_users || 0, stats?.total_users || 1)}%
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.healthIndicator, { color: '#FF9500' }]}>●</Text>
                    <Text style={[styles.healthText, { color: '#FF9500' }]}>
                      {calculatePercentage(stats?.banned_users || 0, stats?.total_users || 1)}%
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Quick Insights</Text>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📊</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Average Petition Performance</Text>
              <Text style={styles.insightText}>
                Each petition receives an average of{' '}
                <Text style={styles.insightHighlight}>
                  {stats?.total_petitions > 0 
                    ? (stats.total_votes / stats.total_petitions).toFixed(1) 
                    : 0} votes
                </Text>{' '}
                and{' '}
                <Text style={styles.insightHighlight}>
                  {stats?.total_petitions > 0 
                    ? (stats.total_comments / stats.total_petitions).toFixed(1) 
                    : 0} comments
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>👥</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>User Growth</Text>
              <Text style={styles.insightText}>
                <Text style={styles.insightHighlight}>
                  {stats?.new_users_30d || 0} new users
                </Text>{' '}
                joined in the last 30 days
                {stats?.total_users && stats?.new_users_30d && (
                  <Text>
                    , representing{' '}
                    <Text style={styles.insightHighlight}>
                      {calculatePercentage(stats.new_users_30d, stats.total_users)}%
                    </Text>{' '}
                    growth
                  </Text>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>🛡️</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Moderation Workload</Text>
              <Text style={styles.insightText}>
                Currently{' '}
                <Text style={styles.insightHighlight}>
                  {(stats?.pending_reports || 0) + 
                   (stats?.under_review_reports || 0) + 
                   (stats?.pending_petitions || 0) + 
                   (stats?.flagged_petitions || 0) + 
                   (stats?.flagged_comments || 0)} items
                </Text>{' '}
                require moderation attention
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingTop: ResponsiveUtils.isIPhoneX() ? 44 : 20,
    paddingBottom: ResponsiveUtils.spacing(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
  },
  backIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    color: '#1C1C1E',
  },
  headerTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: ResponsiveUtils.spacing(2),
  },
  sectionTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(2),
    color: '#1C1C1E',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -ResponsiveUtils.spacing(0.5),
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  overviewIcon: {
    fontSize: ResponsiveUtils.fontSize(32),
    marginBottom: ResponsiveUtils.spacing(1),
  },
  overviewValue: {
    fontSize: ResponsiveUtils.fontSize(28),
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  overviewLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  overviewGrowth: {
    fontSize: ResponsiveUtils.fontSize(10),
    color: '#34C759',
    fontWeight: '600',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1.5),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  metricTitle: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
  },
  metricValue: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#0066FF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  metricDescription: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  moderationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -ResponsiveUtils.spacing(0.5),
  },
  moderationCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  moderationValue: {
    fontSize: ResponsiveUtils.fontSize(24),
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  moderationLabel: {
    fontSize: ResponsiveUtils.fontSize(11),
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
  moderationIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  healthLabel: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  healthValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ResponsiveUtils.spacing(0.75),
  },
  healthIndicator: {
    fontSize: ResponsiveUtils.fontSize(16),
  },
  healthText: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1.5),
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  insightIcon: {
    fontSize: ResponsiveUtils.fontSize(32),
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  insightText: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#3C3C43',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '600',
    color: '#0066FF',
  },
  bottomPadding: {
    height: ResponsiveUtils.spacing(4),
  },
});
