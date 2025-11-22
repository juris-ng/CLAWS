import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const CustomDrawer = (props) => {
  const { user, userProfile, logout } = useAuth();
  const { navigation } = props;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const getUserInitials = () => {
    const name = userProfile?.full_name || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const DrawerMenuItem = ({ icon, label, onPress, badge }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.profileInitialsLarge}>{getUserInitials()}</Text>
        </View>
        <Text style={styles.profileName}>{userProfile?.full_name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'member@example.com'}</Text>
        <View style={styles.memberBadge}>
          <Text style={styles.memberBadgeText}>MEMBER</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🥇</Text>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Activity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Activity</Text>
        <View style={styles.activityRow}>
          <View style={styles.activityCard}>
            <Text style={styles.activityValue}>0</Text>
            <Text style={styles.activityLabel}>Petitions</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityValue}>0</Text>
            <Text style={styles.activityLabel}>Signatures</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityValue}>0</Text>
            <Text style={styles.activityLabel}>Comments</Text>
          </View>
        </View>
      </View>

      {/* Available Points Card */}
      <TouchableOpacity
        style={styles.pointsCard}
        onPress={() => navigation.navigate('PointsRedemption')}
        activeOpacity={0.7}
      >
        <View style={styles.pointsLeft}>
          <Text style={styles.pointsIcon}>💎</Text>
          <View>
            <Text style={styles.pointsLabel}>Available Points</Text>
            <Text style={styles.pointsValue}>0</Text>
          </View>
        </View>
        <Text style={styles.redeemText}>Redeem ›</Text>
      </TouchableOpacity>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Settings</Text>
        <DrawerMenuItem
          icon="✏️"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <DrawerMenuItem
          icon="🔒"
          label="Anonymous Mode"
          onPress={() => navigation.navigate('AnonymousSettings')}
        />
        <DrawerMenuItem
          icon="📜"
          label="Activity History"
          onPress={() => navigation.navigate('ActivityHistory')}
        />
        <DrawerMenuItem
          icon="📊"
          label="Points History"
          onPress={() => navigation.navigate('PointsHistory')}
        />
        <DrawerMenuItem
          icon="🏆"
          label="Leaderboard"
          onPress={() => navigation.navigate('Leaderboard')}
        />
        <DrawerMenuItem
          icon="⚙️"
          label="App Settings"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      {/* My Content Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 My Content</Text>
        <DrawerMenuItem
          icon="📋"
          label="My Petitions"
          onPress={() => navigation.navigate('ManagePetitions')}
          badge="0"
        />
        <DrawerMenuItem
          icon="⚖️"
          label="My Appeals"
          onPress={() => navigation.navigate('MyAppeals')}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.appVersion}>Governance App v1.0</Text>
        <Text style={styles.memberSince}>
          Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    paddingBottom: 20,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: '#0066FF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInitialsLarge: {
    color: '#0066FF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },

  // Activity Section
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 11,
    color: '#666666',
  },

  // Points Card
  pointsCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  redeemText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuLabel: {
    fontSize: 15,
    color: '#333333',
  },
  badge: {
    backgroundColor: '#0066FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 15,
    color: '#D32F2F',
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 11,
    color: '#CCCCCC',
  },
});

export default CustomDrawer;
