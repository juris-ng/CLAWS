import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { PointsService } from '../../utils/pointsService';

export default function PetitionComposerScreen({ user, onBack, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('petitions')
      .insert([
        {
          member_id: user.id,
          title: title,
          description: description,
          category: 'general',
          upvotes: 0,
          downvotes: 0,
          status: 'pending',
          is_anonymous: isAnonymous,
        },
      ])
      .select();

    if (error) {
      setSubmitting(false);
      alert('Failed to create petition: ' + error.message);
      return;
    }

    // Award points for petition creation
    const pointsAwarded = await PointsService.awardPoints(
      user.id,
      'member',
      'petition_created',
      data[0].id
    );

    setSubmitting(false);
    alert(`Petition created successfully! You earned ${pointsAwarded} points! 🎉`);
    setTitle('');
    setDescription('');
    setIsAnonymous(false);
    if (onSuccess) onSuccess();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compose Petition</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Petition Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Petition for Enhanced Community Green"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Publish Anonymously</Text>
              <Text style={styles.toggleSubtitle}>Your identity will not be publicly visible.</Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#E5E5EA', true: '#0066FF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Formatting Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>≡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>🔗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolIcon}>📎</Text>
          </TouchableOpacity>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Dear Local Council,

We, the undersigned residents of Springfield, are writing to advocate for the urgent enhancement and expansion of our community's green spaces. The current availability of parks and recreational areas is insufficient to meet the growing needs of"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Invite Lawyers */}
        <TouchableOpacity 
          style={styles.inviteSection}
          onPress={() => {}}
        >
          <Text style={styles.inviteIcon}>⚖️</Text>
          <Text style={styles.inviteText}>Invite Lawyers</Text>
          <Text style={styles.expandIcon}>›</Text>
        </TouchableOpacity>

        {/* AI Suggestions */}
        <TouchableOpacity 
          style={styles.aiSection}
          onPress={() => setShowAISuggestions(!showAISuggestions)}
        >
          <Text style={styles.aiIcon}>💡</Text>
          <Text style={styles.aiText}>Get AI Suggestions</Text>
          <Text style={styles.expandIcon}>{showAISuggestions ? '▼' : '›'}</Text>
        </TouchableOpacity>

        {showAISuggestions && (
          <View style={styles.aiSuggestionsBox}>
            <Text style={styles.aiSuggestionTitle}>AI Recommendations:</Text>
            <Text style={styles.aiSuggestionText}>
              • Consider adding specific statistics about current green space availability
            </Text>
            <Text style={styles.aiSuggestionText}>
              • Include examples from similar successful petitions
            </Text>
            <Text style={styles.aiSuggestionText}>
              • Mention community health benefits to strengthen your case
            </Text>
            <Text style={styles.aiSuggestionText}>
              • Add a clear call-to-action for local officials
            </Text>
          </View>
        )}

        {/* Points Preview */}
        <View style={styles.pointsPreview}>
          <Text style={styles.pointsIcon}>🎯</Text>
          <Text style={styles.pointsText}>You'll earn <Text style={styles.pointsBold}>10 points</Text> for creating this petition!</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.previewButton}>
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.publishButton, submitting && styles.publishButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.publishButtonText}>
              {submitting ? 'Publishing...' : 'Publish'}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C3C43',
  },
  descriptionInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 250,
    color: '#3C3C43',
    padding: 0,
  },
  inviteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 1,
  },
  inviteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inviteText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
  },
  expandIcon: {
    fontSize: 20,
    color: '#8E8E93',
  },
  aiSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 20,
    marginBottom: 1,
  },
  aiIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  aiText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  aiSuggestionsBox: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    paddingTop: 0,
    marginBottom: 1,
  },
  aiSuggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0066FF',
  },
  aiSuggestionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#3C3C43',
    marginBottom: 8,
  },
  pointsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pointsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pointsText: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
  },
  pointsBold: {
    fontWeight: 'bold',
    color: '#FF9500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
  },
  publishButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
