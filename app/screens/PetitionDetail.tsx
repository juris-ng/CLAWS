import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';

export default function PetitionDetail({ petition, user, onBack }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    loadComments();
    loadUserVote();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107'; // yellow
      case 'under_review': return '#17a2b8'; // cyan
      case 'approved': return '#28a745'; // green
      case 'rejected': return '#dc3545'; // red
      case 'implemented': return '#6610f2'; // purple
      default: return '#6c757d'; // gray
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'implemented': return 'Implemented';
      default: return status;
    }
  };

  const loadComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        members:member_id (full_name)
      `)
      .eq('petition_id', petition.id)
      .order('created_at', { ascending: true });

    setLoading(false);

    if (data) {
      setComments(data);
    }
  };

  const loadUserVote = async () => {
    const { data } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('member_id', user.id)
      .eq('petition_id', petition.id)
      .single();

    if (data) {
      setUserVote(data.vote_type);
    }
  };

  const handleVote = async (voteType) => {
    if (userVote === voteType) {
      // Remove vote
      await supabase
        .from('votes')
        .delete()
        .eq('member_id', user.id)
        .eq('petition_id', petition.id);

      const functionName = voteType === 'upvote' ? 'decrement_upvotes' : 'decrement_downvotes';
      await supabase.rpc(functionName, { petition_id: petition.id });

      setUserVote(null);
    } else {
      if (userVote) {
        // Update existing vote
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('member_id', user.id)
          .eq('petition_id', petition.id);

        const decrementFn = userVote === 'upvote' ? 'decrement_upvotes' : 'decrement_downvotes';
        const incrementFn = voteType === 'upvote' ? 'increment_upvotes' : 'increment_downvotes';
        
        await supabase.rpc(decrementFn, { petition_id: petition.id });
        await supabase.rpc(incrementFn, { petition_id: petition.id });
      } else {
        // New vote
        await supabase.from('votes').insert([
          {
            member_id: user.id,
            petition_id: petition.id,
            vote_type: voteType,
          },
        ]);

        const functionName = voteType === 'upvote' ? 'increment_upvotes' : 'increment_downvotes';
        await supabase.rpc(functionName, { petition_id: petition.id });
      }

      setUserVote(voteType);
    }

    // Refresh petition data
    const { data: updatedPetition } = await supabase
      .from('petitions')
      .select('*')
      .eq('id', petition.id)
      .single();

    if (updatedPetition) {
      petition.upvotes = updatedPetition.upvotes;
      petition.downvotes = updatedPetition.downvotes;
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('comments').insert([
      {
        petition_id: petition.id,
        member_id: user.id,
        comment_text: commentText,
        is_anonymous: isAnonymous,
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert('Failed to post comment: ' + error.message);
    } else {
      setCommentText('');
      setIsAnonymous(false);
      loadComments();
    }
  };

  const renderComment = (comment) => (
    <View key={comment.id} style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>
          {comment.is_anonymous ? '👤 Anonymous Member' : comment.members?.full_name || 'Member'}
        </Text>
        <Text style={styles.commentDate}>
          {new Date(comment.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.comment_text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Petition Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadComments} />
        }
      >
        {/* Petition Card */}
        <View style={styles.petitionCard}>
          <Text style={styles.petitionTitle}>{petition.title}</Text>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(petition.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusLabel(petition.status)}</Text>
          </View>
          
          <Text style={styles.petitionDescription}>{petition.description}</Text>
          
          <View style={styles.voteContainer}>
            <TouchableOpacity 
              style={[
                styles.voteButton,
                userVote === 'upvote' && styles.voteButtonActive
              ]}
              onPress={() => handleVote('upvote')}
            >
              <Text style={[
                styles.voteButtonText,
                userVote === 'upvote' && styles.voteButtonTextActive
              ]}>
                👍 {petition.upvotes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.voteButton,
                userVote === 'downvote' && styles.voteButtonActive
              ]}
              onPress={() => handleVote('downvote')}
            >
              <Text style={[
                styles.voteButtonText,
                userVote === 'downvote' && styles.voteButtonTextActive
              ]}>
                👎 {petition.downvotes}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <Text style={styles.sectionTitle}>
          Discussion ({comments.length})
        </Text>

        {comments.length === 0 ? (
          <View style={styles.emptyComments}>
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
          </View>
        ) : (
          comments.map(renderComment)
        )}
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add your comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.anonymousToggle}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
              {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.anonymousLabel}>Post anonymously</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  petitionCard: {
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
  petitionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  petitionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  voteContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  voteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  voteButtonActive: {
    backgroundColor: '#007bff',
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  voteButtonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  emptyComments: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  commentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  commentInputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  anonymousLabel: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
