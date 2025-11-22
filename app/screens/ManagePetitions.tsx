import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { getCategoryIcon } from '../constants/Categories';


const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#ffc107' },
  { value: 'under_review', label: 'Under Review', color: '#17a2b8' },
  { value: 'approved', label: 'Approved', color: '#28a745' },
  { value: 'rejected', label: 'Rejected', color: '#dc3545' },
  { value: 'implemented', label: 'Implemented', color: '#6610f2' },
];


export default function ManagePetitions({ onBack }) {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);


  useEffect(() => {
    loadPetitions();
  }, []);


  const loadPetitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('petitions')
      .select(`
        *,
        members:member_id (full_name)
      `)
      .order('created_at', { ascending: false });


    setLoading(false);


    if (data) {
      setPetitions(data);
    }
  };


  const handleStatusChange = async (newStatus) => {
    const { error } = await supabase
      .from('petitions')
      .update({ status: newStatus })
      .eq('id', selectedPetition.id);


    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      alert('Petition status updated successfully!');
      setModalVisible(false);
      setSelectedPetition(null);
      loadPetitions();
    }
  };


  const getStatusColor = (status) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj ? statusObj.color : '#6c757d';
  };


  const getStatusLabel = (status) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };


  const renderPetition = ({ item }) => (
    <View style={styles.petitionCard}>
      <View style={styles.petitionHeader}>
        <Text style={styles.categoryText}>
          {getCategoryIcon(item.category)} {item.category}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>


      <Text style={styles.petitionTitle}>{item.title}</Text>
      <Text style={styles.petitionDescription} numberOfLines={2}>
        {item.description}
      </Text>


      <View style={styles.petitionMeta}>
        <Text style={styles.metaText}>
          By: {item.members?.full_name || 'Member'}
        </Text>
        <Text style={styles.metaText}>
          👍 {item.upvotes} | 👎 {item.downvotes}
        </Text>
      </View>


      <TouchableOpacity
        style={styles.changeStatusButton}
        onPress={() => {
          setSelectedPetition(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.changeStatusButtonText}>Change Status</Text>
      </TouchableOpacity>
    </View>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#28a745" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Petitions</Text>
          <View style={styles.backButton} />
        </View>


        {/* Petitions List */}
        <FlatList
          data={petitions}
          renderItem={renderPetition}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadPetitions} />
          }
          contentContainerStyle={styles.listContainer}
        />


        {/* Status Change Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Petition Status</Text>
              
              {selectedPetition && (
                <>
                  <Text style={styles.modalPetitionTitle} numberOfLines={2}>
                    {selectedPetition.title}
                  </Text>
                  
                  <Text style={styles.modalLabel}>Select New Status:</Text>
                  
                  <ScrollView style={styles.statusList}>
                    {STATUS_OPTIONS.map((status) => (
                      <TouchableOpacity
                        key={status.value}
                        style={[
                          styles.statusOption,
                          { borderLeftColor: status.color }
                        ]}
                        onPress={() => handleStatusChange(status.value)}
                      >
                        <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
                        <Text style={styles.statusOptionText}>{status.label}</Text>
                        {selectedPetition.status === status.value && (
                          <Text style={styles.currentBadge}>Current</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>


                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedPetition(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#28a745',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  petitionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  petitionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  petitionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  petitionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  changeStatusButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeStatusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalPetitionTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statusList: {
    maxHeight: 300,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  currentBadge: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
