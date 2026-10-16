import React from 'react';
import { Navigation, MapPin, Radio, ShieldCheck, Compass, AlertCircle } from 'lucide-react';
import { CompanyConfig } from '../types';
import { formatDistance, LocationSimulationMode } from '../hooks/useGeolocationTracker';

interface RadarGeofenceCardProps {
  company: CompanyConfig;
  distance: number;
  isInsideGeofence: boolean;
  simulationMode: LocationSimulationMode;
  onSetSimulationMode: (mode: LocationSimulationMode) => void;
  geoError: string | null;
  currentCoords: { lat: number; lng: number } | null;
}

export const RadarGeofenceCard: React.FC<RadarGeofenceCardProps> = ({
  company,
  distance,
  isInsideGeofence,
  simulationMode,
  onSetSimulationMode,
  geoError,
  currentCoords,
}) => {
  // Ratio of distance relative to radius (clamped for visual radar display)
  const isClose = distance <= company.radiusMeters * 2;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/70 via-slate-950/80 to-teal-950/70 border border-emerald-800/40 p-5 shadow-xl backdrop-blur-md">
      {/* Background soft ambient glow */}
      <div
        className={`absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isInsideGeofence ? 'bg-emerald-500/25' : isClose ? 'bg-teal-500/20' : 'bg-emerald-600/15'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isInsideGeofence
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Radar Bán Kính Công Ty</span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{company.name}</p>
          </div>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border transition-colors ${
            isInsideGeofence
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : isClose
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isInsideGeofence
                ? 'bg-emerald-400 animate-pulse'
                : isClose
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          <span>{isInsideGeofence ? 'Trong công ty' : isClose ? 'Sát cổng vào' : 'Ngoài vùng'}</span>
        </div>
      </div>

      {/* Visual Radar graphic & Distance Metric */}
      <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
        {/* Radar Circular Visual */}
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-slate-950/80 border border-slate-800">
          {/* Outer circle (Threshold) */}
          <div className="absolute inset-2 rounded-full border border-dashed border-slate-700/60" />
          {/* Company Radius Circle */}
          <div
            className={`absolute inset-6 rounded-full border ${
              isInsideGeofence
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-amber-500/50 bg-amber-500/5'
            }`}
          />
          {/* Animated pulse rings */}
          <div
            className={`absolute inset-4 rounded-full border ${
              isInsideGeofence ? 'border-emerald-400/40' : 'border-amber-400/30'
            } animate-pulse-ring`}
          />

          {/* Center Office Pin */}
          <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40">
            <MapPin className="h-4 w-4 fill-slate-950" />
          </div>

          {/* User Dot position based on distance */}
          <div
            className={`absolute flex h-5 w-5 items-center justify-center rounded-full shadow-lg transition-all duration-700 ${
              isInsideGeofence
                ? 'bg-emerald-500 text-white shadow-emerald-500/50'
                : 'bg-blue-500 text-white shadow-blue-500/50'
            }`}
            style={{
              top: isInsideGeofence ? '35%' : isClose ? '18%' : '6%',
              right: isInsideGeofence ? '32%' : isClose ? '18%' : '6%',
            }}
          >
            <Navigation className="h-3 w-3 -rotate-45" />
          </div>
        </div>

        {/* Distance Stats & Details */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-baseline justify-between sm:justify-start sm:gap-3">
            <div className="text-xs text-slate-400">Khoảng cách hiện tại:</div>
            <div className="text-2xl font-black font-mono-numbers text-white tracking-tight">
              {formatDistance(distance)}
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Bán kính cảnh báo: <strong>{company.radiusMeters} mét</strong></span>
          </div>

          {geoError && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-950/50 border border-red-500/30 p-2 text-xs text-red-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span>{geoError}</span>
            </div>
          )}

          {currentCoords && (
            <div className="text-[11px] font-mono-numbers text-slate-400 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800/80 truncate">
              GPS: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* Simulation / GPS Mode Selector */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Compass className="h-3 w-3 text-amber-400" /> Chế độ kiểm tra vị trí:
          </span>
          <span className="text-[10px] text-amber-400/90 font-medium">Bấm để thử nghiệm</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          <button
            onClick={() => onSetSimulationMode('sim_inside')}
            className={`px-2 py-1.5 rounded-xl font-medium transition cursor-pointer text-center ${
              simulationMode === 'sim_inside'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🏢 Vào cty (~20m)
          </button>
          <button
            onClick={() => onSetSimulationMode('sim_approaching')}
            className={`px-2 py-1.5 rounded-xl font-medium transition cursor-pointer text-center ${
              simulationMode === 'sim_approaching'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🚪 Cổng cty (~110m)
          </button>
          <button
            onClick={() => onSetSimulationMode('sim_far')}
            className={`px-2 py-1.5 rounded-xl font-medium transition cursor-pointer text-center ${
              simulationMode === 'sim_far'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 font-bold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🚗 Ở nhà (~3km)
          </button>
          <button
            onClick={() => onSetSimulationMode('real')}
            className={`px-2 py-1.5 rounded-xl font-medium transition cursor-pointer text-center ${
              simulationMode === 'real'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 font-bold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            📡 GPS Thực
          </button>
        </div>
      </div>
    </div>
  );
};
