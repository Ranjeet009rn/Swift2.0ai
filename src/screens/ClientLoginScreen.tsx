import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';
import { Ionicons } from '@expo/vector-icons';

let SmsRetrieverNitro: any = null;
if (Platform.OS === 'android') {
  try {
    const SmsRetrieverNitroModule: any = require('@huymobile/react-native-sms-retriever-nitro-module');
    SmsRetrieverNitro = SmsRetrieverNitroModule?.default ?? SmsRetrieverNitroModule;
  } catch (e) {
    console.error('Failed to load SMS Retriever Nitro:', e);
    SmsRetrieverNitro = null;
  }
}

interface ClientLoginScreenProps {
  onLoginSuccess: () => void;
}

const ClientLoginScreen: React.FC<ClientLoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'email' | 'license'>('email');
  
  // Email/Password login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // License-based login states
  const [licenseNo, setLicenseNo] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'license' | 'mobile' | 'otp'>('license');
  const [clientData, setClientData] = useState<any>(null);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const smsListenerCleanupRef = useRef<null | (() => void)>(null);
  const [appHash, setAppHash] = useState('');
  
  const [loading, setLoading] = useState(false);

  const normalizedMobileNo = (() => {
    const digits = mobileNo.replace(/[^0-9]/g, '');
    if (digits.length <= 10) return digits;
    return digits.slice(-10);
  })();

  useEffect(() => {
    const getAppHash = async () => {
      if (Platform.OS !== 'android') return;
      try {
        if (SmsRetrieverNitro?.getAppHash) {
          const hash = await SmsRetrieverNitro.getAppHash();
          console.log('[OTP] app hash (nitro) raw:', hash);
          if (Array.isArray(hash) && hash.length > 0) {
            const h = String(hash[0]);
            console.log('[OTP] app hash (nitro) selected:', h);
            setAppHash(h);
          } else if (typeof hash === 'string') {
            console.log('[OTP] app hash (nitro) selected:', hash);
            setAppHash(hash);
          }
        }
      } catch (e) {
        console.error('❌ Failed to get app hash:', e);
      }
    };
    getAppHash();

    return () => {
      if (smsListenerCleanupRef.current) {
        smsListenerCleanupRef.current();
        smsListenerCleanupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const startListener = async () => {
      if (Platform.OS !== 'android') return;
      if (step !== 'otp') return;
      
      try {
        if (!SmsRetrieverNitro?.startSmsRetriever) {
          console.log('⚠️ SMS Retriever Nitro not available');
          return;
        }

        console.log('🚀 Starting SMS Retriever Nitro listener...');
        
        // Start the SMS retriever
        const started = await SmsRetrieverNitro.startSmsRetriever();
        console.log('✅ SMS Retriever started:', started);

        // Add listener for incoming SMS
        const subscription = SmsRetrieverNitro.addSmsListener((event: any) => {
          console.log('📩 SMS received:', event);
          const message: string = event?.message || event?.sms || '';
          console.log('📝 SMS message:', message);
          
          // Extract 6-digit OTP from message
          const match = message.match(/\b\d{6}\b/);
          if (match && match[0]) {
            console.log('✅ OTP extracted:', match[0]);
            setOtp(match[0]);
          }
        });

        smsListenerCleanupRef.current = () => {
          try {
            console.log('🧹 Cleaning up SMS listener');
            subscription?.remove?.();
            SmsRetrieverNitro?.removeSmsListener?.();
          } catch (e) {
            console.error('Error cleaning up SMS listener:', e);
          }
        };
      } catch (e) {
        console.error('❌ SMS Retriever Nitro Error:', e);
      }
    };

    startListener();

    return () => {
      if (smsListenerCleanupRef.current) {
        smsListenerCleanupRef.current();
        smsListenerCleanupRef.current = null;
      }
    };
  }, [step]);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${PHP_API_URL}client_login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (result.success) {
        // Store session token and client data
        await AsyncStorage.setItem('session_token', result.data.session_token || Date.now().toString());
        await AsyncStorage.setItem('client_data', JSON.stringify(result.data));
        
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: onLoginSuccess }
        ]);
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network +error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLicense = async () => {
    if (!licenseNo.trim()) {
      Alert.alert('Error', 'Please enter your license number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${PHP_API_URL}client_verify_license.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_no: licenseNo.trim()
        }),
      });

      const result = await response.json();
      
      console.log('=== LICENSE VERIFICATION RESPONSE ===');
      console.log('Full result:', JSON.stringify(result, null, 2));
      console.log('Success:', result.success);
      console.log('Data object:', result.data);
      console.log('cname:', result.data?.cname);
      console.log('client_name:', result.data?.client_name);
      console.log('=====================================');

      if (result.success) {
        // Map cname to client_name for consistency
        const clientData = {
          ...result.data,
          client_name: result.data.cname || result.data.client_name
        };
        
        console.log('Mapped client data:', clientData);
        console.log('Organization name to display:', clientData.client_name);
        
        setClientData(clientData);
        setIsLicenseExpired(result.expired || result.data.is_expired || false);
        setStep('mobile');
        
        // Show appropriate message based on license status
        const orgName = clientData.client_name || clientData.cname || clientData.organization || 'User';
        if (result.expired || result.data.is_expired) {
          Alert.alert('License Expired', `Welcome ${orgName}!\n\n⚠️ Your license has expired on ${result.data.expiry_date}.\nPlease contact support to renew.\n\nYou can continue to login for now.`);
        } else {
          Alert.alert('Success', `Welcome ${orgName}!\nPlease enter your mobile number to continue.`);
        }
      } else {
        console.error('Verification failed:', result.message);
        Alert.alert('Verification Failed', result.message || 'Invalid license number');
      }
    } catch (error) {
      console.error('License verification error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!mobileNo.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (normalizedMobileNo.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // Use API-specific OTP endpoint for license-based login
      const response = await fetch(`${PHP_API_URL}client_send_otp_sms_api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_no: licenseNo.trim(),
          mobile_no: normalizedMobileNo,
          organization: clientData?.cname || clientData?.organization || '',
          app_hash: appHash
        }),
      });

      const result = await response.json();
      console.log('OTP send response:', result);

      if (result.success) {
        setStep('otp');
        Alert.alert('OTP Sent', 'Please check your mobile for the OTP');
      } else {
        Alert.alert('Failed', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${PHP_API_URL}client_verify_otp.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_no: licenseNo.trim(),
          mobile_no: mobileNo.trim(),
          otp: otp.trim()
        }),
      });

      const result = await response.json();
      console.log('OTP verification response:', result);

      if (result.success) {
        // Store session token and client data
        const sessionData = {
          ...clientData,
          login_mobile: mobileNo.trim(),
          session_token: result.session_token || Date.now().toString()
        };
        
        await AsyncStorage.setItem('session_token', sessionData.session_token);
        await AsyncStorage.setItem('client_data', JSON.stringify(sessionData));
        await AsyncStorage.setItem('login_time', Date.now().toString()); // For 6-month session expiry
        
        // Check if license is expired
        const edate = sessionData.edate || sessionData.expiry_date;
        let isExpired = false;
        if (edate) {
          const expiryDate = new Date(edate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);
          isExpired = expiryDate < today;
        }
        
        // Show appropriate message
        if (isExpired) {
          Alert.alert(
            '⚠️ License Expired',
            `Your license expired on ${edate}. Please contact support to renew your license.\n\nYou can still access the dashboard.`,
            [{ text: 'OK', onPress: onLoginSuccess }]
          );
        } else {
          Alert.alert('Success', 'Login successful!', [
            { text: 'OK', onPress: onLoginSuccess }
          ]);
        }
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#1e3a8a" />
        <Text
          style={styles.title}
        >
          Client Login
        </Text>
        <Text style={styles.subtitle}>
          {loginMode === 'email' ? 'Sign in to access your support tickets' : (
            step === 'license' ? 'Enter your license number to continue' :
            step === 'mobile' ? 'Enter your mobile number' :
            'Enter the OTP sent to your mobile'
          )}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Login Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, loginMode === 'email' && styles.toggleButtonActive]}
            onPress={() => setLoginMode('email')}
            disabled={loading}
          >
            <Ionicons 
              name="mail" 
              size={18} 
              color={loginMode === 'email' ? '#ffffff' : '#1e3a8a'} 
            />
            <Text style={[styles.toggleText, loginMode === 'email' && styles.toggleTextActive]}>
              Email Login
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toggleButton, loginMode === 'license' && styles.toggleButtonActive]}
            onPress={() => {
              setLoginMode('license');
              setStep('license');
            }}
            disabled={loading}
          >
            <Ionicons 
              name="card" 
              size={18} 
              color={loginMode === 'license' ? '#ffffff' : '#1e3a8a'} 
            />
            <Text style={[styles.toggleText, loginMode === 'license' && styles.toggleTextActive]}>
              License Login
            </Text>
          </TouchableOpacity>
        </View>
        {/* Email/Password Login */}
        {loginMode === 'email' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* License-based Login */}
        {loginMode === 'license' && step === 'license' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number *</Text>
              <TextInput
                style={styles.input}
                value={licenseNo}
                onChangeText={setLicenseNo}
                placeholder="Enter your license number"
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleVerifyLicense}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.loginButtonText}>Verify License</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {loginMode === 'license' && step === 'mobile' && (
          <>
            {isLicenseExpired && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                  ⚠️ License Expired on {clientData?.expiry_date}
                </Text>
                <Text style={styles.warningSubText}>
                  Please contact support to renew your license
                </Text>
              </View>
            )}
            
            {clientData ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Organization:</Text>
                <Text style={styles.infoValue}>
                  {clientData.client_name || clientData.cname || clientData.organization || 'Not Available'}
                </Text>
                <Text style={styles.infoLabel}>License:</Text>
                <Text style={styles.infoValue}>{clientData.license_number || licenseNo}</Text>
                
                {/* Debug info - remove after testing */}
                <Text style={{fontSize: 10, color: '#999', marginTop: 10}}>
                  Debug: {JSON.stringify({
                    client_name: clientData.client_name,
                    cname: clientData.cname,
                    organization: clientData.organization
                  })}
                </Text>
              </View>
            ) : (
              <View style={styles.infoBox}>
                <Text style={{color: 'red'}}>⚠️ No client data received</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                value={mobileNo}
                onChangeText={setMobileNo}
                placeholder="Enter your 10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#ffffff" />
                  <Text style={styles.loginButtonText}>Send OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('license')}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={16} color="#1e3a8a" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        {loginMode === 'license' && step === 'otp' && (
          <>
            {isLicenseExpired && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                  ⚠️ License Expired on {clientData?.expiry_date}
                </Text>
                <Text style={styles.warningSubText}>
                  Please contact support to renew your license
                </Text>
              </View>
            )}
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                OTP sent to {normalizedMobileNo ? `xxxxxx${normalizedMobileNo.slice(-4)}` : ''}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter OTP *</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#ffffff" />
                  <Text style={styles.loginButtonText}>Verify & Login</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('mobile')}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={16} color="#1e3a8a" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            Need help? Contact your system administrator
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  debugHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugSubheader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  hashContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  debugLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  hashText: {
    flex: 1,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 10,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111111',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e3a8a',
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1e3a8a',
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
    marginLeft: 4,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#1e3a8a',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  warningSubText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ClientLoginScreen;
