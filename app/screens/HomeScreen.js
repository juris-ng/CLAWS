import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { GeminiAIService } from '../../utils/geminiAIService';
import { getCategoryInfo, getRandomCategoryImage } from '../../utils/petitionCategoriesService';
import { PetitionService } from '../../utils/petitionService';
import PetitionDetailEnhanced from './PetitionDetailEnhanced';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0047AB',
  primaryDark: '#003580',
  primaryLight: '#E3F2FD',
  secondary: '#FF6B35',
  orange: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  black: '#000000',
  darkGray: '#1A1A1A',
  mediumGray: '#666666',
  lightGray: '#E5E5E5',
  veryLightGray: '#F5F5F5',
  white: '#FFFFFF',
  background: '#F8F9FA',
  purple: '#9C27B0',
  trending: '#FF5722',
  supportGreen: '#4CAF50',
  opposeRed: '#F44336',
  skeleton: '#E0E0E0',
  skeletonHighlight: '#F5F5F5',
};

const SkeletonCard = () => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={styles.petitionCard}>
      <View style={styles.cardMainContent}>
        <Animated.View style={[styles.skeletonImage, { opacity }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
            <View style={styles.creatorDetails}>
              <Animated.View style={[styles.skeletonText, styles.skeletonName, { opacity }]} />
              <Animated.View style={[styles.skeletonText, styles.skeletonDate, { opacity }]} />
            </View>
          </View>
          <Animated.View style={[styles.skeletonText, styles.skeletonTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonText, styles.skeletonTitleShort, { opacity }]} />
          <Animated.View style={[styles.skeletonText, styles.skeletonDescription, { opacity }]} />
          <Animated.View style={[styles.skeletonText, styles.skeletonDescriptionShort, { opacity }]} />
          <Animated.View style={[styles.skeletonTargetBody, { opacity }]} />
          <Animated.View style={[styles.skeletonComments, { opacity }]} />
        </View>
      </View>
      <View style={styles.voteSection}>
        <View style={styles.voteButton}>
          <Animated.View style={[styles.skeletonVoteIcon, { opacity }]} />
          <Animated.View style={[styles.skeletonVoteCount, { opacity }]} />
        </View>
        <View style={styles.voteDivider} />
        <View style={styles.voteButton}>
          <Animated.View style={[styles.skeletonVoteIcon, { opacity }]} />
          <Animated.View style={[styles.skeletonVoteCount, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [contentType, setContentType] = useState('petitions');
  const [smartFilters, setSmartFilters] = useState([]);
  const [showSmartFilters, setShowSmartFilters] = useState(false);

  useEffect(() => { loadAllContent(); }, []);
  useEffect(() => { filterContentByType(); }, [contentType, petitions, projects, discussions, events]);

  const loadAllContent = async () => {
    try {
      setLoading(true);
      await Promise.all([loadPetitions(), loadProjects(), loadDiscussions(), loadEvents()]);
    } catch (error) {
      console.error('Error loading content:', error);
      showToast('Failed to load content', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPetitions = async () => {
    try {
      const { data: petitionsData, error } = await supabase
        .from('petitions')
        .select(`
          *,
          creator:members!petitions_member_id_fkey(id, full_name, avatar_url, is_anonymous, anonymous_display_name),
          target_body:bodies!petitions_target_body_id_fkey(id, name, logo_url),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const petitionsWithCounts = await Promise.all(
        (petitionsData || []).map(async (petition) => {
          const { count: signatureCount } = await supabase
            .from('petition_upvotes')
            .select('*', { count: 'exact', head: true })
            .eq('petition_id', petition.id);

          const { count: opposeCount } = await supabase
            .from('petition_downvotes')
            .select('*', { count: 'exact', head: true })
            .eq('petition_id', petition.id);

          return {
            ...petition,
            signature_count: signatureCount || 0,
            oppose_count: opposeCount || 0,
            image_url: petition.image_url || getRandomCategoryImage(petition.category),
            content_type: 'petition',
          };
        })
      );

      if (userProfile && petitionsWithCounts.length > 2) {
        const aiRes = await GeminiAIService.rankPetitions({ profile: userProfile, petitions: petitionsWithCounts });
        if (aiRes.success && Array.isArray(aiRes.rankedIds) && aiRes.rankedIds.length) {
          petitionsWithCounts.sort((a, b) => aiRes.rankedIds.indexOf(a.id) - aiRes.rankedIds.indexOf(b.id));
        }
      }

      setPetitions(petitionsWithCounts);
    } catch (error) {
      console.error('Error loading petitions:', error);
    }
  };

  const loadProjects = async () => {
    try {
      if (!user) { setProjects([]); return; }
      const { data: memberships } = await supabase.from('body_members').select('body_id').eq('member_id', user.id);
      const bodyIds = memberships?.map(m => m.body_id) || [];
      if (bodyIds.length === 0) { setProjects([]); return; }
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`*, body:bodies!projects_body_id_fkey(id, name, logo_url)`)
        .in('body_id', bodyIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error?.code === 'PGRST205') { setProjects([]); return; }
      if (error) throw error;
      const formattedProjects = (projectsData || []).map(project => ({ ...project, content_type: 'project' }));
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  const loadDiscussions = async () => {
    try {
      if (!user) { setDiscussions([]); return; }
      const { data: memberships } = await supabase.from('body_members').select('body_id').eq('member_id', user.id);
      const bodyIds = memberships?.map(m => m.body_id) || [];
      if (bodyIds.length === 0) { setDiscussions([]); return; }
      const { data: discussionsData, error } = await supabase
        .from('discussions')
        .select(`*, body:bodies!discussions_body_id_fkey(id, name, logo_url)`)
        .in('body_id', bodyIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error?.code === 'PGRST205') { setDiscussions([]); return; }
      if (error) throw error;
      const formattedDiscussions = (discussionsData || []).map(discussion => ({ ...discussion, content_type: 'discussion' }));
      setDiscussions(formattedDiscussions);
    } catch (error) {
      console.error('Error loading discussions:', error);
      setDiscussions([]);
    }
  };

  const loadEvents = async () => {
    try {
      if (!user) { setEvents([]); return; }
      const { data: memberships } = await supabase.from('body_members').select('body_id').eq('member_id', user.id);
      const bodyIds = memberships?.map(m => m.body_id) || [];
      if (bodyIds.length === 0) { setEvents([]); return; }
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`*, body:bodies!events_body_id_fkey(id, name, logo_url)`)
        .in('body_id', bodyIds)
        .order('start_date', { ascending: true })
        .limit(50);
      if (error?.code === 'PGRST205') { setEvents([]); return; }
      if (error) throw error;
      const formattedEvents = (eventsData || []).map(event => ({ ...event, content_type: 'event' }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  const filterContentByType = () => {
    switch (contentType) {
      case 'petitions': setFilteredContent(petitions); break;
      case 'projects': setFilteredContent(projects); break;
      case 'discussions': setFilteredContent(discussions); break;
      case 'events': setFilteredContent(events); break;
      default: setFilteredContent(petitions);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllContent();
  };

  const getUserInitials = () => {
    const name = userProfile?.full_name || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleFocusSmartFilters = async () => {
    if (!userProfile || petitions.length === 0 || smartFilters.length !== 0) return;
    const aiRes = await GeminiAIService.suggestPetitionFilters(userProfile, petitions, []);
    if (aiRes.success && Array.isArray(aiRes.filters)) {
      setSmartFilters(aiRes.filters);
      setShowSmartFilters(true);
    }
  };

  const handleSelectSmartFilter = async (filter) => {
    setSearchQuery(filter);
    await handleSearch(filter);
    setShowSmartFilters(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    try {
      const result = await PetitionService.searchPetitions(query, 10);
      if (result.success) {
        setSearchResults(result.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
      autoHide: true,
      bottomOffset: 100,
    });
  };

  const handleVote = async (petitionId, voteType) => {
    if (!user) {
      showToast('Please login to vote', 'error');
      return;
    }
    try {
      if (voteType === 'upvote') {
        const { data: existingSignature } = await supabase
          .from('petition_upvotes')
          .select('id')
          .eq('petition_id', petitionId)
          .eq('member_id', user.id)
          .maybeSingle();
        if (existingSignature) {
          const { error } = await supabase.from('petition_upvotes').delete().eq('petition_id', petitionId).eq('member_id', user.id);
          if (error) throw error;
          showToast('✋ Signature removed');
        } else {
          const { error } = await supabase.from('petition_upvotes').insert({ petition_id: petitionId, member_id: user.id });
          if (error) throw error;
          showToast('✅ Petition signed!');
        }
      } else {
        const { data: existingOppose } = await supabase
          .from('petition_downvotes')
          .select('id')
          .eq('petition_id', petitionId)
          .eq('member_id', user.id)
          .maybeSingle();
        if (existingOppose) {
          const { error } = await supabase.from('petition_downvotes').delete().eq('petition_id', petitionId).eq('member_id', user.id);
          if (error) throw error;
          showToast('Opposition removed');
        } else {
          const { error } = await supabase.from('petition_downvotes').insert({ petition_id: petitionId, member_id: user.id });
          if (error) throw error;
          showToast('⚠️ Petition opposed');
        }
      }
      await loadPetitions();
    } catch (error) {
      console.error('Vote error:', error);
      if (error.code === '23505') {
        showToast('You already voted', 'info');
      } else {
        showToast('Failed to vote. Try again.', 'error');
      }
    }
  };

  const renderFilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsContent}>
        <TouchableOpacity style={[styles.filterTab, contentType === 'petitions' && styles.activeFilterTab]} onPress={() => setContentType('petitions')} activeOpacity={0.7}>
          <Text style={[styles.filterTabText, contentType === 'petitions' && styles.activeFilterTabText]}>Petitions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterTab, contentType === 'projects' && styles.activeFilterTab]} onPress={() => setContentType('projects')} activeOpacity={0.7}>
          <Text style={[styles.filterTabText, contentType === 'projects' && styles.activeFilterTabText]}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterTab, contentType === 'discussions' && styles.activeFilterTab]} onPress={() => setContentType('discussions')} activeOpacity={0.7}>
          <Text style={[styles.filterTabText, contentType === 'discussions' && styles.activeFilterTabText]}>Discussions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterTab, contentType === 'events' && styles.activeFilterTab]} onPress={() => setContentType('events')} activeOpacity={0.7}>
          <Text style={[styles.filterTabText, contentType === 'events' && styles.activeFilterTabText]}>Events</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => {
            const drawerNav = navigation.getParent();
            if (drawerNav && drawerNav.openDrawer) {
              drawerNav.openDrawer();
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{getUserInitials()}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.mediumGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${contentType}...`}
            placeholderTextColor={COLORS.mediumGray}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={handleFocusSmartFilters}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowSearchResults(false);
                setSearchResults([]);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      {showSmartFilters && smartFilters.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 16, marginTop: 5 }}>
          {smartFilters.map((filter, idx) => (
            <TouchableOpacity
              key={filter + idx}
              style={{
                backgroundColor: COLORS.primaryLight,
                borderRadius: 14,
                paddingVertical: 6,
                paddingHorizontal: 14,
                marginRight: 8,
                marginBottom: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => handleSelectSmartFilter(filter)}
              activeOpacity={0.7}
            >
              <Ionicons name="sparkles-outline" size={14} color={COLORS.primaryDark} style={{ marginRight: 5 }} />
              <Text style={{ color: COLORS.primaryDark, fontSize: 13, fontWeight: '600' }}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => {
                  setSelectedPetition(item);
                  setShowModal(true);
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.image_url }} style={styles.searchResultImage} resizeMode="cover" />
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.searchResultCategory}>{getCategoryInfo(item.category).name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </View>
      )}
      {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={32} color={COLORS.lightGray} />
          <Text style={styles.noResultsText}>No {contentType} found</Text>
        </View>
      )}
    </View>
  );

  const renderPetitionCard = ({ item: petition }) => {
    const creator = petition.creator;
    const targetBody = petition.target_body;
    const isAnonymous = petition.is_anonymous || creator?.is_anonymous;
    const creatorName = isAnonymous ? creator?.anonymous_display_name || 'Anonymous User' : creator?.full_name || 'Anonymous User';
    const signatureCount = petition.signature_count || 0;
    const opposeCount = petition.oppose_count || 0;
    const commentCount = petition.comments?.[0]?.count || 0;
    const bodyName = targetBody?.name || 'Public Body';
    const category = getCategoryInfo(petition.category);

    return (
      <TouchableOpacity
        style={styles.petitionCard}
        onPress={() => {
          setSelectedPetition(petition);
          setShowModal(true);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: petition.image_url }} style={styles.petitionImage} resizeMode="cover" />
            <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
              <Text style={styles.categoryText}>{category.icon} {category.name}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatarSmall, { backgroundColor: isAnonymous ? COLORS.purple : COLORS.primary }]}>
                <Text style={styles.avatarTextSmall}>{isAnonymous ? '?' : creatorName[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{creatorName}</Text>
                <Text style={styles.timeAgo}>
                  {new Date(petition.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.petitionTitle} numberOfLines={2}>{petition.title}</Text>
            <Text style={styles.petitionDescription} numberOfLines={2}>{petition.description}</Text>
            <View style={styles.targetBody}>
              <Ionicons name="business-outline" size={14} color={COLORS.mediumGray} />
              <Text style={styles.targetText} numberOfLines={1}>{bodyName}</Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.commentsBadge}>
                <Ionicons name="chatbubble-outline" size={14} color={COLORS.mediumGray} />
                <Text style={styles.commentsText}>{commentCount} Comments</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.voteSection}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleVote(petition.id, 'upvote');
            }}
            activeOpacity={0.6}
          >
            <FontAwesome name="hand-rock-o" size={24} color={COLORS.supportGreen} />
            <Text style={[styles.voteCount, { color: COLORS.supportGreen }]}>{signatureCount}</Text>
          </TouchableOpacity>
          <View style={styles.voteDivider} />
          <TouchableOpacity
            style={styles.voteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleVote(petition.id, 'downvote');
            }}
            activeOpacity={0.6}
          >
            <FontAwesome name="hand-rock-o" size={24} color={COLORS.opposeRed} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={[styles.voteCount, { color: COLORS.opposeRed }]}>{opposeCount}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContentCard = ({ item }) => {
    if (item.content_type === 'petition') {
      return renderPetitionCard({ item });
    }
    const bodyName = item.body?.name || 'Organization';
    return (
      <TouchableOpacity
        style={styles.petitionCard}
        onPress={() => {
          showToast('Coming Soon', 'info');
        }}
        activeOpacity={0.9}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image_url || item.cover_image || getRandomCategoryImage('general') }}
              style={styles.petitionImage}
              resizeMode="cover"
            />
            <View style={[styles.categoryBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.categoryText}>
                {item.content_type === 'project' ? '🚀' : item.content_type === 'discussion' ? '💬' : '📅'} {item.content_type}
              </Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatarSmall, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.avatarTextSmall}>{bodyName[0]?.toUpperCase() || 'O'}</Text>
              </View>
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{bodyName}</Text>
                <Text style={styles.timeAgo}>
                  {new Date(item.created_at || item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.petitionTitle} numberOfLines={2}>{item.title || item.name}</Text>
            <Text style={styles.petitionDescription} numberOfLines={2}>{item.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={
          contentType === 'petitions' ? 'document-text-outline' :
          contentType === 'projects' ? 'briefcase-outline' :
          contentType === 'discussions' ? 'chatbubbles-outline' : 'calendar-outline'
        }
        size={64}
        color={COLORS.lightGray}
      />
      <Text style={styles.emptyText}>No {contentType} found</Text>
      <Text style={styles.emptySubtext}>
        {contentType === 'petitions' ? 'Be the first to create one!' : `Join organizations to see their ${contentType}`}
      </Text>
      {contentType === 'petitions' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreatePetition')}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.emptyButtonText}>Create Petition</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        {renderHeader()}
        {renderFilterTabs()}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
        <TouchableOpacity style={styles.fab} disabled>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {renderHeader()}
      {renderFilterTabs()}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredContent}
          renderItem={renderContentCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={filteredContent.length === 0 ? styles.emptyListContent : styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePetition')} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
      <PetitionDetailEnhanced
        visible={showModal}
        petition={selectedPetition}
        onClose={() => {
          setShowModal(false);
          setSelectedPetition(null);
          loadAllContent();
        }}
      />
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  skeletonImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.skeleton,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.skeleton,
    marginRight: 10,
  },
  skeletonText: {
    backgroundColor: COLORS.skeleton,
    borderRadius: 4,
  },
  skeletonName: {
    width: 120,
    height: 14,
    marginBottom: 6,
  },
  skeletonDate: {
    width: 60,
    height: 10,
  },
  skeletonTitle: {
    width: '90%',
    height: 16,
    marginBottom: 8,
  },
  skeletonTitleShort: {
    width: '60%',
    height: 16,
    marginBottom: 10,
  },
  skeletonDescription: {
    width: '100%',
    height: 12,
    marginBottom: 6,
  },
  skeletonDescriptionShort: {
    width: '75%',
    height: 12,
    marginBottom: 10,
  },
  skeletonTargetBody: {
    width: '80%',
    height: 32,
    backgroundColor: COLORS.skeleton,
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonComments: {
    width: 100,
    height: 28,
    backgroundColor: COLORS.skeleton,
    borderRadius: 16,
  },
  skeletonVoteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.skeleton,
  },
  skeletonVoteCount: {
    width: 30,
    height: 14,
    backgroundColor: COLORS.skeleton,
    borderRadius: 4,
    marginTop: 6,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  profileButton: {
    padding: 0,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 20,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
    padding: 0,
  },
  notificationButton: {
    padding: 0,
  },
  searchResults: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    maxHeight: 300,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.veryLightGray,
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  noResults: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 24,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  filterTabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingVertical: 10,
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  activeFilterTabText: {
    color: COLORS.white,
  },
  petitionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardMainContent: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  petitionImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTextSmall: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  timeAgo: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  petitionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  petitionDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
    lineHeight: 18,
    marginBottom: 10,
  },
  targetBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
  },
  targetText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  commentsText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  voteSection: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    paddingVertical: 16,
  },
  voteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  voteDivider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 85,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
