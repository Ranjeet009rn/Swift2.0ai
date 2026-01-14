import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Modal, Image, ActivityIndicator, Dimensions, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';
import ForceScrollView from '../components/ForceScrollView';
import TicketSuccessScreen from './TicketSuccessScreen';

const CreateTicketScreen = ({ navigation, activeTab = 'raise', onTabChange }: any) => {
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState('');
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [organization, setOrganization] = useState('');

  useEffect(() => {
    // On mount, load client org from AsyncStorage (used by login flow)
    const loadOrg = async () => {
      try {
        const cd = await AsyncStorage.getItem('client_data');
        if (cd) {
          const data = JSON.parse(cd);
          if (data?.organization) setOrganization(data.organization);
        }
      } catch (e) {}
    };
    loadOrg();
  }, []);

  

  const handleAddAttachment = async () => {
    if (attachments.length >= 1) {
      Alert.alert("Can't upload more than one", 'You can only upload 1 image. Remove the existing image to add a new one.');
      return;
    }
    setShowImagePickerModal(true);
  };

  const handlePickFromGallery = async () => {
    setShowImagePickerModal(false);
    
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileKey = `${asset.fileName || 'image'}_${Date.now()}_0`;

        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
          } else {
            setUploadProgress(prev => ({ ...prev, [fileKey]: Math.floor(progress) }));
          }
        }, 200);

        const newAsset = {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: 'image/jpeg',
          fileKey: fileKey
        } as any;

        // Always keep only one screenshot
        setAttachments([newAsset]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image from gallery. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    setShowImagePickerModal(false);
    
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileKey = `photo_${Date.now()}_0`;

        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
          } else {
            setUploadProgress(prev => ({ ...prev, [fileKey]: Math.floor(progress) }));
          }
        }, 200);

        const newAsset = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: 'image/jpeg',
          fileKey: fileKey
        } as any;

        // Always keep only one screenshot
        setAttachments([newAsset]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const attachment = attachments[index];
    const fileKey = (attachment as any).fileKey;
    
    // Remove from progress tracking
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileKey];
      return newProgress;
    });
    
    // Remove from attachments
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(updatedAttachments);
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.includes('pdf')) return 'document-text';
    return 'document';
  };

  const handleCreateTicket = async () => {
    if (!issueTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your ticket');
      return;
    }

    if (attachments.length === 0) {
      Alert.alert('Screenshot Required', 'Please add a screenshot of your issue before submitting');
      return;
    }

    setLoading(true);
    try {
      // Get client data from storage (from your existing OTP login)
      let clientData = await AsyncStorage.getItem('client_data');
      if (!clientData) {
        clientData = await AsyncStorage.getItem('user_data');
      }
      
      let client = null;
      if (clientData) {
        try {
          client = JSON.parse(clientData);
          console.log('Found stored client data:', client);
        } catch (e) {
          console.log('Error parsing client data:', e);
        }
      }

      const formData = new FormData();
      const clientIdValue = client?.cid || client?.client_id || '';
      const licenseNoValue = client?.license_no || client?.licenseNumber || '';
      const mobileNoValue = client?.mobile_no || client?.mobileNumber || '';
      const clientNameValue = client?.client_name || client?.contact_person || '';
      
      console.log('Creating ticket with data:', {
        client_id: clientIdValue,
        license_no: licenseNoValue,
        mobile_no: mobileNoValue,
        issue_title: issueTitle,
        issue_description: issueDescription.trim() || 'No description provided',
        organization: organization
      });
      
      formData.append('client_id', clientIdValue);
      formData.append('license_no', licenseNoValue);
      formData.append('mobile_no', mobileNoValue);
      formData.append('issue_title', issueTitle);
      formData.append('issue_description', issueDescription.trim() || 'No description provided');
      formData.append('organization', organization);
      formData.append('client_name', clientNameValue);
      formData.append('priority', 'Medium');
      formData.append('status', 'Open');
      formData.append('progress_stage', 'Ticket Created');
      formData.append('progress_percentage', '0');
      // Attach the first attachment, for now only one
      if (attachments && attachments.length > 0) {
        const att = attachments[0] as any;
        // On web, we must send a File/Blob instead of RN-style { uri, name, type }
        if (Platform.OS === 'web') {
          try {
            const res = await fetch(att.uri);
            const blob = await res.blob();
            const file = new File([blob], att.name || 'attachment.jpg', { type: att.mimeType || blob.type || 'image/jpeg' });
            formData.append('attachment', file);
          } catch (e) {
            console.warn('Failed to convert attachment for web:', e);
          }
        } else {
          formData.append('attachment', {
            uri: att.uri,
            name: att.name || `attachment.jpg`,
            type: att.mimeType || 'image/jpeg',
          } as any);
        }
      }
      const response = await fetch(`${PHP_API_URL}client_create_ticket.php`, {
        method: 'POST',
        // Do not set Content-Type here; let fetch set multipart boundary
        body: formData
      });
      const text = await response.text();
      console.log('Server response status:', response.status);
      console.log('Server response text:', text);
      
      let result: any;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error(`Invalid server response: ${text.substring(0, 200)}`);
      }
      console.log('API Response:', result);

      if (result.success) {
        // Show success screen instead of alert
        setCreatedTicketId(result.data.ticket_id);
        setShowSuccessScreen(true);
        
        // Clear form
        setIssueTitle('');
        setIssueDescription('');
        setAttachments([]);
        
        
      } else {
        Alert.alert('Error', result.message || 'Failed to create ticket', [
          {
            text: 'Debug Info',
            onPress: () => Alert.alert('Debug', JSON.stringify(result, null, 2))
          },
          { text: 'OK' }
        ]);
      }
    } catch (error: any) {
      console.error('Create ticket error:', error);
      const friendly = (error?.message === 'INVALID_JSON')
        ? '❌ Something went wrong on the server while creating the ticket. Please try again.'
        : `Network/Server error: ${error.message}`;
      Alert.alert('Error', friendly, [
        {
          text: 'Debug Info',
          onPress: () => Alert.alert('Debug', JSON.stringify(error, null, 2))
        },
        { text: 'OK' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Show success screen if ticket was created
  if (showSuccessScreen) {
    return (
      <TicketSuccessScreen
        ticketId={createdTicketId}
        onGoToMyTickets={() => {
          setShowSuccessScreen(false);
          onTabChange('tickets'); // Switch to My Tickets tab
        }}
        onCreateAnother={() => {
          setShowSuccessScreen(false);
          // Stay on current screen to create another ticket
        }}
      />
    );
  }

  // Disable submit until the single attachment (if any) reaches 100% progress
  const hasAttachment = attachments.length > 0;
  const currentFileKey = hasAttachment ? (attachments[0] as any).fileKey : null;
  const currentProgress = currentFileKey ? (uploadProgress[currentFileKey] || 0) : 0;
  const isUploading = hasAttachment && currentProgress < 100;

  return (
    <ForceScrollView>
      <View style={[styles.container, { paddingBottom: 140 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Support Ticket</Text>
          <Text style={styles.subtitle}>Describe your issue and we'll help you resolve it</Text>
        </View>
        

        <View style={styles.form}>
          {/* Render org as form field at top, disabled */}
          <View style={{ backgroundColor: '#e0e7ff', borderRadius: 8, padding: 16, marginBottom: 18 }}>
            <Text style={[styles.label, { color: '#3730a3', marginBottom: 4 }]}>Organization</Text>
            <TextInput value={organization} editable={false} style={[styles.input, { backgroundColor: '#c7d2fe', color: '#312e81', fontWeight: 'bold' }]} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issue Title *</Text>
            <TextInput
              style={styles.input}
              value={issueTitle}
              onChangeText={setIssueTitle}
              placeholder="Brief description of your issue *"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issue Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={issueDescription}
              onChangeText={setIssueDescription}
              placeholder="Detailed description of the problem (optional)..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Screenshot <Text style={{color: '#ef4444'}}>*</Text></Text>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAddAttachment}
            >
              <Ionicons name="attach" size={20} color="#1e3a8a" />
              <Text style={styles.attachmentButtonText}>Add Screenshot</Text>
            </TouchableOpacity>
            
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => {
                  const fileKey = (attachment as any).fileKey;
                  const progress = uploadProgress[fileKey] || 0;
                  const isImage = attachment.mimeType?.startsWith('image/');
                  
                  return (
                    <View key={index} style={styles.attachmentItem}>
                      <TouchableOpacity 
                        style={styles.attachmentPreview}
                        onPress={() => {
                          if (isImage && attachment.uri) {
                            setSelectedImage(attachment.uri);
                          }
                        }}
                      >
                        {isImage && attachment.uri ? (
                          <Image source={{ uri: attachment.uri }} style={styles.imagePreview} />
                        ) : (
                          <View style={styles.fileIconContainer}>
                            <Ionicons 
                              name={getFileIcon(attachment.mimeType)} 
                              size={32} 
                              color="#6b7280" 
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {attachment.name}
                        </Text>
                        <Text style={styles.attachmentSize}>
                          {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </Text>
                        
                        {progress < 100 ? (
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                              <View 
                                style={[styles.progressFill, { width: `${progress}%` }]} 
                              />
                            </View>
                            <Text style={styles.progressText}>{progress}%</Text>
                          </View>
                        ) : (
                          <View style={styles.uploadComplete}>
                            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                            <Text style={styles.uploadCompleteText}>Uploaded</Text>
                          </View>
                        )}
                      </View>
                      
                      <TouchableOpacity 
                        onPress={() => handleRemoveAttachment(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
            
            <Text style={styles.attachmentNote}>
              <Text style={{color: '#ef4444', fontWeight: '600'}}>Required:</Text> Add a screenshot of your issue
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (loading || isUploading) && styles.submitButtonDisabled]}
            onPress={handleCreateTicket}
            disabled={loading || isUploading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating Ticket...' : 'Create Ticket'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 100}} />
      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.imagePickerTitle}>Add Screenshot</Text>
            <Text style={styles.imagePickerSubtitle}>Choose how you want to add your screenshot</Text>
            
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={handlePickFromGallery}
            >
              <View style={styles.imagePickerIconContainer}>
                <Ionicons name="images" size={32} color="#1e3a8a" />
              </View>
              <View style={styles.imagePickerTextContainer}>
                <Text style={styles.imagePickerOptionTitle}>Device Gallery</Text>
                <Text style={styles.imagePickerOptionSubtitle}>Select from your photo library</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={handleTakePhoto}
            >
              <View style={styles.imagePickerIconContainer}>
                <Ionicons name="camera" size={32} color="#1e3a8a" />
              </View>
              <View style={styles.imagePickerTextContainer}>
                <Text style={styles.imagePickerOptionTitle}>Camera</Text>
                <Text style={styles.imagePickerOptionSubtitle}>Take a photo with your camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-size Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea}
            onPress={() => setSelectedImage(null)}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullSizeImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
      </View>
    </ForceScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 140, // increase bottom space
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Space for navigation
    minHeight: 1000, // Increased minimum height to ensure scrolling
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  form: {
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  priorityButtonSelected: {
    borderColor: '#1e3a8a',
    backgroundColor: '#1e3a8a',
  },
  priorityCritical: {
    borderColor: '#dc2626',
  },
  priorityHigh: {
    borderColor: '#ea580c',
  },
  priorityMedium: {
    borderColor: '#ca8a04',
  },
  priorityLow: {
    borderColor: '#16a34a',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  priorityTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  attachmentButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  attachmentsList: {
    marginTop: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attachmentPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fileIconContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  attachmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1e3a8a',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: '600',
    minWidth: 35,
  },
  uploadComplete: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadCompleteText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  attachmentNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  imagePickerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imagePickerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagePickerTextContainer: {
    flex: 1,
  },
  imagePickerOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  imagePickerOptionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default CreateTicketScreen;
