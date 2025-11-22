import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LawyerService } from '../../utils/lawyerService';

const LawyersListScreen = ({ navigation }) => {
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [practiceAreas, setPracticeAreas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating, experience, fee
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    searchLawyers();
  }, [selectedPracticeArea, minRating, maxFee, sortBy]);

  useEffect(() => {
    filterBySearchQuery();
  }, [searchQuery, lawyers]);

  const loadData = async () => {
    try {
      const [lawyersResult, areasResult] = await Promise.all([
        LawyerService.searchLawyers({}),
        LawyerService.getPracticeAreas(),
      ]);

      if (lawyersResult.success) {
        setLawyers(lawyersResult.lawyers || []);
        setFilteredLawyers(lawyersResult.lawyers || []);
      }

      if (areasResult.success) {
        setPracticeAreas(areasResult.practiceAreas || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchLawyers = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedPracticeArea) {
        filters.practiceAreaId = selectedPracticeArea;
      }
      if (minRating) {
        filters.minRating = parseFloat(minRating);
      }
      if (maxFee) {
        filters.maxConsultationFee = parseFloat(maxFee);
      }

      const result = await LawyerService.searchLawyers(filters);
      if (result.success) {
        let results = result.lawyers || [];
        
        // Sort results
        results = sortLawyers(results);
        
        setLawyers(results);
        setFilteredLawyers(results);
      }
    } catch (error) {
      console.error('Error searching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortLawyers = (lawyersList) => {
    const sorted = [...lawyersList];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'experience':
        return sorted.sort((a, b) => (b.years_of_experience || 0) - (a.years_of_experience || 0));
      case 'fee':
        return sorted.sort((a, b) => (a.consultation_fee || 999999) - (b.consultation_fee || 999999));
      default:
        return sorted;
    }
  };

  const filterBySearchQuery = () => {
    if (!searchQuery.trim()) {
      setFilteredLawyers(lawyers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = lawyers.filter((lawyer) => {
      const name = lawyer.full_name?.toLowerCase() || '';
      const firm = lawyer.law_firm?.toLowerCase() || '';
      const bio = lawyer.bio?.toLowerCase() || '';
      
      return name.includes(query) || firm.includes(query) || bio.includes(query);
    });

    setFilteredLawyers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    setSelectedPracticeArea('');
    setMinRating('');
    setMaxFee('');
    loadData();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPracticeArea('');
    setMinRating('');
    setMaxFee('');
    searchLawyers();
  };

  const renderLawyer = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.lawyerCard}
        onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}
      >
        <View style={styles.lawyerHeader}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.lawyerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.lawyerName} numberOfLines={1}>
                {item.full_name || 'Unknown'}
              </Text>
              {item.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            {item.law_firm && (
              <Text style={styles.lawFirm} numberOfLines={1}>
                {item.law_firm}
              </Text>
            )}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingIcon}>⭐</Text>
              <Text style={styles.ratingText}>
                {(item.rating || 0).toFixed(1)}
              </Text>
              <Text style={styles.ratingCount}>({item.total_reviews || 0})</Text>
              {item.is_available && (
                <View style={styles.availableDot} />
              )}
            </View>
          </View>
        </View>

        {item.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}

        <View style={styles.lawyerFooter}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💼</Text>
            <Text style={styles.detailText}>{item.years_of_experience || 0} yrs</Text>
          </View>
          {item.consultation_fee && (
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>💰</Text>
              <Text style={styles.detailText}>
                {item.consultation_fee.toLocaleString()} KES
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}
          >
            <Text style={styles.viewProfileText}>View Profile →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading lawyers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, firm, or expertise..."
              placeholderTextColor="#999999"
            />
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Results Count & Sort */}
          <View style={styles.resultsBar}>
            <Text style={styles.resultsCount}>
              {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} found
            </Text>
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort:</Text>
              <TouchableOpacity onPress={() => setSortBy('rating')}>
                <Text style={[styles.sortOption, sortBy === 'rating' && styles.sortActive]}>
                  Rating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortBy('experience')}>
                <Text style={[styles.sortOption, sortBy === 'experience' && styles.sortActive]}>
                  Experience
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortBy('fee')}>
                <Text style={[styles.sortOption, sortBy === 'fee' && styles.sortActive]}>
                  Fee
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Practice Area:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedPracticeArea}
                    onValueChange={setSelectedPracticeArea}
                    style={styles.picker}
                  >
                    <Picker.Item label="All Areas" value="" />
                    {Array.isArray(practiceAreas) &&
                      practiceAreas.map((area) => (
                        <Picker.Item
                          key={area.id}
                          label={`${area.icon || ''} ${area.name || 'Unknown'}`}
                          value={area.id}
                        />
                      ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Min Rating:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={minRating}
                    onValueChange={setMinRating}
                    style={styles.picker}
                  >
                    <Picker.Item label="Any" value="" />
                    <Picker.Item label="⭐ 1+" value="1" />
                    <Picker.Item label="⭐ 2+" value="2" />
                    <Picker.Item label="⭐ 3+" value="3" />
                    <Picker.Item label="⭐ 4+" value="4" />
                  </Picker>
                </View>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Max Fee (KES):</Text>
                <TextInput
                  style={styles.filterInput}
                  value={maxFee}
                  onChangeText={setMaxFee}
                  placeholder="e.g., 5000"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Lawyers List */}
        <FlatList
          data={filteredLawyers || []}
          renderItem={renderLawyer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyText}>No lawyers found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedPracticeArea || minRating || maxFee
                  ? 'Try adjusting your search filters'
                  : 'No lawyers available at the moment'}
              </Text>
            </View>
          }
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('RegisterLawyer')}
        >
          <Text style={styles.registerButtonIcon}>+</Text>
          <Text style={styles.registerButtonText}>Register as Lawyer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterToggle: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
  },
  sortOption: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 8,
  },
  sortActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
  },
  filterInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearFiltersButton: {
    backgroundColor: '#FF5252',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  lawyerCard: {
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
  lawyerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lawyerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lawFirm: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  lawyerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666666',
  },
  viewProfileButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewProfileText: {
    fontSize: 12,
    color: '#2196F3',
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
  registerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  registerButtonIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LawyersListScreen;
