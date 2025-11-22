import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { WhistleblowService } from '../../utils/whistleblowService';
import WhistleblowCard from '../components/WhistleblowCard';

const WhistleblowListScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // NEW: Create Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    category: 'corruption',
    severity: 'medium',
    description: '',
    target_entity: '',
    location: '',
    is_anonymous: true,
  });

  const categories = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'corruption', label: 'Corruption', icon: '💰' },
    { value: 'harassment', label: 'Harassment', icon: '⚠️' },
    { value: 'fraud', label: 'Fraud', icon: '🚨' },
    { value: 'safety', label: 'Safety', icon: '🛡️' },
    { value: 'environmental', label: 'Environmental', icon: '🌍' },
    { value: 'other', label: 'Other', icon: '📢' }
  ];

  useEffect(() => {
    loadReports();
  }, [selectedCategory, selectedSeverity]);

  const loadReports = async () => {
    try {
      const filters = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      if (selectedSeverity !== 'all') {
        filters.severity = selectedSeverity;
      }

      const result = await WhistleblowService.getAllReports(filters);
      if (result.success) {
        setReports(result.reports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleReportPress = (report) => {
    navigation.navigate('WhistleblowDetail', { reportId: report.id });
  };

  // MODIFIED: Open modal instead of navigation
  const handleCreateReport = () => {
    setShowCreateModal(true);
  };

  // NEW: Submit Report Handler
  const handleSubmitReport = async () => {
    // Validation
    if (!newReport.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!newReport.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (newReport.description.length < 20) {
      Alert.alert('Error', 'Description must be at least 20 characters');
      return;
    }

    setSubmitting(true);

    try {
      const result = await WhistleblowService.createReport(newReport);
      
      if (result.success) {
        Alert.alert('Success', 'Report submitted successfully');
        setShowCreateModal(false);
        
        // Reset form
        setNewReport({
          title: '',
          category: 'corruption',
          severity: 'medium',
          description: '',
          target_entity: '',
          location: '',
          is_anonymous: true,
        });
        
        // Reload reports
        loadReports();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedCategory === item.value && styles.filterChipActive
      ]}
      onPress={() => setSelectedCategory(item.value)}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text style={[
        styles.filterText,
        selectedCategory === item.value && styles.filterTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderReport = ({ item }) => (
    <WhistleblowCard report={item} onPress={() => handleReportPress(item)} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F44336" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Whistle-blow Reports</Text>
          <Text style={styles.headerSubtitle}>
            Expose wrongdoing safely and anonymously
          </Text>
        </View>

        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={categories}
            renderItem={renderCategoryFilter}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No reports found</Text>
              <Text style={styles.emptySubtext}>
                Be the first to report an issue
              </Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.createButton} onPress={handleCreateReport}>
          <Text style={styles.createButtonIcon}>🚨</Text>
          <Text style={styles.createButtonText}>Report Issue</Text>
        </TouchableOpacity>

        {/* NEW: CREATE REPORT MODAL */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report Issue</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brief summary of the issue"
                  value={newReport.title}
                  onChangeText={(text) => setNewReport({ ...newReport, title: text })}
                  maxLength={200}
                  placeholderTextColor="#999999"
                />

                {/* Category */}
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newReport.category}
                    onValueChange={(value) => setNewReport({ ...newReport, category: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="💰 Corruption" value="corruption" />
                    <Picker.Item label="⚠️ Harassment" value="harassment" />
                    <Picker.Item label="🚨 Fraud" value="fraud" />
                    <Picker.Item label="🛡️ Safety" value="safety" />
                    <Picker.Item label="🌍 Environmental" value="environmental" />
                    <Picker.Item label="📢 Other" value="other" />
                  </Picker>
                </View>

                {/* Severity */}
                <Text style={styles.label}>Severity *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newReport.severity}
                    onValueChange={(value) => setNewReport({ ...newReport, severity: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="⬇️ Low" value="low" />
                    <Picker.Item label="➡️ Medium" value="medium" />
                    <Picker.Item label="⬆️ High" value="high" />
                    <Picker.Item label="🚨 Critical" value="critical" />
                  </Picker>
                </View>

                {/* Description */}
                <Text style={styles.label}>Description * (min 20 characters)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the issue in detail..."
                  value={newReport.description}
                  onChangeText={(text) => setNewReport({ ...newReport, description: text })}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={2000}
                  placeholderTextColor="#999999"
                />
                <Text style={styles.charCount}>{newReport.description.length}/2000</Text>

                {/* Target Entity */}
                <Text style={styles.label}>Target Entity (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Organization or individual involved"
                  value={newReport.target_entity}
                  onChangeText={(text) => setNewReport({ ...newReport, target_entity: text })}
                  placeholderTextColor="#999999"
                />

                {/* Location */}
                <Text style={styles.label}>Location (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Where did this occur?"
                  value={newReport.location}
                  onChangeText={(text) => setNewReport({ ...newReport, location: text })}
                  placeholderTextColor="#999999"
                />

                {/* Anonymous Toggle */}
                <View style={styles.anonymousToggle}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Submit Anonymously</Text>
                    <Text style={styles.toggleDescription}>
                      Your identity will be protected
                    </Text>
                  </View>
                  <Switch
                    value={newReport.is_anonymous}
                    onValueChange={(value) => setNewReport({ ...newReport, is_anonymous: value })}
                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                    thumbColor={newReport.is_anonymous ? '#2E7D32' : '#f4f3f4'}
                  />
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>💡</Text>
                  <Text style={styles.infoText}>
                    {newReport.is_anonymous
                      ? 'Your report will be submitted anonymously. Your identity will be protected.'
                      : 'Providing your identity may help authorities follow up with you for more information.'}
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmitReport}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.modalFooter} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#F44336',
    padding: 24,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFEBEE',
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
    backgroundColor: '#F44336',
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
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  createButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // NEW: Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalClose: {
    fontSize: 32,
    color: '#666666',
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#F5F5F5',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  anonymousToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0066FF',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    height: 20,
  },
});

export default WhistleblowListScreen;
