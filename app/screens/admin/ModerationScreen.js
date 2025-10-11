import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl, StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AdminService } from '../../../utils/adminService';
import { ResponsiveUtils } from '../../../utils/responsive';

export default function ModerationScreen({ user, profile, onBack }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [petitions, setPetitions] = useState([]);
  const [flaggedPetitions, setFlaggedPetitions] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [moderationNotes, setModerationNotes] = useState('');

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    setLoading(true);
    const [pending, flaggedP, flaggedC] = await Promise.all([
      AdminService.getPendingPetitions(),
      AdminService.getFlaggedPetitions(),
      AdminService.getFlaggedComments(),
    ]);
    setPetitions(pending);
    setFlaggedPetitions(flaggedP);
    setFlaggedComments(flaggedC);
    setLoading(false);
  };

  const handleApprovePetition = async (petitionId) => {
    Alert.alert(
      'Approve Petition',
      'Are you sure you want to approve this petition?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const result = await AdminService.moderatePetition(petitionId, 'approved', moderationNotes);
            if (result.success) {
              Alert.alert('Success', 'Petition approved');
              setShowModal(false);
              setModerationNotes('');
              loadModerationData();
            } else {
              Alert.alert('Error', result.error || 'Failed to approve petition');
            }
          }
        }
      ]
    );
  };

  const handleRejectPetition = async (petitionId) => {
    if (!moderationNotes.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    Alert.alert(
      'Reject Petition',
      'Are you sure you want to reject this petition?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            const result = await AdminService.moderatePetition(petitionId, 'rejected', moderationNotes);
            if (result.success) {
              Alert.alert('Success', 'Petition rejected');
              setShowModal(false);
              setModerationNotes('');
              loadModerationData();
            } else {
              Alert.alert('Error', result.error || 'Failed to reject petition');
            }
          }
        }
      ]
    );
  };

  const handleDeletePetition = async (petitionId) => {
    if (!moderationNotes.trim()) {
      Alert.alert('Error', 'Please provide a reason for deletion');
      return;
    }

    Alert.alert(
      'Delete Petition',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await AdminService.deletePetition(petitionId, moderationNotes);
            if (result.success) {
              Alert.alert('Success', 'Petition deleted');
              setShowModal(false);
              setModerationNotes('');
              loadModerationData();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete petition');
            }
          }
        }
      ]
    );
  };

  const handleDeleteComment = async (commentId) => {
    if (!moderationNotes.trim()) {
      Alert.alert('Error', 'Please provide a reason for deletion');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await AdminService.deleteComment(commentId, moderationNotes);
            if (result.success) {
              Alert.alert('Success', 'Comment deleted');
              setShowModal(false);
              setModerationNotes('');
              loadModerationData();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const renderPetition = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => {
        setSelectedItem({ ...item, type: 'petition' });
        setShowModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Text style={styles.itemIcon}>📋</Text>
          <View style={styles.itemHeaderInfo}>
            <Text style={styles.itemAuthor}>
              {item.member?.full_name || 'Anonymous'}
            </Text>
            <Text style={styles.itemTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {item.flag_count > 0 && (
          <View style={styles.flagBadge}>
            <Text style={styles.flagBadgeText}>🚩 {item.flag_count}</Text>
          </View>
        )}
      </View>

      <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.itemDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.itemFooter}>
        <Text style={styles.itemCategory}>
          {item.category?.toUpperCase() || 'UNCATEGORIZED'}
        </Text>
        <Text style={styles.itemArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderComment = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => {
        setSelectedItem({ ...item, type: 'comment' });
        setShowModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Text style={styles.itemIcon}>💬</Text>
          <View style={styles.itemHeaderInfo}>
            <Text style={styles.itemAuthor}>
              {item.member?.full_name || 'Anonymous'}
            </Text>
            <Text style={styles.itemTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {item.flag_count > 0 && (
          <View style={styles.flagBadge}>
            <Text style={styles.flagBadgeText}>🚩 {item.flag_count}</Text>
          </View>
        )}
      </View>

      <Text style={styles.itemDescription}>{item.comment_text}</Text>

      <View style={styles.itemFooter}>
        <Text style={styles.itemPetition} numberOfLines={1}>
          On: {item.petition?.title || 'Unknown Petition'}
        </Text>
        <Text style={styles.itemArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'pending': return petitions;
      case 'flagged': return flaggedPetitions;
      case 'comments': return flaggedComments;
      default: return [];
    }
  };

  const renderItem = ({ item }) => {
    if (activeTab === 'comments') {
      return renderComment({ item });
    }
    return renderPetition({ item });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Moderation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({petitions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'flagged' && styles.tabActive]}
          onPress={() => setActiveTab('flagged')}
        >
          <Text style={[styles.tabText, activeTab === 'flagged' && styles.tabTextActive]}>
            Flagged ({flaggedPetitions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'comments' && styles.tabActive]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.tabText, activeTab === 'comments' && styles.tabTextActive]}>
            Comments ({flaggedComments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={getCurrentData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadModerationData} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>
              No items require moderation at this time
            </Text>
          </View>
        )}
      />

      {/* Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedItem?.type === 'comment' ? 'Comment Details' : 'Petition Details'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Author</Text>
                  <Text style={styles.modalValue}>
                    {selectedItem.member?.full_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.modalSubValue}>
                    {selectedItem.member?.email || 'No email'}
                  </Text>
                </View>

                {selectedItem.type === 'petition' ? (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Title</Text>
                      <Text style={styles.modalValue}>{selectedItem.title}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Description</Text>
                      <Text style={styles.modalValue}>{selectedItem.description}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Category</Text>
                      <Text style={styles.modalValue}>
                        {selectedItem.category?.toUpperCase() || 'UNCATEGORIZED'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Comment</Text>
                      <Text style={styles.modalValue}>{selectedItem.comment_text}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Petition</Text>
                      <Text style={styles.modalValue}>
                        {selectedItem.petition?.title || 'Unknown'}
                      </Text>
                    </View>
                  </>
                )}

                {selectedItem.flag_count > 0 && (
                  <View style={[styles.modalSection, styles.warningSection]}>
                    <Text style={styles.modalLabel}>⚠️ Flags</Text>
                    <Text style={styles.warningText}>
                      This content has been flagged {selectedItem.flag_count} times
                    </Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Moderation Notes</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Enter reason for action (required for reject/delete)..."
                    value={moderationNotes}
                    onChangeText={setModerationNotes}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.modalActions}>
                  {selectedItem.type === 'petition' && activeTab === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprovePetition(selectedItem.id)}
                      >
                        <Text style={styles.approveButtonText}>✓ Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectPetition(selectedItem.id)}
                      >
                        <Text style={styles.rejectButtonText}>✗ Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedItem.type === 'petition' && activeTab === 'flagged' && (
                    <>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprovePetition(selectedItem.id)}
                      >
                        <Text style={styles.approveButtonText}>✓ Keep Petition</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePetition(selectedItem.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedItem.type === 'comment' && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteComment(selectedItem.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Delete Comment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: ResponsiveUtils.spacing(1.5),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066FF',
  },
  tabText: {
    fontSize: ResponsiveUtils.fontSize(13),
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#0066FF',
  },
  listContainer: {
    padding: ResponsiveUtils.spacing(2),
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1.5),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  itemHeaderInfo: {
    flex: 1,
  },
  itemAuthor: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
  },
  itemTime: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  flagBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: ResponsiveUtils.spacing(1),
    paddingVertical: 4,
    borderRadius: 12,
  },
  flagBadgeText: {
    fontSize: ResponsiveUtils.fontSize(11),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  itemTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(1),
    lineHeight: 22,
  },
  itemDescription: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: ResponsiveUtils.fontSize(11),
    fontWeight: '600',
    color: '#0066FF',
  },
  itemPetition: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
    flex: 1,
  },
  itemArrow: {
    fontSize: ResponsiveUtils.fontSize(20),
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ResponsiveUtils.spacing(10),
  },
  emptyIcon: {
    fontSize: ResponsiveUtils.fontSize(64),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  emptyTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  emptyText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: ResponsiveUtils.fontSize(32),
    color: '#8E8E93',
    lineHeight: 32,
  },
  modalBody: {
    padding: ResponsiveUtils.spacing(2.5),
  },
  modalSection: {
    marginBottom: ResponsiveUtils.spacing(2.5),
  },
  warningSection: {
    backgroundColor: '#FFF3E0',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  modalLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: ResponsiveUtils.spacing(0.5),
  },
  modalValue: {
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#1C1C1E',
    lineHeight: 22,
  },
  modalSubValue: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#8E8E93',
    marginTop: 2,
  },
  warningText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#FF9500',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(14),
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    gap: ResponsiveUtils.spacing(1),
    marginTop: ResponsiveUtils.spacing(2),
  },
  approveButton: {
    backgroundColor: '#34C759',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: '#FF9500',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
