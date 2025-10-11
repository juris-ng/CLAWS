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

export default function AdminHomeScreen({ user, profile, onBack, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const [statsData, activityData] = await Promise.all([
      AdminService.getDashboardStats(),
      AdminService.getRecentActivity(10),
    ]);
    setStats(statsData);
    setRecentActivity(activityData || []);
    setLoading(false);
  };

  const getActivityIcon = (action) => {
    const icons = {
      ban_user: '🚫',
      unban_user: '✅',
      delete_petition: '🗑️',
      delete_comment: '💬',
      update_role: '👤',
      status_change: '🔄',
    };
    return icons[action] || '📝';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboard} />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome, {profile?.full_name}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Admin Dashboard Overview</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Users Stats */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statChange}>
              +{stats?.new_users_30d || 0} this month
            </Text>
          </View>

          {/* Petitions Stats */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>📋</Text>
              <Text style={styles.statValue}>{stats?.total_petitions || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Petitions</Text>
            <Text style={styles.statChange}>
              {stats?.active_petitions || 0} active
            </Text>
          </View>

          {/* Votes Stats */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>👍</Text>
              <Text style={styles.statValue}>{stats?.total_votes || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Total Votes</Text>
            <Text style={styles.statChange}>All time</Text>
          </View>

          {/* Comments Stats */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statValue}>{stats?.total_comments || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Comments</Text>
            <Text style={styles.statChange}>All time</Text>
          </View>
        </View>

        {/* Pending Items */}
        {(stats?.pending_reports > 0 || stats?.pending_petitions > 0 || stats?.flagged_petitions > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Needs Attention</Text>
            
            {stats?.pending_reports > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => onNavigate('Reports')}
              >
                <View style={styles.alertLeft}>
                  <Text style={styles.alertIcon}>🚨</Text>
                  <View>
                    <Text style={styles.alertTitle}>Pending Reports</Text>
                    <Text style={styles.alertSubtitle}>
                      {stats.pending_reports} reports waiting for review
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertArrow}>→</Text>
              </TouchableOpacity>
            )}

            {stats?.flagged_petitions > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => onNavigate('Moderation')}
              >
                <View style={styles.alertLeft}>
                  <Text style={styles.alertIcon}>🚩</Text>
                  <View>
                    <Text style={styles.alertTitle}>Flagged Petitions</Text>
                    <Text style={styles.alertSubtitle}>
                      {stats.flagged_petitions} petitions flagged
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertArrow}>→</Text>
              </TouchableOpacity>
            )}

            {stats?.pending_petitions > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => onNavigate('Moderation')}
              >
                <View style={styles.alertLeft}>
                  <Text style={styles.alertIcon}>⏳</Text>
                  <View>
                    <Text style={styles.alertTitle}>Pending Approval</Text>
                    <Text style={styles.alertSubtitle}>
                      {stats.pending_petitions} petitions awaiting approval
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertArrow}>→</Text>
              </TouchableOpacity>
            )}

            {stats?.banned_users > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => onNavigate('Users')}
              >
                <View style={styles.alertLeft}>
                  <Text style={styles.alertIcon}>🚫</Text>
                  <View>
                    <Text style={styles.alertTitle}>Banned Users</Text>
                    <Text style={styles.alertSubtitle}>
                      {stats.banned_users} users currently banned
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Users')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Moderation')}
            >
              <Text style={styles.actionIcon}>🛡️</Text>
              <Text style={styles.actionLabel}>Moderation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Reports')}
            >
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Analytics')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Recent Activity</Text>
          
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <Text style={styles.activityIcon}>
                  {getActivityIcon(activity.action)}
                </Text>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.moderator?.full_name || 'Admin'}
                  </Text>
                  <Text style={styles.activityDescription}>
                    {activity.action.replace(/_/g, ' ')} • {activity.target_type}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
        </View>
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
  welcomeCard: {
    backgroundColor: '#0066FF',
    margin: ResponsiveUtils.spacing(2),
    padding: ResponsiveUtils.spacing(3),
    borderRadius: 16,
  },
  welcomeTitle: {
    fontSize: ResponsiveUtils.fontSize(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  welcomeSubtitle: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ResponsiveUtils.spacing(1),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    margin: '1%',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  statIcon: {
    fontSize: ResponsiveUtils.fontSize(28),
  },
  statValue: {
    fontSize: ResponsiveUtils.fontSize(28),
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: ResponsiveUtils.fontSize(13),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  statChange: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  section: {
    paddingHorizontal: ResponsiveUtils.spacing(2),
    marginBottom: ResponsiveUtils.spacing(3),
  },
  sectionTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(1.5),
    color: '#1C1C1E',
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ResponsiveUtils.spacing(1),
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  alertTitle: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  alertArrow: {
    fontSize: ResponsiveUtils.fontSize(20),
    color: '#FF9500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -ResponsiveUtils.spacing(0.5),
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    margin: '1%',
    padding: ResponsiveUtils.spacing(2.5),
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionIcon: {
    fontSize: ResponsiveUtils.fontSize(36),
    marginBottom: ResponsiveUtils.spacing(1),
  },
  actionLabel: {
    fontSize: ResponsiveUtils.fontSize(13),
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activityIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#3C3C43',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  activityTime: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(5),
  },
  emptyIcon: {
    fontSize: ResponsiveUtils.fontSize(48),
    marginBottom: ResponsiveUtils.spacing(1),
  },
  emptyText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
  },
});
