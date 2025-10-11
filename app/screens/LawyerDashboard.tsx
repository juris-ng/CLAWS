import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

export default function LawyerDashboard({ user, profile }) {
  const [lawyerData, setLawyerData] = useState(profile);

  useEffect(() => {
    loadLawyerData();
  }, []);

  const loadLawyerData = async () => {
    const { data } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setLawyerData(data);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>⚖️ Lawyer Portal</Text>
          <Text style={styles.nameText}>{lawyerData?.full_name}</Text>
          <Text style={styles.pointsText}>Points: {lawyerData?.points || 0}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Professional Profile</Text>
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Name:</Text>
            <Text style={styles.profileValue}>{lawyerData?.full_name}</Text>
          </View>
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Practice Areas:</Text>
            <Text style={styles.profileValue}>{lawyerData?.practice_areas || 'Not specified'}</Text>
          </View>
          
          {lawyerData?.license_number && (
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>License Number:</Text>
              <Text style={styles.profileValue}>{lawyerData.license_number}</Text>
            </View>
          )}
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Email:</Text>
            <Text style={styles.profileValue}>{lawyerData?.email}</Text>
          </View>
          
          {lawyerData?.phone_number && (
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Phone:</Text>
              <Text style={styles.profileValue}>{lawyerData.phone_number}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Consultation Requests</Text>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No consultation requests yet</Text>
          <Text style={styles.emptySubtext}>
            Members can request your legal advice on petitions
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>View Petitions Requiring Legal Input</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Consultation Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Profile Settings</Text>
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
    backgroundColor: '#6c757d',
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
    color: '#6c757d',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  profileRow: {
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 10,
  },
  emptyState: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
