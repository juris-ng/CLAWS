import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LawyerService } from '../../utils/lawyerService';

const LawyerProfileScreen = ({ route, navigation }) => {
  const { lawyerId } = route.params || {};

  const [lawyer, setLawyer] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [badges, setBadges] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (lawyerId) {
      loadLawyerProfile();
    }
  }, [lawyerId]);

  const loadLawyerProfile = async () => {
    try {
      const [
        lawyerResult,
        specializationsResult,
        credentialsResult,
        badgesResult,
        reviewsResult,
        statsResult,
      ] = await Promise.all([
        LawyerService.getLawyerById(lawyerId),
        LawyerService.getLawyerSpecializations(lawyerId),
        LawyerService.getLawyerCredentials(lawyerId),
        LawyerService.getLawyerBadges(lawyerId),
        LawyerService.getLawyerReviews(lawyerId),
        LawyerService.getLawyerStats(lawyerId),
      ]);

      if (lawyerResult.success) {
        setLawyer(lawyerResult.lawyer);
      }

      if (specializationsResult.success) {
        setSpecializations(specializationsResult.specializations);
      }

      if (credentialsResult.success) {
        setCredentials(credentialsResult.credentials);
      }

      if (badgesResult.success) {
        setBadges(badgesResult.badges);
      }

      if (reviewsResult.success) {
        setReviews(reviewsResult.reviews);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading lawyer profile:', error);
      Alert.alert('Error', 'Failed to load lawyer profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLawyerProfile();
  };

  const handleCall = () => {
    if (lawyer?.office_phone) {
      Linking.openURL(`tel:${lawyer.office_phone}`);
    }
  };

  const handleEmail = () => {
    if (lawyer?.email) {
      Linking.openURL(`mailto:${lawyer.email}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${lawyer?.full_name} - ${lawyer?.bio?.substring(0, 100)}...`,
        title: `${lawyer?.full_name} - Lawyer Profile`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Profile',
      'Are you sure you want to report this profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement report functionality
            Alert.alert('Success', 'Profile reported successfully');
          },
        },
      ]
    );
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= roundedRating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const getExpertiseColor = (level) => {
    switch (level) {
      case 'expert':
        return '#4CAF50';
      case 'advanced':
        return '#2196F3';
      case 'intermediate':
        return '#FF9800';
      default:
        return '#999999';
    }
  };

  const renderReview = (review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {review.client?.profile_image ? (
          <Image source={{ uri: review.client.profile_image }} style={styles.reviewerAvatar} />
        ) : (
          <View style={styles.reviewerAvatarPlaceholder}>
            <Text style={styles.reviewerAvatarText}>
              {review.client?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.client?.full_name || 'Anonymous'}
          </Text>
          {renderRatingStars(review.overall_rating)}
        </View>
      </View>

      {review.review_text && (
        <Text style={styles.reviewText}>{review.review_text}</Text>
      )}

      {(review.professionalism || review.communication || 
        review.expertise || review.value_for_money) && (
        <View style={styles.detailedRatings}>
          {review.professionalism && (
            <View style={styles.detailedRatingItem}>
              <Text style={styles.detailedRatingLabel}>Professionalism</Text>
              <Text style={styles.detailedRatingValue}>{review.professionalism}/5</Text>
            </View>
          )}
          {review.communication && (
            <View style={styles.detailedRatingItem}>
              <Text style={styles.detailedRatingLabel}>Communication</Text>
              <Text style={styles.detailedRatingValue}>{review.communication}/5</Text>
            </View>
          )}
          {review.expertise && (
            <View style={styles.detailedRatingItem}>
              <Text style={styles.detailedRatingLabel}>Expertise</Text>
              <Text style={styles.detailedRatingValue}>{review.expertise}/5</Text>
            </View>
          )}
          {review.value_for_money && (
            <View style={styles.detailedRatingItem}>
              <Text style={styles.detailedRatingLabel}>Value</Text>
              <Text style={styles.detailedRatingValue}>{review.value_for_money}/5</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.reviewDate}>
        {new Date(review.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading || !lawyer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const successRate =
    stats && stats.totalCases > 0
      ? ((stats.activeCases / stats.totalCases) * 100).toFixed(1)
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {lawyer.profile_image ? (
            <Image source={{ uri: lawyer.profile_image }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {lawyer.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          <Text style={styles.lawyerName}>{lawyer.full_name}</Text>

          {lawyer.law_firm && <Text style={styles.lawFirm}>{lawyer.law_firm}</Text>}

          <View style={styles.ratingContainer}>
            {renderRatingStars(lawyer.rating || 0)}
            <Text style={styles.ratingText}>
              {(lawyer.rating || 0).toFixed(1)} ({stats?.totalReviews || 0} reviews)
            </Text>
          </View>

          <View style={styles.badgesRow}>
            {lawyer.is_verified && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Text style={styles.badgeText}>✓ Verified</Text>
              </View>
            )}
            {lawyer.bar_number && (
              <View style={[styles.badge, styles.barBadge]}>
                <Text style={styles.badgeText}>⚖️ Bar: {lawyer.bar_number}</Text>
              </View>
            )}
          </View>

          {/* Action Icons */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <Text style={styles.headerActionIcon}>🔗</Text>
              <Text style={styles.headerActionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleReport}>
              <Text style={styles.headerActionIcon}>🚩</Text>
              <Text style={styles.headerActionText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{lawyer.years_of_experience || 0}</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalCases || 0}</Text>
            <Text style={styles.statLabel}>Cases</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{successRate}%</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
          {lawyer.consultation_fee && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {lawyer.consultation_fee.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Fee (KES)</Text>
            </View>
          )}
        </View>

        {/* Achievement Badges */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {badges.map((badge) => (
                <View key={badge.id} style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>{badge.badge?.icon || '🏆'}</Text>
                  <Text style={styles.achievementName}>{badge.badge?.name}</Text>
                  <Text style={styles.achievementDate}>
                    {new Date(badge.earned_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Specializations */}
        {specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practice Areas & Expertise</Text>
            <View style={styles.specializationsGrid}>
              {specializations.map((spec) => (
                <View key={spec.id} style={styles.specializationChip}>
                  <Text style={styles.specializationIcon}>
                    {spec.practice_area?.icon || '⚖️'}
                  </Text>
                  <View style={styles.specializationInfo}>
                    <Text style={styles.specializationName}>
                      {spec.practice_area?.name}
                    </Text>
                    <View
                      style={[
                        styles.expertiseBadge,
                        { backgroundColor: getExpertiseColor(spec.expertise_level) },
                      ]}
                    >
                      <Text style={styles.expertiseText}>
                        {spec.expertise_level || 'intermediate'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bio */}
        {lawyer.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{lawyer.bio}</Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          {lawyer.office_address && (
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📍</Text>
              <Text style={styles.contactText}>{lawyer.office_address}</Text>
            </View>
          )}

          {lawyer.office_phone && (
            <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={[styles.contactText, styles.contactLink]}>
                {lawyer.office_phone}
              </Text>
            </TouchableOpacity>
          )}

          {lawyer.email && (
            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={[styles.contactText, styles.contactLink]}>{lawyer.email}</Text>
            </TouchableOpacity>
          )}

          {lawyer.languages && lawyer.languages.length > 0 && (
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>🗣️</Text>
              <Text style={styles.contactText}>{lawyer.languages.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Credentials */}
        {credentials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credentials & Certifications</Text>
            {credentials.map((credential) => (
              <View key={credential.id} style={styles.credentialItem}>
                <View style={styles.credentialHeader}>
                  <Text style={styles.credentialName}>
                    {credential.credential_type || 'License'}
                  </Text>
                  {credential.verification_status === 'verified' && (
                    <View style={styles.credentialVerified}>
                      <Text style={styles.credentialVerifiedText}>✓ Verified</Text>
                    </View>
                  )}
                </View>
                {credential.issuing_authority && (
                  <Text style={styles.credentialAuthority}>
                    {credential.issuing_authority}
                  </Text>
                )}
                {credential.issue_date && (
                  <Text style={styles.credentialDate}>
                    Issued: {new Date(credential.issue_date).getFullYear()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Client Reviews ({reviews.length})</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SubmitReview', { lawyerId })}
            >
              <Text style={styles.writeReviewLink}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
          ) : (
            reviews.slice(0, 5).map(renderReview)
          )}

          {reviews.length > 5 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('AllReviews', { lawyerId, reviews })}
            >
              <Text style={styles.viewAllText}>View All Reviews ({reviews.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              navigation.navigate('BookConsultation', {
                lawyerId: lawyer.id,
              })
            }
          >
            <Text style={styles.primaryButtonText}>📅 Book Consultation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              navigation.navigate('RequestQuote', {
                lawyerId: lawyer.id,
              })
            }
          >
            <Text style={styles.secondaryButtonText}>💰 Request Fee Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() =>
              navigation.navigate('MessageLawyer', {
                lawyerId: lawyer.id,
              })
            }
          >
            <Text style={styles.tertiaryButtonText}>💬 Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>
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
    marginTop: 12,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lawyerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  lawFirm: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    fontSize: 20,
  },
  ratingText: {
    fontSize: 14,
    color: '#666666',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  barBadge: {
    backgroundColor: '#2196F3',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  headerActionButton: {
    alignItems: 'center',
  },
  headerActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  headerActionText: {
    fontSize: 12,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  writeReviewLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  achievementBadge: {
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 80,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 10,
    color: '#999999',
  },
  specializationsGrid: {
    gap: 12,
  },
  specializationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
  },
  specializationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  specializationInfo: {
    flex: 1,
  },
  specializationName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 4,
  },
  expertiseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expertiseText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bioText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  contactText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  contactLink: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  credentialItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  credentialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textTransform: 'capitalize',
  },
  credentialVerified: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  credentialVerifiedText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  credentialAuthority: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  credentialDate: {
    fontSize: 12,
    color: '#999999',
  },
  reviewCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailedRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailedRatingItem: {
    alignItems: 'center',
  },
  detailedRatingLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 2,
  },
  detailedRatingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999999',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tertiaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  tertiaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    height: 20,
  },
});

export default LawyerProfileScreen;
