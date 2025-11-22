import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { BodyCollaborationService } from '../../utils/bodyCollaborationService';

const JointCampaignsScreen = ({ route, navigation }) => {
  // Get bodyId from route or current user
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'active', label: 'Active', icon: '🚀' },
    { value: 'planning', label: 'Planning', icon: '📝' },
    { value: 'completed', label: 'Completed', icon: '✅' },
  ];

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadCampaigns();
    }
  }, [bodyId, filter]);

  const initializeBodyId = async () => {
    if (!bodyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setBodyId(user.id);
      }
    }
  };

  const loadCampaigns = async () => {
    try {
      const result = await BodyCollaborationService.getCampaigns(
        bodyId,
        filter === 'all' ? null : filter
      );
      if (result.success) {
        setCampaigns(result.campaigns || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      Alert.alert('Error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'awareness':
        return '📢';
      case 'fundraising':
        return '💰';
      case 'advocacy':
        return '📣';
      case 'service_delivery':
        return '🤲';
      case 'education':
        return '📚';
      default:
        return '🎯';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'planning':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderCampaign = ({ item }) => {
    const typeIcon = getCampaignTypeIcon(item.campaign_type);
    const statusColor = getStatusColor(item.status);
    
    // Calculate progress
    let progress = 0;
    if (item.target_amount && item.current_amount) {
      progress = (item.current_amount / item.target_amount) * 100;
    } else if (item.target_signatures && item.current_signatures) {
      progress = (item.current_signatures / item.target_signatures) * 100;
    }

    return (
      <TouchableOpacity
        style={styles.campaignCard}
        onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id })}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>

        <View style={styles.campaignHeader}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignName} numberOfLines={2}>
              {item.campaign_name}
            </Text>
            <Text style={styles.campaignType}>
              {item.campaign_type?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.campaignDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Lead Body */}
        <View style={styles.leadBody}>
          <Text style={styles.leadLabel}>Led by:</Text>
          <View style={styles.bodyBadge}>
            {item.lead_body?.logo_url ? (
              <Image source={{ uri: item.lead_body.logo_url }} style={styles.miniLogo} />
            ) : (
              <View style={styles.miniLogoPlaceholder}>
                <Text style={styles.miniLogoText}>
                  {item.lead_body?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.bodyName} numberOfLines={1}>
              {item.lead_body?.name || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Partners */}
        {item.partners && item.partners.length > 0 && (
          <View style={styles.partnersContainer}>
            <Text style={styles.partnersLabel}>
              🤝 {item.partners.length} Partner{item.partners.length !== 1 ? 's' : ''}
            </Text>
            <View style={styles.partnerLogos}>
              {item.partners.slice(0, 4).map((partner, index) =>
                partner.body?.logo_url ? (
                  <Image
                    key={index}
                    source={{ uri: partner.body.logo_url }}
                    style={[styles.partnerLogo, { marginLeft: index > 0 ? -10 : 0 }]}
                  />
                ) : (
                  <View
                    key={index}
                    style={[
                      styles.partnerLogo,
                      styles.partnerLogoPlaceholder,
                      { marginLeft: index > 0 ? -10 : 0 },
                    ]}
                  >
                    <Text style={styles.partnerLogoText}>
                      {partner.body?.name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )
              )}
              {item.partners.length > 4 && (
                <View style={[styles.partnerLogo, styles.morePartners]}>
                  <Text style={styles.moreText}>+{item.partners.length - 4}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Progress */}
        {(item.target_amount || item.target_signatures) && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: progress >= 100 ? '#4CAF50' : '#FF9800',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.target_amount
                ? `KES ${(item.current_amount || 0).toLocaleString()} / ${item.target_amount.toLocaleString()} (${progress.toFixed(0)}%)`
                : `${item.current_signatures || 0} / ${item.target_signatures} signatures (${progress.toFixed(0)}%)`}
            </Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.datesContainer}>
          {item.start_date && (
            <Text style={styles.dateText}>
              📅 Start: {new Date(item.start_date).toLocaleDateString()}
            </Text>
          )}
          {item.end_date && (
            <Text style={styles.dateText}>
              🏁 End: {new Date(item.end_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#FF9800" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9800" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Joint Campaigns</Text>
        <Text style={styles.headerSubtitle}>
          {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          renderItem={renderFilter}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚀</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
            </Text>
            <Text style={styles.emptySubtext}>
              Create joint campaigns with partner organizations to amplify your impact
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateCampaign', { bodyId })}
      >
        <Text style={styles.createButtonText}>+ New Campaign</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  header: {
    backgroundColor: '#FF9800',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF3E0',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF9800',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginRight: 70,
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  campaignType: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  campaignDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  leadBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leadLabel: {
    fontSize: 13,
    color: '#999999',
    marginRight: 8,
  },
  bodyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flex: 1,
  },
  miniLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  miniLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniLogoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bodyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  partnersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnersLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  partnerLogos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  partnerLogoPlaceholder: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerLogoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  morePartners: {
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    padding: 60,
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
    lineHeight: 20,
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default JointCampaignsScreen;
