import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { TrustMetricsService } from '../../utils/trustMetricsService';

export default function BodyDashboardScreen({ user, profile }) {
  const [bodyData, setBodyData] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);
  const [editingMission, setEditingMission] = useState(false);
  const [missionText, setMissionText] = useState('');
  const [trustMetrics, setTrustMetrics] = useState(null);
  const [adminRoles, setAdminRoles] = useState([]);
  const [ideas, setIdeas] = useState([]);

  const tabs = ['Overview', 'Petitions', 'Ideas', 'Members'];

  useEffect(() => {
    loadBodyData();
  }, []);

  const loadBodyData = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('bodies')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setBodyData(data);
      setMissionText(data.description || '');
    }

    // Load trust metrics
    const metrics = await TrustMetricsService.getTrustMetrics(user.id);
    setTrustMetrics(metrics);

    // Load admin roles
    const { data: roles } = await supabase
      .from('body_admin_roles')
      .select(`
        *,
        members:member_id (full_name, email)
      `)
      .eq('body_id', user.id)
      .eq('is_active', true);

    if (roles) {
      setAdminRoles(roles);
    }

    // Load ideas
    await loadIdeas();

    setLoading(false);
  };

  const loadIdeas = async () => {
    const { data } = await supabase
      .from('ideas')
      .select(`
        *,
        members:member_id (full_name)
      `)
      .eq('body_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setIdeas(data);
    }
  };

  const handleSaveMission = async () => {
    const { error } = await supabase
      .from('bodies')
      .update({ description: missionText })
      .eq('user_id', user.id);

    if (!error) {
      setBodyData({ ...bodyData, description: missionText });
      setEditingMission(false);
      alert('Mission updated successfully!');
    }
  };

  const handleRecalculateTrust = async () => {
    setLoading(true);
    const metrics = await TrustMetricsService.calculateTrustMetrics(user.id);
    setTrustMetrics(metrics);
    setLoading(false);
    alert('Trust metrics recalculated!');
  };

  const handleReviewIdea = async (ideaId, newStatus) => {
    const { error } = await supabase
      .from('ideas')
      .update({ 
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', ideaId);

    if (!error) {
      alert(`Idea ${newStatus}!`);
      await loadIdeas();
    }
  };

  const getIdeaStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#FF9500';
      case 'under_review': return '#0066FF';
      case 'accepted': return '#34C759';
      case 'implemented': return '#AF52DE';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const trustRating = trustMetrics 
    ? TrustMetricsService.getTrustRating(trustMetrics.trust_score) 
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Body Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {bodyData?.name?.charAt(0).toUpperCase() || 'B'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Name */}
      <View style={styles.bodyHeader}>
        <Text style={styles.bodyName}>{bodyData?.name}</Text>
        <Text style={styles.bodySubtitle}>{bodyData?.member_count || 0} Members</Text>
      </View>

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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBodyData} />
        }
      >
        {activeTab === 'Overview' && (
          <>
            {/* Trust Metrics */}
            {trustMetrics && trustRating && (
              <View style={styles.trustMetricsCard}>
                <View style={styles.trustHeader}>
                  <Text style={styles.trustTitle}>Trust Score</Text>
                  <TouchableOpacity onPress={handleRecalculateTrust}>
                    <Text style={styles.recalculateButton}>🔄 Refresh</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.trustScoreRow}>
                  <View style={styles.trustScoreCircle}>
                    <Text style={[styles.trustScoreNumber, { color: trustRating.color }]}>
                      {Math.round(trustMetrics.trust_score)}
                    </Text>
                    <Text style={styles.trustScoreLabel}>/ 100</Text>
                  </View>
                  <View style={styles.trustRating}>
                    <Text style={styles.trustRatingIcon}>{trustRating.icon}</Text>
                    <Text style={[styles.trustRatingText, { color: trustRating.color }]}>
                      {trustRating.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.trustMetrics}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Response Rate</Text>
                    <Text style={styles.metricValue}>{Math.round(trustMetrics.response_rate)}%</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Resolution Rate</Text>
                    <Text style={styles.metricValue}>{Math.round(trustMetrics.resolution_rate)}%</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Member Satisfaction</Text>
                    <Text style={styles.metricValue}>{Math.round(trustMetrics.member_satisfaction)}%</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Transparency</Text>
                    <Text style={styles.metricValue}>{Math.round(trustMetrics.transparency_score)}%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Mission Statement */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mission Statement</Text>
                <TouchableOpacity onPress={() => setEditingMission(!editingMission)}>
                  <Text style={styles.editButton}>{editingMission ? 'Cancel' : 'Edit'}</Text>
                </TouchableOpacity>
              </View>

              {editingMission ? (
                <>
                  <TextInput
                    style={styles.missionInput}
                    value={missionText}
                    onChangeText={setMissionText}
                    multiline
                    placeholder="Enter your organization's mission..."
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveMission}>
                    <Text style={styles.saveButtonText}>Save Mission</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.missionText}>
                  {bodyData?.description || 'No mission statement set.'}
                </Text>
              )}
            </View>

            {/* Admin Roles */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Administrative Team</Text>
                <TouchableOpacity>
                  <Text style={styles.addButton}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {adminRoles.length === 0 ? (
                <Text style={styles.emptyText}>No admin roles assigned yet</Text>
              ) : (
                adminRoles.map((role) => (
                  <View key={role.id} style={styles.adminCard}>
                    <View style={styles.adminAvatar}>
                      <Text style={styles.adminAvatarText}>
                        {role.members?.full_name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.adminInfo}>
                      <Text style={styles.adminName}>{role.members?.full_name}</Text>
                      <Text style={styles.adminRole}>{role.role_title}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Analytics Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Analytics</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{bodyData?.points || 0}</Text>
                  <Text style={styles.statLabel}>Total Points</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{bodyData?.member_count || 0}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {trustMetrics?.total_petitions_handled || 0}
                  </Text>
                  <Text style={styles.statLabel}>Petitions</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {trustMetrics?.total_petitions_resolved || 0}
                  </Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Petitions' && (
          <View style={styles.section}>
            <Text style={styles.emptyText}>No petitions yet</Text>
          </View>
        )}

        {activeTab === 'Ideas' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Ideas</Text>
              <Text style={styles.sectionSubtitle}>{ideas.length} total</Text>
            </View>

            {ideas.length === 0 ? (
              <Text style={styles.emptyText}>No ideas submitted yet</Text>
            ) : (
              ideas.map((idea) => (
                <View key={idea.id} style={styles.ideaCard}>
                  <View style={styles.ideaHeader}>
                    <View style={[
                      styles.ideaStatusBadge, 
                      { backgroundColor: getIdeaStatusColor(idea.status) }
                    ]}>
                      <Text style={styles.ideaStatusText}>
                        {idea.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.ideaTitle}>{idea.title}</Text>
                  <Text style={styles.ideaDescription} numberOfLines={2}>
                    {idea.description}
                  </Text>
                  
                  <View style={styles.ideaFooter}>
                    <Text style={styles.ideaAuthor}>
                      By {idea.members?.full_name}
                    </Text>
                    {idea.status === 'submitted' && (
                      <View style={styles.ideaActions}>
                        <TouchableOpacity 
                          style={styles.ideaActionButton}
                          onPress={() => handleReviewIdea(idea.id, 'accepted')}
                        >
                          <Text style={styles.ideaActionText}>✅ Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.ideaActionButton, styles.ideaRejectButton]}
                          onPress={() => handleReviewIdea(idea.id, 'rejected')}
                        >
                          <Text style={styles.ideaRejectText}>❌ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {idea.status === 'accepted' && (
                      <TouchableOpacity 
                        style={styles.ideaImplementButton}
                        onPress={() => handleReviewIdea(idea.id, 'implemented')}
                      >
                        <Text style={styles.ideaImplementText}>Mark as Implemented</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'Members' && (
          <View style={styles.section}>
            <Text style={styles.emptyText}>Member list will appear here</Text>
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
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bodyHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  bodyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bodySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    gap: 10,
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
  content: {
    flex: 1,
  },
  trustMetricsCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  trustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trustTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recalculateButton: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  trustScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trustScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  trustScoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  trustScoreLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  trustRating: {
    flex: 1,
  },
  trustRatingIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  trustRatingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  trustMetrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  metricLabel: {
    fontSize: 15,
    color: '#3C3C43',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  editButton: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  addButton: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  missionInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 15,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  missionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginBottom: 10,
  },
  adminAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  ideaCard: {
    backgroundColor: '#F2F2F7',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  ideaHeader: {
    marginBottom: 10,
  },
  ideaStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ideaStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  ideaDescription: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 10,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  ideaAuthor: {
    fontSize: 13,
    color: '#8E8E93',
  },
  ideaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ideaActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  ideaActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  ideaRejectButton: {
    borderColor: '#FF3B30',
  },
  ideaRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  ideaImplementButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#AF52DE',
  },
  ideaImplementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
