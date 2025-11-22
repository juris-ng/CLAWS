import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

const RateBodyScreen = ({ route, navigation }) => {
  const { bodyId, bodyName } = route.params;

  const [category, setCategory] = useState('responsiveness');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingRating, setExistingRating] = useState(null);

  const categories = [
    {
      value: 'responsiveness',
      label: 'Responsiveness',
      icon: '⚡',
      description: 'How quickly they respond to issues',
    },
    {
      value: 'transparency',
      label: 'Transparency',
      icon: '👁️',
      description: 'How open and honest they are',
    },
    {
      value: 'effectiveness',
      label: 'Effectiveness',
      icon: '🎯',
      description: 'How well they solve problems',
    },
    {
      value: 'accountability',
      label: 'Accountability',
      icon: '⚖️',
      description: 'How responsible they are',
    },
  ];

  useEffect(() => {
    loadExistingRating();
  }, [category]);

  const loadExistingRating = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('body_ratings')
        .select('*')
        .eq('body_id', bodyId)
        .eq('user_id', user.id)
        .eq('category', category)
        .single();

      if (data) {
        setExistingRating(data);
        setRating(data.rating);
        setReviewText(data.review_text || '');
        setIsAnonymous(data.is_anonymous || false);
      } else {
        setExistingRating(null);
        setRating(0);
        setReviewText('');
      }
    } catch (error) {
      console.error('Error loading existing rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please select a star rating before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to rate');
        setSubmitting(false);
        return;
      }

      const ratingData = {
        body_id: bodyId,
        user_id: user.id,
        category,
        rating,
        review_text: reviewText.trim() || null,
        is_anonymous: isAnonymous,
      };

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('body_ratings')
          .update(ratingData)
          .eq('id', existingRating.id);

        if (error) throw error;

        Alert.alert('Success! 🎉', 'Your rating has been updated', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // Create new rating
        const { error } = await supabase.from('body_ratings').insert([ratingData]);

        if (error) throw error;

        Alert.alert('Success! 🎉', 'Thank you for rating this organization', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }

      // Update body average ratings using RPC
      await supabase.rpc('update_body_ratings', { body_id: bodyId });
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (stars) => {
    switch (stars) {
      case 0:
        return 'Tap to rate';
      case 1:
        return '⭐ Poor';
      case 2:
        return '⭐⭐ Fair';
      case 3:
        return '⭐⭐⭐ Good';
      case 4:
        return '⭐⭐⭐⭐ Very Good';
      case 5:
        return '⭐⭐⭐⭐⭐ Excellent';
      default:
        return 'Select rating';
    }
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.star, star <= rating && styles.starActive]}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const currentCategory = categories.find((c) => c.value === category);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Organization</Text>
          <Text style={styles.bodyName}>{bodyName}</Text>
        </View>

        {/* Existing Rating Notice */}
        {existingRating && (
          <View style={styles.existingNotice}>
            <Text style={styles.existingNoticeIcon}>ℹ️</Text>
            <Text style={styles.existingNoticeText}>
              You've already rated this category. Your submission will update your previous rating.
            </Text>
          </View>
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Category</Text>
          <Text style={styles.sectionSubtitle}>Choose what aspect you want to rate</Text>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryButton, category === cat.value && styles.categoryButtonActive]}
              onPress={() => setCategory(cat.value)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
              </View>
              <View style={styles.categoryText}>
                <Text
                  style={[styles.categoryLabel, category === cat.value && styles.categoryLabelActive]}
                >
                  {cat.label}
                </Text>
                <Text style={styles.categoryDescription}>{cat.description}</Text>
              </View>
              {category === cat.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Star Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rating for {currentCategory?.label}</Text>
          <Text style={styles.sectionSubtitle}>Tap the stars to rate</Text>
          {renderStarRating()}
          <View style={styles.ratingLabelContainer}>
            <Text style={styles.ratingText}>{getRatingLabel(rating)}</Text>
          </View>
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.section}>
          <View style={styles.anonymousToggle}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleTitleRow}>
                <Text style={styles.toggleIcon}>{isAnonymous ? '🔒' : '👤'}</Text>
                <Text style={styles.toggleTitle}>Anonymous Rating</Text>
              </View>
              <Text style={styles.toggleSubtitle}>
                {isAnonymous
                  ? 'Your identity is hidden from everyone'
                  : 'Your name will be visible with this rating'}
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={isAnonymous ? '#2E7D32' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Review Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Written Review (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Share your experience in detail</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Write about your experience with this organization..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{reviewText.length}/500 characters</Text>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesBox}>
          <Text style={styles.guidelinesIcon}>💡</Text>
          <View style={styles.guidelinesContent}>
            <Text style={styles.guidelinesTitle}>Rating Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and constructive{'\n'}• Focus on facts and experiences{'\n'}• Respect
              others' opinions{'\n'}• Avoid inappropriate language
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (submitting || rating === 0) && styles.submitButtonDisabled]}
          onPress={handleSubmitRating}
          disabled={submitting || rating === 0}
          activeOpacity={0.8}
        >
          {submitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {existingRating ? '✓ Update Rating' : '✓ Submit Rating'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066FF',
    padding: 20,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bodyName: {
    fontSize: 16,
    color: '#E3F2FD',
    fontWeight: '500',
  },
  existingNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  existingNoticeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  existingNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066FF',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryText: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  categoryLabelActive: {
    color: '#0066FF',
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  checkmark: {
    fontSize: 28,
    color: '#0066FF',
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 48,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
  },
  ratingLabelContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066FF',
  },
  anonymousToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  toggleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
  },
  guidelinesBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  guidelinesIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  guidelinesContent: {
    flex: 1,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#0066FF',
    padding: 18,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
  },
});

export default RateBodyScreen;
