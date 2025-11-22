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

export default function DiscussionDetailScreen({ route, navigation }) {
  const { discussionId } = route.params;
  const { user } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchDiscussion = async () => {
    try {
      const result = await BodyContentService.getContentById(discussionId);
      if (result.success) {
        setDiscussion(result.content);
        setLiked(result.content.user_liked || false);
        setFollowing(result.content.user_following || false);
      } else {
        Alert.alert('Error', result.error || 'Failed to load discussion');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Fetch discussion error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscussion();
  }, [discussionId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDiscussion();
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to like discussions');
      return;
    }

    const newLikedState = !liked;
    setLiked(newLikedState);

    setDiscussion(prev => ({
      ...prev,
      likes_count: prev.likes_count + (newLikedState ? 1 : -1),
    }));

    const result = await BodyContentService.toggleLike(discussionId, newLikedState);
    if (!result.success) {
      setLiked(!newLikedState);
      setDiscussion(prev => ({
        ...prev,
        likes_count: prev.likes_count + (newLikedState ? -1 : 1),
      }));
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to follow discussions');
      return;
    }

    const newFollowingState = !following;
    setFollowing(newFollowingState);

    const result = await BodyContentService.toggleFollow(discussionId, newFollowingState);
    if (!result.success) {
      setFollowing(!newFollowingState);
      Alert.alert('Error', result.error || 'Failed to update follow status');
    } else {
      Alert.alert(
        'Success',
        newFollowingState
          ? 'You will receive updates about this discussion'
          : 'You have unfollowed this discussion'
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

    const result = await BodyContentService.addComment(discussionId, commentText.trim());

    setSubmittingComment(false);

    if (result.success) {
      setCommentText('');
      setDiscussion(prev => ({
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
          <Text style={styles.loadingText}>Loading discussion...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!discussion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Discussion not found</Text>
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
            {discussion.body_logo_url ? (
              <Image
                source={{ uri: discussion.body_logo_url }}
                style={styles.bodyLogo}
              />
            ) : (
              <View style={[styles.bodyLogo, styles.placeholderLogo]}>
                <Text style={styles.placeholderText}>
                  {discussion.body_name ? discussion.body_name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={styles.bodyName}>{discussion.body_name || 'Unknown Body'}</Text>
              <Text style={styles.timestamp}>
                {new Date(discussion.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{discussion.title}</Text>

          {/* Content */}
          <Text style={styles.content}>{discussion.content}</Text>

          {/* Category Badge */}
          {discussion.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{discussion.category.toUpperCase()}</Text>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{discussion.views_count || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{discussion.likes_count || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{discussion.comments_count || 0}</Text>
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
            <Text style={styles.sectionTitle}>Join the Discussion</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts..."
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
    backgroundColor: COLORS.primary,
    marginBottom: 16,
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
