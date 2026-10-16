import { CompanyConfig, AlarmSettings, CheckInRecord } from '../types';

const STORAGE_KEYS = {
  COMPANY: 'checkin_alarm_company_v1',
  SETTINGS: 'checkin_alarm_settings_v1',
  RECORDS: 'checkin_alarm_records_v1',
  TODAY_STATUS: 'checkin_alarm_today_status_v1',
};

export const DEFAULT_COMPANY: CompanyConfig = {
  name: 'Văn Phòng Công Ty Tech Hub',
  address: 'Tầng 12, Toà Nhà Landmark, P. 22, Bình Thạnh, TP.HCM',
  latitude: 10.7951,
  longitude: 106.7218,
  radiusMeters: 150,
  shiftStartTime: '08:30',
  alertMinutesBefore: 10,
  activeDays: [1, 2, 3, 4, 5], // Thứ 2 đến Thứ 6
  checkinAppUrl: 'https://base.vn',
  checkinAppName: 'Base Checkin / 1Office / Fingerprint',
};

export const DEFAULT_SETTINGS: AlarmSettings = {
  soundType: 'urgent',
  volume: 0.9,
  vibrate: true,
  snoozeDurationMinutes: 2,
  appTheme: 'emerald',
};

// Seed 4 days of history to showcase streak
const SEED_RECORDS: CheckInRecord[] = [
  {
    id: 'rec-1',
    dateStr: '2026-10-12',
    timestamp: new Date('2026-10-12T08:18:00').getTime(),
    formattedTime: '08:18',
    status: 'ON_TIME',
    companyName: 'Văn Phòng Công Ty Tech Hub',
    distanceAtCheckin: 42,
    note: 'Đúng giờ, cách máy chấm công 42m',
  },
  {
    id: 'rec-2',
    dateStr: '2026-10-13',
    timestamp: new Date('2026-10-13T08:22:00').getTime(),
    formattedTime: '08:22',
    status: 'ON_TIME',
    companyName: 'Văn Phòng Công Ty Tech Hub',
    distanceAtCheckin: 18,
    note: 'Đúng giờ, reo nhắc nhở lúc vào thang máy',
  },
  {
    id: 'rec-3',
    dateStr: '2026-10-14',
    timestamp: new Date('2026-10-14T08:14:00').getTime(),
    formattedTime: '08:14',
    status: 'ON_TIME',
    companyName: 'Văn Phòng Công Ty Tech Hub',
    distanceAtCheckin: 65,
    note: 'Chấm sớm 16 phút tại hầm gửi xe',
  },
  {
    id: 'rec-4',
    dateStr: '2026-10-15',
    timestamp: new Date('2026-10-15T08:26:00').getTime(),
    formattedTime: '08:26',
    status: 'ON_TIME',
    companyName: 'Văn Phòng Công Ty Tech Hub',
    distanceAtCheckin: 30,
    note: 'Chuông báo cứu nguy kịp lúc 4 phút trước giờ G!',
  },
];

export function getStoredCompany(): CompanyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (raw) return { ...DEFAULT_COMPANY, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading company config', e);
  }
  return DEFAULT_COMPANY;
}

export function saveStoredCompany(config: CompanyConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving company config', e);
  }
}

export function getStoredSettings(): AlarmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AlarmSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function getStoredRecords(): CheckInRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading records', e);
  }
  return SEED_RECORDS;
}

export function saveStoredRecords(records: CheckInRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving records', e);
  }
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
