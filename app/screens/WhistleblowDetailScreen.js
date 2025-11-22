import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { AnonymousService } from '../../utils/anonymousService';
import { WhistleblowService } from '../../utils/whistleblowService';


const WhistleblowDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params;
  
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);


  useEffect(() => {
    loadReportData();
  }, [reportId]);


  const loadReportData = async () => {
    try {
      // Load report
      const reportResult = await WhistleblowService.getReportById(reportId);
      if (reportResult.success) {
        setReport(reportResult.report);
      }


      // Load comments
      const commentsResult = await WhistleblowService.getReportComments(reportId);
      if (commentsResult.success) {
        setComments(commentsResult.comments);
      }


      // Check if user has supported
      const supportResult = await WhistleblowService.hasUserSupported(reportId);
      if (supportResult.success) {
        setHasSupported(supportResult.hasSupported);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };


  const handleSupport = async () => {
    try {
      const result = hasSupported
        ? await WhistleblowService.unsupportReport(reportId)
        : await WhistleblowService.supportReport(reportId);


      if (result.success) {
        setHasSupported(!hasSupported);
        loadReportData(); // Refresh to update count
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error toggling support:', error);
    }
  };


  const handleAddComment = async () => {
    if (!commentText.trim()) return;


    setSubmittingComment(true);
    try {
      const result = await WhistleblowService.addComment(
        reportId,
        commentText.trim(),
        commentAnonymous
      );


      if (result.success) {
        setCommentText('');
        setCommentAnonymous(false);
        loadReportData(); // Refresh comments
      } else {
        Alert.alert('Error', 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };


  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'under_review': return '#2196F3';
      case 'investigating': return '#FF9800';
      case 'verified': return '#4CAF50';
      case 'resolved': return '#00BCD4';
      case 'dismissed': return '#9E9E9E';
      default: return '#666666';
    }
  };


  const renderComment = ({ item }) => {
    const commenterName = item.is_anonymous
      ? 'Anonymous'
      : AnonymousService.getDisplayName(item.commenter);


    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <Text style={styles.commenterName}>{commenterName}</Text>
          <Text style={styles.commentDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.commentContent}>{item.content}</Text>
      </View>
    );
  };


  if (loading || !report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }


  const reporterName = report.is_anonymous
    ? 'Anonymous Reporter'
    : AnonymousService.getDisplayName(report.reporter);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
                <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
              </View>
              {report.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.category}>{report.category.toUpperCase()}</Text>
            <Text style={styles.title}>{report.title}</Text>
          </View>


          {/* Status Bar */}
          <View style={[styles.statusBar, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>
              Status: {report.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>


          {/* Report Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{report.description}</Text>
          </View>


          {report.target_entity && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Entity</Text>
              <View style={styles.targetContainer}>
                <Text style={styles.targetText}>{report.target_entity}</Text>
              </View>
            </View>
          )}


          {report.location && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.infoText}>📍 {report.location}</Text>
            </View>
          )}


          {/* Meta Information */}
          <View style={styles.section}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Reported by:</Text>
              <Text style={styles.metaValue}>{reporterName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>
                {new Date(report.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Views:</Text>
              <Text style={styles.metaValue}>{report.views_count || 0}</Text>
            </View>
          </View>


          {/* Support Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.supportButton, hasSupported && styles.supportButtonActive]}
              onPress={handleSupport}
            >
              <Text style={styles.supportButtonIcon}>
                {hasSupported ? '👍' : '👍🏼'}
              </Text>
              <Text style={[styles.supportButtonText, hasSupported && styles.supportButtonTextActive]}>
                {hasSupported ? 'Supported' : 'Support This Report'}
              </Text>
              <Text style={[styles.supportCount, hasSupported && styles.supportCountActive]}>
                {report.support_count || 0}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>
            
            {comments.length === 0 ? (
              <Text style={styles.noComments}>No comments yet. Be the first to comment.</Text>
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>


          <View style={styles.footer} />
        </ScrollView>


        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor="#999999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || submittingComment) && styles.sendButtonDisabled
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submittingComment}
          >
            <Text style={styles.sendButtonText}>
              {submittingComment ? '...' : '➤'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBar: {
    padding: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  targetContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  targetText: {
    fontSize: 16,
    color: '#E65100',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 16,
    color: '#666666',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#666666',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  supportButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  supportButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066FF',
    flex: 1,
  },
  supportButtonTextActive: {
    color: '#0066FF',
  },
  supportCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  supportCountActive: {
    color: '#0066FF',
  },
  noComments: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commenterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999999',
  },
  commentContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#F44336',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
  },
});


export default WhistleblowDetailScreen;
