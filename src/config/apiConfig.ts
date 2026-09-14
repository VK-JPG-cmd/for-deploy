import { Platform } from 'react-native';

/**
 * Central API Configuration for Parent Control Backend
 * - Dynamically extracts Host LAN IP from Expo environment when running on physical devices
 * - Android Emulator uses 10.0.2.2 to reach host machine localhost
 * - Web / Desktop uses 127.0.0.1 or localhost
 * - Port 8000 is the running FastAPI server
 */
const getHostFromExpo = (): string | null => {
  try {
    const g = globalThis as any;
    const constants = g?.expo?.modules?.ExponentConstants || g?.NativeModules?.ExponentConstants;
    const hostUri = constants?.debuggerHost || constants?.manifest?.debuggerHost || constants?.manifest2?.extra?.expoGo?.developer?.tool;
    if (hostUri) {
      const ip = String(hostUri).split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {}
  return null;
};


const expoIp = getHostFromExpo();
export const DEFAULT_HOST = expoIp || '127.0.0.1';
const CANDIDATE_HOSTS = [DEFAULT_HOST, '127.0.0.1', '10.201.126.62', '10.0.2.2'];
const DEFAULT_PORT = '5000';

let customBaseUrl: string | null = null;
let resolvedWorkingBaseUrl: string = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

export const getUnifiedBaseUrl = (): string => {
  if (customBaseUrl) {
    return customBaseUrl;
  }
  return resolvedWorkingBaseUrl;
};

export const getFallbackUrls = (): string[] => {
  return CANDIDATE_HOSTS.map(h => `http://${h}:${DEFAULT_PORT}`);
};

export const setResolvedHost = (url: string) => {
  resolvedWorkingBaseUrl = url.replace(/\/+$/, '');
};

export const getParentalBaseUrl = (): string => {
  return getUnifiedBaseUrl();
};

export const getApiBaseUrl = (): string => {
  return getUnifiedBaseUrl();
};

export const getMalwareBaseUrl = (): string => {
  return getUnifiedBaseUrl();
};

export const getAuthBaseUrl = (): string => {
  return getUnifiedBaseUrl();
};

export const getGeoBaseUrl = (): string => {
  return `${getUnifiedBaseUrl()}/api/v1/geolocation`;
};

export const getVulnBaseUrl = (): string => {
  return `${getUnifiedBaseUrl()}/api`;
};

export const getCallerBaseUrl = (): string => {
  return getUnifiedBaseUrl();
};

export const setApiBaseUrl = (url: string) => {
  customBaseUrl = url.trim().replace(/\/+$/, '');
};

export const API_BASE_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
