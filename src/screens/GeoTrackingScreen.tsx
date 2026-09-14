import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

import { GeolocationRepository } from '../data/repository';

interface GeoRequest {
  ip: string;
  threatLevel: 'Safe' | 'Suspicious' | 'High Risk';
  country: string;
  city: string;
  isp: string;
  latency: string;
  timeAgo: string;
  timeCategory: '1H' | '24H' | '7D';
  xPercent: number; // 0.0 to 1.0 (X coordinate on map)
  yPercent: number; // 0.0 to 1.0 (Y coordinate on map)
  latitude: string;
  longitude: string;
}

interface GeoTrackingScreenProps {
  onBack: () => void;
}

const allRequests: GeoRequest[] = [
  { ip: '104.244.42.1', threatLevel: 'Safe', country: 'United States', city: 'San Francisco', isp: 'Twitter Inc.', latency: '35ms', timeAgo: '5m ago', timeCategory: '1H', xPercent: 0.20, yPercent: 0.35, latitude: '37.7749° N', longitude: '122.4194° W' },
  { ip: '185.190.140.12', threatLevel: 'High Risk', country: 'Netherlands', city: 'Amsterdam', isp: 'Creanova Hosting', latency: '180ms', timeAgo: '12m ago', timeCategory: '1H', xPercent: 0.48, yPercent: 0.28, latitude: '52.3676° N', longitude: '4.9041° E' },
  { ip: '13.107.4.50', threatLevel: 'Safe', country: 'Japan', city: 'Tokyo', isp: 'Microsoft Corp', latency: '85ms', timeAgo: '42m ago', timeCategory: '1H', xPercent: 0.82, yPercent: 0.38, latitude: '35.6762° N', longitude: '139.6503° E' },
  { ip: '43.205.12.89', threatLevel: 'Suspicious', country: 'India', city: 'Mumbai', isp: 'Amazon Data Services', latency: '120ms', timeAgo: '3h ago', timeCategory: '24H', xPercent: 0.70, yPercent: 0.52, latitude: '19.0760° N', longitude: '72.8777° E' },
  { ip: '185.220.101.5', threatLevel: 'High Risk', country: 'Germany', city: 'Frankfurt', isp: 'Tor Exit Node', latency: '210ms', timeAgo: '6h ago', timeCategory: '24H', xPercent: 0.50, yPercent: 0.32, latitude: '50.1109° N', longitude: '8.6821° E' },
  { ip: '210.140.10.3', threatLevel: 'Safe', country: 'Japan', city: 'Osaka', isp: 'NTT Communications', latency: '98ms', timeAgo: '18h ago', timeCategory: '24H', xPercent: 0.84, yPercent: 0.42, latitude: '34.6937° N', longitude: '135.5023° E' },
  { ip: '103.21.244.0', threatLevel: 'Safe', country: 'Singapore', city: 'Singapore', isp: 'Cloudflare Inc.', latency: '62ms', timeAgo: '2d ago', timeCategory: '7D', xPercent: 0.78, yPercent: 0.58, latitude: '1.3521° N', longitude: '103.8198° E' },
  { ip: '91.198.174.192', threatLevel: 'Safe', country: 'France', city: 'Paris', isp: 'Wikimedia Foundation', latency: '110ms', timeAgo: '4d ago', timeCategory: '7D', xPercent: 0.46, yPercent: 0.33, latitude: '48.8566° N', longitude: '2.3522° E' },
  { ip: '109.201.154.22', threatLevel: 'Suspicious', country: 'Russia', city: 'Moscow', isp: 'Rostelecom PJSC', latency: '195ms', timeAgo: '6d ago', timeCategory: '7D', xPercent: 0.56, yPercent: 0.26, latitude: '55.7558° N', longitude: '37.6173° E' }
];

interface NearbyPlace {
  name: string;
  distance: string;
}

const mapBackendRecordToGeoRequest = (rec: any): GeoRequest => {
  const lat = typeof rec.latitude === 'number' ? rec.latitude : parseFloat(rec.latitude) || 0;
  const lon = typeof rec.longitude === 'number' ? rec.longitude : parseFloat(rec.longitude) || 0;

  const xPercent = Math.max(0.08, Math.min(0.92, (lon + 180) / 360));
  const yPercent = Math.max(0.1, Math.min(0.9, (90 - lat) / 180));

  let threatLevel: 'Safe' | 'Suspicious' | 'High Risk' = 'Safe';
  if (rec.is_spoofed && (rec.spoof_confidence === 'high' || rec.is_mock_location)) {
    threatLevel = 'High Risk';
  } else if (rec.is_spoofed || rec.spoof_confidence === 'medium') {
    threatLevel = 'Suspicious';
  }

  return {
    ip: rec.ip || `192.168.1.${Math.abs(Math.floor(lat * 10)) % 254 + 1}`,
    threatLevel,
    country: rec.country || 'Detected Region',
    city: rec.city || 'Live GPS Node',
    isp: rec.provider || rec.isp || 'Mobile Cellular / GPS',
    latency: `${Math.floor(Math.random() * 40) + 20}ms`,
    timeAgo: rec.timestamp ? 'Live' : '5m ago',
    timeCategory: '1H',
    xPercent,
    yPercent,
    latitude: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`,
    longitude: `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`,
  };
};

const getNearbyPlaces = (ip: string): NearbyPlace[] => {
  if (ip.startsWith('185.')) {
    return [
      { name: 'Amsterdam AMS-IX Node', distance: '1.2 km' },
      { name: 'Equinix AM3 Data Center', distance: '3.4 km' },
      { name: 'Leaseweb Gateway Node B', distance: '5.1 km' }
    ];
  } else if (ip.startsWith('104.')) {
    return [
      { name: 'San Francisco SF-MIX Exchange', distance: '0.8 km' },
      { name: 'Digital Realty SF Data Center', distance: '2.1 km' },
      { name: 'Cloudflare SF Edge Server 12', distance: '4.3 km' }
    ];
  } else if (ip.startsWith('43.')) {
    return [
      { name: 'Mumbai GPX Data Center', distance: '1.9 km' },
      { name: 'Nxtra Airtel Exchange Mumbai', distance: '3.0 km' },
      { name: 'AWS Mumbai Edge Region', distance: '6.2 km' }
    ];
  } else {
    return [
      { name: 'Carrier Telecom Exchange Node', distance: '2.5 km' },
      { name: 'Central ISP Gateway Routing', distance: '4.8 km' },
      { name: 'Local Edge DNS Cache', distance: '7.1 km' }
    ];
  }
};

export const GeoTrackingScreen: React.FC<GeoTrackingScreenProps> = ({ onBack }) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [requestsList, setRequestsList] = useState<GeoRequest[]>(allRequests);
  const [selectedFilter, setSelectedFilter] = useState<'All' | '1H' | '24H' | '7D'>('All');
  const [selectedRequest, setSelectedRequest] = useState<GeoRequest | null>(allRequests[1]); // Default to Amsterdam
  const [dynamicNearbyPlaces, setDynamicNearbyPlaces] = useState<NearbyPlace[]>([]);

  // Fetch live backend geolocation data
  useEffect(() => {
    let isMounted = true;
    const fetchGeoData = async () => {
      try {
        const [liveRes, historyRes] = await Promise.allSettled([
          GeolocationRepository.getCurrentLocation(),
          GeolocationRepository.getLocationHistory(),
        ]);

        const fetchedRequests: GeoRequest[] = [];

        if (liveRes.status === 'fulfilled' && liveRes.value?.data) {
          fetchedRequests.push(mapBackendRecordToGeoRequest(liveRes.value.data));
        }

        if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value) && historyRes.value.length > 0) {
          historyRes.value.forEach((item: any) => {
            fetchedRequests.push(mapBackendRecordToGeoRequest(item));
          });
        }

        if (isMounted && fetchedRequests.length > 0) {
          const combined = [...fetchedRequests, ...allRequests];
          setRequestsList(combined);
          setSelectedRequest(combined[0]);
        }
      } catch (err) {
        console.log('Using default geolocation data:', err);
      }
    };

    fetchGeoData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch nearby places dynamically for the selected request
  useEffect(() => {
    let isMounted = true;
    if (!selectedRequest) return;

    const lat = parseFloat(selectedRequest.latitude);
    const lon = parseFloat(selectedRequest.longitude);

    if (!isNaN(lat) && !isNaN(lon)) {
      GeolocationRepository.getNearbyPlaces({ latitude: lat, longitude: lon, radius_km: 10 })
        .then((places) => {
          if (isMounted && Array.isArray(places) && places.length > 0) {
            setDynamicNearbyPlaces(
              places.map((p: any) => ({
                name: p.place_name || p.name || 'Local Network Node',
                distance: `${p.distance_km || p.distance || 1.5} km`,
              }))
            );
          } else if (isMounted) {
            setDynamicNearbyPlaces(getNearbyPlaces(selectedRequest.ip));
          }
        })
        .catch(() => {
          if (isMounted) {
            setDynamicNearbyPlaces(getNearbyPlaces(selectedRequest.ip));
          }
        });
    } else {
      setDynamicNearbyPlaces(getNearbyPlaces(selectedRequest.ip));
    }

    return () => {
      isMounted = false;
    };
  }, [selectedRequest]);

  // Radar rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for markers
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Start radar rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Start marker pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [1, 2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0.8, 0],
  });

  const filteredRequests = requestsList.filter(req => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === '1H') return req.timeCategory === '1H';
    if (selectedFilter === '24H') return req.timeCategory === '1H' || req.timeCategory === '24H';
    if (selectedFilter === '7D') return true;
    return true;
  });

  const renderContinentDot = (cx: number, cy: number, seed: number) => {
    // Renders a cluster of small dots to resemble a continent
    const dots = [];
    const random = (s: number) => {
      const x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };
    
    let s = seed;
    for (let i = 0; i < 15; i++) {
      const dx = (random(s++) - 0.5) * 35;
      const dy = (random(s++) - 0.5) * 25;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 25) {
        dots.push(
          <Circle
            key={i}
            cx={cx + dx}
            cy={cy + dy}
            r={random(s++) * 2 + 1}
            fill={colors.cyanAccent}
            opacity={0.12}
          />
        );
      }
    }
    return dots;
  };

  const mapWidth = 320;
  const mapHeight = 220;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.contentWrapper}>

      {/* 1. TOP HEADER APP BAR WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" color={colors.text} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>API Geolocation Tracker</Text>
          <Text style={styles.headerSubtitle}>Live threat request map overview</Text>
        </View>
      </View>

      {/* 2. TIME RANGE FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {(['1H', '24H', '7D', 'All'] as const).map(filter => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => {
                setSelectedFilter(filter);
                // Select first matching request if current is not in the filtered list
                const matching = allRequests.filter(req => {
                  if (filter === 'All') return true;
                  if (filter === '1H') return req.timeCategory === '1H';
                  if (filter === '24H') return req.timeCategory === '1H' || req.timeCategory === '24H';
                  if (filter === '7D') return true;
                  return true;
                });
                if (matching.length > 0) {
                  setSelectedRequest(matching[0]);
                }
              }}
            >
              <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. INTERACTIVE MAP BOX */}
      <View style={styles.mapContainer}>
        {/* Latitude/Longitude Grid Lines */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {/* Horizonal Lines */}
          {[1, 2, 3, 4, 5].map(i => (
            <Line
              key={`h-${i}`}
              x1="0"
              y1={(mapHeight / 6) * i}
              x2="100%"
              y2={(mapHeight / 6) * i}
              stroke={colors.border}
              strokeWidth="0.8"
              opacity={0.3}
            />
          ))}
          {/* Vertical Lines */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <Line
              key={`v-${i}`}
              x1={(mapWidth / 10) * i}
              y1="0"
              x2={(mapWidth / 10) * i}
              y2="100%"
              stroke={colors.border}
              strokeWidth="0.8"
              opacity={0.3}
            />
          ))}

          {/* Continents Silhouettes */}
          {renderContinentDot(mapWidth * 0.2, mapHeight * 0.35, 10)}
          {renderContinentDot(mapWidth * 0.3, mapHeight * 0.68, 20)}
          {renderContinentDot(mapWidth * 0.5, mapHeight * 0.38, 30)}
          {renderContinentDot(mapWidth * 0.52, mapHeight * 0.65, 40)}
          {renderContinentDot(mapWidth * 0.75, mapHeight * 0.38, 50)}
          {renderContinentDot(mapWidth * 0.85, mapHeight * 0.72, 60)}
        </Svg>

        {/* Rotating Radar Sweep */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ rotate: spin }],
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%">
            <Line
              x1={mapWidth / 2}
              y1={mapHeight / 2}
              x2={mapWidth / 2}
              y2={0}
              stroke={colors.purpleAccent}
              strokeWidth="2"
              opacity={0.5}
            />
          </Svg>
        </Animated.View>

        {/* Request Markers */}
        {filteredRequests.map((req) => {
          const isSelected = selectedRequest?.ip === req.ip;
          const markerColor =
            req.threatLevel === 'High Risk'
              ? colors.redDanger
              : req.threatLevel === 'Suspicious'
              ? colors.orangeWarning
              : colors.greenSuccess;

          return (
            <TouchableOpacity
              key={req.ip}
              style={[
                styles.markerContainer,
                {
                  left: req.xPercent * mapWidth - 15,
                  top: req.yPercent * mapHeight - 15,
                },
              ]}
              onPress={() => setSelectedRequest(req)}
            >
              <View style={styles.markerAnchor}>
                {/* Pulsing Outer Ring */}
                <Animated.View
                  style={[
                    styles.pulsingRing,
                    {
                      borderColor: markerColor,
                      transform: [{ scale: isSelected ? pulseScale : 1.2 }],
                      opacity: isSelected ? pulseOpacity : 0.3,
                    },
                  ]}
                />
                {/* Core Center Dot */}
                <View
                  style={[
                    styles.markerDot,
                    { backgroundColor: markerColor },
                    isSelected && styles.markerDotSelected,
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.liveTrackingText}>Live Tracking: ACTIVE</Text>
        <Text style={styles.gridCoordsText}>GRID: 104°W / 45°N</Text>
      </View>

      {/* 4. IP DETAILS PANEL */}
      {selectedRequest && (
        <View
          style={[
            styles.detailsCard,
            selectedRequest.threatLevel === 'High Risk' && { borderColor: colors.redDanger + '55' },
          ]}
        >
          <View style={styles.detailsHeader}>
            <View style={styles.ipRow}>
              <Icon name="dns" color={colors.cyanAccent} size={18} />
              <Text style={styles.ipText}>{selectedRequest.ip}</Text>
            </View>

            {/* Threat Level Badge */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    selectedRequest.threatLevel === 'High Risk'
                      ? colors.redDanger + '26'
                      : selectedRequest.threatLevel === 'Suspicious'
                      ? colors.orangeWarning + '26'
                      : colors.greenSuccess + '26',
                  borderColor:
                    selectedRequest.threatLevel === 'High Risk'
                      ? colors.redDanger
                      : selectedRequest.threatLevel === 'Suspicious'
                      ? colors.orangeWarning
                      : colors.greenSuccess,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      selectedRequest.threatLevel === 'High Risk'
                        ? colors.redDanger
                        : selectedRequest.threatLevel === 'Suspicious'
                        ? colors.orangeWarning
                        : colors.greenSuccess,
                  },
                ]}
              >
                {selectedRequest.threatLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.detailsGrid}>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>LOCATION</Text>
              <View style={styles.locationRow}>
                <Icon name="globe" color={colors.textMuted} size={13} />
                <Text style={styles.detailsValue}>
                  {selectedRequest.city}, {selectedRequest.country}
                </Text>
              </View>
            </View>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>ORGANIZATION</Text>
              <Text style={styles.detailsValue} numberOfLines={1}>
                {selectedRequest.isp}
              </Text>
            </View>
          </View>

          <View style={[styles.detailsGrid, { marginTop: 12 }]}>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>LATENCY</Text>
              <View style={styles.latencyRow}>
                <Icon name="speed" color={colors.greenSuccess} size={13} />
                <Text style={styles.detailsValue}>{selectedRequest.latency}</Text>
              </View>
            </View>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>TIME DETECTED</Text>
              <View style={styles.timeRow}>
                <Icon name="clock" color={colors.textMuted} size={13} />
                <Text style={styles.detailsValue}>{selectedRequest.timeAgo}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.detailsGrid, { marginTop: 12 }]}>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>LATITUDE</Text>
              <View style={styles.locationRow}>
                <Icon name="location-on" color={colors.purpleAccent} size={13} />
                <Text style={styles.detailsValue}>{selectedRequest.latitude}</Text>
              </View>
            </View>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>LONGITUDE</Text>
              <View style={styles.locationRow}>
                <Icon name="location-on" color={colors.purpleAccent} size={13} />
                <Text style={styles.detailsValue}>{selectedRequest.longitude}</Text>
              </View>
            </View>
          </View>

          {/* Nearby Network Places List */}
          <View style={styles.cardDivider} />
          <Text style={styles.detailsLabel}>NEARBY NETWORK PLACES</Text>
          <View style={styles.nearbyContainer}>
            {(dynamicNearbyPlaces.length > 0 ? dynamicNearbyPlaces : getNearbyPlaces(selectedRequest.ip)).map((place, idx) => (
              <View key={idx} style={styles.nearbyPlaceRow}>
                <View style={styles.nearbyPlaceLeft}>
                  <Icon name="location-on" color={colors.purpleAccent} size={14} />
                  <Text style={styles.nearbyPlaceName}>{place.name}</Text>
                </View>
                <Text style={styles.nearbyPlaceDistance}>{place.distance}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 5. API REQUESTS SCROLLING LIST */}
      <Text style={styles.listTitle}>Filtered API Logs ({filteredRequests.length})</Text>

      <FlatList
        data={filteredRequests}
        keyExtractor={item => item.ip}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedRequest?.ip === item.ip;
          const alertColor =
            item.threatLevel === 'High Risk'
              ? colors.redDanger
              : item.threatLevel === 'Suspicious'
              ? colors.orangeWarning
              : colors.greenSuccess;

          return (
            <TouchableOpacity
              style={[
                styles.logItem,
                isSelected ? styles.logItemActive : styles.logItemInactive,
              ]}
              onPress={() => setSelectedRequest(item)}
            >
              <View style={[styles.logIndicator, { backgroundColor: alertColor }]} />
              <View style={styles.logTexts}>
                <Text style={styles.logIp}>{item.ip}</Text>
                <Text style={styles.logSub}>
                  {item.city}, {item.country}
                </Text>
              </View>
              <View style={styles.logRightCol}>
                <Text style={styles.logTime}>{item.timeAgo}</Text>
                <Text style={styles.logLatency}>{item.latency}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 0.23,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.purpleAccent,
    borderColor: 'transparent',
  },
  filterBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  mapContainer: {
    width: 320,
    height: 220,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  markerContainer: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerAnchor: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  markerDotSelected: {
    borderWidth: 1.5,
    borderColor: colors.text,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  liveTrackingText: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.greenSuccess,
    opacity: 0.8,
  },
  gridCoordsText: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    fontSize: 9,
    color: colors.textMuted,
    opacity: 0.6,
  },
  detailsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 24,
    marginVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    flex: 1,
  },
  detailsLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  listTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 24,
    marginTop: 18,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  logItemActive: {
    backgroundColor: colors.cardBackground + '80',
    borderColor: colors.purpleAccent,
  },
  logItemInactive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
  },
  logIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logTexts: {
    flex: 1,
    marginLeft: 12,
  },
  logIp: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  logSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  logRightCol: {
    alignItems: 'flex-end',
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 10,
  },
  logLatency: {
    color: colors.greenSuccess,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  nearbyContainer: {
    marginTop: 6,
  },
  nearbyPlaceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  nearbyPlaceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyPlaceName: {
    color: colors.text,
    fontSize: 12,
    marginLeft: 6,
  },
  nearbyPlaceDistance: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
