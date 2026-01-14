import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

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

interface CleanLoginScreenProps {
  onLoginSuccess: () => void;
}

const CleanLoginScreen: React.FC<CleanLoginScreenProps> = ({ onLoginSuccess }) => {
  const { refreshAuth } = useAuth();
  const [licenseNo, setLicenseNo] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState('');
  const [trialOtp, setTrialOtp] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: credentials, 2: OTP, 3: success
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180 seconds
  const [timerActive, setTimerActive] = useState(false);
  const [clientName, setClientName] = useState('');
  const [organization, setOrganization] = useState('');
  const [orgLocked, setOrgLocked] = useState(false);
  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const [isOtpValid, setIsOtpValid] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [emptyErrors, setEmptyErrors] = useState({ license: false, mobile: false, organization: false });
  const [appHash, setAppHash] = useState('');

  // Get app hash for SMS Retriever
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
  }, []);

  // Start SMS listener when on OTP step
  useEffect(() => {
    const startListener = async () => {
      if (Platform.OS !== 'android') return;
      if (step !== 2) return;
      
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
            setIsOtpInvalid(false);
          }
        });

        return () => {
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
  }, [step]);

  const normalizedMobileNo = (() => {
    const digits = mobileNo.replace(/[^0-9]/g, '');
    if (digits.length <= 10) return digits;
    return digits.slice(-10);
  })();

  // Timer effect for OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);


 
  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate license number with recursive sum validation
  const validateLicenseNumber = (license: string): boolean => {
    // Check if exactly 9 digits
    if (license.length !== 9) {
      return false;
    }
    
    // Check if all characters are digits
    if (!/^\d{9}$/.test(license)) {
      return false;
    }
    
    // Calculate sum of digits recursively until we get a single digit
    let sum = license.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    
    // Keep reducing until we get a single digit
    while (sum > 9) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    
    // Check if final sum equals 9
    return sum === 9;
  };

  // Handle license number change with validation
  const handleLicenseChange = (text: string) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Limit to 9 digits
    const limitedText = numericText.slice(0, 9);
    
    setLicenseNo(limitedText);
    if (emptyErrors.license) setEmptyErrors(prev => ({ ...prev, license: false }));
    setOrgLocked(false);
    if (limitedText.length < 9) {
      setOrganization('');
    }
    
    // Validate and show error
    if (limitedText.length === 0) {
      setLicenseError('');
    } else if (limitedText.length < 9) {
      setLicenseError('License number must be 9 digits');
    } else if (limitedText.length === 9) {
      // Calculate recursive sum
      let sum = limitedText.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      while (sum > 9) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      }
      
      if (sum !== 9) {
        setLicenseError(`Invalid license: recursive sum of digits is ${sum}, must be 9`);
      } else {
        setLicenseError('');
      }
    }
  };

  // When we have a valid 9-digit license, auto-fetch organization
  useEffect(() => {
    setOrgLocked(false);
    setOrganization('');
    if (licenseNo.length !== 9 || licenseError) return;
    
    const fetchOrg = async () => {
      try {
        console.log('🔍 Fetching organization for license:', licenseNo);
        console.log('📡 API URL:', PHP_API_URL);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        // First try: Check database for existing clients
        console.log('📊 Step 1: Checking database...');
        const dbRes = await fetch(`${PHP_API_URL}client_get_organization.php`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ license_no: licenseNo.trim() }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('📊 DB Response status:', dbRes.status);
        const dbData = await dbRes.json();
        console.log('📊 DB Data:', dbData);
        
        if (dbData?.success && dbData?.organization) {
          // Found in database
          console.log('✅ Found in database:', dbData.organization);
          setOrganization(dbData.organization);
          setOrgLocked(true);
          return;
        }
        
        // Second try: Call external API for new licenses
        console.log('🌐 Step 2: Calling external API...');
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 15000); // 15 second timeout
        
        const apiRes = await fetch(`${PHP_API_URL}client_verify_license.php`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ license_no: licenseNo.trim() }),
          signal: controller2.signal
        });
        clearTimeout(timeoutId2);
        console.log('🌐 API Response status:', apiRes.status);
        const apiData = await apiRes.json();
        console.log('🌐 API Data:', apiData);
        
        if (apiData?.success && (apiData?.data?.cname || apiData?.data?.organization)) {
          // Found from API - show organization regardless of account status
          const orgName = apiData.data.cname || apiData.data.organization;
          console.log('✅ Found from API:', orgName);
          console.log('📊 License Status:', apiData.message);
          
          // Show status info if account has issues but still allow login
          if (apiData.expired || apiData.on_break) {
            console.log('⚠️ Account Status:', {
              expired: apiData.expired,
              onBreak: apiData.on_break,
              message: apiData.message
            });
            // Note: We still set the organization name even for expired/break accounts
          }
          
          setOrganization(orgName);
          setOrgLocked(true);
        } else {
          // Not found anywhere - allow manual entry
          console.log('⚠️ Not found - allowing manual entry');
          setOrganization('');
          setOrgLocked(false);
        }
      } catch (e: any) {
        console.error('❌ Failed to fetch organization:', e);
        console.error('Error name:', e?.name);
        console.error('Error message:', e?.message);
        
        let errorMessage = 'Could not connect to server. Please check your internet connection.';
        
        if (e?.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (e?.message?.includes('Network request failed')) {
          errorMessage = 'Network request failed. Please check your internet connection.';
        } else if (e?.message?.includes('Failed to fetch')) {
          errorMessage = 'Cannot reach server. Please check if you are connected to the internet.';
        }
        
        Alert.alert('Connection Error', errorMessage);
        setOrganization('');
        setOrgLocked(false);
      }
    };
    fetchOrg();
  }, [licenseNo, licenseError]);

  const handleSendOTP = async () => {
    const missing = {
      license: !licenseNo.trim(),
      mobile: !mobileNo.trim(),
      organization: !organization.trim(),
    };
    if (missing.license || missing.mobile || missing.organization) {
      setEmptyErrors(missing);
      return;
    }

    // Basic license validation - just check if not empty and is 9 digits
    if (licenseNo.length !== 9 || !/^\d{9}$/.test(licenseNo)) {
      Alert.alert('Invalid License', 'License number must be exactly 9 digits');
      return;
    }

    // Validate mobile number
    if (normalizedMobileNo.length !== 10) {
      Alert.alert('Invalid Mobile', 'Mobile number must be exactly 10 digits');
      return;
    }

    setLoading(true);
     setOtp(''); // Clear old OTP when sending new one
    // Debug logging
    console.log('🚀 Sending OTP request...');
    console.log('📱 License:', licenseNo);
    console.log('📞 Mobile:', mobileNo);
    console.log('🌐 API URL:', PHP_API_URL);
    
    try {
     
      const response = await fetch(`${PHP_API_URL}client_send_otp_sms_api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_no: licenseNo.trim(),
          mobile_no: normalizedMobileNo,
          organization: organization.trim(),
          app_hash: appHash
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response text first to check if it's valid JSON
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('📄 Response text:', responseText);
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('✅ OTP response:', result);
      console.log('✅ Success status:', result.success);
      console.log('✅ Message:', result.message);
      if (result.error) {
        console.error('❌ Backend error:', result.error);
        console.error('❌ Debug info:', result.debug);
      }

      if (result.success) {
        console.log('🎯 Moving to step 2 (OTP screen)');
        setStep(2);
       
        setTimeLeft(180); // 3 minutes = 180 seconds
        setTimerActive(true); // Start timer
        console.log('✅ Step changed to:', 2);
        //Alert.alert('Success', 'OTP sent to your mobile number');
      } else {
        console.error('❌ OTP send failed:', result.message);
        const errorMsg = result.error ? `${result.message}\n\nError: ${result.error}` : result.message;
        Alert.alert('Error', errorMsg || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('❌ OTP error:', error);
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('❌ Invalid OTP', 'Please enter complete 6-digit OTP');
      return;
    }

    // Check if OTP has expired
    if (timeLeft === 0) {
      setIsOtpInvalid(true); // Mark OTP as invalid to show red border
      Alert.alert('❌ OTP Expired', 'This OTP has expired. Please request a new OTP.');
      setOtp(''); // Clear the expired OTP
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verifying OTP...');
      console.log('📋 License:', licenseNo.trim());
      console.log('📱 Mobile:', mobileNo.trim());
      console.log('🔢 OTP:', otp.trim());
      console.log('🌐 API URL:', `${PHP_API_URL}client_verify_otp.php`);
      
      // Verify OTP with server
      const verifyResponse = await fetch(`${PHP_API_URL}client_verify_otp.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_no: licenseNo.trim(),
          mobile_no: normalizedMobileNo,
          otp: otp.trim()
        }),
      });

      const verifyResult = await verifyResponse.json();
      console.log('OTP verification response:', verifyResult);

      if (!verifyResult.success) {
        // OTP verification failed (wrong OTP or expired)
        setIsOtpInvalid(true); // Mark OTP as invalid to show red border
        Alert.alert('❌ Verification Failed', verifyResult.message || 'Invalid or expired OTP. Please try again.');
        setOtp(''); // Clear the invalid OTP
        setLoading(false);
        return;
      }

      // OTP verified successfully, now get client data
      console.log('✅ OTP Verified Successfully!');
      
      // Show green border for valid OTP
      setIsOtpValid(true);
      
      const clientResult = verifyResult; // Server should return client data on successful verification
      
      if (clientResult.success && clientResult.data) {
        const clientData = clientResult.data.client; // ← FIXED: Get client object from data
        
        console.log('=== CLEAN LOGIN DEBUG ===');
        console.log('Full API result:', clientResult);
        console.log('Client data from API:', clientData);
        console.log('License from API:', clientData.license_no);
        console.log('Mobile from API:', clientData.mobile_no);

        // Check if license is expired
        const edate = clientData.edate;
        let isExpired = false;
        if (edate) {
          const expiryDate = new Date(edate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);
          isExpired = expiryDate < today;
        }

        // Store in AsyncStorage for the app to use
        await AsyncStorage.setItem('client_data', JSON.stringify(clientData));
        await AsyncStorage.setItem('user_data', JSON.stringify(clientData));
        await AsyncStorage.setItem('jwt_token', 'token_' + clientData.cid + '_' + Date.now());
        await AsyncStorage.setItem('login_time', Date.now().toString()); // For 6-month session expiry
        
        console.log('Stored client data:', JSON.stringify(clientData));
        
        // Show license expiry warning if expired
        if (isExpired) {
          Alert.alert(
            '⚠️ License Expired',
            `Your license expired on ${edate}. Please contact support to renew your license.`,
            [{ text: 'OK' }]
          );
        }
        
        console.log('Showing green border for 1.5 seconds before navigating');
        
        // Wait 1.5 seconds to show green border, then navigate to dashboard
        setTimeout(async () => {
          await refreshAuth(); // This will trigger the RootNavigator to show MainNavigator
          console.log('Dashboard should appear now');
        }, 1500);
        
      } else {
        // Server verification succeeded but no client data returned
        Alert.alert('❌ Error', 'Client data not found. Please contact support.');
        setOtp('');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('❌ Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          // Step 1: License and Mobile
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require('../../assets/images/tally.jpg')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text
                style={styles.title}
              >
                Support Portal
              </Text>
              <Text style={styles.subtitle}>Professional Support System</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>License Number</Text>
              <TextInput
                style={[
                  styles.input,
                  licenseError ? styles.inputError : null,
                  licenseNo.length === 9 && !licenseError ? styles.inputValid : null,
                  emptyErrors.license ? styles.inputError : null
                ]}
                value={licenseNo}
                onChangeText={handleLicenseChange}
                placeholder="Enter 9-digit license number"
                placeholderTextColor="#999"
                selectionColor="#1e3a8a"
                cursorColor="#1e3a8a"
                keyboardType="number-pad"
                maxLength={9}
              />
              {emptyErrors.license ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>Please enter license number</Text>
                </View>
              ) : licenseError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>{licenseError}</Text>
                </View>
              ) : licenseNo.length === 9 ? (
                <View style={styles.validationSuccessContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text style={styles.validationSuccessText}>Valid license number</Text>
                </View>
              ) : (
                <Text style={styles.helperText}>Enter 9-digit license number</Text>
              )}

              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.mobileGroup}>
                <TextInput
                  style={styles.countryCodeBox}
                  value={`+${countryCode}`}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 3);
                    setCountryCode(digits || '');
                  }}
                  selectionColor="#1e3a8a"
                  cursorColor="#1e3a8a"
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TextInput
                  style={[styles.mobileInput, emptyErrors.mobile ? styles.inputError : null]}
                  value={mobileNo}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setMobileNo(numericText);
                    if (emptyErrors.mobile) setEmptyErrors(prev => ({ ...prev, mobile: false }));
                  }}
                  placeholder="Enter mobile number (10 digits)"
                  placeholderTextColor="#999"
                  selectionColor="#1e3a8a"
                  cursorColor="#1e3a8a"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.label}>Organization</Text>
              <TextInput
                style={[styles.input, orgLocked ? { backgroundColor: '#eef2ff' } : null, emptyErrors.organization ? styles.inputError : null]}
                value={organization}
                onChangeText={(t) => { setOrganization(t); if (emptyErrors.organization) setEmptyErrors(prev => ({ ...prev, organization: false })); }}
                placeholder="Enter organization name"
                placeholderTextColor="#999"
                selectionColor="#1e3a8a"
                cursorColor="#1e3a8a"
                editable={!orgLocked}
              />
              {emptyErrors.organization && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>Please enter organization</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Get OTP</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.subtitle}>Co powered by SG Software Solutions</Text>
            </View>
          </View>
        ) : step === 2 ? (
          // Step 2: OTP Verification
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require('../../assets/images/tally.jpg')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to your mobile
              </Text>
              <Text style={styles.subtitle}>
                {normalizedMobileNo ? `xxxxxx${normalizedMobileNo.slice(-4)}` : ''}
              </Text>
              {timeLeft === 0 && (
                <Text style={styles.expiredWarning}>
                  ⚠️ OTP Expired - Please resend
                </Text>
              )}
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={[
                  styles.otpInput, 
                  isOtpInvalid && styles.otpInputInvalid,
                  isOtpValid && styles.otpInputValid,
                  otp.length === 0 && styles.otpInputPlaceholder
                ]}
                value={otp}
                onChangeText={(text) => {
                  // Only allow numbers and max 6 digits
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText.length <= 6) {
                    setOtp(numericText);
                    setIsOtpInvalid(false); // Reset invalid state when user types
                    setIsOtpValid(false); // Reset valid state when user types
                  }
                }}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                textAlign="center"
                autoFocus
                returnKeyType="done"
              />

              <TouchableOpacity
                style={[styles.button, (loading || timeLeft === 0) && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading || timeLeft === 0}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep(1);
                  setOtp('');
                  setTimerActive(false);
                  setTimeLeft(180);
                }}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resendButton, timeLeft > 0 && styles.resendButtonDisabled]}
                onPress={() => {
                  if (timeLeft === 0) {
                    setOtp(''); // Clear expired OTP before resending
                    handleSendOTP();
                  }
                }}
                disabled={timeLeft > 0}
              >
                <Text style={[styles.resendButtonText, timeLeft > 0 && styles.resendButtonTextDisabled]}>
                  {timeLeft > 0 ? `Resend OTP (${formatTime(timeLeft)})` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 900,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  tallyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  expiredWarning: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 5,
  },
  timerContainer: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  timerText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#fafafa',
    color: '#111111',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  countryCodeBox: {
    width: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    height: 44,
    textAlignVertical: 'center',
    color: '#111111',
  },
  mobileInputFlex: {
    flex: 1,
  },
  mobileInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    height: 44,
    textAlignVertical: 'center',
    color: '#111111',
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  inputValid: {
    borderColor: '#16a34a',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  validationSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  validationSuccessText: {
    color: '#16a34a',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    textAlign: 'center',
    letterSpacing: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    color: '#1f2937',
  },
  otpInputInvalid: {
    borderColor: '#dc2626',
    borderWidth: 3,
    backgroundColor: '#fef2f2',
  },
  otpInputValid: {
    borderColor: '#10b981',
    borderWidth: 3,
    backgroundColor: '#f0fdf4',
  },
  otpInputPlaceholder: {
    letterSpacing: 0,
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpDigitInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#fafafa',
    textAlign: 'center',
    color: '#111111',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
  resendButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  successLoader: {
    marginTop: 10,
  },
});

export default CleanLoginScreen;
