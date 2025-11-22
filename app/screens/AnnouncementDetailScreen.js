import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { BodyContentService } from '../../utils/bodyContentService';

const COLORS = {
  primary: '#0047AB',
  secondary: '#6C757D',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  light: '#F8F9FA',
  dark: '#343A40',
  white: '#FFFFFF',
  border: '#DEE2E6',
  text: '#212529',
  textSecondary: '#6C757D',
};

export default function AnnouncementDetailScreen({ route, navigation }) {
  const { announcementId } = route.params;
  const { user } = useAuth();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch announcement details
  const fetchAnnouncement = async () => {
    try {
      const result = await BodyContentService.getContentById(announcementId);
      if (result.success) {
        setAnnouncement(result.content);
        setLiked(result.content.user_liked || false);
        setFollowing(result.content.user_following || false);
      } else {
        Alert.alert('Error', result.error || 'Failed to load announcement');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Fetch announcement error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, [announcementId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnnouncement();
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to like announcements');
      return;
    }

    const newLikedState = !liked;
    setLiked(newLikedState);

    // Optimistically update count
    setAnnouncement(prev => ({
      ...prev,
      likes_count: prev.likes_count + (newLikedState ? 1 : -1),
    }));

    const result = await BodyContentService.toggleLike(announcementId, newLikedState);
    if (!result.success) {
      // Revert on error
      setLiked(!newLikedState);
      setAnnouncement(prev => ({
        ...prev,
        likes_count: prev.likes_count + (newLikedState ? -1 : 1),
      }));
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to follow announcements');
      return;
    }

    const newFollowingState = !following;
    setFollowing(newFollowingState);

    const result = await BodyContentService.toggleFollow(announcementId, newFollowingState);
    if (!result.success) {
      setFollowing(!newFollowingState);
      Alert.alert('Error', result.error || 'Failed to update follow status');
    } else {
      Alert.alert(
        'Success',
        newFollowingState
          ? 'You will receive updates about this announcement'
          : 'You have unfollowed this announcement'
      );
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Invalid Input', 'Please enter a comment');
      return;
    }

    setSubmittingComment(true);

    const result = await BodyContentService.addComment(announcementId, commentText.trim());

    setSubmittingComment(false);

    if (result.success) {
      setCommentText('');
      setAnnouncement(prev => ({
        ...prev,
        comments_count: prev.comments_count + 1,
      }));
      Alert.alert('Success', 'Comment added successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading announcement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!announcement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Announcement not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            {/* Body Logo */}
            {announcement.body_logo_url ? (
              <Image
                source={{ uri: announcement.body_logo_url }}
                style={styles.bodyLogo}
              />
            ) : (
              <View style={[styles.bodyLogo, styles.placeholderLogo]}>
                <Text style={styles.placeholderText}>
                  {announcement.body_name ? announcement.body_name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={styles.bodyName}>{announcement.body_name || 'Unknown Body'}</Text>
              <Text style={styles.timestamp}>
                {new Date(announcement.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{announcement.title}</Text>

          {/* Content */}
          <Text style={styles.content}>{announcement.content}</Text>

          {/* Priority Badge */}
          {announcement.priority && (
            <View style={[styles.badge, styles[`badge${announcement.priority}`]]}>
              <Text style={styles.badgeText}>{announcement.priority.toUpperCase()}</Text>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{announcement.views_count || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{announcement.likes_count || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{announcement.comments_count || 0}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, liked && styles.actionButtonActive]}
              onPress={handleLike}
            >
              <Text style={[styles.actionButtonText, liked && styles.actionButtonTextActive]}>
                {liked ? '❤️ Liked' : '🤍 Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, following && styles.actionButtonActive]}
              onPress={handleFollow}
            >
              <Text style={[styles.actionButtonText, following && styles.actionButtonTextActive]}>
                {following ? '🔔 Following' : '🔕 Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Add Comment</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submittingComment}
            />
            <TouchableOpacity
              style={[styles.button, submittingComment && styles.buttonDisabled]}
              onPress={handleAddComment}
              disabled={submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Post Comment</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bodyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderLogo: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bodyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgelow: {
    backgroundColor: COLORS.success,
  },
  badgemedium: {
    backgroundColor: COLORS.warning,
  },
  badgehigh: {
    backgroundColor: COLORS.danger,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionButtonTextActive: {
    color: COLORS.white,
  },
  commentSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
});
