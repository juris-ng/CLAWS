import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { getCategoryInfo } from '../../utils/petitionCategoriesService';

const { width, height } = Dimensions.get('window');

// CLAWS Brand Colors
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
  supportGreen: '#4CAF50',
  opposeRed: '#F44336',
};

export default function PetitionDetailEnhanced({ visible, petition, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [hasSupported, setHasSupported] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [signatureCount, setSignatureCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creator, setCreator] = useState(null);
  const [body, setBody] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [relatedPetitions, setRelatedPetitions] = useState([]);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    if (visible && petition) {
      loadPetitionDetails();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, petition]);

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

  const loadPetitionDetails = async () => {
    setLoading(true);
    await Promise.all([
      loadCreator(),
      loadBody(),
      loadSupportData(),
      loadComments(),
      loadUpdates(),
      loadRelatedPetitions(),
    ]);
    setLoading(false);
  };

  const loadCreator = async () => {
    if (petition.member_id) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('id', petition.member_id)
        .single();
      setCreator(data);
    }
  };

  const loadBody = async () => {
    if (petition.target_body_id) {
      const { data } = await supabase
        .from('bodies')
        .select('*')
        .eq('id', petition.target_body_id)
        .single();
      setBody(data);
    }
  };

  const loadSupportData = async () => {
    const { data: signaturesData, count: sigCount } = await supabase
      .from('petition_upvotes')
      .select('*', { count: 'exact' })
      .eq('petition_id', petition.id);

    setSignatureCount(sigCount || 0);

    if (user) {
      const userSignature = signaturesData?.find((s) => s.member_id === user.id);
      setHasSupported(!!userSignature);
    }

    const { data: downvotesData, count: downCount } = await supabase
      .from('petition_downvotes')
      .select('*', { count: 'exact' })
      .eq('petition_id', petition.id);

    setDownvoteCount(downCount || 0);

    if (user && downvotesData) {
      const userDownvote = downvotesData.find((d) => d.member_id === user.id);
      setHasDownvoted(!!userDownvote);
    }
  };

  // ✅ UPDATED: Load comments with likes/dislikes and replies
  const loadComments = async () => {
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        *,
        member:members!comments_member_id_fkey(id, full_name, avatar_url, is_anonymous, anonymous_display_name)
      `)
      .eq('petition_id', petition.id)
      .order('created_at', { ascending: false });

    if (!commentsData) {
      setComments([]);
      return;
    }

    // Load likes/dislikes for each comment
    const commentsWithStats = await Promise.all(
      commentsData.map(async (comment) => {
        // Get like count
        const { count: likeCount } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // Get dislike count
        const { count: dislikeCount } = await supabase
          .from('comment_dislikes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // Check if user liked/disliked
        let userLiked = false;
        let userDisliked = false;

        if (user) {
          const { data: userLikeData } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('member_id', user.id)
            .maybeSingle();

          const { data: userDislikeData } = await supabase
            .from('comment_dislikes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('member_id', user.id)
            .maybeSingle();

          userLiked = !!userLikeData;
          userDisliked = !!userDislikeData;
        }

        // Get replies count
        const { count: replyCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', comment.id);

        return {
          ...comment,
          likeCount: likeCount || 0,
          dislikeCount: dislikeCount || 0,
          userLiked,
          userDisliked,
          replyCount: replyCount || 0,
          replies: [],
        };
      })
    );

    // Organize comments into parent-child structure
    const parentComments = commentsWithStats.filter(c => !c.parent_id);
    const childComments = commentsWithStats.filter(c => c.parent_id);

    // Attach replies to parents
    parentComments.forEach(parent => {
      parent.replies = childComments.filter(child => child.parent_id === parent.id);
    });

    setComments(parentComments);
  };

  const loadUpdates = async () => {
    const { data } = await supabase
      .from('petition_updates')
      .select('*')
      .eq('petition_id', petition.id)
      .order('created_at', { ascending: false });

    setUpdates(data || []);
  };

  const loadRelatedPetitions = async () => {
    if (petition.category) {
      const { data } = await supabase
        .from('petitions')
        .select('id, title, signature_count, category')
        .eq('category', petition.category)
        .neq('id', petition.id)
        .eq('status', 'active')
        .order('signature_count', { ascending: false })
        .limit(3);

      setRelatedPetitions(data || []);
    }
  };

  const handleSupport = async () => {
    if (!user) {
      showToast('Please login to sign petitions', 'error');
      return;
    }

    try {
      if (hasSupported) {
        const { error } = await supabase
          .from('petition_upvotes')
          .delete()
          .eq('petition_id', petition.id)
          .eq('member_id', user.id);

        if (error) throw error;

        setHasSupported(false);
        setSignatureCount(signatureCount - 1);
        showToast('✋ Signature removed');
      } else {
        const { error } = await supabase
          .from('petition_upvotes')
          .insert({
            petition_id: petition.id,
            member_id: user.id,
          });

        if (error) throw error;

        setHasSupported(true);
        setSignatureCount(signatureCount + 1);

        const newCount = signatureCount + 1;
        if ([10, 50, 100, 500, 1000].includes(newCount)) {
          showToast(`🎉 Milestone! ${newCount} signatures reached!`);
        } else {
          showToast('✅ Petition signed!');
        }

        if (hasDownvoted) {
          await supabase
            .from('petition_downvotes')
            .delete()
            .eq('petition_id', petition.id)
            .eq('member_id', user.id);
          setHasDownvoted(false);
          setDownvoteCount(Math.max(0, downvoteCount - 1));
        }
      }
    } catch (error) {
      console.error('Support error:', error);
      if (error.code === '23505') {
        showToast('You already signed this petition', 'info');
      } else {
        showToast('Failed to sign petition', 'error');
      }
    }
  };

  const handleDownvote = async () => {
    if (!user) {
      showToast('Please login to vote', 'error');
      return;
    }

    try {
      if (hasDownvoted) {
        const { error } = await supabase
          .from('petition_downvotes')
          .delete()
          .eq('petition_id', petition.id)
          .eq('member_id', user.id);

        if (error) throw error;

        setHasDownvoted(false);
        setDownvoteCount(Math.max(0, downvoteCount - 1));
        showToast('Opposition removed');
      } else {
        const { error } = await supabase
          .from('petition_downvotes')
          .insert({
            petition_id: petition.id,
            member_id: user.id,
          });

        if (error) throw error;

        setHasDownvoted(true);
        setDownvoteCount(downvoteCount + 1);
        showToast('⚠️ Petition opposed');

        if (hasSupported) {
          await supabase
            .from('petition_upvotes')
            .delete()
            .eq('petition_id', petition.id)
            .eq('member_id', user.id);
          setHasSupported(false);
          setSignatureCount(Math.max(0, signatureCount - 1));
        }
      }
    } catch (error) {
      console.error('Downvote error:', error);
      if (error.code === '23505') {
        showToast('You already opposed this petition', 'info');
      } else {
        showToast('Failed to oppose petition', 'error');
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Sign this petition: ${petition.title}\n\nHelp us reach our goal!`,
        title: petition.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReport = async (reason) => {
    try {
      await supabase.from('reports').insert({
        reported_by: user?.id,
        content_type: 'petition',
        content_id: petition.id,
        reason,
      });
      showToast('Report submitted. We will review it shortly.');
      setShowReportOptions(false);
    } catch (error) {
      console.error('Report error:', error);
      showToast('Failed to submit report', 'error');
    }
  };

  // ✅ UPDATED: Add main comment
  const handleAddComment = async () => {
    if (!user) {
      showToast('Please login to comment', 'error');
      return;
    }

    if (!newComment.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('comments').insert({
        petition_id: petition.id,
        member_id: user.id,
        comment_text: newComment.trim(),  // ✅ CHANGED
        parent_id: null,
      });

      if (error) throw error;

      setNewComment('');
      showToast('💬 Comment posted!');
      loadComments();
    } catch (error) {
      console.error('Comment error:', error);
      showToast('Failed to add comment', 'error');
    }
  };

  // ✅ NEW: Add reply to comment
  const handleAddReply = async (parentCommentId) => {
    if (!user) {
      showToast('Please login to reply', 'error');
      return;
    }

    if (!replyText.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('comments').insert({
        petition_id: petition.id,
        member_id: user.id,
        comment_text: replyText.trim(),
        parent_id: parentCommentId,
      });

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      showToast('💬 Reply posted!');
      loadComments();
    } catch (error) {
      console.error('Reply error:', error);
      showToast('Failed to add reply', 'error');
    }
  };

  // ✅ NEW: Like comment
  const handleLikeComment = async (commentId, currentlyLiked) => {
    if (!user) {
      showToast('Please login to like comments', 'error');
      return;
    }

    try {
      if (currentlyLiked) {
        // Remove like
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('member_id', user.id);
      } else {
        // Add like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            member_id: user.id,
          });

        // Remove dislike if exists
        await supabase
          .from('comment_dislikes')
          .delete()
          .eq('comment_id', commentId)
          .eq('member_id', user.id);
      }

      loadComments();
    } catch (error) {
      console.error('Like error:', error);
      showToast('Failed to like comment', 'error');
    }
  };

  // ✅ NEW: Dislike comment
  const handleDislikeComment = async (commentId, currentlyDisliked) => {
    if (!user) {
      showToast('Please login to dislike comments', 'error');
      return;
    }

    try {
      if (currentlyDisliked) {
        // Remove dislike
        await supabase
          .from('comment_dislikes')
          .delete()
          .eq('comment_id', commentId)
          .eq('member_id', user.id);
      } else {
        // Add dislike
        await supabase
          .from('comment_dislikes')
          .insert({
            comment_id: commentId,
            member_id: user.id,
          });

        // Remove like if exists
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('member_id', user.id);
      }

      loadComments();
    } catch (error) {
      console.error('Dislike error:', error);
      showToast('Failed to dislike comment', 'error');
    }
  };

  const getProgressPercentage = () => {
    const goal = petition.signature_goal || 1000;
    return Math.min((signatureCount / goal) * 100, 100);
  };

  const getRemainingSignatures = () => {
    const goal = petition.signature_goal || 1000;
    return Math.max(goal - signatureCount, 0);
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // ✅ NEW: Render comment with replies
  const renderComment = (comment, isReply = false) => {
    const commenterAnon = comment.member?.is_anonymous;
    const commenterName = commenterAnon
      ? comment.member?.anonymous_display_name || 'Anonymous'
      : comment.member?.full_name || 'Anonymous';

    return (
      <View key={comment.id} style={[styles.commentCard, isReply && styles.replyCard]}>
        <View style={styles.commentHeader}>
          <View
            style={[
              styles.commentAvatar,
              { backgroundColor: commenterAnon ? COLORS.purple : COLORS.primary },
            ]}
          >
            <Text style={styles.commentAvatarText}>
              {commenterAnon ? '?' : commenterName[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.commentInfo}>
            <Text style={styles.commentAuthor}>{commenterName}</Text>
            <Text style={styles.commentDate}>
              {new Date(comment.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.commentText}>{comment.comment_text}</Text>

        {/* Comment Actions */}
        <View style={styles.commentActions}>
          {/* Like */}
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => handleLikeComment(comment.id, comment.userLiked)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={comment.userLiked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={16}
              color={comment.userLiked ? COLORS.primary : COLORS.mediumGray}
            />
            <Text style={[styles.commentActionText, comment.userLiked && styles.commentActionTextActive]}>
              {comment.likeCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Dislike */}
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => handleDislikeComment(comment.id, comment.userDisliked)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={comment.userDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
              size={16}
              color={comment.userDisliked ? COLORS.error : COLORS.mediumGray}
            />
            <Text style={[styles.commentActionText, comment.userDisliked && styles.commentActionTextActive]}>
              {comment.dislikeCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Reply */}
          {!isReply && (
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={() => setReplyingTo(comment.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.mediumGray} />
              <Text style={styles.commentActionText}>
                {comment.replyCount > 0 ? `${comment.replyCount} replies` : 'Reply'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor={COLORS.mediumGray}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <View style={styles.replyActions}>
              <TouchableOpacity
                style={styles.replyCancelButton}
                onPress={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                <Text style={styles.replyCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.replyPostButton}
                onPress={() => handleAddReply(comment.id)}
              >
                <Text style={styles.replyPostText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  };

  if (!petition) return null;

  const isAnonymous = petition.is_anonymous || creator?.is_anonymous;
  const creatorName = isAnonymous
    ? creator?.anonymous_display_name || 'Anonymous Citizen'
    : creator?.full_name || 'Anonymous User';
  const isTrending = signatureCount >= 100;
  const category = getCategoryInfo(petition.category);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <KeyboardAvoidingView
              style={styles.container}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color={COLORS.darkGray} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Petition Details</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                    <Ionicons name="share-outline" size={24} color={COLORS.darkGray} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowReportOptions(true)}
                    style={styles.iconButton}
                  >
                    <Ionicons name="flag-outline" size={24} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={loadPetitionDetails}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                  />
                }
              >
                <View style={styles.contentCard}>
                  {isTrending && (
                    <View style={styles.trendingBadge}>
                      <Ionicons name="flame" size={18} color={COLORS.orange} />
                      <Text style={styles.trendingText}>Trending</Text>
                    </View>
                  )}

                  <View style={styles.creatorSection}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: isAnonymous ? COLORS.purple : COLORS.primary },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {isAnonymous ? '?' : creatorName[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.creatorInfo}>
                      <Text style={styles.creatorName}>{creatorName}</Text>
                      <Text style={styles.creatorDate}>
                        {new Date(petition.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badges}>
                    {category && (
                      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                        <Text style={styles.badgeIcon}>{category.icon}</Text>
                        <Text style={[styles.badgeText, { color: category.color }]}>
                          {category.name}
                        </Text>
                      </View>
                    )}
                    {body && (
                      <View style={styles.targetBadge}>
                        <Ionicons name="business-outline" size={14} color={COLORS.mediumGray} />
                        <Text style={styles.targetText}>{body.name}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.title}>{petition.title}</Text>
                  <Text style={styles.description}>{petition.description}</Text>

                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <View>
                        <Text style={styles.progressCount}>
                          {signatureCount.toLocaleString()}
                        </Text>
                        <Text style={styles.progressLabel}>signatures</Text>
                      </View>
                      <View style={styles.goalContainer}>
                        <Text style={styles.goalLabel}>Goal</Text>
                        <Text style={styles.goalCount}>
                          {(petition.signature_goal || 1000).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[styles.progressBarFill, { width: `${getProgressPercentage()}%` }]}
                      />
                    </View>
                    
                    <Text style={styles.progressRemaining}>
                      {getRemainingSignatures().toLocaleString()} more needed
                    </Text>
                  </View>

                  <View style={styles.votingSection}>
                    <TouchableOpacity
                      style={[styles.voteButton, hasSupported && styles.voteButtonActive]}
                      onPress={handleSupport}
                      activeOpacity={0.7}
                    >
                      <FontAwesome 
                        name="hand-rock-o" 
                        size={24} 
                        color={hasSupported ? COLORS.white : COLORS.supportGreen} 
                      />
                      <View style={styles.voteInfo}>
                        <Text style={[styles.voteCount, hasSupported && styles.voteCountActive]}>
                          {signatureCount}
                        </Text>
                        <Text style={[styles.voteLabel, hasSupported && styles.voteLabelActive]}>
                          {hasSupported ? 'Signed' : 'Sign'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.voteButton, styles.downvoteButton, hasDownvoted && styles.downvoteButtonActive]}
                      onPress={handleDownvote}
                      activeOpacity={0.7}
                    >
                      <FontAwesome 
                        name="hand-rock-o" 
                        size={24} 
                        color={hasDownvoted ? COLORS.white : COLORS.opposeRed}
                        style={{ transform: [{ rotate: '180deg' }] }}
                      />
                      <View style={styles.voteInfo}>
                        <Text style={[styles.voteCount, styles.downvoteCount, hasDownvoted && styles.voteCountActive]}>
                          {downvoteCount}
                        </Text>
                        <Text style={[styles.voteLabel, styles.downvoteLabel, hasDownvoted && styles.voteLabelActive]}>
                          {hasDownvoted ? 'Opposed' : 'Oppose'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={20} color={COLORS.mediumGray} />
                      <Text style={styles.statText}>{comments.length} comments</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.statItem} onPress={handleShare}>
                      <Ionicons name="share-social-outline" size={20} color={COLORS.mediumGray} />
                      <Text style={styles.statText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {updates.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                      <Text style={styles.sectionTitle}>Updates</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{updates.length}</Text>
                      </View>
                    </View>
                    {updates.map((update) => (
                      <View key={update.id} style={styles.updateCard}>
                        <Text style={styles.updateTitle}>{update.title}</Text>
                        <Text style={styles.updateDate}>
                          {new Date(update.created_at).toLocaleDateString()}
                        </Text>
                        <Text style={styles.updateContent}>{update.content}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {relatedPetitions.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="link" size={20} color={COLORS.primary} />
                      <Text style={styles.sectionTitle}>Related Petitions</Text>
                    </View>
                    {relatedPetitions.map((related) => {
                      const relCat = getCategoryInfo(related.category);
                      return (
                        <TouchableOpacity
                          key={related.id}
                          style={styles.relatedCard}
                          activeOpacity={0.7}
                        >
                          <View style={styles.relatedContent}>
                            {relCat && <Text style={styles.relatedIcon}>{relCat.icon}</Text>}
                            <Text style={styles.relatedTitle} numberOfLines={2}>
                              {related.title}
                            </Text>
                          </View>
                          <Text style={styles.relatedSignatures}>
                            {(related.signature_count || 0).toLocaleString()} signatures
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Comments Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Comments</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{comments.length}</Text>
                    </View>
                  </View>

                  <View style={styles.addCommentSection}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add your comment..."
                      placeholderTextColor={COLORS.mediumGray}
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={styles.postButton}
                      onPress={handleAddComment}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>

                  {comments.map(comment => renderComment(comment))}

                  {comments.length === 0 && (
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubbles-outline" size={48} color={COLORS.lightGray} />
                      <Text style={styles.emptyText}>No comments yet</Text>
                      <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
                    </View>
                  )}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>

        <Toast />
      </View>

      <Modal
        visible={showReportOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportOptions(false)}
      >
        <TouchableOpacity
          style={styles.reportOverlay}
          activeOpacity={1}
          onPress={() => setShowReportOptions(false)}
        >
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Ionicons name="flag" size={24} color={COLORS.error} />
              <Text style={styles.reportTitle}>Report Petition</Text>
            </View>
            {[
              'Spam or misleading',
              'Offensive content',
              'False information',
              'Harassment',
              'Other',
            ].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.reportOption}
                onPress={() => handleReport(reason)}
                activeOpacity={0.7}
              >
                <Text style={styles.reportOptionText}>{reason}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.reportCancel}
              onPress={() => setShowReportOptions(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.reportCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.95,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },

  contentCard: {
    backgroundColor: COLORS.white,
    padding: 20,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  trendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.orange,
  },

  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  creatorDate: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.veryLightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  targetText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: COLORS.mediumGray,
    lineHeight: 24,
    marginBottom: 20,
  },

  progressCard: {
    backgroundColor: COLORS.veryLightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressCount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  goalContainer: {
    alignItems: 'flex-end',
  },
  goalLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  goalCount: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressRemaining: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },

  votingSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.veryLightGray,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.supportGreen + '30',
    gap: 12,
  },
  voteButtonActive: {
    backgroundColor: COLORS.supportGreen,
    borderColor: COLORS.supportGreen,
  },
  downvoteButton: {
    borderColor: COLORS.opposeRed + '30',
  },
  downvoteButtonActive: {
    backgroundColor: COLORS.opposeRed,
    borderColor: COLORS.opposeRed,
  },
  voteInfo: {
    alignItems: 'flex-start',
  },
  voteCount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.supportGreen,
    marginBottom: 2,
  },
  voteCountActive: {
    color: COLORS.white,
  },
  downvoteCount: {
    color: COLORS.opposeRed,
  },
  voteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.supportGreen,
  },
  voteLabelActive: {
    color: COLORS.white,
  },
  downvoteLabel: {
    color: COLORS.opposeRed,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.lightGray,
  },
  statText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  updateCard: {
    backgroundColor: COLORS.veryLightGray,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  updateDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  updateContent: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
  },

  relatedCard: {
    backgroundColor: COLORS.veryLightGray,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  relatedContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  relatedIcon: {
    fontSize: 18,
  },
  relatedTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  relatedSignatures: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ✅ NEW: Comment styles with likes/dislikes/replies
  addCommentSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    color: COLORS.darkGray,
  },
  postButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCard: {
    backgroundColor: COLORS.veryLightGray,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  replyCard: {
    marginLeft: 40,
    backgroundColor: COLORS.white,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    lineHeight: 20,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  commentActionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  replyInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  replyInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    color: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  replyCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  replyCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  replyPostButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  replyPostText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  repliesContainer: {
    marginTop: 10,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },

  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  reportOptionText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  reportCancel: {
    padding: 16,
    marginTop: 8,
    backgroundColor: COLORS.veryLightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
});
