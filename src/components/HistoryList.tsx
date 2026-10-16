import React from 'react';
import { Flame, CheckCircle, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import { CheckInRecord } from '../types';

interface HistoryListProps {
  records: CheckInRecord[];
  onClearRecords?: () => void;
  onOpenDrive?: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ records, onOpenDrive }) => {
  // Calculate streak of on-time records
  const onTimeCount = records.filter((r) => r.status === 'ON_TIME').length;

  return (
    <div className="rounded-3xl bg-gradient-to-b from-emerald-950/60 via-slate-950/70 to-teal-950/60 border border-emerald-800/40 p-5 shadow-lg backdrop-blur-md">
      {/* Streak Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5 fill-slate-950 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Chuỗi Kỷ Luật Chấm Công</span>
            </h3>
            <p className="text-xs text-amber-400 font-semibold">
              {onTimeCount} ngày chấm công đúng giờ liên tiếp 🔥
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Tỷ lệ đúng giờ</span>
            <div className="text-base font-extrabold font-mono-numbers text-emerald-400">
              {records.length > 0 ? `${Math.round((onTimeCount / records.length) * 100)}%` : '100%'}
            </div>
          </div>
          {onOpenDrive && (
            <button
              onClick={onOpenDrive}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
              title="Đồng bộ hoặc xuất sang Google Drive"
            >
              <span>Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Record Items */}
      <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {records.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Chưa có lịch sử chấm công nào được lưu.
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                    rec.status === 'ON_TIME'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono-numbers text-white">
                      {rec.formattedTime}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {rec.dateStr}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[210px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{rec.note || `${rec.companyName} (${rec.distanceAtCheckin}m)`}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="w-2.5 h-2.5" /> Đúng giờ
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
