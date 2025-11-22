import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import { BodyService } from '../../utils/bodyService';

const BodyTeamScreen = ({ route, navigation }) => {
  const [bodyId, setBodyId] = useState(route.params?.bodyId);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    initializeBodyId();
  }, []);

  useEffect(() => {
    if (bodyId) {
      loadTeamMembers();
    }
  }, [bodyId]);

  const initializeBodyId = async () => {
    if (!bodyId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setBodyId(user.id);
      }
    }
  };

  const loadTeamMembers = async () => {
    try {
      const result = await BodyService.getBodyMembers(bodyId);
      if (result.success) {
        setMembers(result.members || []);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamMembers();
  };

  const handleEditPermissions = (member) => {
    setSelectedMember(member);
    setShowPermissionsModal(true);
  };

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${member.member?.full_name || 'this member'} from your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await BodyService.removeMember(bodyId, member.member_id);
            if (result.success) {
              Alert.alert('Success', 'Team member removed successfully');
              loadTeamMembers();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      {/* Header with Avatar and Info */}
      <View style={styles.memberHeader}>
        {item.member?.avatar_url ? (
          <Image source={{ uri: item.member.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.member?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.member?.full_name || 'Unknown'}</Text>
          <Text style={styles.memberEmail}>{item.member?.email || ''}</Text>
          {item.title && (
            <View style={styles.titleContainer}>
              <Ionicons name="briefcase-outline" size={14} color="#1A73E8" />
              <Text style={styles.memberTitle}>{item.title}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Role Badge */}
      <View
        style={[
          styles.roleBadge,
          item.role === 'owner' && styles.roleBadgeOwner,
          item.role === 'admin' && styles.roleBadgeAdmin,
          item.role === 'moderator' && styles.roleBadgeModerator,
        ]}
      >
        <Ionicons 
          name={
            item.role === 'owner' ? 'shield-checkmark' :
            item.role === 'admin' ? 'star' :
            item.role === 'moderator' ? 'shield-outline' :
            'person-outline'
          } 
          size={14} 
          color={
            item.role === 'owner' ? '#0D47A1' :
            item.role === 'admin' ? '#1565C0' :
            item.role === 'moderator' ? '#1976D2' :
            '#BDBDBD'
          } 
        />
        <Text style={styles.roleText}>
          {item.role.toUpperCase()}
        </Text>
      </View>

      {/* Permissions */}
      <View style={styles.permissionsContainer}>
        <View style={styles.permissionsHeader}>
          <Ionicons name="key-outline" size={16} color="#666" />
          <Text style={styles.permissionsTitle}>Permissions</Text>
        </View>
        <View style={styles.permissionsList}>
          {item.can_post && (
            <View style={styles.permissionBadge}>
              <Ionicons name="create-outline" size={12} color="#4CAF50" />
              <Text style={styles.permissionText}>Create Posts</Text>
            </View>
          )}
          {item.can_respond && (
            <View style={styles.permissionBadge}>
              <Ionicons name="chatbox-outline" size={12} color="#4CAF50" />
              <Text style={styles.permissionText}>Respond</Text>
            </View>
          )}
          {item.can_manage_members && (
            <View style={styles.permissionBadge}>
              <Ionicons name="people-outline" size={12} color="#4CAF50" />
              <Text style={styles.permissionText}>Manage Team</Text>
            </View>
          )}
          {!item.can_post && !item.can_respond && !item.can_manage_members && (
            <Text style={styles.noPermissions}>No special permissions</Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      {item.role !== 'owner' && (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPermissions(item)}
          >
            <Ionicons name="create-outline" size={18} color="#1A73E8" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemoveMember(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Joined Date */}
      <View style={styles.joinedContainer}>
        <Ionicons name="calendar-outline" size={12} color="#999" />
        <Text style={styles.joinedDate}>
          Joined {new Date(item.joined_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Loading team members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Simple Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Team Management</Text>
            <Text style={styles.headerSubtitle}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
          <Ionicons name="people" size={28} color="#1A73E8" />
        </View>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No Team Members Yet</Text>
            <Text style={styles.emptySubtext}>
              Invite members to help manage your organization's profile and interactions
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowInviteModal(true)}>
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modals */}
      <InviteModal
        visible={showInviteModal}
        bodyId={bodyId}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setShowInviteModal(false);
          loadTeamMembers();
        }}
      />

      {selectedMember && (
        <PermissionsModal
          visible={showPermissionsModal}
          bodyId={bodyId}
          member={selectedMember}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedMember(null);
          }}
          onSave={async (permissions) => {
            const result = await BodyService.updateMemberPermissions(
              bodyId,
              selectedMember.member_id,
              permissions
            );
            if (result.success) {
              Alert.alert('Success', 'Permissions updated successfully');
              loadTeamMembers();
              setShowPermissionsModal(false);
              setSelectedMember(null);
            } else {
              Alert.alert('Error', result.error || 'Failed to update permissions');
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

// INVITE MODAL
const InviteModal = ({ visible, bodyId, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [title, setTitle] = useState('');
  const [canPost, setCanPost] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setSending(true);
    try {
      const result = await BodyService.inviteMember(bodyId, {
        email: email.trim().toLowerCase(),
        role,
        title: title.trim(),
        can_post: canPost,
        can_respond: canRespond,
        can_manage_members: canManageMembers,
      });

      if (result.success) {
        Alert.alert('Success', 'Team member invited successfully');
        setEmail('');
        setTitle('');
        setRole('member');
        setCanPost(false);
        setCanRespond(false);
        setCanManageMembers(false);
        onSuccess();
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="person-add" size={28} color="#1A73E8" />
              <Text style={styles.modalTitle}>Invite Team Member</Text>
            </View>

            {/* Email Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                <Ionicons name="mail-outline" size={14} color="#666" /> Email Address *
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="member@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Title Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                <Ionicons name="briefcase-outline" size={14} color="#666" /> Title/Position
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Communications Officer"
                placeholderTextColor="#999"
              />
            </View>

            {/* Role Picker */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                <Ionicons name="shield-outline" size={14} color="#666" /> Role
              </Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Moderator" value="moderator" />
                  <Picker.Item label="Representative" value="representative" />
                  <Picker.Item label="Member" value="member" />
                </Picker>
              </View>
            </View>

            {/* Permissions */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                <Ionicons name="key-outline" size={14} color="#666" /> Permissions
              </Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="create-outline" size={20} color="#666" />
                  <Text style={styles.switchLabel}>Can create posts</Text>
                </View>
                <Switch
                  value={canPost}
                  onValueChange={setCanPost}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={canPost ? '#1A73E8' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="chatbox-outline" size={20} color="#666" />
                  <Text style={styles.switchLabel}>Can respond to petitions</Text>
                </View>
                <Switch
                  value={canRespond}
                  onValueChange={setCanRespond}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={canRespond ? '#1A73E8' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="people-outline" size={20} color="#666" />
                  <Text style={styles.switchLabel}>Can manage team members</Text>
                </View>
                <Switch
                  value={canManageMembers}
                  onValueChange={setCanManageMembers}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={canManageMembers ? '#1A73E8' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={onClose} 
                disabled={sending}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonPrimary, sending && styles.modalButtonDisabled]}
                onPress={handleInvite}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                    <Text style={styles.modalButtonTextPrimary}>Send Invite</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// PERMISSIONS MODAL
const PermissionsModal = ({ visible, bodyId, member, onClose, onSave }) => {
  const [role, setRole] = useState(member?.role || 'member');
  const [canPost, setCanPost] = useState(member?.can_post || false);
  const [canRespond, setCanRespond] = useState(member?.can_respond || false);
  const [canManageMembers, setCanManageMembers] = useState(member?.can_manage_members || false);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={28} color="#1A73E8" />
              <Text style={styles.modalTitle}>Edit Permissions</Text>
            </View>
            <Text style={styles.modalSubtitle}>{member?.member?.full_name}</Text>

            {/* Role Picker */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                <Ionicons name="shield-outline" size={14} color="#666" /> Role
              </Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Moderator" value="moderator" />
                  <Picker.Item label="Representative" value="representative" />
                  <Picker.Item label="Member" value="member" />
                </Picker>
              </View>
            </View>

            {/* Permissions */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                <Ionicons name="key-outline" size={14} color="#666" /> Permissions
              </Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="create-outline" size={20} color="#666" />
                  <Text style={styles.switchLabel}>Can create posts</Text>
                </View>
                <Switch
                  value={canPost}
                  onValueChange={setCanPost}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={canPost ? '#1A73E8' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="chatbox-outline" size={20} color="#666" />
                  <Text style={styles.switchLabel}>Can respond to petitions</Text>
                </View>
                <Switch
                  value={canRespond}
                  onValueChange={setCanRespond}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={canRespond ? '#1A73E8' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="people-outline" size={20} color="#666" />
                  <Text style={styles.switchLabel}>Can manage team members</Text>
                </View>
                <Switch
                  value={canManageMembers}
                  onValueChange={setCanManageMembers}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={canManageMembers ? '#1A73E8' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  onSave({
                    role,
                    can_post: canPost,
                    can_respond: canRespond,
                    can_manage_members: canManageMembers,
                  });
                }}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.modalButtonTextPrimary}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// STYLES
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
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#1A73E8',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberTitle: {
    fontSize: 13,
    color: '#1A73E8',
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  roleBadgeOwner: {
    backgroundColor: '#BBDEFB',
  },
  roleBadgeAdmin: {
    backgroundColor: '#C5CAE9',
  },
  roleBadgeModerator: {
    backgroundColor: '#D1C4E9',
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  permissionsContainer: {
    marginBottom: 16,
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  permissionText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  noPermissions: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  joinedDate: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    color: '#333333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    gap: 8,
  },
  modalButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BodyTeamScreen;
