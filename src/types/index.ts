export type AlarmSoundType = 'siren' | 'urgent' | 'bell' | 'sonar';

export interface CompanyConfig {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  shiftStartTime: string; // '08:30'
  alertMinutesBefore: number; // e.g. 10 (ring alarm 10 mins before shiftStartTime if not checked in)
  activeDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  checkinAppUrl?: string;
  checkinAppName?: string;
}

export interface AlarmSettings {
  soundType: AlarmSoundType;
  volume: number; // 0 to 1
  vibrate: boolean;
  snoozeDurationMinutes: number;
  appTheme?: 'emerald' | 'teal' | 'navy';
}

export type CheckInStatus = 'NOT_CHECKED_IN' | 'ON_TIME' | 'LATE';

export interface CheckInRecord {
  id: string;
  dateStr: string; // 'YYYY-MM-DD'
  timestamp: number;
  formattedTime: string;
  status: 'ON_TIME' | 'LATE';
  companyName: string;
  distanceAtCheckin: number;
  note?: string;
}

export interface DayStatus {
  dateStr: string;
  isCheckedIn: boolean;
  checkinRecord?: CheckInRecord;
  snoozedUntil?: number; // timestamp
}
