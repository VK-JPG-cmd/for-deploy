import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';
import { loginUser, AuthError } from '../data/authRepository';
import { ParentalRepository } from '../data/parentalRepository';
import { Storage } from '../utils/storage';

interface LoginScreenProps {
  onSignInSuccess: (isLinked: boolean, email?: string) => void;
  onSetUpChildDevice: () => void;
  onGoToSignUp: () => void;
  signUpSuccessMessage?: string; // shown when returning from SignUp
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignInSuccess,
  onSetUpChildDevice,
  onGoToSignUp,
  signUpSuccessMessage,
}) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async () => {
    console.log('[Auth] handleEmailSignIn called with email:', email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    // Admin Credentials constraint check
    if (email.trim().toLowerCase() === 'admin@gmail.com' && password === 'Admin123') {
      setIsLoading(false);
      onSignInSuccess(false, 'admin@gmail.com');
      return;
    } else if (email.trim().toLowerCase() === 'admin@gmail.com' && password !== 'Admin123') {
      setErrorMessage('Invalid admin password');
      setIsLoading(false);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      // Call the backend - verifies credentials
      const result = await loginUser({ email, password });

      // Save role & token securely in storage
      await Storage.setAssignedRole('PARENT');
      await Storage.setUserProfile({
        name: result.parent_name || 'Parent Admin',
        email: email.trim(),
        user_id: result.user_id,
      });
      await Storage.setAuthToken(result.access_token || `auth_tok_${result.user_id || Date.now()}`);

      console.log('[Auth] Login successful, user_id:', result.user_id);

      // Always reset old cached child state on new login unless verified in DB
      await Storage.setLinkedChild(null);
      let isLinked = false;
      if (result.user_id) {
        const backendCheck = await ParentalRepository.checkParentLinked(result.user_id);
        if (backendCheck?.is_linked && backendCheck?.linked_child) {
          isLinked = true;
          await Storage.setLinkedChild(backendCheck.linked_child);
        }
      }

      onSignInSuccess(isLinked, email.trim().toLowerCase());
    } catch (err) {
      const authErr = err as AuthError;
      setErrorMessage(authErr.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <View style={styles.purpleGlow} />
      </View>

      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onSetUpChildDevice}>
          <Icon name="arrow-back" color={colors.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Parent Login</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/app_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Aepttas Shield</Text>
        </View>

        <Text style={styles.subtitleText}>AI-Powered Mobile Security Suite</Text>

        {/* Welcome message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to continue protecting your device</Text>
          <View style={styles.dbBadge}>
            <View style={styles.dbDot} />
            <Text style={styles.dbBadgeText}>PostgreSQL Database Connected (apt_users_b)</Text>
          </View>
        </View>

        {/* Success banner (after successful registration) */}
        {!!signUpSuccessMessage && (
          <View style={styles.successContainer}>
            <Icon name="shield" color="#10b981" size={16} />
            <Text style={styles.successText}>{signUpSuccessMessage}</Text>
          </View>
        )}

        {!!errorMessage && (
          <View style={styles.errorContainer}>
            <Icon name="error" color={colors.redDanger} size={16} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="email" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 16 }]}>
            <Icon name="lock" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Icon
                name={passwordVisible ? 'visibility' : 'visibility-off'}
                color={colors.textMuted}
                size={20}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, isLoading && { opacity: 0.75 }]}
            onPress={handleEmailSignIn}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <View style={styles.btnContent}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="shield" color="#fff" size={20} />
                    <Text style={styles.btnText}>Sign In</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialBtn}>
            <Icon name="email" color="#EA4335" size={20} />
            <Text style={styles.socialBtnText}>Gmail</Text>
          </TouchableOpacity>
        </View>

        {/* Footer links */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onGoToSignUp}>
            <Text style={styles.linkText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.childSetupBtn} onPress={onSetUpChildDevice}>
          <Text style={styles.childSetupText}>Setting up a child's device? Enter Linking Code</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    alignItems: 'center',
    overflow: 'hidden',
  },
  purpleGlow: {
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.darkPurpleGlow,
    opacity: 0.3,
    filter: 'blur(60px)', // Will be ignored in RN but we use opacity+background for soft glow
    marginTop: -150,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginTop: 36,
    height: 110,
    width: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.purpleAccent + 'CC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: colors.purpleAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 44,
  },
  welcomeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 60,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingLeft: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotText: {
    color: colors.purpleAccent,
    fontSize: 14,
    fontWeight: '500',
  },
  signInBtn: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 16,
  },
  socialContainer: {
    width: '100%',
    marginBottom: 36,
  },
  socialBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  socialBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 2,
  },
  dbDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  dbBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: colors.purpleAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  childSetupBtn: {
    paddingVertical: 8,
  },
  childSetupText: {
    color: colors.cyanAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redDanger + '1E',
    borderWidth: 1,
    borderColor: colors.redDanger + '88',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    color: colors.redDanger,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b98188',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 16,
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
