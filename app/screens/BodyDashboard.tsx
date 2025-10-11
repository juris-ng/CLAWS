import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';
import ManagePetitions from './ManagePetitions';

export default function BodyDashboard({ user, profile }) {
  const [bodyData, setBodyData] = useState(profile);
  const [petitionsCount, setPetitionsCount] = useState(0);
  const [showManagePetitions, setShowManagePetitions] = useState(false);

  useEffect(() => {
    loadBodyStats();
  }, []);

  const loadBodyStats = async () => {
    // Refresh body data
    const { data: bodyInfo } = await supabase
      .from('bodies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (bodyInfo) {
      setBodyData(bodyInfo);
    }

    // Get petitions count
    const { count } = await supabase
      .from('petitions')
      .select('*', { count: 'exact', head: true });

    setPetitionsCount(count || 0);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  // Show ManagePetitions screen if active
  if (showManagePetitions) {
    return <ManagePetitions onBack={() => setShowManagePetitions(false)} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>🏢 Organization Dashboard</Text>
          <Text style={styles.nameText}>{bodyData?.name}</Text>
          <Text style={styles.pointsText}>Points: {bodyData?.points || 0}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bodyData?.member_count || 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{petitionsCount}</Text>
            <Text style={styles.statLabel}>Total Petitions</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{bodyData?.points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Organization Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Organization Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{bodyData?.name}</Text>
          </View>
          
          {bodyData?.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.infoValue}>{bodyData.description}</Text>
            </View>
          )}
          
          {bodyData?.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{bodyData.location}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Manage Members</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowManagePetitions(true)}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>Manage Petitions & Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Organization Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  welcomeText: {
    color: '#fff',
    fontSize: 14,
  },
  nameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28a745',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  actionButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
  },
});
