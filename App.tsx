import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, StyleSheet, View, LogBox, BackHandler, ToastAndroid, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { colors } from './src/styles/theme';
import { Storage } from './src/utils/storage';
import { ChildDaemon } from './src/services/childDaemon';
import { ParentalRepository } from './src/data/parentalRepository';

// Import Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { GeoTrackingScreen } from './src/screens/GeoTrackingScreen';
import { ParentalControlScreen } from './src/screens/ParentalControlScreen';
import { MalwareAnalysisScreen } from './src/screens/MalwareAnalysisScreen';
import { CallerIntelligenceScreen } from './src/screens/CallerIntelligenceScreen';
import { ChildLinkScreen } from './src/screens/ChildLinkScreen';
import { ChildModeScreen } from './src/screens/ChildModeScreen';
import { VulnerabilityDetectionScreen } from './src/screens/VulnerabilityDetectionScreen';
import { ChildDashboardScreen } from './src/screens/ChildDashboardScreen';
import { AdminLogsScreen } from './src/screens/AdminLogsScreen';
import { DeviceRoleSelectionScreen } from './src/screens/DeviceRoleSelectionScreen';
import { TwoStepBindingScreen } from './src/screens/TwoStepBindingScreen';
import { ChildPermissionsScreen } from './src/screens/ChildPermissionsScreen';

type ScreenName =
  | 'Login'
  | 'SignUp'
  | 'Dashboard'
  | 'GeoTracking'
  | 'ParentalControl'
  | 'MalwareAnalysis'
  | 'CallerIntelligence'
  | 'ChildLink'
  | 'ChildPermissions'
  | 'ChildMode'
  | 'VulnerabilityDetection'
  | 'ChildDashboard'
  | 'AdminLogs'
  | 'DeviceRoleSelection'
  | 'TwoStepBinding';

import { useAppTheme } from './src/contexts/ThemeContext';

function AppContent({ renderScreen }: { renderScreen: () => React.ReactNode }) {
  const { colors, mode } = useAppTheme();
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.safeArea}>
          {renderScreen()}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('DeviceRoleSelection');
  const [screenStack, setScreenStack] = useState<ScreenName[]>(['DeviceRoleSelection']);
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');
  const lastBackPressRef = useRef<number>(0);

  const navigateTo = useCallback((screen: ScreenName, replace = false) => {
    setCurrentScreen(screen);
    setScreenStack(prev => {
      if (replace) {
        return [...prev.slice(0, -1), screen];
      }
      if (prev[prev.length - 1] === screen) {
        return prev;
      }
      return [...prev, screen];
    });
  }, []);

  const goBack = useCallback(() => {
    setScreenStack(prev => {
      if (prev.length > 1) {
        const nextStack = [...prev];
        nextStack.pop();
        const prevScreen = nextStack[nextStack.length - 1];
        setCurrentScreen(prevScreen);
        return nextStack;
      } else {
        if (currentScreen !== 'Dashboard' && currentScreen !== 'DeviceRoleSelection' && currentScreen !== 'ChildMode') {
          setCurrentScreen('Dashboard');
          return ['Dashboard'];
        }
        return prev;
      }
    });
  }, [currentScreen]);

  // Android hardware & gesture back button handling
  useEffect(() => {
    const onHardwareBackPress = () => {
      // If we are in sub-screens, navigate back rather than closing the app
      if (
        currentScreen !== 'Dashboard' &&
        currentScreen !== 'DeviceRoleSelection' &&
        currentScreen !== 'ChildMode'
      ) {
        goBack();
        return true; // handled
      }

      // If on Dashboard or root screen, prompt before closing or double tap to exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        return false; // let the system exit
      }
      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => backSub.remove();
  }, [currentScreen, goBack]);

  useEffect(() => {
    LogBox.ignoreAllLogs();
    async function checkLaunchGuard() {
      try {
        console.log('[App] Checking session on mount...');
        const token = await Storage.getAuthToken();
        const profile = await Storage.getUserProfile();
        const role = await Storage.getAssignedRole();

        if (token || profile) {
          console.log('[Auth] Active session found. Auto-routing...');
          if (role === 'CHILD') {
            setCurrentScreen('ChildMode');
            setScreenStack(['ChildMode']);
            return;
          }

          if (profile && profile.user_id) {
            try {
              const backendCheck = await ParentalRepository.checkParentLinked(profile.user_id);
              if (backendCheck?.is_linked && backendCheck?.linked_child) {
                await Storage.setLinkedChild(backendCheck.linked_child);
              }
            } catch (e) {
              console.warn('[App] Backend link check failed during launch:', e);
            }
          }
          setCurrentScreen('Dashboard');
          setScreenStack(['Dashboard']);
        } else {
          setCurrentScreen('DeviceRoleSelection');
          setScreenStack(['DeviceRoleSelection']);
        }
      } catch (error) {
        console.error('[Auth] Session restoration check failed:', error);
        setCurrentScreen('DeviceRoleSelection');
        setScreenStack(['DeviceRoleSelection']);
      }
    }
    checkLaunchGuard();
  }, []);

  const handleSignOut = async () => {
    await Storage.clear();
    ChildDaemon.stopDaemon();
    setCurrentScreen('DeviceRoleSelection');
    setScreenStack(['DeviceRoleSelection']);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DeviceRoleSelection':
        return (
          <DeviceRoleSelectionScreen
            onSelectParent={() => navigateTo('Login')}
            onSelectChild={() => navigateTo('ChildLink')}
            onViewBindingCode={() => navigateTo('TwoStepBinding')}
          />
        );
      case 'Login':
        return (
          <LoginScreen
            onSignInSuccess={(isLinked, userEmail) => {
              setSignUpSuccessMessage('');
              if (userEmail === 'admin@gmail.com') {
                navigateTo('AdminLogs');
              } else {
                setCurrentScreen('Dashboard');
                setScreenStack(['Dashboard']);
              }
            }}
            onSetUpChildDevice={() => navigateTo('DeviceRoleSelection')}
            onGoToSignUp={() => {
              setSignUpSuccessMessage('');
              navigateTo('SignUp');
            }}
            signUpSuccessMessage={signUpSuccessMessage}
          />
        );
      case 'TwoStepBinding':
        return (
          <TwoStepBindingScreen
            onBack={goBack}
            onCheckStatus={() => navigateTo('Dashboard')}
          />
        );
      case 'SignUp':
        return (
          <SignUpScreen
            onSignUpSuccess={() => {
              setSignUpSuccessMessage('Account created successfully! Please sign in.');
              navigateTo('Login', true);
            }}
            onGoToLogin={() => {
              setSignUpSuccessMessage('');
              navigateTo('Login', true);
            }}
          />
        );
      case 'Dashboard':
        return (
          <DashboardScreen
            onSignOut={handleSignOut}
            onOpenGeoTracking={() => navigateTo('GeoTracking')}
            onOpenParentalControl={() => navigateTo('ParentalControl')}
            onOpenMalwareAnalysis={() => navigateTo('MalwareAnalysis')}
            onOpenCallerIntelligence={() => navigateTo('CallerIntelligence')}
            onOpenVulnerabilityDetection={() => navigateTo('VulnerabilityDetection')}
            onOpenChildDashboard={() => navigateTo('ChildDashboard')}
          />
        );
      case 'GeoTracking':
        return <GeoTrackingScreen onBack={goBack} />;
      case 'ParentalControl':
        return (
          <ParentalControlScreen
            onBack={goBack}
            onSignOut={handleSignOut}
          />
        );
      case 'MalwareAnalysis':
        return <MalwareAnalysisScreen onBack={goBack} />;
      case 'CallerIntelligence':
        return <CallerIntelligenceScreen onBack={goBack} />;
      case 'VulnerabilityDetection':
        return <VulnerabilityDetectionScreen onBack={goBack} />;
      case 'ChildDashboard':
        return <ChildDashboardScreen onBack={goBack} />;
      case 'ChildLink':
        return (
          <ChildLinkScreen
            onBack={goBack}
            onLinkSuccess={() => navigateTo('ChildPermissions')}
          />
        );
      case 'ChildPermissions':
        return (
          <ChildPermissionsScreen
            onBack={goBack}
            onConfirmPermissions={() => {
              setCurrentScreen('ChildMode');
              setScreenStack(['ChildMode']);
            }}
          />
        );
      case 'ChildMode':
        return <ChildModeScreen onUnlink={handleSignOut} />;
      case 'AdminLogs':
        return <AdminLogsScreen onBack={goBack} />;
      default:
        return (
          <DeviceRoleSelectionScreen
            onSelectParent={() => navigateTo('Login')}
            onSelectChild={() => navigateTo('ChildLink')}
            onViewBindingCode={() => navigateTo('TwoStepBinding')}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <AppContent renderScreen={renderScreen} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export default App;
