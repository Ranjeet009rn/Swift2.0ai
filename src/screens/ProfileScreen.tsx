import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
// Removed ForceScrollView to avoid nested scroll on web; rely on parent ScrollView
import { PHP_API_URL } from '../config/apiConfig';

interface ProfileScreenProps {
  onLogout: () => void;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    loadClientData();
  }, []);

  // Debug: Log what's in AsyncStorage
  useEffect(() => {
    const debugStorage = async () => {
      try {
        const clientData = await AsyncStorage.getItem('client_data');
        const userData = await AsyncStorage.getItem('user_data');
        console.log('=== PROFILE DEBUG ===');
        console.log('client_data:', clientData);
        console.log('user_data:', userData);
        if (clientData) {
          console.log('Parsed client_data:', JSON.parse(clientData));
        }
      } catch (error) {
        console.error('Debug error:', error);
      }
    };
    debugStorage();
  }, []);

  // Check if session expired (6 months) - MUST be before any conditional returns
  useEffect(() => {
    const checkSessionExpiry = async () => {
      try {
        const loginTime = await AsyncStorage.getItem('login_time');
        if (loginTime) {
          const loginDate = new Date(parseInt(loginTime));
          const now = new Date();
          const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
          
          if (now.getTime() - loginDate.getTime() > sixMonthsInMs) {
            Alert.alert(
              'Session Expired',
              'Your session has expired after 6 months. Please login again.',
              [{ text: 'OK', onPress: onLogout }]
            );
          }
        }
      } catch (error) {
        console.error('Error checking session expiry:', error);
      }
    };
    checkSessionExpiry();
  }, []);

  const loadClientData = async () => {
    try {
      let data = await AsyncStorage.getItem('client_data');
      if (!data) {
        data = await AsyncStorage.getItem('user_data');
      }
      
      if (data) {
        const client = JSON.parse(data);
        console.log('Loaded client data:', client);
        setClientData(client);
      } else {
        console.log('No client data found in storage');
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: onLogout 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const isRegistered = clientData?.is_registered === 1 || clientData?.is_registered === true;
  const displayName = clientData?.organization || clientData?.client_name || clientData?.contact_person || '';
  const licenseNo = clientData?.license_no || '';
  const mobileNo = clientData?.mobile_no || '';
  const email = clientData?.email || clientData?.emailid || '';
  const contactPerson = clientData?.contact_person || '';
  const address = clientData?.address || '';
  const city = clientData?.city || '';
  const state = clientData?.state || '';
  const pincode = clientData?.pincode || '';
  const gstNo = clientData?.gst_no || '';
  const panNo = clientData?.pan_no || '';
  const organization = clientData?.organization || '';
  const edate = clientData?.edate || '';

  // Check if license is expired
  const isLicenseExpired = () => {
    if (!edate) return false;
    const expiryDate = new Date(edate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate < today;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.mainContainer}>
        <View style={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.headerGradient}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(displayName || 'User')}</Text>
                </View>
              </View>
              <Text style={styles.userName}>{isRegistered ? displayName : 'Unregistered'}</Text>
              {isRegistered ? (
                <View style={styles.roleBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                  <Text style={styles.userRole}>Registered Client</Text>
                </View>
              ) : null}
              {!isRegistered && !!licenseNo && (
                <Text style={styles.licenseUnderName}>{licenseNo}</Text>
              )}
              
              {/* License Expiry Warning */}
              {isLicenseExpired() && (
                <View style={styles.expiredBadge}>
                  <Ionicons name="warning" size={14} color="#dc2626" />
                  <Text style={styles.expiredText}>License Expired</Text>
                </View>
              )}
            </View>
          </View>

          

          {/* Account Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={24} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Account Information</Text>
            </View>
            
            <View style={styles.infoCard}>
              {organization ? (<View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#e0e7ff' }]}> 
                  <Ionicons name="business" size={22} color="#3730a3" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Organization</Text>
                  <Text style={[styles.infoValue, { color: '#3730a3', fontWeight: 'bold' }]}>{organization}</Text>
                </View>
              </View>) : null}
              {organization ? <View style={styles.divider} /> : null}
              {licenseNo ? (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#dbeafe' }]}> 
                    <Ionicons name="card" size={22} color="#3b82f6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>License Number</Text>
                    <Text style={styles.infoValue}>{licenseNo}</Text>
                  </View>
                </View>
              ) : null}
              {licenseNo && isRegistered ? <View style={styles.divider} /> : null}
              {isRegistered && !!edate ? (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#ecfeff' }]}> 
                    <Ionicons name="time" size={22} color="#0ea5e9" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>License Expiry Date</Text>
                    <Text style={styles.infoValue}>{edate}</Text>
                  </View>
                </View>
              ) : null}
              {contactPerson ? (<View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#dbeafe' }]}> 
                  <Ionicons name="person" size={22} color="#3b82f6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contact Person</Text>
                  <Text style={styles.infoValue}>{contactPerson}</Text>
                </View>
              </View>) : null}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            
            <View style={styles.infoCard}>
              {mobileNo ? (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#dcfce7' }]}> 
                    <Ionicons name="call" size={22} color="#16a34a" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Mobile Number</Text>
                    <Text style={styles.infoValue}>{mobileNo}</Text>
                  </View>
                </View>
              ) : null}
              {mobileNo ? <View style={styles.divider} /> : null}
              {isRegistered && !!email ? (<View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#fee2e2' }]}> 
                  <Ionicons name="mail" size={22} color="#ef4444" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{email}</Text>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="mail-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>) : null}
            </View>
            {/* App version and copyright */}
            <View style={styles.appMeta}>
              <Text style={styles.versionText}>SGS-Connect Version 1.0.0</Text>
              <Text style={styles.copyrightText}>© 2025 Swift2.0AI. All rights reserved.</Text>
            </View>
          </View>

          {/* Address Information */}
          {(address || city || state || pincode) ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={24} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Address Details</Text>
              </View>
              
              <View style={styles.infoCard}>
                {address ? (<View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#fef3c7' }]}> 
                    <Ionicons name="location" size={22} color="#f59e0b" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Full Address</Text>
                    <Text style={styles.infoValue}>{address}</Text>
                  </View>
                </View>) : null}

                {(city || state || pincode) ? (
                  <View style={styles.locationGrid}>
                    {city ? (
                      <View style={styles.locationItem}>
                        <Ionicons name="business" size={18} color="#f59e0b" />
                        <Text style={styles.locationLabel}>City</Text>
                        <Text style={styles.locationValue}>{city}</Text>
                      </View>
                    ) : null}
                    {state ? (
                      <View style={styles.locationItem}>
                        <Ionicons name="map" size={18} color="#f59e0b" />
                        <Text style={styles.locationLabel}>State</Text>
                        <Text style={styles.locationValue}>{state}</Text>
                      </View>
                    ) : null}
                    {pincode ? (
                      <View style={styles.locationItem}>
                        <Ionicons name="navigate" size={18} color="#f59e0b" />
                        <Text style={styles.locationLabel}>Pincode</Text>
                        <Text style={styles.locationValue}>{pincode}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          

          {/* Bottom Spacer */}
          <View style={[styles.bottomSpacer, { height: 80 }]} />
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140, // just bottom, no horizontal
  },
  appMeta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 2,
  },
  versionText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
  },
  copyrightText: {
    fontSize: 11,
    color: '#6b7280',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4f46e5',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#4f46e5',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  unregisteredBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  userRole: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  unregisteredText: {
    color: '#fef3c7',
  },
  licenseUnderName: {
    marginTop: 6,
    color: '#dbeafe',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    marginTop: -20,
    marginHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 4,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  locationGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  locationItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
  },
  locationLabel: {
    fontSize: 11,
    color: '#92400e',
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#78350f',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 120, // extra bottom space
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  expiredText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  ticketLoadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  noTicketsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTicketsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  ticketList: {
    padding: 0,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  ticketHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ticketHistoryLeft: {
    flex: 1,
    marginRight: 12,
  },
  ticketHistoryId: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketHistoryTitle: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  ticketHistoryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  ticketHistoryStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  statusResolved: {
    backgroundColor: '#dcfce7',
  },
  statusInProgress: {
    backgroundColor: '#dbeafe',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  ticketHistoryStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  moreTicketsText: {
    fontSize: 13,
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default ProfileScreen;
