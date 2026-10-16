import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { CompanyConfig, CheckInRecord } from '../types';

interface CheckInActionCardProps {
  isCheckedIn: boolean;
  todayRecord?: CheckInRecord;
  company: CompanyConfig;
  distance: number;
  isInsideGeofence: boolean;
  onCheckIn: () => void;
  onResetToday: () => void;
  onOpenAlarmManual: () => void;
}

export const CheckInActionCard: React.FC<CheckInActionCardProps> = ({
  isCheckedIn,
  todayRecord,
  company,
  distance,
  isInsideGeofence,
  onCheckIn,
  onResetToday,
  onOpenAlarmManual,
}) => {
  // Compute alarm trigger time (e.g. shift 08:30, alertMinutesBefore 10 -> 08:20)
  const [shiftHours, shiftMins] = company.shiftStartTime.split(':').map(Number);
  const totalMins = shiftHours * 60 + shiftMins - company.alertMinutesBefore;
  const alarmHour = Math.floor(totalMins / 60);
  const alarmMin = totalMins % 60;
  const formattedAlarmTime = `${String(alarmHour).padStart(2, '0')}:${String(alarmMin).padStart(2, '0')}`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/80 via-slate-950/90 to-teal-950/80 border border-emerald-800/40 p-6 shadow-2xl backdrop-blur-md">
      {/* Glow highlight */}
      <div
        className={`absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-32 rounded-full blur-3xl pointer-events-none ${
          isCheckedIn ? 'bg-emerald-500/25' : 'bg-emerald-600/20'
        }`}
      />

      <div className="relative z-10">
        {/* Shift Timing Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Ca làm việc:</span>
            <span className="text-sm font-black font-mono-numbers text-white">{company.shiftStartTime}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-300/90 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            <span>Chuông báo lúc:</span>
            <span className="font-bold font-mono-numbers text-amber-300">{formattedAlarmTime}</span>
          </div>
        </div>

        {/* Content State */}
        {isCheckedIn ? (
          /* State: Already Checked In */
          <div className="py-6 flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center mb-3">
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-pulse" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30 text-slate-950">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ĐÃ HOÀN TẤT CHẤM CÔNG HÔM NAY</span>
            </div>

            <div className="text-3xl font-extrabold font-mono-numbers text-white">
              {todayRecord?.formattedTime || '08:18'}
            </div>

            <p className="mt-1 text-xs text-slate-300 font-medium">
              Ghi nhận tại {todayRecord?.companyName || company.name}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                ✓ Đúng giờ, an toàn
              </span>
              <button
                onClick={onResetToday}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
                title="Reset trạng thái để kiểm tra lại tính năng reo chuông"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Thử lại (Reset)</span>
              </button>
            </div>
          </div>
        ) : (
          /* State: Pending Check-In */
          <div className="py-5 flex flex-col items-center text-center">
            {/* Warning tag */}
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>HÔM NAY BẠN CHƯA BẤM CHECK-IN!</span>
            </div>

            {/* BIG ACTION BUTTON */}
            <button
              onClick={onCheckIn}
              className={`group relative w-full overflow-hidden rounded-2xl py-4 px-6 font-black text-base sm:text-lg transition-all active:scale-98 cursor-pointer shadow-xl ${
                isInsideGeofence
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-wide">
                  {isInsideGeofence ? 'XÁC NHẬN CHECK-IN NGAY' : 'BẤM XÁC NHẬN ĐÃ CHECK-IN'}
                </span>
              </div>
            </button>

            <p className="mt-3 text-xs text-slate-400 leading-relaxed max-w-xs">
              {isInsideGeofence ? (
                <span className="text-emerald-400 font-semibold">
                  📍 Bạn đã ở trong công ty (cách {distance}m). Bấm xác nhận ngay để chống quên!
                </span>
              ) : (
                <span>
                  Đang cách công ty <strong>{distance}m</strong>. Khi vào cổng, chuông báo sẽ nhắc bạn nếu chưa điểm danh.
                </span>
              )}
            </p>

            {/* Quick helper options */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {company.checkinAppUrl && (
                <a
                  href={company.checkinAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mở app {company.checkinAppName || 'chấm công'}</span>
                </a>
              )}

              <button
                onClick={onOpenAlarmManual}
                className="inline-flex items-center gap-1 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition cursor-pointer"
              >
                <span>🔔 Kích hoạt chuông ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
