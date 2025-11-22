import { StyleSheet, Text, View } from 'react-native';
import { RatingService } from '../../utils/ratingService';

const RatingDisplay = ({ reputationScore, showDetails = false, size = 'medium' }) => {
  const trustRating = RatingService.calculateTrustRating(reputationScore);
  const level = RatingService.getReputationLevel(reputationScore);
  const badge = RatingService.getReputationBadge(reputationScore);

  const sizeStyles = {
    small: { fontSize: 12, badgeSize: 16, starSize: 10 },
    medium: { fontSize: 16, badgeSize: 24, starSize: 14 },
    large: { fontSize: 20, badgeSize: 32, starSize: 18 }
  };

  const currentSize = sizeStyles[size];

  // Render stars
  const renderStars = () => {
    const fullStars = Math.floor(parseFloat(trustRating));
    const hasHalfStar = trustRating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Text key={i} style={[styles.star, { fontSize: currentSize.starSize }]}>⭐</Text>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Text key={i} style={[styles.star, { fontSize: currentSize.starSize }]}>⭐</Text>);
      } else {
        stars.push(<Text key={i} style={[styles.emptyStar, { fontSize: currentSize.starSize }]}>☆</Text>);
      }
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  if (!showDetails) {
    // Compact view
    return (
      <View style={styles.compactContainer}>
        <Text style={[styles.badge, { fontSize: currentSize.badgeSize }]}>{badge}</Text>
        {renderStars()}
        <Text style={[styles.rating, { fontSize: currentSize.fontSize }]}>
          {trustRating}
        </Text>
      </View>
    );
  }

  // Detailed view
  return (
    <View style={styles.detailedContainer}>
      <View style={styles.header}>
        <Text style={styles.badgeLarge}>{badge}</Text>
        <View style={styles.headerText}>
          <Text style={styles.levelName}>{level.name}</Text>
          <Text style={styles.reputationScore}>{reputationScore.toLocaleString()} Reputation</Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <Text style={styles.label}>Trust Rating:</Text>
        {renderStars()}
        <Text style={styles.ratingValue}>{trustRating} / 5.0</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min((reputationScore / 10000) * 100, 100)}%`,
                backgroundColor: level.color
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.floor((reputationScore / 10000) * 100)}% to maximum
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailedContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    marginRight: 4,
  },
  badgeLarge: {
    fontSize: 48,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  reputationScore: {
    fontSize: 14,
    color: '#666666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    color: '#FFD700',
  },
  emptyStar: {
    color: '#E0E0E0',
  },
  rating: {
    fontWeight: '600',
    color: '#333333',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default RatingDisplay;
