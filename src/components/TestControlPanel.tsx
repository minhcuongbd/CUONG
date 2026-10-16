import React, { useState } from 'react';
import { Play, RotateCcw, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { AlarmSettings } from '../types';

interface TestControlPanelProps {
  settings: AlarmSettings;
  onTriggerAlarmDemo: (reason: string) => void;
  onSimulateArrival: () => void;
  onResetToday: () => void;
}

export const TestControlPanel: React.FC<TestControlPanelProps> = ({
  settings,
  onTriggerAlarmDemo,
  onSimulateArrival,
  onResetToday,
}) => {
  const [testingSound, setTestingSound] = useState(false);

  const handleTestSoundPreview = () => {
    setTestingSound(true);
    soundEngine.previewSound(settings.soundType, settings.volume);
    setTimeout(() => {
      setTestingSound(false);
    }, 2000);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-emerald-950/60 via-slate-950/70 to-teal-950/60 border border-emerald-800/40 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Trung Tâm Thử Nghiệm Chuông Báo
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Bấm để kiểm tra tính năng</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Button 1: Full Emergency Alarm Trigger */}
        <button
          onClick={() =>
            onTriggerAlarmDemo(
              'Thử nghiệm: Bạn đã đến công ty 10 phút trước nhưng chưa xác nhận chấm công!'
            )
          }
          className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-500/40 hover:border-red-500 text-left transition active:scale-98 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white transition">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Reo chuông báo động</div>
              <div className="text-[10px] text-red-300/80">Kích hoạt màn hình reo chuông ngay</div>
            </div>
          </div>
          <Play className="h-3.5 w-3.5 text-red-400" />
        </button>

        {/* Button 2: Simulate Arrival Geofence */}
        <button
          onClick={onSimulateArrival}
          className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 hover:border-emerald-500 text-left transition active:scale-98 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
              <span className="text-sm">🚪</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Mô phỏng đến công ty</div>
              <div className="text-[10px] text-emerald-300/80">Vào bán kính cty và nhắc nhở</div>
            </div>
          </div>
          <Play className="h-3.5 w-3.5 text-emerald-400" />
        </button>

        {/* Button 3: Preview Ringtone Only */}
        <button
          onClick={handleTestSoundPreview}
          disabled={testingSound}
          className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-left transition active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Nghe thử nhạc chuông</div>
              <div className="text-[10px] text-slate-400">Kiểu chuông: {settings.soundType}</div>
            </div>
          </div>
          <span className="text-xs font-mono-numbers text-amber-400 font-bold">
            {testingSound ? 'Đang phát...' : 'Phát 2s'}
          </span>
        </button>

        {/* Button 4: Reset Today State */}
        <button
          onClick={onResetToday}
          className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-left transition active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Làm mới trạng thái ngày</div>
              <div className="text-[10px] text-slate-400">Xóa check-in hôm nay để test lại</div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Reset</span>
        </button>
      </div>
    </div>
  );
};
