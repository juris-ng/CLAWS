import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { PointsService } from '../../utils/pointsService';
import { ResponsiveUtils } from '../../utils/responsive';
import ShareModal from '../components/ShareModal';

export default function PetitionDetailEnhanced({ petition: initialPetition, user, profile, onBack }) {
  const [petition, setPetition] = useState(initialPetition);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadPetitionDetails();
  }, []);

  const loadPetitionDetails = async () => {
    setLoading(true);
    await Promise.all([
      checkIfVoted(),
      loadVoteCount(),
      loadComments(),
    ]);
    setLoading(false);
  };

  const checkIfVoted = async () => {
    const { data, error } = await supabase
      .from('petition_votes')
      .select('id')
      .eq('petition_id', petition.id)
      .eq('member_id', user.id)
      .single();

    setHasVoted(!!data);
  };

  const loadVoteCount = async () => {
    const { count, error } = await supabase
      .from('petition_votes')
      .select('*', { count: 'exact', head: true })
      .eq('petition_id', petition.id);

    setVoteCount(count || 0);
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        member:members(full_name, avatar_url)
      `)
      .eq('petition_id', petition.id)
      .order('created_at', { ascending: false });

    if (!error) setComments(data || []);
  };

  const handleVote = async () => {
    if (hasVoted) {
      // Unvote
      const { error } = await supabase
        .from('petition_votes')
        .delete()
        .eq('petition_id', petition.id)
        .eq('member_id', user.id);

      if (!error) {
        setHasVoted(false);
        setVoteCount(voteCount - 1);
        Alert.alert('Vote Removed', 'Your vote has been removed');
      }
    } else {
      // Vote
      const { error } = await supabase
        .from('petition_votes')
        .insert([{
          petition_id: petition.id,
          member_id: user.id,
        }]);

      if (!error) {
        setHasVoted(true);
        setVoteCount(voteCount + 1);
        
        // Award points
        await PointsService.awardPoints(user.id, 'petition_voted', petition.id, 1);
        
        Alert.alert('Voted! 👍', 'Thanks for your support! You earned +1 point');
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        petition_id: petition.id,
        member_id: user.id,
        comment_text: newComment.trim(),
      }])
      .select(`
        *,
        member:members(full_name, avatar_url)
      `)
      .single();

    if (!error) {
      setComments([data, ...comments]);
      setNewComment('');
      
      // Award points
      await PointsService.awardPoints(user.id, 'comment_posted', data.id, 2);
      
      Alert.alert('Comment Added! 💬', 'You earned +2 points!');
    } else {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Petition Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPetitionDetails} />
        }
      >
        {/* Petition Card */}
        <View style={styles.petitionCard}>
          <View style={styles.petitionHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {petition.member?.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.petitionHeaderInfo}>
              <Text style={styles.petitionAuthor}>
                {petition.member?.full_name || 'Anonymous'}
              </Text>
              <Text style={styles.petitionDate}>
                {new Date(petition.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{petition.category?.toUpperCase()}</Text>
          </View>

          <Text style={styles.petitionTitle}>{petition.title}</Text>
          <Text style={styles.petitionDescription}>{petition.description}</Text>

          {petition.image_url && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageText}>📷 Image attached</Text>
            </View>
          )}

          <View style={styles.petitionStats}>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>👍</Text>
              <Text style={styles.statText}>{voteCount} Votes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{comments.length} Comments</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>🔗</Text>
              <Text style={styles.statText}>{petition.share_count || 0} Shares</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.voteButton, hasVoted && styles.voteButtonActive]}
            onPress={handleVote}
          >
            <Text style={[styles.voteButtonText, hasVoted && styles.voteButtonTextActive]}>
              {hasVoted ? '✓ Voted' : '👍 Vote for this Petition'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShowShareModal(true)}
          >
            <Text style={styles.shareButtonText}>🔗 Share</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add your comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.commentButton}
              onPress={handleAddComment}
            >
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {comment.member?.full_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.commentHeaderInfo}>
                  <Text style={styles.commentAuthor}>
                    {comment.member?.full_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentText}>{comment.comment_text}</Text>
            </View>
          ))}

          {comments.length === 0 && (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        petition={petition}
        userId={user.id}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ResponsiveUtils.spacing(2),
    paddingTop: ResponsiveUtils.isIPhoneX() ? 44 : 20,
    paddingBottom: ResponsiveUtils.spacing(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
  },
  backIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    color: '#1C1C1E',
  },
  headerTitle: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  petitionCard: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2.5),
    marginBottom: ResponsiveUtils.spacing(2),
  },
  petitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  avatarText: {
    fontSize: ResponsiveUtils.fontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  petitionHeaderInfo: {
    flex: 1,
  },
  petitionAuthor: {
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  petitionDate: {
    fontSize: ResponsiveUtils.fontSize(12),
    color: '#8E8E93',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0066FF',
    paddingHorizontal: ResponsiveUtils.spacing(1.5),
    paddingVertical: ResponsiveUtils.spacing(0.5),
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(2),
  },
  categoryText: {
    fontSize: ResponsiveUtils.fontSize(11),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  petitionTitle: {
    fontSize: ResponsiveUtils.fontSize(22),
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: ResponsiveUtils.spacing(1.5),
    lineHeight: 30,
  },
  petitionDescription: {
    fontSize: ResponsiveUtils.fontSize(15),
    color: '#3C3C43',
    lineHeight: 24,
    marginBottom: ResponsiveUtils.spacing(2),
  },
  imageContainer: {
    backgroundColor: '#F2F2F7',
    padding: ResponsiveUtils.spacing(2),
    borderRadius: 8,
    marginBottom: ResponsiveUtils.spacing(2),
  },
  imageText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
    textAlign: 'center',
  },
  petitionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: ResponsiveUtils.spacing(2),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
    marginBottom: 4,
  },
  statText: {
    fontSize: ResponsiveUtils.fontSize(13),
    color: '#8E8E93',
    fontWeight: '600',
  },
  voteButton: {
    backgroundColor: '#0066FF',
    padding: ResponsiveUtils.spacing(1.75),
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  voteButtonActive: {
    backgroundColor: '#34C759',
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
  shareButton: {
    backgroundColor: '#34C759',
    padding: ResponsiveUtils.spacing(1.75),
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    padding: ResponsiveUtils.spacing(2.5),
  },
  commentsTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    marginBottom: ResponsiveUtils.spacing(2),
  },
  addCommentContainer: {
    marginBottom: ResponsiveUtils.spacing(3),
  },
  commentInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: ResponsiveUtils.spacing(1.5),
    fontSize: ResponsiveUtils.fontSize(15),
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  commentButton: {
    backgroundColor: '#0066FF',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 8,
    alignItems: 'center',
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontSize: ResponsiveUtils.fontSize(15),
    fontWeight: '600',
  },
  commentCard: {
    backgroundColor: '#F2F2F7',
    padding: ResponsiveUtils.spacing(1.5),
    borderRadius: 8,
    marginBottom: ResponsiveUtils.spacing(1.5),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ResponsiveUtils.spacing(1),
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1),
  },
  commentAvatarText: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  commentHeaderInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: ResponsiveUtils.fontSize(14),
    fontWeight: '600',
    color: '#1C1C1E',
  },
  commentDate: {
    fontSize: ResponsiveUtils.fontSize(11),
    color: '#8E8E93',
  },
  commentText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#3C3C43',
    lineHeight: 20,
  },
  emptyComments: {
    padding: ResponsiveUtils.spacing(4),
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: ResponsiveUtils.fontSize(14),
    color: '#8E8E93',
    textAlign: 'center',
  },
});
