import { useState, useEffect } from 'react';
import { getUserStorageKey } from '@/lib/auth-utils';

interface GeneralSettings {
  systemName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

const defaultSettings: GeneralSettings = {
  systemName: 'CyberVision AI',
  timezone: 'UTC-5',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

export function useGeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      try {
        const key = getUserStorageKey('generalSettings');
        const savedSettings = localStorage.getItem(key);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading general settings:', error);
      }
    }
  }, []);

  return settings;
}