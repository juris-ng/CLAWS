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

export default function ReportsScreen({ user, profile, onBack }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [filterStatus, reports]);

  const loadReports = async () => {
    setLoading(true);
    const data = await AdminService.getAllReports();
    setReports(data);
    setLoading(false);
  };

  const filterReports = () => {
    if (filterStatus === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(r => r.status === filterStatus));
    }
  };

  const handleResolveReport = async (status) => {
    if (!actionTaken.trim()) {
      Alert.alert('Error', 'Please describe the action taken');
      return;
    }

    const result = await AdminService.updateReportStatus(
      selectedReport.id,
      status,
      actionTaken,
      adminNotes
    );

    if (result.success) {
      Alert.alert('Success', `Report marked as ${status}`);
      setShowModal(false);
      setActionTaken('');
      setAdminNotes('');
      setSelectedReport(null);
      loadReports();
    } else {
      Alert.alert('Error', result.error || 'Failed to update report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'under_review': return '#0066FF';
      case 'resolved': return '#34C759';
      case 'dismissed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#0066FF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'petition': return '📋';
      case 'comment': return '💬';
      case 'user': return '👤';
      default: return '📝';
    }
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        setSelectedReport(item);
        setShowModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportIcon}>
          {getContentTypeIcon(item.content_type)}
        </Text>
        <View style={styles.reportHeaderInfo}>
          <Text style={styles.reportType}>
            {item.content_type.toUpperCase()} REPORT
          </Text>
          <Text style={styles.reportDate}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reportBody}>
        <Text style={styles.reportReason}>📌 {item.reason}</Text>
        {item.description && (
          <Text style={styles.reportDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.reportFooter}>
        <Text style={styles.reportReporter}>
          By: {item.reporter?.full_name || 'Anonymous'}
        </Text>
        <Text style={styles.reportArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'under_review' && styles.filterChipActive]}
          onPress={() => setFilterStatus('under_review')}
        >
          <Text style={[styles.filterText, filterStatus === 'under_review' && styles.filterTextActive]}>
            Reviewing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'resolved' && styles.filterChipActive]}
          onPress={() => setFilterStatus('resolved')}
        >
          <Text style={[styles.filterText, filterStatus === 'resolved' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'dismissed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('dismissed')}
        >
          <Text style={[styles.filterText, filterStatus === 'dismissed' && styles.filterTextActive]}>
            Dismissed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadReports} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Reports</Text>
            <Text style={styles.emptyText}>
              {filterStatus === 'all' 
                ? 'No reports have been submitted yet'
                : `No ${filterStatus} reports`}
            </Text>
          </View>
        )}
      />

      {/* Report Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <View style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Content Type</Text>
                  <Text style={styles.modalValue}>
                    {getContentTypeIcon(selectedReport.content_type)} {selectedReport.content_type.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reported By</Text>
                  <Text style={styles.modalValue}>
                    {selectedReport.reporter?.full_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.modalSubValue}>
                    {selectedReport.reporter?.email || 'No email'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reason</Text>
                  <Text style={styles.modalValue}>{selectedReport.reason}</Text>
                </View>

                {selectedReport.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Description</Text>
                    <Text style={styles.modalValue}>{selectedReport.description}</Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReport.status) }]}>
                      <Text style={styles.badgeText}>{selectedReport.status.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedReport.priority) }]}>
                      <Text style={styles.badgeText}>{selectedReport.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                {selectedReport.reviewed_by && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Reviewed By</Text>
                    <Text style={styles.modalValue}>
                      {selectedReport.reviewed_by_user?.full_name || 'Admin'}
                    </Text>
                    <Text style={styles.modalSubValue}>
                      {new Date(selectedReport.reviewed_at).toLocaleString()}
                    </Text>
                  </View>
                )}

                {selectedReport.action_taken && (
                  <View style={[styles.modalSection, styles.successSection]}>
                    <Text style={styles.modalLabel}>✅ Action Taken</Text>
                    <Text style={styles.modalValue}>{selectedReport.action_taken}</Text>
                  </View>
                )}

                {selectedReport.admin_notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Admin Notes</Text>
                    <Text style={styles.modalValue}>{selectedReport.admin_notes}</Text>
                  </View>
                )}

                {selectedReport.status === 'pending' && (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Action Taken *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Describe the action taken..."
                        value={actionTaken}
                        onChangeText={setActionTaken}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Admin Notes (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Additional notes..."
                        value={adminNotes}
                        onChangeText={setAdminNotes}
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => handleResolveReport('under_review')}
                      >
                        <Text style={styles.reviewButtonText}>👁️ Under Review</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.resolveButton}
                        onPress={() => handleResolveReport('resolved')}
                      >
                        <Text style={styles.resolveButtonText}>✅ Resolve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={() => handleResolveReport('dismissed')}
                      >
                        <Text style={styles.dismissButtonText}>❌ Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingVertical: ResponsiveUtils.spacing(1.5),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: ResponsiveUtils.spacing(1),
  },
  filterChip: {
    paddingVertical: ResponsiveUtils.spacing(0.75),
    paddingHorizontal: ResponsiveUtils.spacing(1.5),
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
  },
  filterText: {
    fontSize: ResponsiveUtils.fontSize(12),
    fontWeight: '600',
    color: '#3C3C43',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: ResponsiveUtils.spacing(2),
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1.5),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  reportIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  reportHeaderInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: ResponsiveUtils.fontSize(12),
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 2,
  },
  reportDate: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  badges: {
    gap: ResponsiveUtils.spacing(0.5),
  },
  statusBadge: {
    paddingHorizontal: ResponsiveUtils.spacing(1),
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadge: {
    paddingHorizontal: ResponsiveUtils.spacing(1),
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: ResponsiveUtils.fontSize(9),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reportBody: {
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  reportReason: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(0.75),
  },
  reportDescription: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#3C3C43',
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ResponsiveUtils.spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  reportReporter: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  reportArrow: {
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
  successSection: {
    backgroundColor: '#E8F5E9',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
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
  badgesRow: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(1),
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(14),
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalActions: {
    gap: ResponsiveUtils.spacing(1),
    marginTop: ResponsiveUtils.spacing(2),
  },
  reviewButton: {
    backgroundColor: '#0066FF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resolveButton: {
    backgroundColor: '#34C759',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  resolveButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    backgroundColor: '#8E8E93',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
