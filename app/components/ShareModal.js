import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ResponsiveUtils } from '../../utils/responsive';
import { ShareService } from '../../utils/shareService';

export default function ShareModal({ visible, onClose, petition, userId }) {
  const shareOptions = ShareService.showShareOptions(petition, userId);

  const handleShare = async (option) => {
    const result = await option.action();
    if (result.success) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Petition</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsContainer}>
            {shareOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.shareOption}
                onPress={() => handleShare(option)}
                activeOpacity={0.7}
              >
                <View style={styles.shareIconContainer}>
                  <Text style={styles.shareIcon}>{option.icon}</Text>
                </View>
                <Text style={styles.shareLabel}>{option.label}</Text>
                <Text style={styles.shareArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: ResponsiveUtils.fontSize(18),
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  modalClose: {
    fontSize: ResponsiveUtils.fontSize(32),
    color: '#8E8E93',
    lineHeight: 32,
  },
  optionsContainer: {
    padding: ResponsiveUtils.spacing(2),
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ResponsiveUtils.spacing(2),
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: ResponsiveUtils.spacing(1),
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ResponsiveUtils.spacing(1.5),
  },
  shareIcon: {
    fontSize: ResponsiveUtils.fontSize(24),
  },
  shareLabel: {
    flex: 1,
    fontSize: ResponsiveUtils.fontSize(16),
    fontWeight: '600',
    color: '#1C1C1E',
  },
  shareArrow: {
    fontSize: ResponsiveUtils.fontSize(20),
    color: '#8E8E93',
  },
});
