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
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { CaseService } from '../../utils/caseService';
import { LawyerService } from '../../utils/lawyerService';

const ImpactTrackingScreen = ({ navigation }) => {
  const [lawyerId, setLawyerId] = useState(null);
  const [impacts, setImpacts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLawyerData();
  }, []);

  useEffect(() => {
    if (lawyerId) {
      loadImpacts();
    }
  }, [lawyerId]);

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

  const loadImpacts = async () => {
    try {
      // Get lawyer stats
      const statsResult = await LawyerService.getLawyerStats(lawyerId);
      if (statsResult.success) {
        setSummary(statsResult.stats);
      }

      // Get case stats
      const caseStatsResult = await CaseService.getCaseStats(lawyerId);
      
      // Generate impact records from actual data
      const impactRecords = [];

      if (caseStatsResult.success && caseStatsResult.stats) {
        const stats = caseStatsResult.stats;

        // Cases Won Impact
        if (stats.closedCases > 0) {
          impactRecords.push({
            id: 'cases-won',
            title: 'Cases Successfully Closed',
            impact_type: 'case_success',
            impact_category: 'legal',
            description: `Successfully resolved ${stats.closedCases} legal cases, providing justice and legal remedies to clients.`,
            beneficiaries_count: stats.closedCases,
            quantitative_metrics: {
              'Total Cases': stats.totalCases,
              'Success Rate': `${((stats.closedCases / stats.totalCases) * 100).toFixed(1)}%`,
            },
            recorded_date: new Date(),
          });
        }

        // Active Cases Impact
        if (stats.activeCases > 0) {
          impactRecords.push({
            id: 'active-cases',
            title: 'Active Case Management',
            impact_type: 'ongoing_service',
            impact_category: 'legal',
            description: `Currently managing ${stats.activeCases} active cases, providing ongoing legal support and representation.`,
            beneficiaries_count: stats.activeCases,
            quantitative_metrics: {
              'Active Cases': stats.activeCases,
              'Urgent Cases': stats.urgentCases || 0,
            },
            recorded_date: new Date(),
          });
        }

        // Pro Bono Impact
        if (stats.proBonoHours > 0) {
          impactRecords.push({
            id: 'pro-bono',
            title: 'Pro Bono Legal Services',
            impact_type: 'community_service',
            impact_category: 'social',
            description: `Provided ${stats.proBonoHours} hours of free legal services to underserved communities and individuals.`,
            beneficiaries_count: stats.proBonoClients || 0,
            quantitative_metrics: {
              'Pro Bono Hours': stats.proBonoHours,
              'Clients Served': stats.proBonoClients || 0,
            },
            recorded_date: new Date(),
          });
        }
      }

      // Consultation Impact
      if (statsResult.success && statsResult.stats.totalConsultations > 0) {
        impactRecords.push({
          id: 'consultations',
          title: 'Legal Consultations Provided',
          impact_type: 'consultation_service',
          impact_category: 'legal',
          description: `Conducted ${statsResult.stats.totalConsultations} legal consultations, providing guidance and advice to individuals seeking legal help.`,
          beneficiaries_count: statsResult.stats.totalConsultations,
          quantitative_metrics: {
            'Total Consultations': statsResult.stats.totalConsultations,
            'Avg Rating': statsResult.stats.averageRating?.toFixed(1) || 'N/A',
          },
          recorded_date: new Date(),
        });
      }

      // Client Satisfaction Impact
      if (statsResult.success && statsResult.stats.totalReviews > 0) {
        impactRecords.push({
          id: 'client-satisfaction',
          title: 'Client Satisfaction Achievement',
          impact_type: 'quality_service',
          impact_category: 'professional',
          description: `Maintained high client satisfaction with an average rating of ${statsResult.stats.averageRating?.toFixed(1)} stars across ${statsResult.stats.totalReviews} reviews.`,
          beneficiaries_count: statsResult.stats.totalReviews,
          quantitative_metrics: {
            'Average Rating': `${statsResult.stats.averageRating?.toFixed(1)} / 5.0`,
            'Total Reviews': statsResult.stats.totalReviews,
            'Positive Feedback': `${((statsResult.stats.averageRating / 5) * 100).toFixed(0)}%`,
          },
          recorded_date: new Date(),
        });
      }

      setImpacts(impactRecords);
    } catch (error) {
      console.error('Error loading impacts:', error);
      Alert.alert('Error', 'Failed to load impact data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadImpacts();
  };

  const getImpactTypeIcon = (type) => {
    switch (type) {
      case 'case_success':
        return '✅';
      case 'ongoing_service':
        return '⚖️';
      case 'community_service':
        return '🤲';
      case 'consultation_service':
        return '💬';
      case 'quality_service':
        return '⭐';
      default:
        return '📊';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'legal':
        return '#2196F3';
      case 'social':
        return '#4CAF50';
      case 'professional':
        return '#FF9800';
      case 'community':
        return '#9C27B0';
      default:
        return '#666666';
    }
  };

  const renderImpact = ({ item }) => {
    const icon = getImpactTypeIcon(item.impact_type);
    const categoryColor = getCategoryColor(item.impact_category);

    return (
      <View style={styles.impactCard}>
        <View style={styles.impactHeader}>
          <Text style={styles.impactIcon}>{icon}</Text>
          <View style={styles.impactInfo}>
            <Text style={styles.impactTitle}>{item.title}</Text>
            <Text style={styles.impactType}>
              {item.impact_type.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.impactDescription}>{item.description}</Text>
        )}

        <View style={styles.impactMetrics}>
          {item.beneficiaries_count && (
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>👥</Text>
              <Text style={styles.metricText}>
                {item.beneficiaries_count.toLocaleString()} beneficiaries
              </Text>
            </View>
          )}

          {item.impact_category && (
            <View
              style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}
            >
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.impact_category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {item.quantitative_metrics && (
          <View style={styles.quantMetrics}>
            <Text style={styles.quantTitle}>Key Metrics:</Text>
            {Object.entries(item.quantitative_metrics).map(([key, value]) => (
              <View key={key} style={styles.quantItem}>
                <Text style={styles.quantLabel}>{key}:</Text>
                <Text style={styles.quantValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.impactDate}>
          Last Updated: {new Date(item.recorded_date).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Professional Impact</Text>
        <Text style={styles.headerSubtitle}>Track your legal career achievements</Text>
      </View>

      {/* Overall Summary */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Impact Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalCases || 0}</Text>
              <Text style={styles.summaryLabel}>Total Cases</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalConsultations || 0}</Text>
              <Text style={styles.summaryLabel}>Consultations</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {summary.averageRating?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.summaryLabel}>Avg Rating</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalReviews || 0}</Text>
              <Text style={styles.summaryLabel}>Reviews</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Impact Highlights</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading impact data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <FlatList
          data={impacts}
          renderItem={renderImpact}
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
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No impact records yet</Text>
              <Text style={styles.emptySubtext}>
                Start taking cases to build your impact profile
              </Text>
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
  summaryCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  impactCard: {
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
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  impactIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  impactInfo: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  impactType: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  impactDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  impactMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metricText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  quantMetrics: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  quantTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quantLabel: {
    fontSize: 13,
    color: '#666666',
  },
  quantValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  impactDate: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
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

export default ImpactTrackingScreen;
