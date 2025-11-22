// screens/activity/MyTrackScreen.js
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
  teal: '#009688',
};

// Universal progress steps for all activities
const PROGRESS_STEPS = [
  { id: 'all', label: 'All', icon: 'apps-outline', color: COLORS.darkGray },
  { id: 'initiated', label: 'Initiated', icon: 'flag-outline', color: COLORS.blue },
  { id: 'planning', label: 'Planning', icon: 'create-outline', color: COLORS.warning },
  { id: 'active', label: 'Active', icon: 'flash-outline', color: COLORS.primary },
  { id: 'review', label: 'Review', icon: 'eye-outline', color: COLORS.purple },
  { id: 'completed', label: 'Completed', icon: 'checkmark-circle-outline', color: COLORS.success },
];

const ACTIVITY_TYPES = {
  petition: { color: COLORS.blue, icon: 'document-text', label: 'Petition' },
  project: { color: COLORS.primary, icon: 'briefcase', label: 'Project' },
  movement: { color: COLORS.purple, icon: 'megaphone', label: 'Movement' },
  campaign: { color: COLORS.teal, icon: 'flag', label: 'Campaign' },
};

export default function MyTrackScreen({ navigation }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    try {
      setLoading(true);

      // Get user's body memberships
      const { data: memberships, error: memberError } = await supabase
        .from('body_members')
        .select('body_id')
        .eq('member_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const bodyIds = memberships.map((m) => m.body_id);

      // Fetch petitions
      const { data: petitions, error: petitionsError } = await supabase
        .from('petitions')
        .select(`
          id,
          title,
          description,
          body_id,
          signature_count,
          target_signatures,
          status,
          created_at,
          bodies:body_id (name)
        `)
        .in('body_id', bodyIds)
        .order('created_at', { ascending: false });

      if (petitionsError) throw petitionsError;

      // Transform to unified format
      const activityData = (petitions || []).map((petition) => {
        const progress = mapPetitionToStep(petition);
        const stepData = PROGRESS_STEPS.find(s => s.id === progress) || PROGRESS_STEPS[0];

        return {
          id: petition.id,
          type: 'petition',
          title: petition.title,
          description: petition.description,
          bodyName: petition.bodies?.name || 'Organization',
          currentStep: progress,
          stepLabel: stepData.label,
          stepColor: stepData.color,
          created_at: petition.created_at,
          metadata: {
            signatures: petition.signature_count || 0,
            target: petition.target_signatures || 1000,
            status: petition.status,
          },
        };
      });

      setActivities(activityData);
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const mapPetitionToStep = (petition) => {
    if (petition.status === 'completed' || petition.status === 'resolved') return 'completed';
    if (petition.status === 'under_review' || petition.status === 'submitted') return 'review';
    
    const signatureProgress = (petition.signature_count || 0) / (petition.target_signatures || 1000);
    
    if (signatureProgress >= 0.7) return 'active';
    if (signatureProgress >= 0.3) return 'planning';
    return 'initiated';
  };

  const filterByStep = () => {
    let filtered = [...activities];

    if (currentStep !== 'all') {
      filtered = filtered.filter((a) => a.currentStep === currentStep);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.bodyName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const getStepProgress = (step) => {
    const stepIndex = PROGRESS_STEPS.findIndex(s => s.id === step);
    if (stepIndex <= 0) return 0;
    return Math.round((stepIndex / (PROGRESS_STEPS.length - 1)) * 100);
  };

  const renderActivityCard = ({ item }) => {
    const typeConfig = ACTIVITY_TYPES[item.type];
    const progressPercent = getStepProgress(item.currentStep);

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => {
          if (item.type === 'petition') {
            navigation.navigate('PetitionDetails', { petitionId: item.id });
          }
        }}
        activeOpacity={0.7}
      >
        {/* Type Badge & Step Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '15' }]}>
            <Ionicons name={typeConfig.icon} size={12} color={typeConfig.color} />
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
          <View style={[styles.stepBadge, { backgroundColor: item.stepColor + '15' }]}>
            <Text style={[styles.stepBadgeText, { color: item.stepColor }]}>
              {item.stepLabel}
            </Text>
          </View>
        </View>

        {/* Title & Body */}
        <Text style={styles.activityTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bodyName} numberOfLines={1}>
          {item.bodyName}
        </Text>

        {/* Description */}
        {item.description && (
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: item.stepColor },
              ]}
            />
          </View>
          <Text style={[styles.progressPercent, { color: item.stepColor }]}>
            {progressPercent}%
          </Text>
        </View>

        {/* Footer Metadata */}
        <View style={styles.cardFooter}>
          <View style={styles.metadataRow}>
            {item.type === 'petition' && (
              <View style={styles.metadataItem}>
                <Ionicons name="people" size={14} color={COLORS.mediumGray} />
                <Text style={styles.metadataText}>
                  {item.metadata.signatures.toLocaleString()} signed
                </Text>
              </View>
            )}
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.mediumGray} />
              <Text style={styles.metadataText}>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
        </View>
      </TouchableOpacity>
    );
  };

  const filteredActivities = filterByStep();

  // Count activities per step
  const stepCounts = PROGRESS_STEPS.map(step => ({
    ...step,
    count: step.id === 'all' 
      ? activities.length 
      : activities.filter(a => a.currentStep === step.id).length,
  }));

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your track...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Track Progress</Text>
              <Text style={styles.headerSubtitle}>
                {activities.length} active • {filteredActivities.length} showing
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Home', { screen: 'CreatePetitionType' })}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={COLORS.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
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
        </View>

        {/* STEP FILTERS (TABS) */}
        <View style={styles.stepsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepsContent}
          >
            {stepCounts.map((step) => (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepChip,
                  currentStep === step.id && styles.stepChipActive,
                  currentStep === step.id && { borderColor: step.color },
                ]}
                onPress={() => setCurrentStep(step.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={currentStep === step.id ? step.color : COLORS.mediumGray}
                />
                <Text
                  style={[
                    styles.stepText,
                    currentStep === step.id && { color: step.color, fontWeight: '700' },
                  ]}
                >
                  {step.label}
                </Text>
                {step.count > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: currentStep === step.id ? step.color : COLORS.lightGray },
                    ]}
                  >
                    <Text style={styles.countText}>{step.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Activities List */}
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityCard}
          keyExtractor={(item) => `${item.type}-${item.id}`}
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
              <Ionicons
                name={activities.length === 0 ? 'trending-up-outline' : 'search-outline'}
                size={64}
                color={COLORS.lightGray}
              />
              <Text style={styles.emptyTitle}>
                {activities.length === 0 
                  ? 'No activities to track' 
                  : `No activities in ${PROGRESS_STEPS.find(s => s.id === currentStep)?.label} step`}
              </Text>
              <Text style={styles.emptyText}>
                {activities.length === 0
                  ? 'Join organizations and participate in initiatives to track progress'
                  : 'Activities in this stage will appear here'}
              </Text>
              {activities.length === 0 && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigation.navigate('Home', { screen: 'CreatePetitionType' })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.createButtonText}>Get Started</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: COLORS.white,
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
    padding: 0,
  },

  // STEP FILTERS
  stepsContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  stepsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.veryLightGray,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  stepChipActive: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },

  // List
  listContent: {
    padding: 16,
  },

  // Activity Card
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
    lineHeight: 24,
  },
  bodyName: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 12,
    lineHeight: 20,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
