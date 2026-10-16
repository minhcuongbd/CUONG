import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<string>('08:15');
  // Default to false so user immediately gets the full, rich, expansive screen without black sidebars
  const [isFrameEnabled, setIsFrameEnabled] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011812] text-slate-100 flex flex-col items-center justify-start p-2 sm:py-6 sm:px-4 selection:bg-emerald-400 selection:text-black">
      {/* Top Floating Control Bar */}
      <header className="flex items-center justify-between w-full max-w-5xl mb-3 px-3 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-950/50">
        <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs sm:text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Smartphone className="w-3.5 h-3.5" />
          </span>
          <span>MINH CƯỜNG • Ứng Dụng Android Chấm Công</span>
          <span className="hidden sm:inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
            Nền Xanh Lục
          </span>
        </div>

        <button
          onClick={() => setIsFrameEnabled(!isFrameEnabled)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition active:scale-95 cursor-pointer text-xs shadow-md shadow-emerald-500/20"
        >
          {isFrameEnabled ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Xem Tràn Màn Hình</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Xem Khung Điện Thoại</span>
            </>
          )}
        </button>
      </header>

      {/* Main App Container */}
      <main
        className={`w-full transition-all duration-300 ${
          isFrameEnabled
            ? 'max-w-[425px] sm:rounded-[48px] sm:border-[8px] sm:border-emerald-950/90 sm:shadow-[0_25px_60px_-15px_rgba(4,47,46,0.9)] bg-gradient-to-b from-[#022c22] via-[#012019] to-[#01140e] overflow-hidden relative sm:ring-1 sm:ring-emerald-500/40'
            : 'max-w-5xl bg-gradient-to-b from-[#022c22]/95 via-[#012019]/95 to-[#01140e]/95 min-h-[calc(100vh-80px)] rounded-3xl border border-emerald-500/30 shadow-2xl backdrop-blur-xl'
        }`}
      >
        {/* Android Simulated Status Bar (Shown inside phone frame or as sleek top bar) */}
        <div className="sticky top-0 z-40 bg-[#022c22]/95 backdrop-blur-md px-5 pt-3 pb-2.5 flex items-center justify-between text-xs text-emerald-200 select-none border-b border-emerald-800/40">
          {/* Left: Live Clock */}
          <span className="font-bold font-mono-numbers text-white tracking-tight">{currentTime}</span>

          {/* Center: Camera Punch-Hole Simulation */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-emerald-700/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
          </div>

          {/* Right: Network & Battery Icons */}
          <div className="flex items-center gap-2 text-emerald-300">
            <Signal className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-300">5G</span>
            <Wifi className="w-3 h-3 text-emerald-400" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono-numbers text-emerald-300">92%</span>
              <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Child Screen Content */}
        <div className="min-h-[calc(100vh-140px)] flex flex-col justify-between">
          <div>{children}</div>

          {/* Android Bottom Navigation Pill */}
          <div className="py-3 flex justify-center items-center select-none">
            <div className="w-36 h-1 rounded-full bg-emerald-600/50 hover:bg-emerald-400 transition-colors" />
          </div>
        </div>
      </main>
    </div>
  );
};
