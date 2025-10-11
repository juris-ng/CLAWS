import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../supabase';

export default function IdeasComposerScreen({ user, bodyId, onBack, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'general', label: '💡 General', color: '#8E8E93' },
    { value: 'infrastructure', label: '🏗️ Infrastructure', color: '#FF9500' },
    { value: 'environment', label: '🌳 Environment', color: '#34C759' },
    { value: 'education', label: '📚 Education', color: '#0066FF' },
    { value: 'health', label: '🏥 Health', color: '#FF3B30' },
    { value: 'safety', label: '🚨 Safety', color: '#AF52DE' },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('ideas')
      .insert([
        {
          body_id: bodyId,
          member_id: user.id,
          title: title,
          description: description,
          category: category,
          status: 'submitted',
          upvotes: 0,
          downvotes: 0,
        },
      ])
      .select();

    setSubmitting(false);

    if (error) {
      alert('Failed to submit idea: ' + error.message);
      return;
    }

    alert('Idea submitted successfully! The body will review it soon.');
    setTitle('');
    setDescription('');
    if (onSuccess) onSuccess();
    onBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Idea</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>💡</Text>
          <Text style={styles.infoBannerText}>
            Share your ideas and suggestions with the body. This is less formal than a petition 
            and perfect for brainstorming solutions.
          </Text>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Idea Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Community Garden Initiative"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  category === cat.value && styles.categoryButtonActive,
                  { borderColor: category === cat.value ? cat.color : '#E5E5EA' }
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.categoryText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your idea in detail. What problem does it solve? How would it benefit the community?"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Great Ideas:</Text>
          <Text style={styles.tipText}>• Be specific and clear about your suggestion</Text>
          <Text style={styles.tipText}>• Explain the expected benefits</Text>
          <Text style={styles.tipText}>• Consider feasibility and resources needed</Text>
          <Text style={styles.tipText}>• Keep it constructive and solution-focused</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onBack}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Idea'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 60,
  },
  backIcon: {
    fontSize: 24,
    color: '#0066FF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  infoBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#0066FF',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 18,
    color: '#3C3C43',
    padding: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#F0F7FF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 200,
    color: '#3C3C43',
    padding: 0,
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#856404',
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 6,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
