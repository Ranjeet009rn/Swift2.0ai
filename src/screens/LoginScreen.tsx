import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';
import GlobalBottomNavigation from '../components/GlobalBottomNavigation';
import LabeledInput from '../components/LabeledInput';

type Step = 'SPLASH' | 'LOGIN' | 'OTP';
type Role = 'user' | 'employee' | 'admin';

interface LoginScreenProps {
  licenseNo: string;
  setLicenseNo: (v: string) => void;
  phoneNo: string;
  setPhoneNo: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  step: Step;
  sending: boolean;
  verifying: boolean;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  remainingSeconds?: number;
  onResend?: () => void;
  otpError?: string;
  selectedRole?: Role;
  onRoleChange?: (role: Role) => void;
  onLogin?: (username: string, password: string, role: Role) => void;
  error?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  licenseNo,
  setLicenseNo,
  phoneNo,
  setPhoneNo,
  otp,
  setOtp,
  step,
  sending,
  verifying,
  onSendOtp,
  onVerifyOtp,
  remainingSeconds = 0,
  onResend,
  otpError,
  selectedRole = 'user',
  onRoleChange,
  onLogin,
  error,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const oneTimeCodeInputRef = useRef<TextInput | null>(null);
  const otpAutoSubmitRef = useRef(false);
  // Validation helpers
  const numericPhone = phoneNo.replace(/\D/g, '');
  const isLicenseValid = /^(?=.{5,18}$)[A-Za-z0-9\-]+$/.test(licenseNo.trim());
  const isPhoneValid = /^\d{10}$/.test(numericPhone);
  const isOtpValid = /^\d{6}$/.test(otp);

  useEffect(() => {
    if (step !== 'OTP') {
      otpAutoSubmitRef.current = false;
      return;
    }

    if (Platform.OS === 'ios') {
      setTimeout(() => {
        oneTimeCodeInputRef.current?.focus();
      }, 50);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'OTP') return;
    if (!isOtpValid) return;
    if (verifying) return;
    if (otpAutoSubmitRef.current) return;

    otpAutoSubmitRef.current = true;
    onVerifyOtp();
  }, [otp, isOtpValid, step, verifying, onVerifyOtp]);

  // OTP 6-box handling
  const inputs = React.useRef<Array<TextInput | null>>([]);
  const otpDigits = (otp || '').padEnd(6, ' ').slice(0, 6).split('');

  const updateDigit = (index: number, char: string) => {
    const onlyNum = char.replace(/\D/g, '');
    // Handle paste of all digits
    if (onlyNum.length > 1) {
      const paste = onlyNum.slice(0, 6);
      setOtp(paste);
      inputs.current[5]?.blur();
      return;
    }
    if (onlyNum.length === 0) {
      const next = otpDigits.map((d, i) => (i === index ? '' : (d.trim() ? d : ''))).join('');
      setOtp(next);
      if (index > 0) inputs.current[index - 1]?.focus();
      return;
    }
    const newDigits = otpDigits.map((d, i) => (i === index ? onlyNum[0] : (d.trim() ? d : '')));
    const next = newDigits.join('').trimEnd();
    setOtp(next);
    if (index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index].trim() && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const getUsernameLabel = () => {
    return 'License Number';
  };

  const getPasswordLabel = () => {
    return 'Mobile Number';
  };

  const getUsernamePlaceholder = () => {
    return 'Enter license number (e.g., LC12345)';
  };

  const getPasswordPlaceholder = () => {
    return 'Enter mobile number (10 digits)';
  };

  const handleSubmit = () => {
    // Only client login
    if (onLogin) {
      onLogin(username, password, 'user');
    }
  };

  // Splash Screen
  if (step === 'SPLASH') {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashContent}>
          <View style={styles.splashLogo}>
            <Text style={styles.splashLogoText}>SG</Text>
          </View>
          <Text style={styles.splashTitle}>SG Connect</Text>
          <Text style={styles.splashSubtitle}>Professional Client Support Portal</Text>
          <ActivityIndicator size="large" color="#ffffff" style={styles.splashLoader} />
        </View>
      </View>
    );
  }

  // For web, wrap in scrollable container
  const LoginContent = () => (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={true}
        >
          <View style={styles.loginCard}>
        <View style={styles.loginHeader}>
          <View style={styles.loginLogo}>
            <Text style={styles.loginLogoText}>SG</Text>
          </View>
          <Text style={styles.loginTitle}>Support Portal</Text>
          <Text style={styles.loginSubtitle}>Professional Support System</Text>
        </View>

        {step === 'LOGIN' && (
          <>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}


            <LabeledInput
              label={getUsernameLabel()}
              value={username}
              onChangeText={setUsername}
              placeholder={getUsernamePlaceholder()}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <LabeledInput
              label={getPasswordLabel()}
              value={password}
              onChangeText={(text) => {
                // Only allow digits and limit to 10 characters
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 10) {
                  setPassword(numericText);
                }
              }}
              placeholder={getPasswordPlaceholder()}
              secureTextEntry={false}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <TouchableOpacity
              style={[styles.loginButton, (!username || !password) && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !username || !password}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Sending OTP...' : 'Get OTP'}
              </Text>
            </TouchableOpacity>

          </>
        )}

        {step === 'OTP' && (
          <>
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>OTP sent to {phoneNo.substring(0, 4)}XXXXXX. Enter the 6-digit code.</Text>
            </View>
            {Platform.OS === 'ios' && (
              <TextInput
                ref={oneTimeCodeInputRef}
                value={otp}
                onChangeText={(t) => {
                  const onlyNum = (t || '').replace(/\D/g, '').slice(0, 6);
                  setOtp(onlyNum);
                  if (onlyNum.length === 6) {
                    inputs.current[5]?.blur();
                  }
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                importantForAutofill="yes"
                caretHidden
                style={styles.iosOneTimeCodeHiddenInput}
              />
            )}
            <Text style={styles.labelSmall}>OTP</Text>
            <View style={styles.otpRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputs.current[i] = ref; }}
                  value={otpDigits[i].trim()}
                  onChangeText={(t) => updateDigit(i, t)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[
                    styles.otpBox,
                    !otpDigits[i].trim() && styles.otpBoxEmpty,
                    !!otpError && styles.otpBoxError,
                  ]}
                  textAlign="center"
                  placeholder=""
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  onFocus={() => {
                    if (Platform.OS === 'ios') {
                      oneTimeCodeInputRef.current?.focus();
                    }
                  }}
                />
              ))}
            </View>
            {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}
            <TouchableOpacity style={[styles.loginButton, !isOtpValid && styles.loginButtonDisabled]} onPress={onVerifyOtp} disabled={verifying || !isOtpValid}>
              <Text style={styles.loginButtonText}>{verifying ? 'Verifying…' : 'Verify & Sign in'}</Text>
            </TouchableOpacity>
            <View style={styles.actionsRow}>
              {remainingSeconds > 0 ? (
                <Text style={styles.mutedText}>Resend in {remainingSeconds}s</Text>
              ) : (
                <TouchableOpacity onPress={onResend || onSendOtp}>
                  <Text style={styles.linkText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Global Fixed Bottom Navigation */}
      <GlobalBottomNavigation 
        activeTab="dashboard" 
        onTabChange={(tab) => {
          // Handle navigation if needed
          console.log('Navigate to:', tab);
        }} 
      />
    </SafeAreaView>
  );

  return <LoginContent />;
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    // Use content-based height; avoid fixed minHeight for responsiveness
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashLogo: {
    width: 128,
    height: 128,
    backgroundColor: '#ffffff',
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  splashLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 18,
    color: '#bfdbfe',
    marginBottom: 32,
    textAlign: 'center',
  },
  splashLoader: {
    marginTop: 32,
  },
  loginContainer: {
    flexGrow: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginLogo: {
    width: 80,
    height: 80,
    backgroundColor: '#1e3a8a',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  infoBanner: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    color: '#3730a3',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  dot: { color: '#9ca3af', paddingHorizontal: 4 },
  helpText: { color: '#6b7280', fontSize: 12, marginTop: 6, textAlign: 'center' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    width: 44,
    height: 52,
  },
  labelSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  mutedText: { color: '#6b7280', fontWeight: '600' },
  errorText: { color: '#b91c1c', marginBottom: 6, fontSize: 12 },
  otpBox: {
    width: 46,
    height: 56,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    textAlignVertical: 'center',
    // Prevent glyph from overflowing the rounded box on Android
    includeFontPadding: false as unknown as boolean,
    paddingVertical: Platform.OS === 'android' ? 0 : 6,
    lineHeight: Platform.OS === 'android' ? 56 : undefined,
    overflow: 'hidden',
  },
  otpBoxEmpty: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  otpBoxError: {
    borderColor: '#ef4444',
  },
  iosOneTimeCodeHiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
    top: 0,
    left: 0,
  },
  roleSection: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  roleOptionSelected: {
    // Optional: Add selected styling if needed
  },
  roleRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  roleRadioSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 14,
  },
  demoCredentials: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  demoContent: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  demoText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'left',
  },
  demoBold: {
    fontWeight: 'bold',
  },
  demoOtp: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LoginScreen;
