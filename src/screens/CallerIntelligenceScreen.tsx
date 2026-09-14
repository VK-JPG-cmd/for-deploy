import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Platform,
  ToastAndroid,
  Alert,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';
import { useCallerIntelligence } from '../hooks/useCallerIntelligence';
import { getCallerBaseUrl } from '../config/apiConfig';

interface MockCall {
  name: string;
  number: string;
  riskScore: number;
  type: 'Normal' | 'Spam' | 'Scam' | 'High-Risk' | 'Suspicious';
  carrier: string;
  location: string;
  frequency: string;
}

interface BlockedNumber {
  number: string;
  name: string;
  reason: string;
  date: string;
}

interface SpamCall {
  name: string;
  number: string;
  riskScore: number;
  date: string;
}

interface CallReport {
  id: string;
  number: string;
  type: string;
  description: string;
  timestamp: string;
}

interface CallerIntelligenceScreenProps {
  onBack: () => void;
}

export const CallerIntelligenceScreen: React.FC<CallerIntelligenceScreenProps> = ({ onBack }) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const {
    blockedNumbers,
    spamCalls,
    reportHistory,
    callHistory,
    autoBlockEnabled,
    notificationsEnabled,
    addBlockedNumber,
    removeBlockedNumber,
    reportCall,
    toggleAutoBlock,
    toggleNotifications,
  } = useCallerIntelligence();

  const [activeTab, setActiveTab] = useState<number>(0);

  const [recentAlerts] = useState<string[]>([
    'Critical Scam Blocked: +1 (866) 492-3001 at 09:42 AM',
    'Auto-Blocked Telemarketer: +1 (510) 902-8811 at 08:30 AM',
    'Spam Risk Detected: +1 (202) 555-0143 at 11:30 AM'
  ]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MockCall | null>(null);

  const [sensitivity, setSensitivity] = useState(75); // 0.75 in Kotlin
  const [privacyLogging, setPrivacyLogging] = useState(false);

  // Simulator
  const [activeSimulatedCall, setActiveSimulatedCall] = useState<MockCall | null>(null);

  // Popups
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [showScamAlert, setShowScamAlert] = useState(false);
  const [showHighRiskAlert, setShowHighRiskAlert] = useState(false);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showCustomBlockModal, setShowCustomBlockModal] = useState(false);
  const [customBlockNumber, setCustomBlockNumber] = useState('');
  const [customBlockName, setCustomBlockName] = useState('');
  const [customBlockReason, setCustomBlockReason] = useState('');

  // Temp reporting variables
  const [reportType, setReportType] = useState('Robocall / Telemarketing');
  const [reportDesc, setReportDesc] = useState('');
  const [callerToBlockOrReport, setCallerToBlockOrReport] = useState<MockCall | null>(null);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Notice', message);
    }
  };

  const handleSimulateCall = async (call: MockCall) => {
    setActiveSimulatedCall(call);
    try {
      await fetch(`${getCallerBaseUrl()}/api/live-call/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_number: call.number,
          caller_name: call.name,
          call_type: call.type === 'Normal' ? 'INCOMING' : (call.type === 'Spam' || call.type === 'Scam' ? 'BLOCKED' : 'INCOMING'),
          duration: Math.floor(Math.random() * 60) + 15,
        }),
      });
    } catch (e) {
      console.warn('Live call analyze error:', e);
    }
    if (call.type === 'Spam') {
      setShowSpamWarning(true);
    } else if (call.type === 'Scam') {
      setShowScamAlert(true);
    } else if (call.type === 'High-Risk') {
      setShowHighRiskAlert(true);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length > 0) {
      const cleanQuery = searchQuery.trim().replace(/\D/g, '');
      try {
        const res = await fetch(`${getCallerBaseUrl()}/api/callers/lookup/${encodeURIComponent(cleanQuery || searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResult({
            name: data.caller_name || 'Shield Identified',
            number: searchQuery,
            riskScore: data.risk_score || (data.is_spam ? 85 : 15),
            type: data.is_spam ? 'Spam' : (data.risk_score > 50 ? 'Suspicious' : 'Normal'),
            carrier: data.carrier || 'Cellular Network',
            location: data.location || 'India',
            frequency: `${data.total_reports || 0} network reports`
          });
          return;
        }
      } catch (e) {
        console.warn('Backend search error:', e);
      }

      setSearchResult({
        name: 'Unknown Caller',
        number: searchQuery,
        riskScore: 50,
        type: 'Normal',
        carrier: 'Unknown Carrier',
        location: 'Unknown Location',
        frequency: '1 call/week'
      });
    }
  };

  // Score circular gauge
  const radius = 40;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const angle = 0.94 * 260; // 94% secure
  const strokeDashoffset = circumference - (angle / 360) * circumference;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.contentWrapper}>

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeTab !== 0) {
              setActiveTab(0);
            } else {
              onBack();
            }
          }}
        >
          <Icon name="arrow-back" color={colors.text} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Caller Intelligence</Text>
          <Text style={styles.headerSubtitle}>Real-Time Call Shield & Spam Analysis Hub</Text>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRowContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {[
            'Dashboard',
            'Live Call Simulator',
            'Number Search',
            'Call History',
            'Spam & Blocked',
            'Scam Info Center',
            'Analytics & Settings'
          ].map((label, idx) => {
            const isSelected = activeTab === idx;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => setActiveTab(idx)}
              >
                <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* VIEW PANEL CONTROLLER */}
      <ScrollView contentContainerStyle={styles.viewContent}>
        {activeTab === 0 && (
          <View style={{ width: '100%' }}>
            {/* Security Score Widget */}
            <View style={styles.dashboardCard}>
              <View style={styles.gaugeRow}>
                <View style={styles.gaugeContainer}>
                  <Svg width={90} height={90} viewBox="0 0 100 100">
                    <G rotation="-220" origin="50, 50">
                      <Circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#140c3f"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${(260 / 360) * circumference} ${circumference}`}
                        strokeLinecap="round"
                      />
                      <Circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={colors.cyanAccent}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </G>
                  </Svg>
                  <View style={styles.gaugeTextWrapper}>
                    <Text style={styles.gaugePct}>94%</Text>
                    <Text style={styles.gaugeLabel}>Secure</Text>
                  </View>
                </View>

                <View style={styles.gaugeInfo}>
                  <Text style={styles.gaugeInfoTitle}>Caller Security Score</Text>
                  <Text style={styles.gaugeInfoSub}>Shield is actively filtering unknown incoming calls.</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.greenStatusDot} />
                    <Text style={styles.statusText}>Protected & Safe</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Call Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statWidget}>
                <Text style={styles.statWidgetLabel}>Calls Today</Text>
                <Text style={styles.statWidgetValue}>
                  {42 + spamCalls.length + blockedNumbers.length}
                </Text>
              </View>
              <View style={[styles.statWidget, { borderColor: colors.orangeWarning + '55' }]}>
                <Text style={styles.statWidgetLabel}>Spam Calls</Text>
                <Text style={[styles.statWidgetValue, { color: colors.orangeWarning }]}>
                  {spamCalls.length}
                </Text>
              </View>
              <View style={[styles.statWidget, { borderColor: colors.redDanger + '55' }]}>
                <Text style={styles.statWidgetLabel}>Blocked Calls</Text>
                <Text style={[styles.statWidgetValue, { color: colors.redDanger }]}>
                  {blockedNumbers.length}
                </Text>
              </View>
            </View>

            {/* Recent Alerts */}
            <Text style={styles.sectionTitle}>RECENT SECURITY ALERTS</Text>
            {recentAlerts.map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <Icon name="notifications-active" color={colors.cyanAccent} size={16} />
                <Text style={styles.alertText}>{alert}</Text>
              </View>
            ))}

            {/* Quick Actions */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>QUICK ACTION CHANNELS</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.actionWidget} onPress={() => setActiveTab(1)}>
                <Icon name="phone-callback" color={colors.greenSuccess} size={24} />
                <Text style={styles.actionWidgetTitle}>Simulate Live Call</Text>
                <Text style={styles.actionWidgetSub}>Test shield triggers</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionWidget} onPress={() => setActiveTab(2)}>
                <Icon name="search" color={colors.cyanAccent} size={24} />
                <Text style={styles.actionWidgetTitle}>Directory Lookup</Text>
                <Text style={styles.actionWidgetSub}>Reputation database</Text>
              </TouchableOpacity>
            </View>

            {/* Inline Sponsored Flipkart Ad */}
            <View style={[styles.modalContent, { borderColor: '#ffd900', borderWidth: 1, marginTop: 24 }]}>
              <View style={styles.adHeader}>
                <Icon name="info" color="#ffd900" size={14} />
                <Text style={styles.adHeaderTag}>SPONSORED BY FLIPKART</Text>
              </View>

              <View style={styles.adBanner}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill as any}>
                  <Circle cx="120" cy="60" r="60" fill="#2874f0" opacity={0.1} />
                  <Circle cx="120" cy="60" r="40" fill="#ffd900" opacity={0.1} />
                  <Path
                    d="M107 45 A15 15 0 0 1 133 45"
                    fill="none"
                    stroke="#ffd900"
                    strokeWidth="2"
                  />
                  <Rect x="100" y="45" width="40" height="50" rx="4" ry="4" fill="#2874f0" />
                </Svg>
                <View style={styles.adBannerTexts}>
                  <Text style={styles.adBannerTitle}>BIG BILLION DAYS</Text>
                  <Text style={styles.adBannerSub}>UP TO 80% OFF ON ALL CATEGORIES</Text>
                </View>
              </View>

              <Text style={styles.adMainTitle}>Flipkart Mega Deals Live!</Text>

              <Text style={styles.adDescription}>
                Get massive discounts on Smartphones, Laptops, Fashion & Home Decor. Extra 10% instant discount with HDFC, SBI and Axis Credit Cards. Limited hours remaining!
              </Text>

              <TouchableOpacity
                style={styles.adCtaBtn}
                onPress={() => showToast('Redirecting to Flipkart Special Deal store...')}
              >
                <LinearGradient
                  colors={['#2874f0', '#ffd900']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.adCtaGradient}
                >
                  <Text style={styles.adCtaBtnText}>Claim Flipkart Deals Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 1 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>ACTIVE INCOMING CALL SIMULATION ENGINE</Text>
            <View style={styles.simulatorBtnsRow}>
              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.greenSuccess }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Father Leo',
                    number: '+1 (555) 019-2831',
                    riskScore: 2,
                    type: 'Normal',
                    carrier: 'Verizon Wireless',
                    location: 'San Jose, CA',
                    frequency: '12 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Safe Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.orangeWarning }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Telemarketing Robocall',
                    number: '+1 (202) 555-0143',
                    riskScore: 85,
                    type: 'Spam',
                    carrier: 'Level 3 Telecom',
                    location: 'Seattle, WA',
                    frequency: '45 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Spam Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.redDanger }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'IRS Impostor Fraud',
                    number: '+1 (866) 492-3001',
                    riskScore: 98,
                    type: 'Scam',
                    carrier: 'VoIP Core',
                    location: 'Washington DC, USA',
                    frequency: '88 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Scam Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: '#ff1111' }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Bank Fraud Hijacker',
                    number: '+1 (800) 999-5566',
                    riskScore: 99,
                    type: 'High-Risk',
                    carrier: 'Imposter Network',
                    location: 'New York, USA',
                    frequency: '150 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>High-Risk Call</Text>
              </TouchableOpacity>
            </View>

            {/* Simulated Active Call Screen */}
            {activeSimulatedCall ? (
              <View style={[styles.callScreenCard, {
                backgroundColor: activeSimulatedCall.type === 'Spam' || activeSimulatedCall.type === 'Scam' || activeSimulatedCall.type === 'High-Risk' 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : activeSimulatedCall.type === 'Normal' 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : activeSimulatedCall.type === 'Suspicious' 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : '#0b0f19'
              }]}>
                <Icon name="phone-in-talk" color={
                  activeSimulatedCall.type === 'Spam' || activeSimulatedCall.type === 'Scam' || activeSimulatedCall.type === 'High-Risk' 
                    ? colors.redDanger 
                    : activeSimulatedCall.type === 'Normal' 
                    ? colors.greenSuccess 
                    : activeSimulatedCall.type === 'Suspicious' 
                    ? colors.orangeWarning 
                    : colors.purpleAccent
                } size={48} />
                <Text style={styles.callScreenName}>{activeSimulatedCall.name}</Text>
                <Text style={styles.callScreenNumber}>{activeSimulatedCall.number}</Text>
                <Text style={styles.callScreenCarrier}>
                  Carrier: {activeSimulatedCall.carrier} | {activeSimulatedCall.location}
                </Text>
                <Text
                  style={[
                    styles.callScreenScore,
                    {
                      color:
                        activeSimulatedCall.riskScore > 80
                          ? colors.redDanger
                          : activeSimulatedCall.riskScore > 50
                          ? colors.orangeWarning
                          : colors.greenSuccess,
                    },
                  ]}
                >
                  Risk Score: {activeSimulatedCall.riskScore}%
                </Text>

                <View style={styles.callActionsRow}>
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: 'rgba(107, 110, 133, 0.2)' }]}
                    onPress={() => {
                      showToast(`Call allowed from ${activeSimulatedCall.name}`);
                      setActiveSimulatedCall(null);
                    }}
                  >
                    <Text style={styles.callBtnText}>Allow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      setCallerToBlockOrReport(activeSimulatedCall);
                      setShowBlockConfirmation(true);
                    }}
                  >
                    <Text style={styles.callBtnText}>Block</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.cyanAccent }]}
                    onPress={() => {
                      setCallerToBlockOrReport(activeSimulatedCall);
                      setReportDesc('');
                      setShowReportPopup(true);
                    }}
                  >
                    <Text style={[styles.callBtnText, { color: '#000' }]}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.callScreenCardEmpty}>
                <Icon name="phone-in-talk" color="#6B6E85" size={48} />
                <Text style={styles.emptyCallText}>No simulated call active. Tap one of the triggers above.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={{ width: '100%' }}>
            <View style={styles.searchCard}>
              <Text style={styles.searchTitle}>Reputation Directory Search</Text>
              <Text style={styles.searchSub}>Lookup the trust index of any phone number</Text>

              <View style={styles.searchInputRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter number (e.g. +1 (800) 555-0199)"
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            {searchResult && (
              <View style={styles.searchResultCard}>
                <Text style={styles.resultTitle}>Search Result Details:</Text>
                <Text style={styles.resultName}>{searchResult.name}</Text>
                <Text style={styles.resultNumber}>{searchResult.number}</Text>
                <Text style={styles.resultSub}>Carrier: {searchResult.carrier}</Text>
                <Text style={styles.resultSub}>Location: {searchResult.location}</Text>
                <Text
                  style={[
                    styles.resultScoreText,
                    {
                      color:
                        searchResult.riskScore > 80
                          ? colors.redDanger
                          : searchResult.riskScore > 50
                          ? colors.orangeWarning
                          : colors.greenSuccess,
                    },
                  ]}
                >
                  Risk Index: {searchResult.riskScore}/100
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 3 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>CALL HISTORY LOGS</Text>
            {callHistory.length > 0 ? (
              callHistory.map((call, idx) => {
                let bgColor = 'rgba(255, 255, 255, 0.05)';
                let labelColor = colors.textMuted;
                if (call.type === 'Spam' || call.type === 'Scam' || call.type === 'High-Risk') {
                  bgColor = 'rgba(239, 68, 68, 0.2)'; // redDanger
                  labelColor = colors.redDanger;
                } else if (call.type === 'Normal') {
                  bgColor = 'rgba(16, 185, 129, 0.2)'; // greenSuccess
                  labelColor = colors.greenSuccess;
                } else if (call.type === 'Suspicious') {
                  bgColor = 'rgba(245, 158, 11, 0.2)'; // orangeWarning (yellow)
                  labelColor = colors.orangeWarning;
                }
                
                return (
                  <View key={idx} style={[styles.historyRow, { backgroundColor: bgColor }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName}>{call.name}</Text>
                      <Text style={styles.historyNumber}>{call.number}</Text>
                      <Text style={styles.historyDate}>Type: <Text style={{color: labelColor, fontWeight: 'bold'}}>{call.type}</Text> | {call.location}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.historyBtn}
                      onPress={() => {
                        setCallerToBlockOrReport(call);
                        setShowBlockConfirmation(true);
                      }}
                    >
                      <Text style={styles.historyBtnText}>Block</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.listEmptyPlaceholder}>
                <Icon name="phone" color={colors.textMuted} size={48} />
                <Text style={styles.placeholderText}>All incoming calls cleared. Secure filter active.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 4 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>SPAM CALLS LOG</Text>
            {spamCalls.map((spam, idx) => (
              <View key={idx} style={styles.blockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedName}>{spam.name}</Text>
                  <Text style={styles.blockedNumber}>{spam.number}</Text>
                  <Text style={styles.blockedDate}>Score: {spam.riskScore}% | {spam.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.unblockBtn}
                  onPress={() => {
                    addBlockedNumber(spam.number, spam.name, 'Auto-Blocked from Spam List');
                    showToast(`Blocked: ${spam.number}`);
                  }}
                >
                  <Text style={styles.unblockBtnText}>Block</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>BLOCKED TELEPHONY REGISTRY</Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.redDanger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                onPress={() => {
                  setCustomBlockNumber('');
                  setCustomBlockName('');
                  setCustomBlockReason('');
                  setShowCustomBlockModal(true);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>+ Block Number</Text>
              </TouchableOpacity>
            </View>
            {blockedNumbers.map((blocked, idx) => (
              <View key={idx} style={styles.blockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedName}>{blocked.name}</Text>
                  <Text style={styles.blockedNumber}>{blocked.number}</Text>
                  <Text style={styles.blockedDate}>Reason: {blocked.reason} | {blocked.date}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.unblockBtn, { borderColor: colors.greenSuccess }]}
                  onPress={() => {
                    removeBlockedNumber(blocked.number);
                    showToast(`Unblocked: ${blocked.number}`);
                  }}
                >
                  <Text style={[styles.unblockBtnText, { color: colors.greenSuccess }]}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 5 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>SCAM THREAT INTELLIGENCE CENTER</Text>
            <View style={styles.scamCard}>
              <Text style={styles.scamTitle}>IRS Government Impersonation</Text>
              <Text style={styles.scamDesc}>
                Scammers call claiming to be IRS agents. They state you owe back taxes and threaten arrest if not paid immediately via gift cards or wire transfers.
              </Text>
              <Text style={styles.scamAction}>Rule: The IRS will never demand immediate payment over the phone.</Text>
            </View>

            <View style={[styles.scamCard, { marginTop: 16 }]}>
              <Text style={styles.scamTitle}>Bank OTP & Credential Theft</Text>
              <Text style={styles.scamDesc}>
                Attackers impersonate bank fraud departments. They ask you to read back a verification code sent to your phone to "cancel a fraudulent charge," which they actually use to drain your account.
              </Text>
              <Text style={styles.scamAction}>Rule: Never share OTP or login codes with any caller.</Text>
            </View>
          </View>
        )}

        {activeTab === 6 && (
          <View style={{ width: '100%' }}>
            <View style={styles.settingCard}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Auto-Block High-Risk Calls</Text>
                  <Text style={styles.settingSub}>Silently terminate known fraud senders</Text>
                </View>
                <Switch value={autoBlockEnabled} onValueChange={toggleAutoBlock} trackColor={{ true: colors.purpleAccent }} />
              </View>

              <View style={[styles.switchRow, { marginTop: 20 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Spam Alert Notifications</Text>
                  <Text style={styles.settingSub}>Display floating warning banners for risk callers</Text>
                </View>
                <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: colors.purpleAccent }} />
              </View>

              <View style={styles.cardDivider} />

              <Text style={styles.settingTitle}>Filter Sensitivity: {sensitivity}%</Text>
              <Text style={styles.settingSub}>Threshold for auto-blocking based on AI Risk score</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity style={styles.sliderButton} onPress={() => setSensitivity(Math.max(10, sensitivity - 5))}>
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.sliderTrackBg}>
                  <View style={[styles.sliderTrackFill, { width: `${sensitivity}%` }]} />
                </View>
                <TouchableOpacity style={styles.sliderButton} onPress={() => setSensitivity(Math.min(100, sensitivity + 5))}>
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Privacy-Preserving Logging</Text>
                  <Text style={styles.settingSub}>Anonymize numbers before threat analysis uploads</Text>
                </View>
                <Switch value={privacyLogging} onValueChange={setPrivacyLogging} trackColor={{ true: colors.purpleAccent }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* POPUP 1: SPAM WARNING DIALOG */}
      <Modal transparent={true} visible={showSpamWarning && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.orangeWarning }]}>
            <View style={styles.popupHeader}>
              <Icon name="warning" color={colors.orangeWarning} size={36} />
              <Text style={styles.popupTitle}>SPAM CALL DETECTED</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={styles.popupSub}>Number: {activeSimulatedCall.number}</Text>
                <Text style={[styles.popupRiskText, { color: colors.redDanger }]}>
                  Risk Score: {activeSimulatedCall.riskScore}%
                </Text>
                <Text style={styles.popupDesc}>
                  This number matches active automated spam networks. We recommend blocking this caller.
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: 'rgba(107, 110, 133, 0.2)' }]}
                    onPress={() => {
                      showToast('Call allowed under observation');
                      setShowSpamWarning(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Allow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      addBlockedNumber(activeSimulatedCall.number, activeSimulatedCall.name, 'Spam Network Warning');
                      showToast('Caller Blocked');
                      setActiveSimulatedCall(null);
                      setShowSpamWarning(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 2: SCAM WARNING DIALOG */}
      <Modal transparent={true} visible={showScamAlert && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.redDanger, backgroundColor: '#2E0914' }]}>
            <View style={styles.popupHeader}>
              <Icon name="gavel" color={colors.redDanger} size={36} />
              <Text style={styles.popupTitle}>IMMEDIATE SCAM WARNING</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={[styles.popupRiskText, { color: colors.redDanger, fontWeight: '900' }]}>
                  Threat Level: CRITICAL RISK
                </Text>
                <Text style={styles.popupSub}>Caller: {activeSimulatedCall.name}</Text>
                <Text style={styles.popupSub}>Number: {activeSimulatedCall.number}</Text>
                <Text style={styles.popupDesc}>
                  Recommended Action: HANG UP IMMEDIATELY. This caller has been reported trying to spoof government bodies for credential fraud.
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowScamAlert(false)}>
                    <Text style={styles.popupTextBtnText}>Dismiss Alert</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      addBlockedNumber(activeSimulatedCall.number, activeSimulatedCall.name, 'Scam Warning Block');
                      showToast('Scam Number Terminated & Blocked');
                      setActiveSimulatedCall(null);
                      setShowScamAlert(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Block & Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 3: HIGH-RISK CALLER DIALOG */}
      <Modal transparent={true} visible={showHighRiskAlert && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#ff1111', backgroundColor: '#2e0000' }]}>
            <View style={styles.popupHeader}>
              <Icon name="cancel" color="#ff1111" size={44} />
              <Text style={styles.popupTitle}>CRITICAL: HIGH RISK ATTACK</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={[styles.popupRiskText, { color: '#ff1111', fontWeight: '900' }]}>
                  Risk Evaluation Score: {activeSimulatedCall.riskScore}%
                </Text>
                <Text style={styles.popupDesc}>
                  This caller is linked to known financial phishing campaigns. The connection is highly suspicious.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#ff1111', height: 46 }]}
                  onPress={() => {
                    addBlockedNumber(activeSimulatedCall.number, activeSimulatedCall.name, 'Critical AI High-Risk Auto-Block');
                    showToast('Immediate Block Executed');
                    setActiveSimulatedCall(null);
                    setShowHighRiskAlert(false);
                  }}
                >
                  <Text style={styles.primaryBtnText}>IMMEDIATE BLOCK SENDER</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.popupTextBtn, { marginTop: 12 }]} onPress={() => setShowHighRiskAlert(false)}>
                  <Text style={styles.popupTextBtnText}>Ignore Risk (Dangerous)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 4: BLOCK CONFIRMATION */}
      <Modal transparent={true} visible={showBlockConfirmation && callerToBlockOrReport !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.popupTitle}>Confirm Block Caller</Text>
            {callerToBlockOrReport && (
              <>
                <Text style={styles.popupDesc}>
                  Are you sure you want to block calls and texts from {callerToBlockOrReport.name} ({callerToBlockOrReport.number})?
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowBlockConfirmation(false)}>
                    <Text style={styles.popupTextBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      addBlockedNumber(callerToBlockOrReport.number, callerToBlockOrReport.name, 'User Block');
                      showToast('Caller Blocked');
                      setActiveSimulatedCall(null);
                      setShowBlockConfirmation(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Confirm Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 5: REPORT SENDER FORM */}
      <Modal transparent={true} visible={showReportPopup && callerToBlockOrReport !== null} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.cyanAccent }]}>
            <Text style={styles.popupTitle}>Report Caller to Threat Database</Text>
            {callerToBlockOrReport && (
              <>
                <Text style={styles.reportFormLabel}>Report Type:</Text>
                {['Robocall / Telemarketing', 'Phishing / Identity Theft', 'Government Impersonation', 'Harassment'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioRow}
                    onPress={() => setReportType(type)}
                  >
                    <View style={styles.radioOuter}>
                      {reportType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}

                <TextInput
                  style={styles.reportInput}
                  placeholder="Incident Description (Optional)"
                  placeholderTextColor={colors.textMuted}
                  value={reportDesc}
                  onChangeText={setReportDesc}
                  multiline={true}
                />

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowReportPopup(false)}>
                    <Text style={styles.popupTextBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.cyanAccent }]}
                    onPress={() => {
                      reportCall(callerToBlockOrReport.number, reportType, reportDesc || 'No description provided.');
                      showToast('Report Submitted. Thank you for securing the network!');
                      setShowReportPopup(false);
                    }}
                  >
                    <Text style={[styles.popupBtnText, { color: '#000' }]}>Submit Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 6: MANUAL BLOCK NUMBER MODAL */}
      <Modal transparent={true} visible={showCustomBlockModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.redDanger }]}>
            <Text style={styles.popupTitle}>Block Phone Number</Text>
            <Text style={styles.popupDesc}>Enter a phone number to blacklist in the cloud database.</Text>

            <TextInput
              style={[styles.reportInput, { height: 44, marginBottom: 10 }]}
              placeholder="Phone Number (e.g. +1 555-0199)"
              placeholderTextColor={colors.textMuted}
              value={customBlockNumber}
              onChangeText={setCustomBlockNumber}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.reportInput, { height: 44, marginBottom: 10 }]}
              placeholder="Caller Name (e.g. Loan Telemarketer)"
              placeholderTextColor={colors.textMuted}
              value={customBlockName}
              onChangeText={setCustomBlockName}
            />

            <TextInput
              style={[styles.reportInput, { height: 44, marginBottom: 16 }]}
              placeholder="Block Reason (e.g. Unwanted spam calls)"
              placeholderTextColor={colors.textMuted}
              value={customBlockReason}
              onChangeText={setCustomBlockReason}
            />

            <View style={styles.popupActions}>
              <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowCustomBlockModal(false)}>
                <Text style={styles.popupTextBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                onPress={() => {
                  if (!customBlockNumber.trim()) {
                    showToast('Please enter a valid phone number');
                    return;
                  }
                  addBlockedNumber(
                    customBlockNumber.trim(),
                    customBlockName.trim() || 'Blocked Number',
                    customBlockReason.trim() || 'Manual Block from UI'
                  );
                  showToast(`Blocked ${customBlockNumber.trim()} in DB!`);
                  setShowCustomBlockModal(false);
                }}
              >
                <Text style={styles.popupBtnText}>Block & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F0A2B',
    borderWidth: 1,
    borderColor: '#337b2cbf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 2,
  },
  tabsRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  tabsRow: {
    paddingHorizontal: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#07051F',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.12)',
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 119, 182, 0.2)',
    borderColor: '#00E5FF',
  },
  tabBtnText: {
    fontSize: 11,
    color: '#6B6E85',
  },
  tabBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  viewContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dashboardCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugePct: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  gaugeLabel: {
    color: '#6B6E85',
    fontSize: 8,
  },
  gaugeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gaugeInfoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  gaugeInfoSub: {
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  greenStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  statusText: {
    color: '#00E676',
    fontSize: 10,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  statWidget: {
    flex: 0.31,
    borderRadius: 10,
    backgroundColor: '#0A0726',
    borderWidth: 0.5,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 12,
  },
  statWidgetLabel: {
    color: '#6B6E85',
    fontSize: 10,
  },
  statWidgetValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B6E85',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0F0923',
    borderWidth: 0.5,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 12,
    width: '100%',
    marginBottom: 8,
  },
  alertText: {
    color: colors.text,
    fontSize: 11,
    marginLeft: 10,
    flex: 1,
  },
  actionWidget: {
    flex: 0.48,
    borderRadius: 10,
    backgroundColor: '#0A0726',
    padding: 14,
  },
  actionWidgetTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionWidgetSub: {
    color: '#6B6E85',
    fontSize: 9,
    marginTop: 2,
  },
  simulatorBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  simBtn: {
    width: '48%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  simBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  callScreenCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.22)',
    padding: 24,
    alignItems: 'center',
  },
  callScreenCardEmpty: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCallText: {
    color: '#6B6E85',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  callScreenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  callScreenNumber: {
    fontSize: 14,
    color: '#6B6E85',
    marginTop: 4,
  },
  callScreenCarrier: {
    fontSize: 12,
    color: '#6B6E85',
    marginTop: 2,
  },
  callScreenScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  callActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  callBtn: {
    flex: 0.31,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  searchTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  searchSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  searchInputRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchBtn: {
    width: 70,
    height: 44,
    backgroundColor: colors.cyanAccent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchResultCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#07051f',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  resultName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultNumber: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  resultScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  listEmptyPlaceholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  historyName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  historyDate: {
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 4,
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  historyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  blockedName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  blockedNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  blockedDate: {
    color: '#6B6E85',
    fontSize: 10,
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.redDanger,
  },
  unblockBtnText: {
    color: colors.redDanger,
    fontSize: 11,
    fontWeight: 'bold',
  },
  scamCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  scamTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  scamDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  scamAction: {
    color: colors.orangeWarning,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 8,
  },
  settingCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  settingTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  settingSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderTrackBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: colors.purpleAccent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    backgroundColor: '#0F0A2B',
    borderWidth: 1,
    padding: 20,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  popupSub: {
    color: '#6B6E85',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  popupRiskText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  popupDesc: {
    color: '#9A8C98',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 16,
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  popupBtn: {
    flex: 0.48,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  popupTextBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 0.48,
  },
  popupTextBtnText: {
    color: '#6B6E85',
    fontSize: 12,
  },
  reportFormLabel: {
    color: '#6B6E85',
    fontSize: 11,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.cyanAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyanAccent,
  },
  radioLabel: {
    color: colors.text,
    fontSize: 13,
  },
  reportInput: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginTop: 16,
    textAlignVertical: 'top',
  },
  resultTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultSub: {
    color: '#6B6E85',
    fontSize: 12,
    marginTop: 4,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  adHeaderTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffd900',
    letterSpacing: 1,
    marginLeft: 6,
  },
  adBanner: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#050B24',
    borderWidth: 0.5,
    borderColor: '#2874f033',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  adBannerTexts: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  adBannerTitle: {
    color: '#ffd900',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  adBannerSub: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '500',
  },
  adMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 11,
    color: '#9a8c98',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  adCtaBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  adCtaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adCtaBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  adSkipBtn: {
    paddingVertical: 4,
  },
  adSkipBtnText: {
    fontSize: 11,
    color: '#6b6e85',
  },
});
