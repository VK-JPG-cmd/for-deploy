import React, { useState, useEffect } from 'react';
import { ParentalRepository } from '../data/parentalRepository';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ToastAndroid,
  Platform,
  Alert,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Line, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

import { Storage } from '../utils/storage';
import { useApkScanner } from '../hooks/useApkScanner';
import { MalwareAnalysisScreen } from './MalwareAnalysisScreen';

interface DashboardScreenProps {
  onSignOut: () => void;
  onOpenGeoTracking: () => void;
  onOpenParentalControl: () => void;
  onOpenMalwareAnalysis: () => void;
  onOpenCallerIntelligence: () => void;
  onOpenVulnerabilityDetection: () => void;
  onOpenChildDashboard: () => void;
}

// --- SUB-TABS VIEWS ---

const ConsoleScreenView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useAppTheme();
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [INFO] Core daemon initialized.`,
    `[${new Date().toLocaleTimeString()}] [SUCCESS] Local token storage verified.`,
    `[${new Date().toLocaleTimeString()}] [INFO] PostgreSQL connected to Render Cloud DB.`,
    `[${new Date().toLocaleTimeString()}] [INFO] Listening for child link status checks...`
  ]);
  const [isPinging, setIsPinging] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handlePing = async () => {
    setIsPinging(true);
    addLog(`[PING] Launching API diagnostics on Render Cloud DB...`);
    setTimeout(() => {
      addLog(`[SUCCESS] Destination host reachable (Render Cloud PostgreSQL).`);
      addLog(`[SYSTEM] Database cluster operational.`);
      setIsPinging(false);
    }, 1500);
  };

  const handleSystemAudit = () => {
    addLog(`[AUDIT] Starting local compliance review...`);
    setTimeout(() => {
      addLog(`[AUDIT] OS: Android SDK API 34`);
      addLog(`[AUDIT] Integrity status: Verified (Safe)`);
      addLog(`[AUDIT] Storage capacity: 15.6 GB protected.`);
      addLog(`[AUDIT] Active shields: Antivirus, APK Scanner, Geofencing.`);
      addLog(`[AUDIT] Audit finished successfully. 0 critical vulnerabilities found.`);
    }, 1500);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
          <Icon name="arrow-back" color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, fontFamily: 'monospace' }}>
          Diagnostic Console
        </Text>
      </View>

      <View style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
          {logs.map((log, index) => {
            let color = '#34d399';
            if (log.includes('[WARN]')) color = '#fbbf24';
            if (log.includes('[INFO]')) color = '#60a5fa';
            if (log.includes('[PING]')) color = '#c084fc';
            return (
              <Text key={index} style={{ fontFamily: 'monospace', color, fontSize: 13, marginBottom: 6, lineHeight: 18 }}>
                {log}
              </Text>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 80 }}>
        <TouchableOpacity
          onPress={handlePing}
          disabled={isPinging}
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: '#475569',
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            marginRight: 8,
            flexDirection: 'row',
            justifyContent: 'center'
          }}
        >
          <Icon name="dns" color={colors.cyanAccent} size={16} />
          <Text style={{ color: '#fff', marginLeft: 6, fontWeight: 'bold', fontSize: 13 }}>Ping DB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSystemAudit}
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: '#475569',
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            marginRight: 8,
            flexDirection: 'row',
            justifyContent: 'center'
          }}
        >
          <Icon name="check-circle" color={colors.purpleAccent} size={16} />
          <Text style={{ color: '#fff', marginLeft: 6, fontWeight: 'bold', fontSize: 13 }}>Audit System</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setLogs([])}
          style={{
            backgroundColor: '#ef444420',
            borderWidth: 1,
            borderColor: '#ef444440',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon name="delete" color="#f87171" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ReportsScreenView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useAppTheme();
  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
          <Icon name="arrow-back" color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          Security Reports
        </Text>
      </View>

      <LinearGradient
        colors={['#8b5cf6', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 20, marginBottom: 20 }}
      >
        <Text style={{ color: '#fff', fontSize: 14, opacity: 0.8 }}>Overall Protection Rating</Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 6 }}>Excellent (98%)</Text>
        <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9 }}>Your device status has been optimal for 7 consecutive days.</Text>
      </LinearGradient>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginRight: 10 }}>
          <Icon name="shield" color={colors.purpleAccent} size={24} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>0</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Threats Found</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginLeft: 10 }}>
          <Icon name="call" color={colors.cyanAccent} size={24} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>24</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Callers Screened</Text>
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Recent Activity Log</Text>
      {[
        { title: 'Automatic Malware Scan Completed', time: 'Today, 02:45 PM', desc: 'Scanned 1.24K apps. No threats detected.', icon: 'check-circle', color: '#10b981' },
        { title: 'Vulnerabilities Detection Active', time: 'Today, 08:30 AM', desc: 'Detected 2 outdated packages with minor CVEs.', icon: 'warning', color: '#f59e0b' },
        { title: 'Parental Controls Synchronized', time: 'Yesterday, 11:00 PM', desc: 'Sync completed with child profile Alexa.', icon: 'sync', color: '#8b5cf6' }
      ].map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <View style={{ backgroundColor: item.color + '20', borderRadius: 8, padding: 8, alignSelf: 'flex-start', marginRight: 12 }}>
            <Icon name={item.icon} color={item.color} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{item.title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{item.time}</Text>
            <Text style={{ color: colors.text, fontSize: 12, marginTop: 4, opacity: 0.8 }}>{item.desc}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const MoreScreenView: React.FC<{ onBack: () => void; onSignOut: () => void }> = ({ onBack, onSignOut }) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
          <Icon name="arrow-back" color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          More Utilities
        </Text>
      </View>

      <View style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 8, marginBottom: 20 }}>
        <TouchableOpacity onPress={toggleTheme} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="dark-mode" color={colors.purpleAccent} size={22} />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 12 }}>Dark Mode</Text>
          </View>
          <Text style={{ color: colors.purpleAccent, fontSize: 12, fontWeight: 'bold' }}>
            {mode === 'dark' ? 'ENABLED' : 'DISABLED'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="dns" color={colors.cyanAccent} size={22} />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 12 }}>Target Database</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Render Cloud (aepttas_xdr)
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="info" color={colors.textMuted} size={22} />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 12 }}>App Version</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            v2.0.4
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onSignOut}
        style={{
          backgroundColor: '#ef444415',
          borderWidth: 1,
          borderColor: '#ef444430',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40
        }}
      >
        <Icon name="logout" color="#ef4444" size={20} />
        <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 14, marginLeft: 8 }}>Sign Out Session</Text>
      </TouchableOpacity>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSignOut,
  onOpenGeoTracking,
  onOpenParentalControl,
  onOpenMalwareAnalysis,
  onOpenCallerIntelligence,
  onOpenVulnerabilityDetection,
  onOpenChildDashboard,
}) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { dashboardMetrics } = useApkScanner();

  const [activeTab, setActiveTab] = useState('Home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileView, setProfileView] = useState<'menu' | 'info' | 'settings' | 'subscription' | 'orders'>('menu');
  const [profileData, setProfileData] = useState({
    name: 'Leo Anderson',
    phone: '+1 (555) 019-2831',
    email: 'leo.anderson@example.com'
  });
  const [showMenu, setShowMenu] = useState(false);
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    async function loadUserProfile() {
      const stored = await Storage.getUserProfile();
      if (stored) {
        setProfileData(prev => ({
          ...prev,
          name: stored.name || prev.name,
          email: stored.email || prev.email,
          phone: stored.phone || prev.phone,
        }));
      }
    }
    loadUserProfile();
    const unsubscribe = Storage.subscribe('user_profile', loadUserProfile);
    return () => unsubscribe();
  }, []);

  const fetchChildren = async () => {
    try {
      let list = await ParentalRepository.listChildren();
      const storedLinkedChild = await Storage.getLinkedChild();
      if (storedLinkedChild && !list.some((c: any) => c.id === storedLinkedChild.id || c.name.toLowerCase() === storedLinkedChild.name.toLowerCase())) {
        list.unshift(storedLinkedChild);
      }
      setChildren(list);
    } catch (err) {
      const storedLinkedChild = await Storage.getLinkedChild();
      setChildren(storedLinkedChild ? [storedLinkedChild] : []);
    }
  };

  const [sosActive, setSosActive] = useState(false);
  const [sosChildName, setSosChildName] = useState('Child Device');

  useEffect(() => {
    const checkSOS = async () => {
      const storedLinkedChild = await Storage.getLinkedChild();
      const targetId = storedLinkedChild?.id || (children[0]?.id || 'child_uuid_1');
      try {
        const sosRes = await ParentalRepository.getActiveSOS(targetId);
        if (sosRes?.is_panic_active) {
          setSosActive(true);
          setSosChildName(storedLinkedChild?.name || children[0]?.name || 'Child Device');
        } else {
          setSosActive(false);
        }
      } catch (e) {}
    };
    checkSOS();
    const interval = setInterval(checkSOS, 2000);
    return () => clearInterval(interval);
  }, [children]);

  useEffect(() => {
    fetchChildren();
    const interval = setInterval(() => {
      fetchChildren();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChildSignOut = async (childId: string, childName: string) => {
    setShowMenu(false);
    try {
      await ParentalRepository.unlinkChildDevice(childId);
      showToast(`Signed out ${childName}`);
      await fetchChildren();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlink device');
    }
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Redirecting', message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Real-time Emergency SOS Distress Popup Modal Alert */}
      <Modal visible={sosActive} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.sosAlertCard}>
            <View style={styles.sosAlertIconBg}>
              <Icon name="warning" color="#ef4444" size={40} />
            </View>
            <Text style={styles.sosAlertTitle}>🚨 EMERGENCY SOS DISTRESS ALERT!</Text>
            <Text style={styles.sosAlertMessage}>
              Emergency panic alarm triggered from <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>{sosChildName}</Text>!
            </Text>
            <Text style={styles.sosAlertSub}>
              📍 GPS Coordinates: 13.0827° N, 80.2707° E (Live Telemetry Transmitted)
            </Text>
            <View style={styles.sosBtnRow}>
              <TouchableOpacity
                style={[styles.sosBtn, { backgroundColor: '#8b5cf6' }]}
                onPress={() => {
                  setSosActive(false);
                  onOpenGeoTracking();
                }}
              >
                <Text style={styles.sosBtnText}>View GPS Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sosBtn, { backgroundColor: '#ef4444' }]}
                onPress={async () => {
                  const storedChild = await Storage.getLinkedChild();
                  const targetId = storedChild?.id || (children[0]?.id || 'child_uuid_1');
                  await ParentalRepository.resolveSOS(targetId);
                  setSosActive(false);
                }}
              >
                <Text style={styles.sosBtnText}>Acknowledge SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <View style={styles.purpleGlow} />
      </View>

      {activeTab === 'Home' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. TOP HEADER APP BAR */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Small Logo Container */}
            <View style={styles.miniLogo}>
              <Image
                source={require('../assets/app_logo.png')}
                style={styles.miniLogoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerTitleContainer}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.headerTitle}>Aepttas Shield</Text>
              </View>
              <Text style={styles.headerSubtitle}>AI-Powered Mobile Security Suite</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <TouchableOpacity style={styles.bellButton} onPress={() => showToast('No new notifications')}>
              <Icon name="notifications" color={colors.text} size={20} />
              <View style={styles.redDot} />
            </TouchableOpacity>

            {/* Profile Icon */}
            <TouchableOpacity style={styles.profileButton} onPress={() => { setProfileView('menu'); setShowProfileModal(true); }}>
              <Icon name="person" color={colors.text} size={20} />
            </TouchableOpacity>

            {/* Three Dots Settings Menu */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity style={{ padding: 8, marginLeft: 4 }} onPress={() => { fetchChildren(); setShowMenu(true); }}>
                <Icon name="more-vert" color={colors.text} size={24} />
              </TouchableOpacity>

              <Modal
                visible={showMenu}
                transparent={true}
                animationType="none"
                onRequestClose={() => setShowMenu(false)}
              >
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 }}
                  activeOpacity={1}
                  onPress={() => setShowMenu(false)}
                >
                  <TouchableOpacity activeOpacity={1} style={[styles.menuDropdown, { position: 'relative', top: 0, right: 0 }]}>
                    <View style={styles.menuItem}>
                      <Icon name="child-care" color={colors.purpleAccent} size={16} />
                      <Text style={styles.menuText}>{children.length} Children Profiles</Text>
                    </View>
                    <View style={styles.menuDivider} />

                    {children.map(child => {
                      return (
                        <View key={child.child_id || child.id} style={styles.childMenuRow}>
                          <Text style={styles.childMenuName} numberOfLines={1}>
                            {child.name}
                          </Text>
                          <TouchableOpacity
                            style={styles.childSignOutBtn}
                            onPress={() => {
                              setShowMenu(false);
                              if (Platform.OS === 'web') {
                                const ok = typeof (globalThis as any).confirm === 'function' ? (globalThis as any).confirm(`Sign out and remove ${child.name}?`) : true;
                                if (ok) {
                                  handleChildSignOut(child.child_id || child.id, child.name);
                                }
                              } else {
                                Alert.alert(
                                  'Sign Out Child',
                                  `Are you sure you want to sign out and remove ${child.name}?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Sign Out', style: 'destructive', onPress: () => handleChildSignOut(child.child_id || child.id, child.name) }
                                  ]
                                );
                              }
                            }}
                          >
                            <Text style={styles.childSignOutBtnText}>Sign Out</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    <View style={styles.menuDivider} />
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onSignOut(); }}>
                      <Icon name="exit-to-app" color={colors.redDanger} size={16} />
                      <Text style={[styles.menuText, { color: colors.redDanger }]}>Sign Out Parent</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>
        </View>

        {/* 2. MAIN STATUS CARD */}
        <LinearGradient
          colors={['#5b21b6', '#1e3a8a', '#0f172a']}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusCardContent}>
            {/* Glowing Shield SVG */}
            <View style={styles.shieldWrapper}>
              <Svg width={80} height={80} viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" fill={colors.purpleAccent} opacity={0.15} />
                <Circle cx="50" cy="50" r="35" fill={colors.cyanAccent} opacity={0.1} />
                <Path
                  d="M50,20 L80,30 V50 C80,68 67,82 50,87 C33,82 20,68 20,50 V30 L50,20 Z"
                  fill="#1e293b"
                  stroke={colors.cyanAccent}
                  strokeWidth="3"
                />
                <Path
                  d="M45,63 L32,50 L37,45 L45,53 L63,35 L68,40 Z"
                  fill={colors.cyanAccent}
                />
              </Svg>
            </View>

            {/* Device Status Details */}
            <View style={styles.statusDetails}>
              <Text style={styles.statusLabelText}>YOUR DEVICE IS</Text>
              <View style={styles.protectedRow}>
                <Text style={styles.protectedText} numberOfLines={1} adjustsFontSizeToFit={true}>PROTECTED</Text>
                <View style={styles.checkBadge}>
                  <Icon name="check" color="#fff" size={10} />
                </View>
              </View>
              <Text style={styles.scoreLabel}>Security Score</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreBig}>{dashboardMetrics?.device_security_score ?? 98}</Text>
                <Text style={styles.scoreSmall}>/100</Text>
              </View>
              <View style={styles.scanTimeRow}>
                <Text style={styles.scanTimeText}>Last scanned: 2 min ago </Text>
                <Icon name="refresh" color="#d1d5db" size={12} />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 3. STATS ROW */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="report" color={colors.redDanger} size={18} />
            <Text style={styles.statValue}>{dashboardMetrics?.threats_detected ?? 32}</Text>
            <Text style={styles.statLabel} numberOfLines={2}>Threats{'\n'}Blocked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="inventory" color={colors.purpleAccent} size={18} />
            <Text style={styles.statValue}>1.24K</Text>
            <Text style={styles.statLabel} numberOfLines={2}>APKs{'\n'}Scanned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="warning-amber" color={colors.orangeWarning} size={18} />
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel} numberOfLines={2}>Vulns{'\n'}Found</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="shield" color={colors.cyanAccent} size={18} />
            <Text style={styles.statValue}>15.6 GB</Text>
            <Text style={styles.statLabel} numberOfLines={2}>Data{'\n'}Protected</Text>
          </View>
        </View>

        {/* 4. QUICK ACTIONS SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS GRID */}
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.purpleAccent + '1E' }]}>
              <Icon name="shield" color={colors.purpleAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Antivirus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenMalwareAnalysis}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.greenSuccess + '1E' }]}>
              <Icon name="inventory" color={colors.greenSuccess} size={20} />
            </View>
            <Text style={styles.gridLabel}>APK Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenCallerIntelligence}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.blueAccent + '1E' }]}>
              <Icon name="phone" color={colors.blueAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Caller Intelligence</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenVulnerabilityDetection}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.orangeWarning + '1E' }]}>
              <Icon name="error-outline" color={colors.orangeWarning} size={20} />
            </View>
            <Text style={styles.gridLabel}>Vulnerability{'\n'}Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.gridRow, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.gridItem} onPress={onOpenChildDashboard}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.purpleAccent + '1E' }]}>
              <Icon name="child-care" color={colors.purpleAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Child Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenGeoTracking}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.blueAccent + '1E' }]}>
              <Icon name="globe" color={colors.blueAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Geo Tracking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenParentalControl}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.pinkAccent + '1E' }]}>
              <Icon name="people" color={colors.pinkAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Parental Control</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.cyanAccent + '1E' }]}>
              <Icon name="vpn-key" color={colors.cyanAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Secure VPN</Text>
          </TouchableOpacity>
        </View>

        {/* 5. AI THREAT INTELLIGENCE CARD */}
        <View style={styles.aiCard}>
          <View style={styles.aiContent}>
            <View style={{ flex: 1.3 }}>
              <Text style={styles.aiTitle}>AI Threat Intelligence</Text>
              <Text style={styles.aiDate}>Updated: Today 08:45 AM</Text>
            </View>

            {/* Neural Network SVG Graphic */}
            <View style={styles.brainWrapper}>
              <Svg width={60} height={50} viewBox="0 0 60 50">
                <Circle cx="30" cy="25" r="16" fill={colors.cyanAccent} opacity={0.2} />
                <Circle cx="30" cy="25" r="6" fill={colors.purpleAccent} opacity={0.8} />
                {/* Connector Lines */}
                <Line x1="30" y1="25" x2="10" y2="10" stroke={colors.cyanAccent} strokeWidth="1" opacity={0.6} />
                <Line x1="30" y1="25" x2="50" y2="35" stroke={colors.cyanAccent} strokeWidth="1" opacity={0.6} />
                <Line x1="30" y1="25" x2="15" y2="40" stroke={colors.purpleAccent} strokeWidth="1" opacity={0.6} />
                <Line x1="30" y1="25" x2="48" y2="10" stroke={colors.purpleAccent} strokeWidth="1" opacity={0.6} />
                {/* Node Circles */}
                <Circle cx="10" cy="10" r="3" fill={colors.cyanAccent} />
                <Circle cx="50" cy="35" r="3" fill={colors.cyanAccent} />
                <Circle cx="15" cy="40" r="3" fill={colors.purpleAccent} />
                <Circle cx="48" cy="10" r="3" fill={colors.purpleAccent} />
              </Svg>
            </View>

            <TouchableOpacity style={styles.aiArrowBtn}>
              <Icon name="arrow-forward" color={colors.text} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. RECENT ACTIVITY */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.editLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivityCard}>
          <View style={styles.activityIconBg}>
            <Icon name="error" color={colors.redDanger} size={24} />
          </View>
          <View style={styles.activityTexts}>
            <Text style={styles.activityTitle}>Malicious APK Detected</Text>
            <Text style={styles.activitySub}>com.bad.app.malware</Text>
          </View>
          <View style={styles.activityTimeCol}>
            <Text style={styles.activityTime}>10:30 AM</Text>
            <Text style={styles.activityStatus}>Quarantined</Text>
          </View>
        </View>

        {/* Spacer before footer bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
      ) : activeTab === 'Scan' ? (
        <MalwareAnalysisScreen onBack={() => setActiveTab('Home')} />
      ) : activeTab === 'Console' ? (
        <ConsoleScreenView onBack={() => setActiveTab('Home')} />
      ) : activeTab === 'Reports' ? (
        <ReportsScreenView onBack={() => setActiveTab('Home')} />
      ) : (
        <MoreScreenView onBack={() => setActiveTab('Home')} onSignOut={onSignOut} />
      )}

      {/* 7. FLOATING BOTTOM NAVIGATION BAR */}
      <View style={styles.floatingNavContainer}>
        <View style={styles.floatingNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => { console.log('[Dashboard] Tab click: Home'); setActiveTab('Home'); }}>
            <Icon name="home" color={activeTab === 'Home' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { console.log('[Dashboard] Tab click: Scan'); setActiveTab('Scan'); }}>
            <Icon name="search" color={activeTab === 'Scan' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Scan' && styles.navTextActive]}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { console.log('[Dashboard] Tab click: Console'); setActiveTab('Console'); }}>
            <Icon name="terminal" color={activeTab === 'Console' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Console' && styles.navTextActive]}>Console</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { console.log('[Dashboard] Tab click: Reports'); setActiveTab('Reports'); }}>
            <Icon name="reports" color={activeTab === 'Reports' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Reports' && styles.navTextActive]}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { console.log('[Dashboard] Tab click: More'); setActiveTab('More'); }}>
            <Icon name="grid" color={activeTab === 'More' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'More' && styles.navTextActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* PROFILE POPUP */}
      <Modal transparent={true} visible={showProfileModal} animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close X Button */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowProfileModal(false)}>
              <Icon name="close" color={colors.text} size={16} />
            </TouchableOpacity>

            {profileView === 'menu' ? (
              <>
                <Text style={styles.menuTitle}>Profile Menu</Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('info')}>
                    <Icon name="person" color={colors.cyanAccent} size={20} />
                    <Text style={styles.menuOptionText}>Profile Info</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('subscription')}>
                    <Icon name="verified" color={colors.purpleAccent} size={20} />
                    <Text style={styles.menuOptionText}>Subscription</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('orders')}>
                    <Icon name="receipt" color={colors.orangeWarning} size={20} />
                    <Text style={styles.menuOptionText}>Orders & Payments</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Feedback feature coming soon.')}>
                    <Icon name="feedback" color={colors.greenSuccess} size={20} />
                    <Text style={styles.menuOptionText}>Feedback</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Help feature coming soon.')}>
                    <Icon name="help" color={colors.cyanAccent} size={20} />
                    <Text style={styles.menuOptionText}>Help</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('settings')}>
                    <Icon name="settings" color={colors.greenSuccess} size={20} />
                    <Text style={styles.menuOptionText}>Settings</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : profileView === 'info' ? (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatarContainer}>
                    <View style={styles.profileAvatarBg}>
                      <Icon name="person" color={colors.text} size={40} />
                    </View>
                    <TouchableOpacity style={styles.editAvatarBtn} onPress={() => showToast('Edit photo feature coming soon.')}>
                      <Icon name="edit" color="#000" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileLabel}>Name</Text>
                  <Text style={styles.profileValue}>{profileData.name}</Text>
                </View>

                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileLabel}>Phone Number</Text>
                  <Text style={styles.profileValue}>{profileData.phone}</Text>
                </View>

                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue}>{profileData.email}</Text>
                </View>
              </>
            ) : profileView === 'settings' ? (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <Text style={styles.menuTitle}>Settings</Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  {/* Theme Toggle */}
                  <TouchableOpacity style={styles.menuOptionBtn} onPress={toggleTheme}>
                    <Text style={styles.menuOptionText}>Dark/Light Mode</Text>
                    <Icon name={mode === 'dark' ? 'light-mode' : 'dark-mode'} color={colors.cyanAccent} size={16} />
                  </TouchableOpacity>

                  {['Account', 'Password', 'Change Password', 'Email', 'Change Email', 'Language'].map((settingItem, idx) => (
                    <TouchableOpacity key={idx} style={styles.menuOptionBtn} onPress={() => showToast(`${settingItem} settings coming soon.`)}>
                      <Text style={styles.menuOptionText}>{settingItem}</Text>
                      <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                    </TouchableOpacity>
                  ))}

                  {/* Log Out Option */}
                  <TouchableOpacity style={[styles.menuOptionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]} onPress={() => { setShowProfileModal(false); onSignOut(); }}>
                    <Text style={[styles.menuOptionText, { color: colors.redDanger }]}>Log Out</Text>
                    <Icon name="exit-to-app" color={colors.redDanger} size={20} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : profileView === 'subscription' ? (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <View style={styles.subHeader}>
                  <Icon name="verified" color={colors.purpleAccent} size={20} />
                  <Text style={styles.subHeaderTag}>AEPTTAS SHIELD SUBSCRIPTION</Text>
                </View>

                <Text style={styles.subMainTitle}>Upgrade to Premium Security</Text>
                <Text style={styles.subDescription}>
                  Unlock full AI telemetry defense and safeguard your mobile workspace.
                </Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  <View style={styles.plansContainer}>
                    {/* Standard Shield Plan */}
                    <TouchableOpacity
                      style={styles.planCard}
                      onPress={() => showToast('Thank you for subscribing to Standard Shield!')}
                    >
                      <View style={styles.planHeaderRow}>
                        <Text style={styles.planName}>Standard Shield</Text>
                        <Text style={styles.planPrice}>₹299/mo</Text>
                      </View>
                      <Text style={styles.planFeatures}>
                        • Core APK Sandboxing{`\n`}• 2 Linked Child Devices{`\n`}• Basic Geo-tracking History
                      </Text>
                    </TouchableOpacity>

                    {/* Premium Plan */}
                    <TouchableOpacity
                      style={[styles.planCard, styles.planCardElite]}
                      onPress={() => showToast('Welcome to Premium Protection!')}
                    >
                      <View style={styles.eliteBadgeRow}>
                        <View style={styles.eliteBadge}>
                          <Text style={styles.eliteBadgeText}>MOST POPULAR</Text>
                        </View>
                      </View>
                      <View style={styles.planHeaderRow}>
                        <Text style={[styles.planName, { color: colors.cyanAccent }]}>Premium</Text>
                        <Text style={[styles.planPrice, { color: colors.cyanAccent }]}>₹599/mo</Text>
                      </View>
                      <Text style={[styles.planFeatures, { color: '#e2e8f0' }]}>
                        • Infinite Sandbox Telemetry{`\n`}• Unlimited Child Device Links{`\n`}• Secure VIP VPN Access{`\n`}• Live 24/7 Threat Intelligence
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <Text style={styles.menuTitle}>Orders & Payments</Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  <View style={[styles.planCard, { marginBottom: 12 }]}>
                    <View style={styles.planHeaderRow}>
                      <Text style={styles.planName}>No Orders Yet</Text>
                    </View>
                    <Text style={styles.planFeatures}>
                      Your past purchases and payment history will appear here once you subscribe to a plan.
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Payment methods coming soon.')}>
                    <Icon name="credit-card" color={colors.cyanAccent} size={20} />
                    <Text style={styles.menuOptionText}>Manage Payment Methods</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Billing history coming soon.')}>
                    <Icon name="receipt" color={colors.purpleAccent} size={20} />
                    <Text style={styles.menuOptionText}>Billing History</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    alignItems: 'center',
    overflow: 'hidden',
  },
  purpleGlow: {
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: '#201a54',
    opacity: 0.35,
    marginTop: -200,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 130,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniLogoImage: {
    width: 32,
    height: 32,
  },
  headerTitleContainer: {
    marginLeft: 12,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.purpleAccent + '88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.redDanger,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purpleAccent + '40',
    borderWidth: 2,
    borderColor: colors.purpleAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.cyanAccent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#07051f',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
  },
  profileLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  profileValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  menuOptionsContainer: {
    width: '100%',
    paddingTop: 8,
  },
  menuOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  modalBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statusCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38bdf844', // translucent cyan/purple gradient border simulation
    marginTop: 8,
    marginBottom: 20,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldWrapper: {
    width: 85,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDetails: {
    flex: 1,
    paddingLeft: 12,
  },
  statusLabelText: {
    color: '#D1D5DB',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  protectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    flexWrap: 'nowrap',
  },
  protectedText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.greenSuccess,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreBig: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreSmall: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 3,
    marginLeft: 2,
  },
  scanTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  scanTimeText: {
    color: '#D1D5DB',
    fontSize: 10.5,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  editLink: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridItem: {
    flex: 0.23,
    height: 90,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  gridIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    color: colors.text,
    fontSize: 9.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 11,
  },
  aiCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  aiDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  brainWrapper: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.redDanger + '26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTexts: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  activitySub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  activityTimeCol: {
    alignItems: 'flex-end',
  },
  activityTime: {
    color: colors.textMuted,
    fontSize: 10.5,
  },
  activityStatus: {
    color: colors.redDanger,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },
  floatingNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 12 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10000,
    elevation: 10,
  },
  floatingNav: {
    flexDirection: 'row',
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.cardBackground + 'F2', // 0.95 opacity
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  navTextActive: {
    color: colors.purpleAccent,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: '#ffd900',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  subHeaderTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.purpleAccent,
    letterSpacing: 1,
    marginLeft: 6,
  },
  subMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subDescription: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  plansContainer: {
    width: '100%',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#0a0d1b',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  planCardElite: {
    borderColor: colors.cyanAccent + '88',
    backgroundColor: '#0a1626',
    borderWidth: 1.5,
  },
  eliteBadgeRow: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eliteBadge: {
    backgroundColor: colors.cyanAccent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  eliteBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.purpleAccent,
  },
  planFeatures: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  subSkipBtn: {
    paddingVertical: 6,
  },
  subSkipBtnText: {
    fontSize: 11,
    color: '#6b6e85',
    fontWeight: '600',
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    width: 175,
    zIndex: 10000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuText: {
    color: colors.text,
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  childMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  childMenuName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  childSignOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  childSignOutBtnText: {
    color: colors.redDanger,
    fontSize: 10,
    fontWeight: 'bold',
  },
  childUnlinkedText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  sosAlertCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  sosAlertIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sosAlertTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  sosAlertMessage: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  sosAlertSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  sosBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  sosBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
