import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
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
  View
} from 'react-native';
import { supabase } from '../../supabase';
import { WhistleblowService } from '../../utils/whistleblowService';


const CreateWhistleblowScreen = ({ navigation }) => {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('corruption');
  const [severity, setSeverity] = useState('medium');
  const [location, setLocation] = useState('');
  const [targetEntity, setTargetEntity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userIsAnonymous, setUserIsAnonymous] = useState(false);


  useEffect(() => {
    checkUserAnonymousStatus();
  }, []);


  const checkUserAnonymousStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('members')
        .select('is_anonymous')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUserIsAnonymous(data.is_anonymous);
        setIsAnonymous(data.is_anonymous); // Default to user's setting
      }
    } catch (error) {
      console.error('Error checking anonymous status:', error);
    }
  };


  const validateForm = () => {
    if (title.trim().length < 10) {
      Alert.alert('Error', 'Title must be at least 10 characters');
      return false;
    }
    if (description.trim().length < 50) {
      Alert.alert('Error', 'Description must be at least 50 characters');
      return false;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    return true;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;


    Alert.alert(
      'Submit Report',
      isAnonymous 
        ? 'Your identity will be protected. Continue?' 
        : 'Your name will be visible. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const reportData = {
                isAnonymous,
                title: title.trim(),
                description: description.trim(),
                category,
                severity,
                location: location.trim() || null,
                targetEntity: targetEntity.trim() || null
              };


              const result = await WhistleblowService.createReport(reportData);
              
              if (result.success) {
                Alert.alert(
                  'Success',
                  'Your report has been submitted and is under review.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to submit report');
              }
            } catch (error) {
              console.error('Error submitting report:', error);
              Alert.alert('Error', 'Failed to submit report');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Report Responsibly</Text>
            <Text style={styles.warningSubtext}>
              Provide accurate information. False reports may result in account suspension.
            </Text>
          </View>
        </View>


        <View style={styles.section}>
          <View style={styles.anonymousToggle}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Anonymous Report</Text>
              <Text style={styles.sectionSubtitle}>
                {isAnonymous ? 'Your identity is protected' : 'Your name will be visible'}
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


        <View style={styles.section}>
          <Text style={styles.label}>Report Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief summary of the issue..."
            placeholderTextColor="#999999"
            maxLength={200}
          />
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              <Picker.Item label="Corruption" value="corruption" />
              <Picker.Item label="Harassment" value="harassment" />
              <Picker.Item label="Fraud" value="fraud" />
              <Picker.Item label="Safety Issue" value="safety" />
              <Picker.Item label="Environmental" value="environmental" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Severity *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={severity}
              onValueChange={setSeverity}
              style={styles.picker}
            >
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
              <Picker.Item label="Critical" value="critical" />
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Detailed Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail. Include dates, locations, and evidence if possible..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Location (Optional)</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Where did this occur?"
            placeholderTextColor="#999999"
            maxLength={200}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Target Entity (Optional)</Text>
          <TextInput
            style={styles.input}
            value={targetEntity}
            onChangeText={setTargetEntity}
            placeholder="Organization or person involved..."
            placeholderTextColor="#999999"
            maxLength={200}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.infoText}>
            💡 Tip: Provide as much detail as possible to help verify and address the issue.
          </Text>
        </View>


        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>


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
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 13,
    color: '#E65100',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 1,
  },
  anonymousToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#F44336',
    padding: 16,
    margin: 16,
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
  },
});


export default CreateWhistleblowScreen;
