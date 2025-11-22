import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BodyCollaborationService } from '../../utils/bodyCollaborationService';


const CreateResourceScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;


  const [resourceType, setResourceType] = useState('venue');
  const [resourceName, setResourceName] = useState('');
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('available');
  const [sharingTerms, setSharingTerms] = useState('free');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const validateForm = () => {
    if (resourceName.trim().length < 3) {
      Alert.alert('Error', 'Resource name must be at least 3 characters');
      return false;
    }
    if (description.trim().length < 20) {
      Alert.alert('Error', 'Description must be at least 20 characters');
      return false;
    }
    if (sharingTerms === 'paid' && !cost) {
      Alert.alert('Error', 'Please set a cost for paid resources');
      return false;
    }
    return true;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;


    setSubmitting(true);
    try {
      const resourceData = {
        resourceType,
        resourceName: resourceName.trim(),
        description: description.trim(),
        availability,
        sharingTerms,
        cost: cost ? parseFloat(cost) : null,
        location: location.trim() || null,
        capacity: capacity ? parseInt(capacity) : null,
        requirements: requirements.trim() || null
      };


      const result = await BodyCollaborationService.createResource(bodyId, resourceData);


      if (result.success) {
        Alert.alert(
          'Success',
          'Resource shared successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      Alert.alert('Error', 'Failed to share resource');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Resource Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={resourceType}
              onValueChange={setResourceType}
              style={styles.picker}
            >
              <Picker.Item label="🏢 Venue/Space" value="venue" />
              <Picker.Item label="🔧 Equipment" value="equipment" />
              <Picker.Item label="🎓 Expertise/Training" value="expertise" />
              <Picker.Item label="💰 Funding" value="funding" />
              <Picker.Item label="👥 Volunteers" value="volunteers" />
              <Picker.Item label="📊 Data/Research" value="data" />
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Resource Name *</Text>
          <TextInput
            style={styles.input}
            value={resourceName}
            onChangeText={setResourceName}
            placeholder="e.g., Conference Hall, Projector, Legal Expertise"
            placeholderTextColor="#999999"
            maxLength={200}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the resource, its features, and usage guidelines..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Availability *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={availability}
              onValueChange={setAvailability}
              style={styles.picker}
            >
              <Picker.Item label="✅ Available" value="available" />
              <Picker.Item label="📅 Reserved" value="reserved" />
              <Picker.Item label="❌ Unavailable" value="unavailable" />
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Sharing Terms *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sharingTerms}
              onValueChange={setSharingTerms}
              style={styles.picker}
            >
              <Picker.Item label="🆓 Free" value="free" />
              <Picker.Item label="💵 Paid" value="paid" />
              <Picker.Item label="🔄 Exchange/Barter" value="exchange" />
              <Picker.Item label="📝 Conditional" value="conditional" />
            </Picker>
          </View>
        </View>


        {sharingTerms === 'paid' && (
          <View style={styles.section}>
            <Text style={styles.label}>Cost (KES) *</Text>
            <TextInput
              style={styles.input}
              value={cost}
              onChangeText={setCost}
              placeholder="e.g., 5000"
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
          </View>
        )}


        <View style={styles.section}>
          <Text style={styles.label}>Location (Optional)</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Nairobi CBD, Westlands"
            placeholderTextColor="#999999"
            maxLength={200}
          />
        </View>


        {(resourceType === 'venue' || resourceType === 'volunteers') && (
          <View style={styles.section}>
            <Text style={styles.label}>Capacity (Optional)</Text>
            <TextInput
              style={styles.input}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="e.g., 100"
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
          </View>
        )}


        <View style={styles.section}>
          <Text style={styles.label}>Requirements (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={requirements}
            onChangeText={setRequirements}
            placeholder="Any requirements or conditions for using this resource..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>


        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Other organizations can request to use your shared resources. You'll receive notifications and can approve/reject requests.
          </Text>
        </View>


        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Sharing Resource...' : 'Share Resource'}
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
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
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0066FF',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
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


export default CreateResourceScreen;
