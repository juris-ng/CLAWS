import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnonymousService } from '../../utils/anonymousService';

const PetitionCard = ({ petition, onPress }) => {
  const getCreatorName = () => {
    if (petition.is_anonymous) {
      return 'Anonymous Activist';
    }
    return AnonymousService.getDisplayName(petition.creator);
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

  const creatorName = getCreatorName();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.creatorInfo}>
          {petition.is_anonymous ? (
            <View style={styles.anonymousAvatar}>
              <Text style={styles.anonymousIcon}>🔒</Text>
            </View>
          ) : (
            petition.creator?.avatar_url ? (
              <Image 
                source={{ uri: petition.creator.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {creatorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )
          )}
          <View style={styles.creatorText}>
            <Text style={styles.creatorName}>{creatorName}</Text>
            <Text style={styles.date}>{formatDate(petition.created_at)}</Text>
          </View>
        </View>
        {petition.is_anonymous && (
          <View style={styles.anonymousBadge}>
            <Text style={styles.anonymousBadgeText}>Anonymous</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {petition.title}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {petition.description}
      </Text>

      {petition.category && (
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {petition.category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.voteStats}>
          <Text style={styles.votesFor}>
            👍 {petition.votes_for || 0}
          </Text>
          <Text style={styles.votesAgainst}>
            👎 {petition.votes_against || 0}
          </Text>
        </View>
        <Text style={styles.viewMore}>View Details →</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  anonymousIcon: {
    fontSize: 20,
  },
  creatorText: {
    flex: 1,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  date: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  anonymousBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  anonymousBadgeText: {
    fontSize: 11,
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
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteStats: {
    flexDirection: 'row',
    gap: 16,
  },
  votesFor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  votesAgainst: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  viewMore: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
});

export default PetitionCard;
