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

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchEvent = async () => {
    try {
      const result = await BodyContentService.getContentById(eventId);
      if (result.success) {
        setEvent(result.content);
        setLiked(result.content.user_liked || false);
        setRsvpStatus(result.content.user_rsvp_status || null);
      } else {
        Alert.alert('Error', result.error || 'Failed to load event');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Fetch event error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvent();
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to like events');
      return;
    }

    const newLikedState = !liked;
    setLiked(newLikedState);

    setEvent(prev => ({
      ...prev,
      likes_count: prev.likes_count + (newLikedState ? 1 : -1),
    }));

    const result = await BodyContentService.toggleLike(eventId, newLikedState);
    if (!result.success) {
      setLiked(!newLikedState);
      setEvent(prev => ({
        ...prev,
        likes_count: prev.likes_count + (newLikedState ? -1 : 1),
      }));
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleRSVP = async (status) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to RSVP');
      return;
    }

    setRsvpStatus(status);

    const result = await BodyContentService.updateRSVP(eventId, status);
    if (!result.success) {
      setRsvpStatus(null);
      Alert.alert('Error', result.error || 'Failed to update RSVP');
    } else {
      Alert.alert('Success', `You are marked as "${status}" for this event`);
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

    const result = await BodyContentService.addComment(eventId, commentText.trim());

    setSubmittingComment(false);

    if (result.success) {
      setCommentText('');
      setEvent(prev => ({
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
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Event not found</Text>
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
            {event.body_logo_url ? (
              <Image
                source={{ uri: event.body_logo_url }}
                style={styles.bodyLogo}
              />
            ) : (
              <View style={[styles.bodyLogo, styles.placeholderLogo]}>
                <Text style={styles.placeholderText}>
                  {event.body_name ? event.body_name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={styles.bodyName}>{event.body_name || 'Unknown Body'}</Text>
              <Text style={styles.timestamp}>
                {new Date(event.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Content */}
          <Text style={styles.content}>{event.content}</Text>

          {/* Event Date & Time */}
          {event.event_date && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>📅 Date & Time</Text>
              <Text style={styles.infoValue}>
                {new Date(event.event_date).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {/* Location */}
          {event.location && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>📍 Location</Text>
              <Text style={styles.infoValue}>{event.location}</Text>
            </View>
          )}

          {/* Registration Deadline */}
          {event.registration_deadline && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>⏰ Registration Deadline</Text>
              <Text style={styles.infoValue}>
                {new Date(event.registration_deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{event.views_count || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{event.likes_count || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{event.comments_count || 0}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>

          {/* RSVP Buttons */}
          <View style={styles.rsvpContainer}>
            <Text style={styles.sectionTitle}>RSVP Status</Text>
            <View style={styles.rsvpButtons}>
              <TouchableOpacity
                style={[styles.rsvpButton, rsvpStatus === 'going' && styles.rsvpButtonActive]}
                onPress={() => handleRSVP('going')}
              >
                <Text style={[styles.rsvpButtonText, rsvpStatus === 'going' && styles.rsvpButtonTextActive]}>
                  ✅ Going
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rsvpButton, rsvpStatus === 'interested' && styles.rsvpButtonActive]}
                onPress={() => handleRSVP('interested')}
              >
                <Text style={[styles.rsvpButtonText, rsvpStatus === 'interested' && styles.rsvpButtonTextActive]}>
                  ⭐ Interested
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rsvpButton, rsvpStatus === 'not_going' && styles.rsvpButtonActive]}
                onPress={() => handleRSVP('not_going')}
              >
                <Text style={[styles.rsvpButtonText, rsvpStatus === 'not_going' && styles.rsvpButtonTextActive]}>
                  ❌ Can't Go
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Like Button */}
          <TouchableOpacity
            style={[styles.actionButton, liked && styles.actionButtonActive]}
            onPress={handleLike}
          >
            <Text style={[styles.actionButtonText, liked && styles.actionButtonTextActive]}>
              {liked ? '❤️ Liked' : '🤍 Like'}
            </Text>
          </TouchableOpacity>

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
  infoBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
  rsvpContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rsvpButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  rsvpButtonTextActive: {
    color: COLORS.white,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 16,
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
