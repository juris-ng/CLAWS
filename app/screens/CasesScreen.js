import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  purple: '#9C27B0',
  blue: '#2196F3',
};

export default function MyCasesScreen({ navigation }) {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusFilters = [
    { id: 'all', label: 'All Cases' },
    { id: 'filed', label: 'Filed' },
    { id: 'hearing', label: 'Hearing' },
    { id: 'verdict', label: 'Verdict' },
    { id: 'resolved', label: 'Resolved' },
  ];

  const statusConfig = {
    filed: { color: COLORS.warning, icon: 'document-text-outline' },
    hearing: { color: COLORS.blue, icon: 'hammer-outline' },
    verdict: { color: COLORS.purple, icon: 'document-outline' },
    resolved: { color: COLORS.success, icon: 'checkmark-circle-outline' },
    dismissed: { color: COLORS.error, icon: 'close-circle-outline' },
  };

  useEffect(() => {
    if (user?.id) {
      loadMyCases();
    }
  }, [user]);

  useEffect(() => {
    if (cases.length > 0) {
      filterCases();
    }
  }, [filter, searchQuery]);

  const loadMyCases = async () => {
    try {
      setLoading(true);

      const { data: participations, error: participationError } = await supabase
        .from('case_participants')
        .select('case_id')
        .eq('member_id', user.id);

      if (participationError) throw participationError;

      if (!participations || participations.length === 0) {
        setCases([]);
        setLoading(false);
        return;
      }

      const caseIds = participations.map((p) => p.case_id);

      const { data: casesData, error: casesError } = await supabase
        .from('legal_cases')
        .select(
          `
          *,
          case_timeline(count),
          case_participants(count)
        `
        )
        .in('id', caseIds)
        .order('escalation_date', { ascending: false });

      if (casesError) throw casesError;

      const casesWithDetails = await Promise.all(
        casesData.map(async (caseItem) => {
          const { data: latestUpdate } = await supabase
            .from('case_timeline')
            .select('*')
            .eq('case_id', caseItem.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...caseItem,
            timelineCount: caseItem.case_timeline?.[0]?.count || 0,
            participantCount: caseItem.case_participants?.[0]?.count || 0,
            latestUpdate: latestUpdate?.[0] || null,
          };
        })
      );

      setCases(casesWithDetails);
    } catch (error) {
      console.error('Error loading cases:', error);
      Alert.alert('Error', 'Failed to load your cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    if (filter !== 'all') {
      filtered = filtered.filter((c) => c.status === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyCases();
  };

  const renderCaseCard = ({ item }) => {
    const config = statusConfig[item.status] || statusConfig.filed;

    return (
      <TouchableOpacity
        style={[styles.caseCard, { borderLeftColor: config.color }]}
        onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIconBox, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon} size={18} color={config.color} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.caseDate}>
            {new Date(item.escalation_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.caseName} numberOfLines={2}>
          {item.name || 'Untitled Case'}
        </Text>

        {item.description && (
          <Text style={styles.caseDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.participantCount}</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.mediumGray} />
            <Text style={styles.statText}>{item.timelineCount} updates</Text>
          </View>
        </View>

        {item.latestUpdate && (
          <View style={styles.latestUpdate}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={COLORS.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.updateText} numberOfLines={1}>
              {item.latestUpdate.description}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const filteredCases = filterCases();

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your cases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Cases</Text>
            <Text style={styles.headerSubtitle}>
              {cases.length} escalated case{cases.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cases..."
            placeholderTextColor={COLORS.mediumGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {statusFilters.map((filterItem) => (
              <TouchableOpacity
                key={filterItem.id}
                style={[
                  styles.filterChip,
                  filter === filterItem.id && styles.filterChipActive,
                ]}
                onPress={() => setFilter(filterItem.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === filterItem.id && styles.filterTextActive,
                  ]}
                >
                  {filterItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cases List */}
        <FlatList
          data={filteredCases}
          renderItem={renderCaseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>
                {cases.length === 0 ? 'No cases yet' : 'No matching cases'}
              </Text>
              <Text style={styles.emptyText}>
                {cases.length === 0
                  ? 'Cases you participate in escalating will appear here'
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
    padding: 0,
  },
  filtersWrapper: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    marginBottom: 4,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
  },
  filterChipActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  caseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  caseDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  caseName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  caseDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.veryLightGray,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  latestUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  updateText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
