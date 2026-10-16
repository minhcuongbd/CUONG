/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  BellRing,
  Settings,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Cloud,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  CompanyConfig,
  AlarmSettings,
  CheckInRecord,
} from './types';
import {
  getStoredCompany,
  saveStoredCompany,
  getStoredSettings,
  saveStoredSettings,
  getStoredRecords,
  saveStoredRecords,
  getTodayKey,
} from './services/storage';
import {
  initAuth,
  googleSignIn,
  logout,
} from './services/googleDriveAuth';
import { backupRecordsToDrive } from './services/googleDriveService';
import { useGeolocationTracker } from './hooks/useGeolocationTracker';
import { AndroidFrame } from './components/AndroidFrame';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { CheckInActionCard } from './components/CheckInActionCard';
import { RadarGeofenceCard } from './components/RadarGeofenceCard';
import { GoogleDriveCard } from './components/GoogleDriveCard';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { ExportAPKModal } from './components/ExportAPKModal';
import { TestControlPanel } from './components/TestControlPanel';
import { HistoryList } from './components/HistoryList';
import { AlarmModal } from './components/AlarmModal';
import { SettingsModal } from './components/SettingsModal';
import confetti from 'canvas-confetti';

export default function App() {
  const [, startTransition] = useTransition();

  // App Configurations & Settings
  const [company, setCompany] = useState<CompanyConfig>(getStoredCompany);
  const [settings, setSettings] = useState<AlarmSettings>(getStoredSettings);
  const [records, setRecords] = useState<CheckInRecord[]>(getStoredRecords);

  // Google Drive Authentication & Cloud State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isExportAPKOpen, setIsExportAPKOpen] = useState<boolean>(false);
  const [appToast, setAppToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Today Status State
  const todayKey = getTodayKey();
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | undefined>(() => {
    return getStoredRecords().find((r) => r.dateStr === todayKey);
  });
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(!!todayRecord);

  // Alarm and Modals
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [alarmTriggerReason, setAlarmTriggerReason] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);

  // Arrival Toast Notification
  const [arrivalToast, setArrivalToast] = useState<string | null>(null);

  // Geolocation & Geofence Tracker
  const {
    mode: simulationMode,
    setMode: setSimulationMode,
    currentCoords,
    distance,
    isInsideGeofence,
    geoError,
    requestCurrentLocationAsCompany,
  } = useGeolocationTracker(company);

  // Save configurations on update
  const handleSaveCompany = (newCompany: CompanyConfig) => {
    setCompany(newCompany);
    saveStoredCompany(newCompany);
  };

  const handleSaveSettings = (newSettings: AlarmSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Listen for Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setDriveToken(token);
      },
      () => {
        setCurrentUser(null);
        setDriveToken(null);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Dismiss Toast automatically
  useEffect(() => {
    if (appToast) {
      const timer = setTimeout(() => {
        setAppToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [appToast]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAppToast({ message, type });
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setDriveToken(res.accessToken);
        showNotification(
          `Đã kết nối tài khoản Google Drive thành công (${res.user.email || res.user.displayName})!`,
          'success'
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      showNotification(message, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setDriveToken(null);
      showNotification('Đã ngắt kết nối tài khoản Google Drive.', 'info');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng xuất thất bại';
      showNotification(message, 'error');
    }
  };

  const handleRestoreRecords = (restored: CheckInRecord[]) => {
    const existingIds = new Set(records.map((r) => r.id));
    const newItems = restored.filter((r) => !existingIds.has(r.id));
    const merged = [...newItems, ...records].sort((a, b) => b.timestamp - a.timestamp);
    setRecords(merged);
    saveStoredRecords(merged);

    const todayRec = merged.find((r) => r.dateStr === todayKey);
    if (todayRec) {
      setTodayRecord(todayRec);
      setIsCheckedIn(true);
    }
  };

  // Perform Check-In
  const handleCheckIn = useCallback(
    (note?: string) => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${h}:${m}`;

      // Check if on time: compare now with company.shiftStartTime
      const [shiftH, shiftM] = company.shiftStartTime.split(':').map(Number);
      const shiftMinutes = shiftH * 60 + shiftM;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const status: 'ON_TIME' | 'LATE' = currentMinutes <= shiftMinutes ? 'ON_TIME' : 'LATE';

      const newRecord: CheckInRecord = {
        id: `rec-${Date.now()}`,
        dateStr: todayKey,
        timestamp: now.getTime(),
        formattedTime: timeStr,
        status,
        companyName: company.name,
        distanceAtCheckin: distance,
        note: note || (status === 'ON_TIME' ? 'Check-in đúng giờ qua ứng dụng' : 'Check-in muộn'),
      };

      const updatedRecords = [newRecord, ...records.filter((r) => r.dateStr !== todayKey)];
      setRecords(updatedRecords);
      saveStoredRecords(updatedRecords);

      setTodayRecord(newRecord);
      setIsCheckedIn(true);
      setIsAlarmActive(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }

      // Auto-sync to Google Drive if user is connected
      if (driveToken) {
        backupRecordsToDrive(updatedRecords)
          .then((file) => {
            showNotification(`Đã tự động sao lưu check-in lên Google Drive (${file.name})`, 'success');
          })
          .catch((e) => {
            console.warn('Lỗi tự động sao lưu Drive:', e);
          });
      }
    },
    [company.shiftStartTime, company.name, distance, records, todayKey, driveToken]
  );

  // Reset today status for testing
  const handleResetToday = () => {
    const updated = records.filter((r) => r.dateStr !== todayKey);
    setRecords(updated);
    saveStoredRecords(updated);
    setTodayRecord(undefined);
    setIsCheckedIn(false);
    setIsAlarmActive(false);
    setSnoozedUntil(null);
  };

  // Snooze Alarm
  const handleSnooze = () => {
    setIsAlarmActive(false);
    const snoozeTime = Date.now() + settings.snoozeDurationMinutes * 60 * 1000;
    setSnoozedUntil(snoozeTime);
  };

  // Trigger Alarm Modal
  const handleTriggerAlarm = (reason: string) => {
    setAlarmTriggerReason(reason);
    setIsAlarmActive(true);
  };

  // Detect Geofence Entry: when user enters geofence and hasn't checked in
  useEffect(() => {
    if (isInsideGeofence && !isCheckedIn) {
      setArrivalToast(
        `📍 Bạn vừa vào vùng ${company.name} (${distance}m)! Đừng quên check-in ngay.`
      );
      const timer = setTimeout(() => {
        setArrivalToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isInsideGeofence, isCheckedIn, company.name, distance]);

  // Periodic Schedule Check: Checks every 10s if we reached alarm time before shift
  useEffect(() => {
    const checkSchedule = () => {
      if (isCheckedIn || isAlarmActive) return;

      // Check snooze window
      if (snoozedUntil && Date.now() < snoozedUntil) {
        return;
      }

      const now = new Date();
      const currentDay = now.getDay();

      // Check if today is an active working day
      if (!company.activeDays.includes(currentDay)) {
        return;
      }

      const [shiftH, shiftM] = company.shiftStartTime.split(':').map(Number);
      const shiftMinutes = shiftH * 60 + shiftM;
      const alarmThresholdMinutes = shiftMinutes - company.alertMinutesBefore;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Trigger if current time is at or past alarmThresholdMinutes AND within reasonable morning window
      if (currentMinutes >= alarmThresholdMinutes && currentMinutes <= shiftMinutes + 45) {
        startTransition(() => {
          setAlarmTriggerReason(
            `Đã đến hạn chót! Sắp tới giờ làm việc (${company.shiftStartTime}) tại ${company.name} mà bạn chưa check-in!`
          );
          setIsAlarmActive(true);
        });
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 10000);
    return () => clearInterval(interval);
  }, [isCheckedIn, isAlarmActive, snoozedUntil, company]);

  // Simulate arrival test
  const handleSimulateArrival = () => {
    setSimulationMode('sim_inside');
    setArrivalToast(
      `🚪 Đã bước vào cổng ${company.name}! Hãy kiểm tra xem bạn đã bấm xác nhận check-in chưa.`
    );
  };

  // Theme gradient background class based on user choice (default emerald)
  const currentTheme = settings.appTheme || 'emerald';
  const themeBgClasses =
    currentTheme === 'teal'
      ? 'from-teal-950 via-slate-950 to-emerald-950'
      : currentTheme === 'navy'
      ? 'from-slate-950 via-sky-950 to-teal-950'
      : 'from-emerald-950 via-slate-950 to-teal-950';

  const cycleTheme = () => {
    const nextTheme: 'emerald' | 'teal' | 'navy' =
      currentTheme === 'emerald' ? 'teal' : currentTheme === 'teal' ? 'navy' : 'emerald';
    const updated = { ...settings, appTheme: nextTheme };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  return (
    <AndroidFrame>
      <div className={`relative p-4 sm:p-5 space-y-4 bg-gradient-to-b ${themeBgClasses} overflow-hidden min-h-full`}>
        {/* Ambient Emerald Glow Effects */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

        {/* Top App Header */}
        <header className="relative z-10 flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25">
              <BellRing className="w-5 h-5 stroke-[2.2]" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-white tracking-tight">MINH CƯỜNG</h1>
                <span className="rounded-full bg-emerald-500/25 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  Android
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium">Báo thức nhắc check-in công ty</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Export APK Button */}
            <button
              onClick={() => setIsExportAPKOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-300 border border-emerald-500/40 transition cursor-pointer text-[11px] font-bold shadow-sm"
              title="Xuất file APK cài đặt lên điện thoại Android"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất APK</span>
            </button>

            {/* Quick Google Drive Modal Button */}
            <button
              onClick={() => {
                if (driveToken) {
                  setIsDriveModalOpen(true);
                } else {
                  handleGoogleSignIn();
                }
              }}
              className="relative flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 transition cursor-pointer text-[11px] font-semibold"
              title={driveToken ? 'Mở quản lý Google Drive' : 'Đăng nhập Google Drive'}
            >
              <Cloud className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Drive</span>
              {driveToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Quick Green Theme Switcher */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 transition cursor-pointer text-[11px] font-semibold"
              title="Đổi tông màu xanh (Lục / Ngọc / Lam)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentTheme === 'emerald' ? 'Xanh Lục' : currentTheme === 'teal' ? 'Xanh Ngọc' : 'Xanh Lam'}</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 hover:text-white border border-emerald-800/60 transition cursor-pointer"
              aria-label="Cài đặt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Toast for Drive Operations & Alerts */}
        {appToast && (
          <div
            className={`flex items-start justify-between gap-2.5 rounded-2xl p-3 shadow-lg backdrop-blur-md animate-fade-in ${
              appToast.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                : appToast.type === 'error'
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                : 'bg-teal-500/20 border border-teal-500/40 text-teal-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {appToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : appToast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Cloud className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-snug">{appToast.message}</div>
            </div>
            <button
              onClick={() => setAppToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Real-time Arrival Alert Banner (If near company) */}
        {arrivalToast && (
          <div className="flex items-start justify-between gap-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 p-3 shadow-md backdrop-blur-sm animate-bounce-once">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 font-medium leading-snug">
                {arrivalToast}
              </div>
            </div>
            <button
              onClick={() => setArrivalToast(null)}
              className="text-amber-400/80 hover:text-amber-200 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Protection Active Badge */}
        <div className="relative z-10 flex items-center justify-between px-3.5 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </div>
            <span className="font-semibold text-emerald-100 text-[11px]">
              Vệ tinh giám sát check-in: <strong className="text-emerald-400">Đang bật</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-300/80 font-mono-numbers">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Giờ G: {company.shiftStartTime}</span>
          </div>
        </div>

        {/* In-App PWA Install Banner */}
        <PWAInstallBanner onOpenExportAPK={() => setIsExportAPKOpen(true)} />

        {/* Main Dashboard Cards (2 columns on wide screens, 1 on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main Check-In Action Card */}
          <CheckInActionCard
            isCheckedIn={isCheckedIn}
            todayRecord={todayRecord}
            company={company}
            distance={distance}
            isInsideGeofence={isInsideGeofence}
            onCheckIn={() => handleCheckIn()}
            onResetToday={handleResetToday}
            onOpenAlarmManual={() =>
              handleTriggerAlarm('Kích hoạt chuông báo khẩn cấp thử nghiệm')
            }
          />

          {/* Radar & Geofence Distance Card */}
          <RadarGeofenceCard
            company={company}
            distance={distance}
            isInsideGeofence={isInsideGeofence}
            simulationMode={simulationMode}
            onSetSimulationMode={setSimulationMode}
            geoError={geoError}
            currentCoords={currentCoords}
          />
        </div>

        {/* Google Drive Cloud Integration Card */}
        <GoogleDriveCard
          isAuthenticated={!!driveToken}
          isLoggingIn={isLoggingIn}
          userName={currentUser?.displayName || undefined}
          userEmail={currentUser?.email || undefined}
          userPhoto={currentUser?.photoURL || undefined}
          records={records}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleGoogleSignOut}
          onOpenDriveModal={() => setIsDriveModalOpen(true)}
          onNotification={showNotification}
        />

        {/* Secondary Cards (2 columns on wide screens, 1 on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Test Sandbox Panel */}
          <TestControlPanel
            settings={settings}
            onTriggerAlarmDemo={handleTriggerAlarm}
            onSimulateArrival={handleSimulateArrival}
            onResetToday={handleResetToday}
          />

          {/* Check-In History and Disciplined Streak */}
          <HistoryList
            records={records}
            onOpenDrive={() => setIsDriveModalOpen(true)}
          />
        </div>

        {/* Android App Info Footer */}
        <footer className="text-center py-2 text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
            <span>MINH CƯỜNG cho Android • Chống quên chấm công</span>
          </p>
          <p className="text-[10px] text-slate-600">
            Hỗ trợ Web Audio API • Geolocation Radar • Google Drive Cloud Sync
          </p>
        </footer>
      </div>

      {/* Full-Screen Alarm Modal Overlay */}
      <AlarmModal
        isOpen={isAlarmActive}
        triggerReason={alarmTriggerReason}
        company={company}
        settings={settings}
        onConfirmCheckIn={(note) => handleCheckIn(note)}
        onSnooze={handleSnooze}
      />

      {/* Google Drive Explorer & Backup Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        records={records}
        userEmail={currentUser?.email || undefined}
        userName={currentUser?.displayName || undefined}
        onRestoreRecords={handleRestoreRecords}
        onNotification={showNotification}
      />

      {/* Export APK Modal */}
      <ExportAPKModal
        isOpen={isExportAPKOpen}
        onClose={() => setIsExportAPKOpen(false)}
        appUrl="https://ais-pre-3bub7zxwmytctmirn577z6-600580946737.asia-northeast1.run.app"
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        company={company}
        settings={settings}
        onSaveCompany={handleSaveCompany}
        onSaveSettings={handleSaveSettings}
        onRequestCurrentLocation={requestCurrentLocationAsCompany}
      />
    </AndroidFrame>
  );
}
