import React, { useState } from 'react';
import { X, MapPin, Clock, Volume2, Bell, Vibrate, Check, LocateFixed, Link as LinkIcon } from 'lucide-react';
import { CompanyConfig, AlarmSettings, AlarmSoundType } from '../types';
import { soundEngine } from '../services/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyConfig;
  settings: AlarmSettings;
  onSaveCompany: (c: CompanyConfig) => void;
  onSaveSettings: (s: AlarmSettings) => void;
  onRequestCurrentLocation: () => Promise<{ lat: number; lng: number }>;
}

const SOUND_OPTIONS: { id: AlarmSoundType; label: string; desc: string }[] = [
  { id: 'urgent', label: 'Beep Gấp Android', desc: 'Chuông tít tít dồn dập tần số cao' },
  { id: 'siren', label: 'Còi Báo Động (Siren)', desc: 'Còi hú cứu thương/khẩn cấp đổi tần số' },
  { id: 'bell', label: 'Chuông Cơ Khí (Bell)', desc: 'Tiếng chuông đồng hồ báo thức cơ học' },
  { id: 'sonar', label: 'Sóng Radar (Sonar)', desc: 'Tiếng xung cảnh báo áp lực cao' },
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'T2' },
  { id: 2, label: 'T3' },
  { id: 3, label: 'T4' },
  { id: 4, label: 'T5' },
  { id: 5, label: 'T6' },
  { id: 6, label: 'T7' },
  { id: 0, label: 'CN' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  company,
  settings,
  onSaveCompany,
  onSaveSettings,
  onRequestCurrentLocation,
}) => {
  const [formDataCompany, setFormDataCompany] = useState<CompanyConfig>({ ...company });
  const [formDataSettings, setFormDataSettings] = useState<AlarmSettings>({ ...settings });
  const [locating, setLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDayToggle = (dayId: number) => {
    const active = formDataCompany.activeDays.includes(dayId);
    const newDays = active
      ? formDataCompany.activeDays.filter((d) => d !== dayId)
      : [...formDataCompany.activeDays, dayId];
    setFormDataCompany({ ...formDataCompany, activeDays: newDays });
  };

  const handleTestSound = (type: AlarmSoundType) => {
    soundEngine.previewSound(type, formDataSettings.volume);
  };

  const handleFetchCurrentLocation = async () => {
    setLocating(true);
    setLocSuccess(false);
    try {
      const coords = await onRequestCurrentLocation();
      setFormDataCompany((prev) => ({
        ...prev,
        latitude: parseFloat(coords.lat.toFixed(6)),
        longitude: parseFloat(coords.lng.toFixed(6)),
      }));
      setLocSuccess(true);
      setTimeout(() => setLocSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Không thể lấy tọa độ hiện tại. Hãy kiểm tra quyền định vị trình duyệt.');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = () => {
    onSaveCompany(formDataCompany);
    onSaveSettings(formDataSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-emerald-950/95 via-slate-900/95 to-teal-950/95 border border-emerald-800/60 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Cài Đặt Nhắc Nhở & Chuông Báo</span>
            </h2>
            <p className="text-xs text-slate-400">Tùy chỉnh lịch ca, tọa độ công ty và kiểu chuông</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Section 1: Ca làm việc & Hạn giờ chuông */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> 1. Ca Làm Việc & Hạn Chót
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Giờ bắt đầu làm việc
                </label>
                <input
                  type="time"
                  value={formDataCompany.shiftStartTime}
                  onChange={(e) =>
                    setFormDataCompany({ ...formDataCompany, shiftStartTime: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-sm font-bold font-mono-numbers text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reo chuông trước giờ G
                </label>
                <select
                  value={formDataCompany.alertMinutesBefore}
                  onChange={(e) =>
                    setFormDataCompany({
                      ...formDataCompany,
                      alertMinutesBefore: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-sm font-semibold text-white focus:border-amber-400 outline-none"
                >
                  <option value={0}>Đúng giờ làm việc (0 phút)</option>
                  <option value={5}>Trước 5 phút</option>
                  <option value={10}>Trước 10 phút (Khuyên dùng)</option>
                  <option value={15}>Trước 15 phút</option>
                  <option value={20}>Trước 20 phút</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ngày làm việc trong tuần
              </label>
              <div className="flex gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const active = formDataCompany.activeDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDayToggle(d.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Vị trí công ty & Bán kính radar */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 2. Vị Trí & Radar Công Ty
              </h3>
              <button
                type="button"
                onClick={handleFetchCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 transition cursor-pointer"
              >
                <LocateFixed className="w-3 h-3" />
                <span>{locating ? 'Đang lấy...' : locSuccess ? '✓ Đã cập nhật!' : 'Lấy GPS vị trí này'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tên công ty / Chi nhánh
              </label>
              <input
                type="text"
                value={formDataCompany.name}
                onChange={(e) => setFormDataCompany({ ...formDataCompany, name: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:border-emerald-400 outline-none"
                placeholder="VD: Văn Phòng Công Ty ABC"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vĩ độ (Lat)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formDataCompany.latitude}
                  onChange={(e) =>
                    setFormDataCompany({ ...formDataCompany, latitude: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs font-mono-numbers text-white focus:border-emerald-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kinh độ (Lng)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formDataCompany.longitude}
                  onChange={(e) =>
                    setFormDataCompany({ ...formDataCompany, longitude: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs font-mono-numbers text-white focus:border-emerald-400 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Bán kính geofence: <strong className="text-emerald-400">{formDataCompany.radiusMeters} mét</strong>
                </label>
                <span className="text-[10px] text-slate-500">Phạm vi kích hoạt nhắc nhở</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={formDataCompany.radiusMeters}
                onChange={(e) =>
                  setFormDataCompany({ ...formDataCompany, radiusMeters: Number(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Âm thanh báo thức & Rung */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> 3. Nhạc Chuông & Rung Báo Động
            </h3>

            <div className="space-y-2">
              {SOUND_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setFormDataSettings({ ...formDataSettings, soundType: opt.id })}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                    formDataSettings.soundType === opt.id
                      ? 'bg-rose-500/15 border-rose-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formDataSettings.soundType === opt.id
                          ? 'border-rose-400 bg-rose-500'
                          : 'border-slate-600'
                      }`}
                    >
                      {formDataSettings.soundType === opt.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] text-slate-400">{opt.desc}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestSound(opt.id);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-semibold text-rose-300 transition"
                  >
                    <span>Nghe</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Âm lượng: {Math.round(formDataSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={formDataSettings.volume}
                  onChange={(e) =>
                    setFormDataSettings({
                      ...formDataSettings,
                      volume: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-slate-300" />
                  <span className="text-xs font-semibold text-slate-200">Rung điện thoại</span>
                </div>
                <input
                  type="checkbox"
                  checked={formDataSettings.vibrate}
                  onChange={(e) =>
                    setFormDataSettings({ ...formDataSettings, vibrate: e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: App chấm công liên kết */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4" /> 4. Liên Kết App Chấm Công
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên app công ty
                </label>
                <input
                  type="text"
                  value={formDataCompany.checkinAppName || ''}
                  onChange={(e) =>
                    setFormDataCompany({ ...formDataCompany, checkinAppName: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white focus:border-sky-400 outline-none"
                  placeholder="VD: Base Checkin / 1Office"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Đường dẫn (URL mở app)
                </label>
                <input
                  type="text"
                  value={formDataCompany.checkinAppUrl || ''}
                  onChange={(e) =>
                    setFormDataCompany({ ...formDataCompany, checkinAppUrl: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white focus:border-sky-400 outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Section 5: Tông màu nền ứng dụng */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>🎨 5. Tông Màu Nền App (Màu Xanh)</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormDataSettings({ ...formDataSettings, appTheme: 'emerald' })}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  (formDataSettings.appTheme || 'emerald') === 'emerald'
                    ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-xs font-bold text-emerald-300">Xanh Lục</span>
                </div>
                <div className="text-[10px] text-slate-400">Emerald sâu</div>
              </button>

              <button
                type="button"
                onClick={() => setFormDataSettings({ ...formDataSettings, appTheme: 'teal' })}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  formDataSettings.appTheme === 'teal'
                    ? 'bg-teal-950/90 border-teal-400 text-white shadow-md shadow-teal-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
                  <span className="text-xs font-bold text-teal-300">Xanh Ngọc</span>
                </div>
                <div className="text-[10px] text-slate-400">Teal hiện đại</div>
              </button>

              <button
                type="button"
                onClick={() => setFormDataSettings({ ...formDataSettings, appTheme: 'navy' })}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  formDataSettings.appTheme === 'navy'
                    ? 'bg-sky-950/90 border-sky-400 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                  <span className="text-xs font-bold text-sky-300">Xanh Lam</span>
                </div>
                <div className="text-[10px] text-slate-400">Ocean Blue</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
