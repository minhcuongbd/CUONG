import { useState } from 'react';
import {
  Cloud,
  FileSpreadsheet,
  UploadCloud,
  FolderOpen,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  backupRecordsToDrive,
  exportRecordsToCSVInDrive,
} from '../services/googleDriveService';
import { CheckInRecord } from '../types';

interface GoogleDriveCardProps {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
  records: CheckInRecord[];
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenDriveModal: () => void;
  onNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export function GoogleDriveCard({
  isAuthenticated,
  isLoggingIn,
  userName,
  userEmail,
  userPhoto,
  records,
  onSignIn,
  onSignOut,
  onOpenDriveModal,
  onNotification,
}: GoogleDriveCardProps) {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncMsg, setLastSyncMsg] = useState<string | null>(null);

  const handleQuickBackup = async () => {
    setIsSyncing(true);
    try {
      const res = await backupRecordsToDrive(records);
      const msg = `Đã sao lưu ${records.length} bản ghi lên Google Drive (${res.name})`;
      setLastSyncMsg(msg);
      onNotification?.(msg, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sao lưu lên Google Drive thất bại';
      onNotification?.(msg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickExportCSV = async () => {
    setIsSyncing(true);
    try {
      const res = await exportRecordsToCSVInDrive(records);
      const msg = `Đã xuất bảng chấm công CSV lên Google Drive (${res.name})`;
      setLastSyncMsg(msg);
      onNotification?.(msg, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất CSV lên Google Drive thất bại';
      onNotification?.(msg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-4 sm:p-5 shadow-xl shadow-emerald-950/30 backdrop-blur-md overflow-hidden">
      {/* Subtle Glow Background */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20">
            <Cloud className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Đồng Bộ Google Drive</h3>
              {isAuthenticated ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đã kết nối
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Chưa kết nối
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Lưu trữ đám mây & xuất bảng công tự động
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mở kho tệp</span>
          </button>
        )}
      </div>

      {/* Body Content */}
      {!isAuthenticated ? (
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <p className="font-medium text-slate-200">
              Kết nối Google Drive để:
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Tự động sao lưu lịch sử chấm công hàng ngày lên Drive.</li>
              <li>Xuất bảng chấm công định dạng CSV (mở ngay bằng Google Sheets hoặc Excel).</li>
              <li>Khôi phục dữ liệu mọi lúc trên mọi thiết bị Android hay máy tính.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <GoogleSignInButton
              onClick={onSignIn}
              isLoading={isLoggingIn}
              label="Đăng nhập Google để kết nối Drive"
              className="w-full sm:w-auto flex-1"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* User Account Info Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-600/50 flex items-center justify-center font-bold text-xs text-emerald-300">
                  {(userName || userEmail || 'G')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {userName || 'Tài khoản Google'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {userEmail || 'Đã cấp quyền truy cập Drive'}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
              title="Đăng xuất khỏi Google Drive"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickBackup}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSyncing ? 'Đang gửi...' : 'Sao lưu JSON'}</span>
            </button>

            <button
              onClick={handleQuickExportCSV}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-emerald-300 hover:text-white font-semibold text-xs border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Xuất CSV Bảng Công</span>
            </button>
          </div>

          {/* Status / Feedback message */}
          {lastSyncMsg && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{lastSyncMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
