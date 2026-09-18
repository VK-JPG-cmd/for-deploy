import { useState, useEffect, useCallback } from 'react';
import { getCallerBaseUrl } from '../config/apiConfig';
import { Storage } from '../utils/storage';

export interface BlockedNumber {
  number: string;
  name: string;
  reason: string;
  date: string;
}

export interface SpamCall {
  name: string;
  number: string;
  riskScore: number;
  date: string;
}

export interface CallReport {
  id: string;
  number: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface MockCall {
  name: string;
  number: string;
  riskScore: number;
  type: 'Normal' | 'Spam' | 'Scam' | 'High-Risk' | 'Suspicious';
  carrier: string;
  location: string;
  frequency: string;
}

const defaultBlockedNumbers: BlockedNumber[] = [];
const defaultSpamCalls: SpamCall[] = [];
const defaultCallHistory: MockCall[] = [];

export function useCallerIntelligence(childId: string = '1') {
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([]);
  const [spamCalls, setSpamCalls] = useState<SpamCall[]>([]);
  const [reportHistory, setReportHistory] = useState<CallReport[]>([]);
  const [callHistory, setCallHistory] = useState<MockCall[]>([]);
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const fetchFromBackendDB = useCallback(async () => {
    try {
      const baseUrl = getCallerBaseUrl();
      const [intelRes, callsRes, spamRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/caller-intel/${childId}`),
        fetch(`${baseUrl}/api/calls`),
        fetch(`${baseUrl}/api/spam-log`)
      ]);

      if (intelRes.status === 'fulfilled' && intelRes.value.ok) {
        const data = await intelRes.value.json();
        if (Array.isArray(data.blockedNumbers) && data.blockedNumbers.length > 0) {
          setBlockedNumbers(data.blockedNumbers);
        }
        if (Array.isArray(data.reportHistory) && data.reportHistory.length > 0) {
          setReportHistory(data.reportHistory);
        }
        if (typeof data.autoBlockEnabled === 'boolean') {
          setAutoBlockEnabled(data.autoBlockEnabled);
        }
        if (typeof data.notificationsEnabled === 'boolean') {
          setNotificationsEnabled(data.notificationsEnabled);
        }
      }

      if (callsRes.status === 'fulfilled' && callsRes.value.ok) {
        const callsData = await callsRes.value.json();
        if (Array.isArray(callsData) && callsData.length > 0) {
          const mappedCalls: MockCall[] = callsData.map((c: any) => ({
            name: c.caller_name || 'Unknown Caller',
            number: c.caller_number || '',
            riskScore: c.risk_score || 0,
            type: c.risk_score >= 80 ? 'Spam' : (c.risk_score > 40 ? 'Suspicious' : 'Normal'),
            carrier: 'Cellular Network',
            location: 'India',
            frequency: 'Recent Call',
          }));
          setCallHistory(mappedCalls);
        }
      }

      if (spamRes.status === 'fulfilled' && spamRes.value.ok) {
        const spamData = await spamRes.value.json();
        if (Array.isArray(spamData) && spamData.length > 0) {
          const mappedSpam: SpamCall[] = spamData.map((s: any) => ({
            name: s.caller_name || 'Reported Spam',
            number: s.phone_number || '',
            riskScore: s.risk_score || 85,
            date: s.reported_at ? new Date(s.reported_at).toLocaleString() : 'Recent',
          }));
          setSpamCalls(mappedSpam);
        }
      }
      return;
    } catch (e) {
      console.warn('Caller Intel backend fetch failed, using local storage fallback:', e);
    }

    try {
      const data = await Storage.getCallerIntel();
      if (data) {
        if (Array.isArray(data.blockedNumbers)) setBlockedNumbers(data.blockedNumbers);
        if (Array.isArray(data.spamCalls)) setSpamCalls(data.spamCalls);
        if (Array.isArray(data.reportHistory)) setReportHistory(data.reportHistory);
        if (Array.isArray(data.callHistory)) setCallHistory(data.callHistory);
        if (typeof data.autoBlockEnabled === 'boolean') setAutoBlockEnabled(data.autoBlockEnabled);
        if (typeof data.notificationsEnabled === 'boolean') setNotificationsEnabled(data.notificationsEnabled);
      }
    } catch {}
  }, [childId]);

  const saveToStorage = useCallback(async (updated: any) => {
    try {
      await Storage.setCallerIntel(updated);
    } catch (err) {
      console.error('Error saving caller intelligence to storage:', err);
    }
  }, []);

  useEffect(() => {
    fetchFromBackendDB();
  }, [fetchFromBackendDB]);

  const addBlockedNumber = useCallback(async (number: string, name: string, reason: string) => {
    const newEntry: BlockedNumber = {
      number,
      name: name || 'Spam Number',
      reason: reason || 'User Blocked',
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newEntry, ...blockedNumbers];
    setBlockedNumbers(updated);
    saveToStorage({ blockedNumbers: updated, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/blocked-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, name, reason }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend add blocked number error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled, saveToStorage, childId, fetchFromBackendDB]);

  const removeBlockedNumber = useCallback(async (number: string) => {
    const updated = blockedNumbers.filter(b => b.number !== number);
    setBlockedNumbers(updated);
    saveToStorage({ blockedNumbers: updated, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/blocked-numbers/${encodeURIComponent(number)}`, {
        method: 'DELETE',
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend delete blocked number error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled, saveToStorage, childId, fetchFromBackendDB]);

  const reportCall = useCallback(async (number: string, type: string, description: string) => {
    const newReport: CallReport = {
      id: String(Date.now()),
      number,
      type,
      description,
      timestamp: new Date().toLocaleString(),
    };
    const updatedReports = [newReport, ...reportHistory];
    setReportHistory(updatedReports);
    saveToStorage({ blockedNumbers, spamCalls, reportHistory: updatedReports, callHistory, autoBlockEnabled, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/report-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, type, description }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend report call error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled, saveToStorage, childId, fetchFromBackendDB]);

  const toggleAutoBlock = useCallback(async (val: boolean) => {
    setAutoBlockEnabled(val);
    saveToStorage({ blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled: val, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_block_enabled: val }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend toggle auto block error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, notificationsEnabled, saveToStorage, childId, fetchFromBackendDB]);

  const toggleNotifications = useCallback(async (val: boolean) => {
    setNotificationsEnabled(val);
    saveToStorage({ blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled: val });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: val }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend toggle notifications error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, saveToStorage, childId, fetchFromBackendDB]);

  return {
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
    refreshData: fetchFromBackendDB,
  };
}
