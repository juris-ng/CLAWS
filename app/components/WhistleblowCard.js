import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnonymousService } from '../../utils/anonymousService';

const WhistleblowCard = ({ report, onPress }) => {
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'corruption': return '💰';
      case 'harassment': return '⚠️';
      case 'fraud': return '🚨';
      case 'safety': return '🛡️';
      case 'environmental': return '🌍';
      default: return '📢';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const reporterName = report.is_anonymous 
    ? 'Anonymous Reporter'
    : AnonymousService.getDisplayName(report.reporter);

  const severityColor = getSeverityColor(report.severity);
  const statusColor = getStatusColor(report.status);
  const categoryIcon = getCategoryIcon(report.category);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.categoryIcon}>{categoryIcon}</Text>
          <View>
            <Text style={styles.category}>
              {report.category.toUpperCase()}
            </Text>
            {report.is_verified && (
              <Text style={styles.verified}>✓ Verified</Text>
            )}
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
          <Text style={styles.severityText}>
            {report.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {report.title}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {report.description}
      </Text>

      {report.target_entity && (
        <View style={styles.targetContainer}>
          <Text style={styles.targetLabel}>Target: </Text>
          <Text style={styles.targetValue}>{report.target_entity}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Text style={styles.reporter}>{reporterName}</Text>
          <Text style={styles.date}>{formatDate(report.created_at)}</Text>
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👁️</Text>
            <Text style={styles.statText}>{report.views_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👍</Text>
            <Text style={styles.statText}>{report.support_count || 0}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.statusBar, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>
          {report.status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  verified: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  targetContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
  },
  targetValue: {
    fontSize: 12,
    color: '#E65100',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaInfo: {
    flex: 1,
  },
  reporter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: '#999999',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  statusBar: {
    marginHorizontal: -16,
    marginBottom: -16,
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default WhistleblowCard;
