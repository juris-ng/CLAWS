import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
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
import { BodyService } from '../../utils/bodyService';


const CreatePartnershipScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;


  const [availableBodies, setAvailableBodies] = useState([]);
  const [partnerBodyId, setPartnerBodyId] = useState('');
  const [partnershipType, setPartnershipType] = useState('collaboration');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    loadAvailableBodies();
  }, []);


  const loadAvailableBodies = async () => {
    try {
      const result = await BodyService.getAllBodies();
      if (result.success) {
        // Filter out current body
        const filtered = result.bodies.filter(b => b.id !== bodyId);
        setAvailableBodies(filtered);
      }
    } catch (error) {
      console.error('Error loading bodies:', error);
    }
  };


  const validateForm = () => {
    if (!partnerBodyId) {
      Alert.alert('Error', 'Please select a partner organization');
      return false;
    }
    if (title.trim().length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return false;
    }
    if (description.trim().length < 20) {
      Alert.alert('Error', 'Description must be at least 20 characters');
      return false;
    }
    return true;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;


    setSubmitting(true);
    try {
      const partnershipData = {
        partnershipType,
        title: title.trim(),
        description: description.trim(),
        objectives: objectives.trim() ? { text: objectives.trim() } : null,
        startDate: startDate || null,
        endDate: endDate || null
      };


      const result = await BodyCollaborationService.createPartnership(
        bodyId,
        partnerBodyId,
        partnershipData
      );


      if (result.success) {
        Alert.alert(
          'Success',
          'Partnership request sent successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error creating partnership:', error);
      Alert.alert('Error', 'Failed to create partnership');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Partner Organization *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={partnerBodyId}
              onValueChange={setPartnerBodyId}
              style={styles.picker}
            >
              <Picker.Item label="Select organization..." value="" />
              {availableBodies.map((body) => (
                <Picker.Item key={body.id} label={body.name} value={body.id} />
              ))}
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Partnership Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={partnershipType}
              onValueChange={setPartnershipType}
              style={styles.picker}
            >
              <Picker.Item label="🤝 Collaboration" value="collaboration" />
              <Picker.Item label="📦 Resource Sharing" value="resource_sharing" />
              <Picker.Item label="🚀 Joint Campaign" value="joint_campaign" />
              <Picker.Item label="📄 Formal Partnership" value="formal_partnership" />
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Partnership Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Youth Empowerment Initiative"
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
            placeholder="Describe the partnership purpose and goals..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Objectives (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={objectives}
            onChangeText={setObjectives}
            placeholder="List partnership objectives..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Start Date (Optional)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999999"
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>End Date (Optional)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999999"
          />
        </View>


        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            The partner organization will receive your request and can accept or decline.
          </Text>
        </View>


        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Sending Request...' : 'Send Partnership Request'}
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
    backgroundColor: '#0066FF',
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


export default CreatePartnershipScreen;
