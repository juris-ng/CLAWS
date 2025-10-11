import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';

export default function LawyerDashboardScreen({ user, profile }) {
  const [lawyerData, setLawyerData] = useState(null);
  const [activeTab, setActiveTab] = useState('My Cases');
  const [loading, setLoading] = useState(false);
  const [partnershipInvites, setPartnershipInvites] = useState([]);

  const tabs = ['My Cases', 'Secure Messages'];

  useEffect(() => {
    loadLawyerData();
    loadInvitations();
  }, []);

  const loadLawyerData = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setLawyerData(data);
    }

    setLoading(false);
  };

  const loadInvitations = async () => {
    const { data } = await supabase
      .from('lawyer_invitations')
      .select(`
        *,
        petitions:petition_id (title, description),
        members:invited_by (full_name)
      `)
      .eq('lawyer_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPartnershipInvites(data);
    }
  };

  const handleAcceptInvitation = async (invitation) => {
    setLoading(true);

    // Update invitation status
    const { error: updateError } = await supabase
      .from('lawyer_invitations')
      .update({ 
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      alert('Error accepting invitation: ' + updateError.message);
      setLoading(false);
      return;
    }

    // Add to petition_lawyers
    const { error: insertError } = await supabase
      .from('petition_lawyers')
      .insert([{
        petition_id: invitation.petition_id,
        lawyer_id: user.id,
      }]);

    setLoading(false);

    if (insertError) {
      alert('Error joining petition: ' + insertError.message);
    } else {
      alert('Invitation accepted! You are now supporting this petition.');
      loadInvitations();
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    setLoading(true);

    const { error } = await supabase
      .from('lawyer_invitations')
      .update({ 
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    setLoading(false);

    if (error) {
      alert('Error declining invitation: ' + error.message);
    } else {
      alert('Invitation declined');
      loadInvitations();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const activeCases = [
    {
      id: 1,
      title: 'Community Water Rights Dispute',
      status: 'Active',
      partner: 'Citizens for Clean Water',
      lastUpdate: 'June 20, 2024',
      description: 'Issue Notice',
      statusColor: '#0066FF',
    },
    {
      id: 2,
      title: 'Public Land Use Zoning Appeal',
      status: 'Review',
      partner: 'Greenbelt Preservation Society',
      lastUpdate: 'June 18, 2024',
      description: 'Escalate',
      statusColor: '#FF9500',
    },
    {
      id: 3,
      title: 'Local Governance Transparency Audit',
      status: 'Active',
      partner: 'Accountability Advocates',
      lastUpdate: 'June 14, 2024',
      description: 'Issue Notice',
      statusColor: '#0066FF',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lawyer Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {lawyerData?.full_name?.charAt(0).toUpperCase() || 'L'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {
            loadLawyerData();
            loadInvitations();
          }} />
        }
      >
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'My Cases' && (
          <>
            {/* Partnership Invites */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Partnership Invites</Text>
                {partnershipInvites.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{partnershipInvites.length}</Text>
                  </View>
                )}
              </View>

              {partnershipInvites.length === 0 ? (
                <View style={styles.emptyInvites}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>No pending invitations</Text>
                </View>
              ) : (
                partnershipInvites.map((invite) => (
                  <View key={invite.id} style={styles.inviteCard}>
                    <View style={styles.inviteIcon}>
                      <Text style={styles.inviteIconText}>⚖️</Text>
                    </View>
                    <View style={styles.inviteContent}>
                      <Text style={styles.inviteTitle}>
                        {invite.petitions?.title || 'Petition'}
                      </Text>
                      <Text style={styles.inviteDate}>
                        Invited by {invite.members?.full_name || 'A member'} on {new Date(invite.created_at).toLocaleDateString()}
                      </Text>
                      <View style={styles.inviteStatusRow}>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>Pending</Text>
                        </View>
                      </View>
                      {invite.message && (
                        <Text style={styles.inviteDescription}>{invite.message}</Text>
                      )}
                      
                      <View style={styles.inviteActions}>
                        <TouchableOpacity 
                          style={styles.declineButton}
                          onPress={() => handleDeclineInvitation(invite)}
                          disabled={loading}
                        >
                          <Text style={styles.declineButtonText}>
                            {loading ? 'Processing...' : 'Decline'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.acceptButton}
                          onPress={() => handleAcceptInvitation(invite)}
                          disabled={loading}
                        >
                          <Text style={styles.acceptButtonText}>
                            {loading ? 'Processing...' : 'Accept'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Active Cases */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Cases</Text>

              {activeCases.map((caseItem) => (
                <TouchableOpacity key={caseItem.id} style={styles.caseCard}>
                  <View style={styles.caseHeader}>
                    <View style={[styles.caseStatusBadge, { backgroundColor: caseItem.statusColor }]}>
                      <Text style={styles.caseStatusText}>{caseItem.status}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.caseTitle}>{caseItem.title}</Text>
                  
                  <View style={styles.caseMetaRow}>
                    <View style={styles.caseMeta}>
                      <Text style={styles.caseMetaIcon}>👥</Text>
                      <Text style={styles.caseMetaText}>Partner: {caseItem.partner}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.caseMetaRow}>
                    <View style={styles.caseMeta}>
                      <Text style={styles.caseMetaIcon}>📅</Text>
                      <Text style={styles.caseMetaText}>Last Update: {caseItem.lastUpdate}</Text>
                    </View>
                  </View>

                  <View style={styles.caseActions}>
                    <TouchableOpacity style={styles.caseActionButton}>
                      <Text style={styles.caseActionText}>{caseItem.description}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.caseActionButtonSecondary}>
                      <Text style={styles.caseActionTextSecondary}>Escalate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details ↗</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'Secure Messages' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Secure Messages</Text>
            <View style={styles.emptyInvites}>
              <Text style={styles.emptyIcon}>✉️</Text>
              <Text style={styles.emptyText}>No secure messages yet</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    padding: 5,
  },
  notificationIcon: {
    fontSize: 24,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#AF52DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    gap: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyInvites: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  inviteCard: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inviteIconText: {
    fontSize: 24,
  },
  inviteContent: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inviteDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  inviteStatusRow: {
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inviteDescription: {
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 18,
    marginBottom: 12,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  caseCard: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  caseStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  caseTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  caseMetaRow: {
    marginBottom: 8,
  },
  caseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caseMetaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  caseMetaText: {
    fontSize: 13,
    color: '#3C3C43',
  },
  caseActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  caseActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  caseActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
  },
  caseActionButtonSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  caseActionTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  viewDetailsButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
