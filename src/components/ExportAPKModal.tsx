import { useState } from 'react';
import {
  Download,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Terminal,
  ShieldCheck,
  Sparkles,
  QrCode,
  FileCode,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ExportAPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export function ExportAPKModal({ isOpen, onClose, appUrl }: ExportAPKModalProps) {
  // Use public preview/shared URL, fallback to window.location.origin
  const liveUrl =
    appUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-3bub7zxwmytctmirn577z6-600580946737.asia-northeast1.run.app');

  const [activeTab, setActiveTab] = useState<'pwabuilder' | 'webapk' | 'cli' | 'config'>('pwabuilder');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  if (!isOpen) return null;

  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(liveUrl)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(liveUrl)}`;

  const bubblewrapCommand = `# 1. Cài đặt công cụ đóng gói APK của Google
npm install -g @bubblewrap/cli

# 2. Khởi tạo dự án Android từ Manifest của app
bubblewrap init --manifest="${liveUrl}/manifest.json"

# 3. Biên dịch ra file APK cài đặt
bubblewrap build`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(bubblewrapCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  const handleDownloadManifest = () => {
    fetch('/manifest.json')
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'minh_cuong_manifest.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.open('/manifest.json', '_blank');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/30">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Xuất File APK Android</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Android APK / WebAPK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đóng gói ứng dụng MINH CƯỜNG cài đặt trên điện thoại Android
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-800 bg-slate-900/90 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Tải APK trực tiếp (Khuyên dùng)</span>
          </button>

          <button
            onClick={() => setActiveTab('webapk')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'webapk'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. Quét QR cài WebAPK</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'cli'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Lệnh Bubblewrap CLI</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>4. Tệp Manifest</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: PWABUILDER (TẢI APK NGAY) */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Cách nhanh nhất để tạo file .APK hoàn chỉnh</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  PWABuilder (công cụ mã nguồn mở chính thức của Microsoft và Google Partner) tự động phân tích Manifest của ứng dụng MINH CƯỜNG và tạo file <strong>.APK</strong> đã ký (signed APK) hoặc <strong>.AAB</strong> để bạn tải về cài đặt trực tiếp lên điện thoại hoặc đưa lên Google Play Store.
                </p>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold text-emerald-300">URL Ứng dụng:</span>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-slate-300 truncate">{liveUrl}</p>
                </div>

                <div className="pt-2">
                  <a
                    href={pwabuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-98 cursor-pointer"
                  >
                    <span>Mở PWABuilder & Tải File APK Android</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* 3 Step Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Các bước nhận file APK:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      1
                    </div>
                    <p className="font-semibold text-slate-200">Nhấn nút phía trên</p>
                    <p className="text-[11px] text-slate-400">PWABuilder sẽ mở ra và tự động kiểm tra Manifest chuẩn Android.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      2
                    </div>
                    <p className="font-semibold text-slate-200">Chọn &quot;Package for Android&quot;</p>
                    <p className="text-[11px] text-slate-400">Chọn gói APK (sideloading) hoặc Google Play AAB theo nhu cầu.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      3
                    </div>
                    <p className="font-semibold text-slate-200">Cài đặt trên điện thoại</p>
                    <p className="text-[11px] text-slate-400">Chép file .apk vào điện thoại Android và mở lên để cài đặt ngay!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBAPK / QR CODE (CÀI TRỰC TIẾP TỪ CHROME ANDROID) */}
          {activeTab === 'webapk' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-2.5 rounded-2xl bg-white shadow-lg shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code ứng dụng MINH CƯỜNG"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                </div>

                <div className="space-y-3 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    <Smartphone className="w-4 h-4" />
                    <span>Cài đặt WebAPK tự động của Google Android</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hệ điều hành Android có cơ chế <strong>WebAPK</strong>: khi bạn mở ứng dụng này trên trình duyệt Google Chrome trên điện thoại Android và nhấn <strong>&quot;Cài đặt ứng dụng&quot;</strong>, Google Play Services sẽ <em>tự động tạo ra một file APK native</em> và cài đặt vào danh sách ứng dụng trong máy!
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Bước 1: Mở Camera điện thoại hoặc Zalo để quét mã QR bên cạnh.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Bước 2: Chọn mở bằng Google Chrome trên Android.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Bước 3: Nhấn thanh thông báo &quot;Cài đặt MINH CƯỜNG&quot; ở góc dưới màn hình.</span>
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 transition cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Đã sao chép liên kết app' : 'Sao chép liên kết gửi qua Zalo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUBBLEWRAP CLI COMMANDS */}
          {activeTab === 'cli' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Sử dụng công cụ chính thức của Google (Bubblewrap TWA):
                </span>
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  {copiedCommand ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCommand ? 'Đã sao chép lệnh' : 'Sao chép toàn bộ lệnh'}</span>
                </button>
              </div>

              <div className="relative p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                <pre>{bubblewrapCommand}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">📌 Yêu cầu môi trường:</p>
                <p>• Máy tính đã cài đặt Node.js và JDK 17+ (Java Development Kit).</p>
                <p>• Lệnh trên sẽ tự động tạo project Android Studio và xuất file <code className="text-emerald-400">app-release-signed.apk</code> để cài trực tiếp lên mọi máy Android.</p>
              </div>
            </div>
          )}

          {/* TAB 4: MANIFEST CONFIG & ICONS */}
          {activeTab === 'config' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Web App Manifest (manifest.json)</h5>
                    <p className="text-[11px] text-slate-400">Chứa thông tin gói APK, icon 192px/512px, màu sắc giao diện.</p>
                  </div>
                  <button
                    onClick={handleDownloadManifest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải manifest.json</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">Package ID</p>
                    <p className="text-xs font-mono font-bold text-emerald-300 truncate">/</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">Tên App</p>
                    <p className="text-xs font-bold text-white truncate">MINH CƯỜNG</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">Theme Color</p>
                    <p className="text-xs font-mono font-bold text-emerald-400">#064e3b</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">Định dạng</p>
                    <p className="text-xs font-bold text-teal-300">Standalone</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tương thích 100% Android 8.0 đến Android 15+</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
