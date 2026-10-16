import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle, Clock, ExternalLink, ShieldAlert, Volume2 } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { AlarmSettings, CompanyConfig } from '../types';
import confetti from 'canvas-confetti';

interface AlarmModalProps {
  isOpen: boolean;
  triggerReason: string;
  company: CompanyConfig;
  settings: AlarmSettings;
  onConfirmCheckIn: (note?: string) => void;
  onSnooze: () => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  triggerReason,
  company,
  settings,
  onConfirmCheckIn,
  onSnooze,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      soundEngine.stopAlarm();
      setElapsedSeconds(0);
      return;
    }

    // Start sound and vibration
    soundEngine.startAlarm(settings.soundType, settings.volume, settings.vibrate);

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      soundEngine.stopAlarm();
    };
  }, [isOpen, settings.soundType, settings.volume, settings.vibrate]);

  if (!isOpen) return null;

  const handleCheckInNow = () => {
    soundEngine.stopAlarm();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
    onConfirmCheckIn('Tắt chuông và xác nhận đã chấm công');
  };

  const handleSnoozeClick = () => {
    soundEngine.stopAlarm();
    onSnooze();
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-red-950 via-slate-950 to-red-950 text-white p-6 overflow-hidden">
      {/* Background Flashing Radial Glow */}
      <div className="absolute inset-0 bg-red-600/15 animate-pulse pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-300">MINH CƯỜNG • CẢNH BÁO QUÊN CHECK-IN</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-red-200/80 font-mono-numbers bg-slate-900/60 px-2.5 py-1 rounded-full border border-red-500/20">
          <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Reo: {formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Center Bell & Urgent Alert */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-sm">
        {/* Animated Sound Wave Rings */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-44 h-44 rounded-full bg-red-500/20 animate-ping" />
          <div className="absolute w-36 h-36 rounded-full bg-amber-500/20 animate-pulse" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-red-600 to-amber-500 shadow-2xl shadow-red-500/50 border-2 border-white/20 animate-alarm-shake">
            <BellRing className="w-14 h-14 text-white drop-shadow-md" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
          BẠN ĐÃ CHECK-IN CHƯA?
        </h1>

        <p className="mt-2 text-sm text-red-200 font-medium leading-relaxed">
          {triggerReason || `Sắp đến giờ làm việc (${company.shiftStartTime}) tại ${company.name}!`}
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-950/80 border border-red-500/30 px-3 py-1 text-xs text-red-300">
          <Clock className="w-3.5 h-3.5" />
          <span>Hạn chót: {company.shiftStartTime} (tránh bị tính đi trễ)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 w-full max-w-sm space-y-3 pb-4">
        {/* BIG Primary Action: Confirm Check-In */}
        <button
          onClick={handleCheckInNow}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base sm:text-lg py-4 px-6 shadow-xl shadow-emerald-500/30 active:scale-98 transition-all cursor-pointer"
        >
          <CheckCircle className="w-6 h-6 stroke-[2.5]" />
          <span>TÔI ĐÃ CHECK-IN RỒI! (TẮT CHUÔNG)</span>
        </button>

        {/* Quick App Launcher */}
        {company.checkinAppUrl && (
          <a
            href={company.checkinAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 py-3 px-4 text-sm font-semibold text-amber-300 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở app {company.checkinAppName || 'chấm công của công ty'}</span>
          </a>
        )}

        {/* Snooze Action */}
        <button
          onClick={handleSnoozeClick}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Báo lại sau {settings.snoozeDurationMinutes} phút (Snooze)</span>
        </button>
      </div>
    </div>
  );
};
