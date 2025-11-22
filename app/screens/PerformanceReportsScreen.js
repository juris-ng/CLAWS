import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { LawyerService } from '../../utils/lawyerService';

const PerformanceReportsScreen = ({ navigation }) => {
  const [lawyerId, setLawyerId] = useState(null);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  useEffect(() => {
    loadLawyerData();
  }, []);

  useEffect(() => {
    if (lawyerId) {
      loadPerformanceData();
    }
  }, [lawyerId, timeRange]);

  const loadLawyerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLawyerId(user.id);
      }
    } catch (error) {
      console.error('Error loading lawyer data:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Load stats
      const statsResult = await LawyerService.getLawyerStats(lawyerId);
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      // Generate mock reports (you can replace with actual report generation)
      const generatedReports = await generateReports();
      setReports(generatedReports);
    } catch (error) {
      console.error('Error loading performance data:', error);
      Alert.alert('Error', 'Failed to load performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateReports = async () => {
    const now = new Date();
    const reports = [];

    // Monthly Report
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    reports.push({
      id: 'monthly-' + monthStart.getTime(),
      report_type: 'monthly',
      status: 'published',
      report_period_start: monthStart,
      report_period_end: monthEnd,
      summary_text:
        'Monthly performance summary including cases handled, consultations completed, and client satisfaction ratings.',
      created_at: now,
    });

    // Quarterly Report
    const quarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    reports.push({
      id: 'quarterly-' + quarterStart.getTime(),
      report_type: 'quarterly',
      status: 'published',
      report_period_start: quarterStart,
      report_period_end: quarterEnd,
      summary_text:
        'Quarterly performance analysis showing trends in case outcomes, revenue, and professional development.',
      created_at: now,
    });

    // Annual Report
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    reports.push({
      id: 'annual-' + yearStart.getTime(),
      report_type: 'annual',
      status: 'draft',
      report_period_start: yearStart,
      report_period_end: yearEnd,
      summary_text:
        'Comprehensive annual review of all legal activities, achievements, and areas for improvement.',
      created_at: now,
    });

    return reports;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPerformanceData();
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'monthly':
        return '📅';
      case 'quarterly':
        return '📊';
      case 'annual':
        return '📈';
      case 'custom':
        return '📋';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#4CAF50';
      case 'draft':
        return '#FF9800';
      case 'archived':
        return '#9E9E9E';
      default:
        return '#666666';
    }
  };

  const handleViewReport = (report) => {
    // Navigate to detailed report view
    Alert.alert('Report Details', `Viewing ${report.report_type} report`);
    // navigation.navigate('ReportDetail', { reportId: report.id });
  };

  const handleExportReport = (report) => {
    Alert.alert('Export Report', `Exporting ${report.report_type} report as PDF`);
    // Implement PDF export functionality
  };

  const renderReport = ({ item }) => {
    const icon = getReportTypeIcon(item.report_type);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity style={styles.reportCard} onPress={() => handleViewReport(item)}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportIcon}>{icon}</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportType}>{item.report_type.toUpperCase()} REPORT</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.periodContainer}>
          <Text style={styles.periodLabel}>Period:</Text>
          <Text style={styles.periodText}>
            {new Date(item.report_period_start).toLocaleDateString()} -{' '}
            {new Date(item.report_period_end).toLocaleDateString()}
          </Text>
        </View>

        {item.summary_text && (
          <Text style={styles.summary} numberOfLines={2}>
            {item.summary_text}
          </Text>
        )}

        <View style={styles.reportFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewReport(item)}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExportReport(item)}
          >
            <Text style={styles.exportButtonText}>📄 Export</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance Reports</Text>
        <Text style={styles.headerSubtitle}>Track your professional growth</Text>
      </View>

      {/* Key Metrics Summary */}
      {stats && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.totalCases || 0}</Text>
            <Text style={styles.metricLabel}>Total Cases</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.totalConsultations || 0}</Text>
            <Text style={styles.metricLabel}>Consultations</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.averageRating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.metricLabel}>Avg Rating</Text>
          </View>
        </View>
      )}

      {/* Time Range Filter */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.filterLabel}>Time Range:</Text>
        <View style={styles.timeRangeButtons}>
          {['week', 'month', 'year'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Available Reports</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading performance reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No reports available</Text>
              <Text style={styles.emptySubtext}>Reports will be generated automatically</Text>
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
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timeRangeContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 6,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  summary: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  reportFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exportButtonText: {
    color: '#333',
    fontSize: 14,
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

export default PerformanceReportsScreen;
