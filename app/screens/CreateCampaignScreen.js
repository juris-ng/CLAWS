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


const CreateCampaignScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;


  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState('awareness');
  const [visibility, setVisibility] = useState('public');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetSignatures, setTargetSignatures] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const validateForm = () => {
    if (campaignName.trim().length < 5) {
      Alert.alert('Error', 'Campaign name must be at least 5 characters');
      return false;
    }
    if (description.trim().length < 50) {
      Alert.alert('Error', 'Description must be at least 50 characters');
      return false;
    }
    if (campaignType === 'fundraising' && !targetAmount) {
      Alert.alert('Error', 'Please set a target amount for fundraising');
      return false;
    }
    return true;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;


    setSubmitting(true);
    try {
      const campaignData = {
        leadBodyId: bodyId,
        campaignName: campaignName.trim(),
        description: description.trim(),
        campaignType,
        visibility,
        startDate: startDate || null,
        endDate: endDate || null,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        targetSignatures: targetSignatures ? parseInt(targetSignatures) : null
      };


      const result = await BodyCollaborationService.createCampaign(campaignData);


      if (result.success) {
        Alert.alert(
          'Success',
          'Campaign created successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      Alert.alert('Error', 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Campaign Name *</Text>
          <TextInput
            style={styles.input}
            value={campaignName}
            onChangeText={setCampaignName}
            placeholder="e.g., Clean Water Initiative 2025"
            placeholderTextColor="#999999"
            maxLength={200}
          />
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Campaign Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={campaignType}
              onValueChange={setCampaignType}
              style={styles.picker}
            >
              <Picker.Item label="📢 Awareness Campaign" value="awareness" />
              <Picker.Item label="💰 Fundraising" value="fundraising" />
              <Picker.Item label="📣 Advocacy" value="advocacy" />
              <Picker.Item label="🤲 Service Delivery" value="service_delivery" />
            </Picker>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the campaign goals and activities..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{description.length}/2000</Text>
        </View>


        <View style={styles.section}>
          <Text style={styles.label}>Visibility *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={visibility}
              onValueChange={setVisibility}
              style={styles.picker}
            >
              <Picker.Item label="🌍 Public - Everyone can see" value="public" />
              <Picker.Item label="👥 Partners Only" value="partners_only" />
              <Picker.Item label="🔒 Private" value="private" />
            </Picker>
          </View>
        </View>


        {campaignType === 'fundraising' && (
          <View style={styles.section}>
            <Text style={styles.label}>Target Amount (KES) *</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="e.g., 500000"
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
          </View>
        )}


        {campaignType === 'advocacy' && (
          <View style={styles.section}>
            <Text style={styles.label}>Target Signatures (Optional)</Text>
            <TextInput
              style={styles.input}
              value={targetSignatures}
              onChangeText={setTargetSignatures}
              placeholder="e.g., 10000"
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
          </View>
        )}


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
            After creating, you can invite other organizations to join as partners.
          </Text>
        </View>


        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Creating Campaign...' : 'Create Campaign'}
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
    minHeight: 150,
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


export default CreateCampaignScreen;
