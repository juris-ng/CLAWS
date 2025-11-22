import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BodyRatingService } from '../../utils/bodyRatingService';

const BodyRatingDisplay = ({ bodyId, compact = false }) => {
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [bodyId]);

  const loadRatings = async () => {
    const result = await BodyRatingService.getBodyAverageRating(bodyId);
    if (result.success) {
      setAvgRating(result.avgRating);
      setTotalRatings(result.totalRatings);
      setCategoryBreakdown(result.categoryBreakdown);
    }
    setLoading(false);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Text key={i} style={styles.star}>⭐</Text>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Text key={i} style={styles.star}>⭐</Text>);
      } else {
        stars.push(<Text key={i} style={styles.emptyStar}>☆</Text>);
      }
    }

    return stars;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading ratings...</Text>
      </View>
    );
  }

  if (totalRatings === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noRatingsText}>No ratings yet</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.starsRow}>
          {renderStars(avgRating)}
        </View>
        <Text style={styles.compactRating}>
          {avgRating.toFixed(1)} ({totalRatings})
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      <View style={styles.overallRating}>
        <Text style={styles.avgNumber}>{avgRating.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {renderStars(avgRating)}
        </View>
        <Text style={styles.totalRatings}>
          Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
        </Text>
      </View>

      {Object.keys(categoryBreakdown).length > 0 && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Category Breakdown</Text>
          {Object.entries(categoryBreakdown).map(([category, data]) => (
            <View key={category} style={styles.categoryRow}>
              <Text style={styles.categoryName}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <View style={styles.categoryRating}>
                <View style={styles.miniStars}>
                  {renderStars(parseFloat(data.avg))}
                </View>
                <Text style={styles.categoryAvg}>{data.avg}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999999',
  },
  noRatingsText: {
    fontSize: 14,
    color: '#999999',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailedContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  overallRating: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avgNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 24,
    color: '#FFD700',
  },
  emptyStar: {
    fontSize: 24,
    color: '#E0E0E0',
  },
  compactRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  totalRatings: {
    fontSize: 14,
    color: '#666666',
  },
  breakdown: {
    marginTop: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  categoryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStars: {
    flexDirection: 'row',
  },
  categoryAvg: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    width: 30,
  },
});

export default BodyRatingDisplay;
