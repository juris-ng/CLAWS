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

export default function UserManagementScreen({ user, profile, onBack }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterRole, users]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await AdminService.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      if (filterRole === 'banned') {
        filtered = filtered.filter(u => u.is_banned === true);
      } else {
        filtered = filtered.filter(u => u.role === filterRole);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for banning');
      return;
    }

    const duration = banDuration ? parseInt(banDuration) : null;
    const result = await AdminService.banUser(selectedUser.id, banReason, duration);

    if (result.success) {
      Alert.alert('Success', 'User has been banned');
      setShowBanModal(false);
      setBanReason('');
      setBanDuration('');
      setSelectedUser(null);
      loadUsers();
    } else {
      Alert.alert('Error', result.error || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    Alert.alert(
      'Unban User',
      'Are you sure you want to unban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            const result = await AdminService.unbanUser(userId);
            if (result.success) {
              Alert.alert('Success', 'User has been unbanned');
              loadUsers();
            } else {
              Alert.alert('Error', result.error || 'Failed to unban user');
            }
          }
        }
      ]
    );
  };

  const handleUpdateRole = async (userId, newRole) => {
    Alert.alert(
      'Update Role',
      `Change user role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const result = await AdminService.updateUserRole(userId, newRole);
            if (result.success) {
              Alert.alert('Success', `User role updated to ${newRole}`);
              setShowUserModal(false);
              setSelectedUser(null);
              loadUsers();
            } else {
              Alert.alert('Error', result.error || 'Failed to update role');
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#FF3B30';
      case 'moderator': return '#FF9500';
      case 'member': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowUserModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.full_name?.[0]?.toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.full_name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
            <Text style={styles.roleBadgeText}>{item.role?.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>

        <View style={styles.userStats}>
          <Text style={styles.userStat}>⭐ Level {item.level || 1}</Text>
          <Text style={styles.userStat}>💰 {item.total_points || 0} pts</Text>
          {item.is_banned && (
            <Text style={styles.bannedBadge}>🚫 BANNED</Text>
          )}
        </View>
      </View>

      <Text style={styles.userArrow}>→</Text>
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
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'all' && styles.filterChipActive]}
          onPress={() => setFilterRole('all')}
        >
          <Text style={[styles.filterText, filterRole === 'all' && styles.filterTextActive]}>
            All ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'admin' && styles.filterChipActive]}
          onPress={() => setFilterRole('admin')}
        >
          <Text style={[styles.filterText, filterRole === 'admin' && styles.filterTextActive]}>
            Admins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'moderator' && styles.filterChipActive]}
          onPress={() => setFilterRole('moderator')}
        >
          <Text style={[styles.filterText, filterRole === 'moderator' && styles.filterTextActive]}>
            Moderators
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'member' && styles.filterChipActive]}
          onPress={() => setFilterRole('member')}
        >
          <Text style={[styles.filterText, filterRole === 'member' && styles.filterTextActive]}>
            Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'banned' && styles.filterChipActive]}
          onPress={() => setFilterRole('banned')}
        >
          <Text style={[styles.filterText, filterRole === 'banned' && styles.filterTextActive]}>
            Banned
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUsers} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'No users match the selected filter'}
            </Text>
          </View>
        )}
      />

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <>
                <View style={styles.modalUserInfo}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.full_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={styles.modalUserName}>{selectedUser.full_name}</Text>
                  <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                  
                  <View style={styles.modalStatsRow}>
                    <View style={styles.modalStatBox}>
                      <Text style={styles.modalStatValue}>{selectedUser.level || 1}</Text>
                      <Text style={styles.modalStatLabel}>Level</Text>
                    </View>
                    <View style={styles.modalStatBox}>
                      <Text style={styles.modalStatValue}>{selectedUser.total_points || 0}</Text>
                      <Text style={styles.modalStatLabel}>Points</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Text style={styles.modalSectionTitle}>Change Role</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[styles.roleButton, selectedUser.role === 'member' && styles.roleButtonActive]}
                      onPress={() => handleUpdateRole(selectedUser.id, 'member')}
                      disabled={selectedUser.role === 'member'}
                    >
                      <Text style={styles.roleButtonText}>Member</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleButton, selectedUser.role === 'moderator' && styles.roleButtonActive]}
                      onPress={() => handleUpdateRole(selectedUser.id, 'moderator')}
                      disabled={selectedUser.role === 'moderator'}
                    >
                      <Text style={styles.roleButtonText}>Moderator</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleButton, selectedUser.role === 'admin' && styles.roleButtonActive]}
                      onPress={() => handleUpdateRole(selectedUser.id, 'admin')}
                      disabled={selectedUser.role === 'admin'}
                    >
                      <Text style={styles.roleButtonText}>Admin</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalSectionTitle}>Actions</Text>
                  
                  {selectedUser.is_banned ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setShowUserModal(false);
                        handleUnbanUser(selectedUser.id);
                      }}
                    >
                      <Text style={styles.actionButtonText}>✅ Unban User</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.dangerButton]}
                      onPress={() => {
                        setShowUserModal(false);
                        setShowBanModal(true);
                      }}
                    >
                      <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
                        🚫 Ban User
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Ban User Modal */}
      <Modal
        visible={showBanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ban User</Text>
              <TouchableOpacity onPress={() => setShowBanModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.banForm}>
              <Text style={styles.inputLabel}>Reason for Ban *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter reason for banning this user..."
                value={banReason}
                onChangeText={setBanReason}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Duration (days, leave empty for permanent)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7, 30"
                value={banDuration}
                onChangeText={setBanDuration}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleBanUser}
              >
                <Text style={styles.submitButtonText}>Ban User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setBanDuration('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: ResponsiveUtils.spacing(2),
    marginBottom: ResponsiveUtils.spacing(1),
    paddingHorizontal: ResponsiveUtils.spacing(1.5),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    fontSize: ResponsiveUtils.fontSize(18),
    marginRight: ResponsiveUtils.spacing(1),
  },
  searchInput: {
    flex: 1,
    fontSize: ResponsiveUtils.fontSize(15),
    paddingVertical: ResponsiveUtils.spacing(1.5),
  },
  clearIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    color: '#8E8E93',
    paddingHorizontal: ResponsiveUtils.spacing(1),
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    marginBottom: ResponsiveUtils.spacing(1),
    gap: ResponsiveUtils.spacing(1),
  },
  filterChip: {
    paddingVertical: ResponsiveUtils.spacing(0.75),
    paddingHorizontal: ResponsiveUtils.spacing(1.5),
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
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
  userCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  userAvatarText: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: ResponsiveUtils.spacing(1),
  },
  userName: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: ResponsiveUtils.spacing(1),
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: ResponsiveUtils.fontSize(9),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#8E8E93',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(1.5),
  },
  userStat: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#3C3C43',
  },
  bannedBadge: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  userArrow: {
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
    maxHeight: '80%',
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
  modalUserInfo: {
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  modalAvatarText: {
    fontSize: ResponsiveUtils.fontSize(32),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalUserName: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(4),
  },
  modalStatBox: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: ResponsiveUtils.fontSize(24),
    fontWeight: 'bold',
    color: '#0066FF',
  },
  modalStatLabel: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  modalActions: {
    padding: ResponsiveUtils.spacing(2.5),
  },
  modalSectionTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  roleButtons: {
    flexDirection: 'row',
    gap: ResponsiveUtils.spacing(1),
    marginBottom: ResponsiveUtils.spacing(3),
  },
  roleButton: {
    flex: 1,
    paddingVertical: ResponsiveUtils.spacing(1.25),
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#0066FF',
  },
  roleButtonText: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
  },
  actionButton: {
    backgroundColor: '#0066FF',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  actionButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  banForm: {
    padding: ResponsiveUtils.spacing(2.5),
  },
  inputLabel: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    marginBottom: ResponsiveUtils.spacing(1),
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(15),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  textArea: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(15),
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  submitButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    padding: ResponsiveUtils.spacing(2),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
    color: '#8E8E93',
  },
});
