import { useEffect, useState } from 'react';
import {
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
import { BodyCollaborationService } from '../../utils/bodyCollaborationService';


const ResourceSharingScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;


  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const resourceTypes = [
    { value: 'all', label: 'All Resources', icon: '📦' },
    { value: 'venue', label: 'Venues', icon: '🏢' },
    { value: 'equipment', label: 'Equipment', icon: '🔧' },
    { value: 'expertise', label: 'Expertise', icon: '🎓' },
    { value: 'funding', label: 'Funding', icon: '💰' },
    { value: 'volunteers', label: 'Volunteers', icon: '👥' },
    { value: 'data', label: 'Data', icon: '📊' }
  ];


  useEffect(() => {
    loadResources();
  }, [filter]);


  const loadResources = async () => {
    try {
      const filters = {
        resourceType: filter === 'all' ? null : filter,
        availability: 'available'
      };
      const result = await BodyCollaborationService.getResources(filters);
      if (result.success) {
        setResources(result.resources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadResources();
  };


  const handleRequestResource = (resource) => {
    navigation.navigate('RequestResource', {
      bodyId,
      resourceId: resource.id,
      resource
    });
  };


  const getResourceIcon = (type) => {
    const resource = resourceTypes.find(r => r.value === type);
    return resource?.icon || '📦';
  };


  const getSharingTermsColor = (terms) => {
    switch (terms) {
      case 'free': return '#4CAF50';
      case 'paid': return '#FF9800';
      case 'exchange': return '#2196F3';
      case 'conditional': return '#9C27B0';
      default: return '#666666';
    }
  };


  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filter === item.value && styles.filterChipActive
      ]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[
        styles.filterText,
        filter === item.value && styles.filterTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );


  const renderResource = ({ item }) => {
    const icon = getResourceIcon(item.resource_type);
    const termsColor = getSharingTermsColor(item.sharing_terms);


    return (
      <View style={styles.resourceCard}>
        <View style={styles.resourceHeader}>
          <Text style={styles.resourceIcon}>{icon}</Text>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceName}>{item.resource_name}</Text>
            <Text style={styles.resourceType}>
              {item.resource_type.toUpperCase()}
            </Text>
          </View>
        </View>


        {item.description && (
          <Text style={styles.resourceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}


        <View style={styles.detailsContainer}>
          {item.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          )}


          {item.capacity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>Capacity: {item.capacity}</Text>
            </View>
          )}


          {item.cost && item.sharing_terms === 'paid' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>💰</Text>
              <Text style={styles.detailText}>KES {item.cost.toLocaleString()}</Text>
            </View>
          )}
        </View>


        <View style={styles.termsBadge} style={{ backgroundColor: termsColor + '20' }}>
          <Text style={[styles.termsText, { color: termsColor }]}>
            {item.sharing_terms.toUpperCase()}
          </Text>
        </View>


        {item.body && (
          <View style={styles.providerInfo}>
            <Text style={styles.providerLabel}>Provided by:</Text>
            <Text style={styles.providerName}>{item.body.name}</Text>
          </View>
        )}


        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => handleRequestResource(item)}
        >
          <Text style={styles.requestButtonText}>Request Resource</Text>
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.container}>
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={resourceTypes}
            renderItem={renderFilter}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>


        <FlatList
          data={resources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No resources available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for shared resources
              </Text>
            </View>
          }
        />


        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateResource', { bodyId })}
        >
          <Text style={styles.addButtonText}>+ Share Resource</Text>
        </TouchableOpacity>
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
    backgroundColor: '#0066FF',
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
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  resourceType: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  termsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  termsText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerLabel: {
    fontSize: 13,
    color: '#999999',
    marginRight: 6,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  requestButton: {
    backgroundColor: '#0066FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default ResourceSharingScreen;
