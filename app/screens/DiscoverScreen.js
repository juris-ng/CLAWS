// screens/discover/DiscoverScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  success: '#4CAF50',
  warning: '#FF9800',
};

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [bodiesLeaderboard, setBodiesLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('learn');
  const [loading, setLoading] = useState(true);
  const [educationalContent, setEducationalContent] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchUserPoints();
      fetchBodiesLeaderboard();
      fetchEducationalContent();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('reputation_points, points')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserPoints(data?.reputation_points || data?.points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
      setUserPoints(0);
    }
  };

  const fetchBodiesLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('bodies')
        .select('id, name, logo, rating, points, body_type')
        .eq('status', 'active')
        .order('points', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBodiesLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching bodies leaderboard:', error);
      setBodiesLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationalContent = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('id, title, content, source_type, body_id, created_at, category')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        setEducationalContent(getDefaultEducationalContent());
      } else {
        setEducationalContent(data);
      }
    } catch (error) {
      console.error('Error fetching educational content:', error);
      setEducationalContent(getDefaultEducationalContent());
    }
  };

  const getDefaultEducationalContent = () => [
    {
      id: '1',
      category: 'Rights',
      title: 'Know Your Rights as a Member',
      content: 'Every member has the right to be heard, to access information, and to participate in decision-making processes. Understanding your rights is the first step to active participation.',
      icon: 'shield-checkmark-outline',
      source: 'General Knowledge',
    },
    {
      id: '2',
      category: 'Participation',
      title: 'The Power of Member Engagement',
      content: 'Active members shape organizational decisions. Your voice matters. By participating in petitions, discussions, and suggestions, you influence the direction of your body.',
      icon: 'megaphone-outline',
      source: 'Success Stories',
    },
    {
      id: '3',
      category: 'Accountability',
      title: 'Holding Leadership Accountable',
      content: 'Transparent governance requires active members who ask questions and demand answers. Review administrative decisions and voice your concerns through our platform.',
      icon: 'people-outline',
      source: 'Best Practices',
    },
    {
      id: '4',
      category: 'Trust',
      title: 'Building Trust Through Transparency',
      content: 'Bodies that communicate openly with members build stronger relationships. When you see transparent operations, your participation becomes more meaningful and impactful.',
      icon: 'ribbon-outline',
      source: 'General Knowledge',
    },
  ];

  const handleRedeemPoints = () => {
    navigation.navigate('PointsRedemption');
  };

  const handleSignLawyer = () => {
    navigation.navigate('BookConsultation');
  };

  const renderEducationCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.educationCard}
      activeOpacity={0.7}
      onPress={() => {}}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={24} color={COLORS.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.categoryBadge}>{item.category}</Text>
          <Text style={styles.sourceText}>{item.source || item.source_type}</Text>
        </View>
      </View>

      <Text style={styles.educationTitle}>{item.title}</Text>
      <Text style={styles.educationDescription} numberOfLines={2}>
        {item.content}
      </Text>

      <View style={styles.readMoreContainer}>
        <Text style={styles.readMore}>Read more</Text>
        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderLeaderboardBody = ({ item, index }) => {
    const getMedalIcon = (idx) => {
      if (idx === 0) return { name: 'trophy', color: '#FFD700' };
      if (idx === 1) return { name: 'medal', color: '#C0C0C0' };
      if (idx === 2) return { name: 'medal', color: '#CD7F32' };
      return null;
    };

    const medal = getMedalIcon(index);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.leaderboardRow}
        onPress={() => navigation.navigate('BodyProfile', { bodyId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.rankContainer}>
          {medal ? (
            <Ionicons name={medal.name} size={24} color={medal.color} />
          ) : (
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          )}
        </View>

        <View style={styles.bodyAvatarContainer}>
          <Text style={styles.bodyAvatarText}>
            {item.name?.charAt(0).toUpperCase() || 'O'}
          </Text>
        </View>

        <View style={styles.bodyInfoContainer}>
          <Text style={styles.bodyName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.bodyType}>{item.body_type || 'Organization'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.statValue}>{(item.rating || 0).toFixed(1)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={14} color={COLORS.primary} />
            <Text style={styles.statValue}>{(item.points || 0).toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* CLEAN WHITE HEADER WITH COMPACT POINTS */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>Learn & Connect</Text>
          </View>
          
          {/* COMPACT POINTS DISPLAY */}
          <View style={styles.compactPoints}>
            <View style={styles.pointsBadge}>
              <Ionicons name="trophy" size={16} color={COLORS.primary} />
              <Text style={styles.compactPointsValue}>{userPoints.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.compactRedeemButton}
              onPress={handleRedeemPoints}
              activeOpacity={0.7}
            >
              <Text style={styles.compactRedeemText}>Redeem</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'learn' && styles.tabActive]}
          onPress={() => setActiveTab('learn')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="book-outline"
            size={18}
            color={activeTab === 'learn' ? COLORS.primary : COLORS.mediumGray}
          />
          <Text style={[styles.tabText, activeTab === 'learn' && styles.tabTextActive]}>
            Education
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
          onPress={() => setActiveTab('leaderboard')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trophy-outline"
            size={18}
            color={activeTab === 'leaderboard' ? COLORS.primary : COLORS.mediumGray}
          />
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
            Organizations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && activeTab === 'leaderboard' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {activeTab === 'learn' ? (
            <ScrollView
              style={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Learning</Text>
                <Text style={styles.sectionSubtitle}>
                  Insights from organizations & member activism patterns
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  AI-powered insights updated from body constitutions
                </Text>
              </View>

              {educationalContent.map((item) => renderEducationCard(item))}
              <View style={{ height: 100 }} />
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Organizations</Text>
                <Text style={styles.sectionSubtitle}>Ranked by engagement & impact</Text>
              </View>

              {bodiesLeaderboard.length > 0 ? (
                bodiesLeaderboard.map((body, index) => renderLeaderboardBody({ item: body, index }))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="business-outline" size={48} color={COLORS.lightGray} />
                  <Text style={styles.emptyText}>No organizations yet</Text>
                </View>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </>
      )}

      {/* FAB - Consult Lawyer */}
      <TouchableOpacity style={styles.fab} onPress={handleSignLawyer} activeOpacity={0.8}>
        <Ionicons name="briefcase-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // CLEAN WHITE HEADER
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  settingsButton: {
    padding: 4,
  },

  // COMPACT POINTS SECTION
  compactPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  compactPointsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  compactRedeemButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  compactRedeemText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // Content
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },

  // Education Card
  educationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  educationDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMore: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Leaderboard
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 8,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.mediumGray,
  },
  bodyAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bodyAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  bodyInfoContainer: {
    flex: 1,
  },
  bodyName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  bodyType: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.mediumGray,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
