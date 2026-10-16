import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, ShieldCheck } from 'lucide-react';

interface PWAInstallBannerProps {
  onOpenExportAPK?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenExportAPK }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/60 p-3.5 border border-emerald-500/30 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Android PWA</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" /> Sẵn sàng
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">Cài đặt app MINH CƯỜNG lên màn hình chính</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExportAPK && (
              <button
                onClick={onOpenExportAPK}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                title="Tải hoặc xuất file APK cài đặt cho Android"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất APK</span>
              </button>
            )}

            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
              >
                <span>Cài Đặt</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 transition"
              >
                Hướng dẫn
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
              aria-label="Đóng banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-400" /> Cài đặt trên iPhone/iPad
            </h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              1. Nhấn nút <strong>Chia sẻ (Share)</strong> trên thanh công cụ Safari.<br />
              2. Kéo xuống chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.<br />
              3. Mở ứng dụng ngay từ màn hình chính để nhận chuông báo và định vị.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-sm font-bold text-slate-950 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
