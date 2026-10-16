import { useState, useEffect } from 'react';
import {
  Cloud,
  FileSpreadsheet,
  FileText,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  UploadCloud,
  Download,
  AlertTriangle,
  X,
  HardDrive,
  FileCode,
  FolderOpen,
  Plus,
} from 'lucide-react';
import {
  DriveFileItem,
  listDriveFiles,
  deleteDriveFile,
  backupRecordsToDrive,
  exportRecordsToCSVInDrive,
  downloadDriveFileContent,
  uploadFileToDrive,
} from '../services/googleDriveService';
import { CheckInRecord } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: CheckInRecord[];
  userEmail?: string;
  userName?: string;
  onRestoreRecords?: (restored: CheckInRecord[]) => void;
  onNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export function GoogleDriveModal({
  isOpen,
  onClose,
  records,
  userEmail,
  userName,
  onRestoreRecords,
  onNotification,
}: GoogleDriveModalProps) {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'backups' | 'all'>('backups');
  const [isOperating, setIsOperating] = useState<boolean>(false);

  // Destructive Confirmation Modal State (MANDATORY REQUIREMENT)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);

  // Restore Confirmation Modal State
  const [restoreCandidate, setRestoreCandidate] = useState<{
    file: DriveFileItem;
    records: CheckInRecord[];
  } | null>(null);

  // Custom File Create State
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('Ghi_Chu_Cham_Cong.txt');
  const [newFileContent, setNewFileContent] = useState<string>('Báo cáo giải trình chấm công:\nNgày: \nLý do: ');

  // Fetch Drive Files
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      let q = '';
      if (activeTab === 'backups') {
        q = "name contains 'minh_cuong' or name contains 'Bang_Cham_Cong'";
      }
      if (searchQuery.trim()) {
        const searchPart = `name contains '${searchQuery.trim()}'`;
        q = q ? `${q} and ${searchPart}` : searchPart;
      }

      const fetched = await listDriveFiles(q || undefined, 30);
      setFiles(fetched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định khi tải Google Drive';
      onNotification?.(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Backup Now
  const handleBackupNow = async () => {
    setIsOperating(true);
    try {
      const res = await backupRecordsToDrive(records);
      onNotification?.(`Đã sao lưu thành công ${records.length} bản ghi lên Google Drive (${res.name})!`, 'success');
      await fetchFiles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sao lưu thất bại';
      onNotification?.(message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // Handle Export CSV Now
  const handleExportCSV = async () => {
    setIsOperating(true);
    try {
      const res = await exportRecordsToCSVInDrive(records);
      onNotification?.(`Đã xuất bảng chấm công CSV thành công lên Google Drive (${res.name})!`, 'success');
      await fetchFiles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xuất CSV thất bại';
      onNotification?.(message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // Handle Custom Note Upload
  const handleCreateCustomFile = async () => {
    if (!newFileName.trim()) return;
    setIsOperating(true);
    try {
      await uploadFileToDrive(newFileName.trim(), newFileContent, 'text/plain');
      onNotification?.(`Đã tạo tệp "${newFileName}" trên Google Drive!`, 'success');
      setIsCreatingFile(false);
      await fetchFiles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tạo tệp thất bại';
      onNotification?.(message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // Handle Execute Destructive Delete (AFTER user confirms in UI)
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsOperating(true);
    const targetFile = fileToDelete;
    setFileToDelete(null); // Close modal
    try {
      await deleteDriveFile(targetFile.id);
      onNotification?.(`Đã xóa vĩnh viễn tệp "${targetFile.name}" khỏi Google Drive!`, 'success');
      setFiles((prev) => prev.filter((f) => f.id !== targetFile.id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xóa tệp thất bại';
      onNotification?.(message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // Handle Load Backup Content to prepare restore
  const handlePrepareRestore = async (file: DriveFileItem) => {
    setIsOperating(true);
    try {
      const raw = await downloadDriveFileContent(file.id);
      const parsed = JSON.parse(raw);
      const candidateRecords: CheckInRecord[] = Array.isArray(parsed.records)
        ? parsed.records
        : Array.isArray(parsed)
        ? parsed
        : [];

      if (!candidateRecords.length) {
        throw new Error('Tệp này không chứa dữ liệu chấm công hợp lệ.');
      }

      setRestoreCandidate({
        file,
        records: candidateRecords,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể đọc tệp sao lưu';
      onNotification?.(message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!restoreCandidate || !onRestoreRecords) return;
    onRestoreRecords(restoreCandidate.records);
    onNotification?.(`Đã khôi phục thành công ${restoreCandidate.records.length} bản ghi chấm công từ Google Drive!`, 'success');
    setRestoreCandidate(null);
  };

  // Helper to format file size
  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const b = parseInt(bytesStr, 10);
    if (isNaN(b)) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to format date
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-950/50 overflow-hidden text-slate-100">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20">
              <Cloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Google Drive Cloud Sync</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Đã kết nối
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {userEmail || userName || 'Tài khoản Google đang hoạt động'}
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

        {/* Action Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBackupNow}
              disabled={isOperating}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Sao lưu JSON ({records.length} bản ghi)</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isOperating}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-emerald-300 hover:text-white font-semibold text-xs border border-emerald-500/30 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Xuất CSV Bảng Chấm Công</span>
            </button>

            <button
              onClick={() => setIsCreatingFile(!isCreatingFile)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>Tạo ghi chú lên Drive</span>
            </button>
          </div>

          {/* New Custom Note form (collapsible) */}
          {isCreatingFile && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2 animate-fade-in">
              <div className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                <span>Tạo tệp văn bản / giải trình chấm công mới lên Google Drive</span>
                <button
                  onClick={() => setIsCreatingFile(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Đóng
                </button>
              </div>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Tên tệp (vd: Giai_Trinh_Cham_Cong.txt)"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                rows={3}
                placeholder="Nội dung ghi chú..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreatingFile(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateCustomFile}
                  disabled={isOperating}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Lưu lên Google Drive
                </button>
              </div>
            </div>
          )}

          {/* Search and Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('backups')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'backups'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sao lưu & Bảng công
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả tệp Drive
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
                  placeholder="Tìm tệp..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={fetchFiles}
                disabled={isLoading}
                title="Làm mới danh sách"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* File List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
              <p className="text-xs">Đang đồng bộ danh sách từ Google Drive...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-300">Chưa có tệp nào phù hợp</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Hãy nhấn &quot;Sao lưu JSON&quot; hoặc &quot;Xuất CSV&quot; phía trên để tạo bản lưu đầu tiên lên Google Drive của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const isJson = file.name.endsWith('.json') || file.mimeType.includes('json');
                const isCsv = file.name.endsWith('.csv') || file.mimeType.includes('csv');

                return (
                  <div
                    key={file.id}
                    className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-emerald-500/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/60">
                        {isCsv ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        ) : isJson ? (
                          <FileCode className="w-4 h-4 text-teal-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition">
                            {file.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{formatDate(file.modifiedTime)}</span>
                          <span>•</span>
                          <span>{formatSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Restore option if JSON backup */}
                      {isJson && onRestoreRecords && (
                        <button
                          onClick={() => handlePrepareRestore(file)}
                          disabled={isOperating}
                          title="Khôi phục danh sách chấm công từ tệp này"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Khôi phục</span>
                        </button>
                      )}

                      {/* Direct Link to Google Drive */}
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở trong Google Drive"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delete File Button (triggers confirmation modal) */}
                      <button
                        onClick={() => setFileToDelete(file)}
                        disabled={isOperating}
                        title="Xóa tệp khỏi Google Drive"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đồng bộ an toàn trực tiếp với Google Drive</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* ======================================================== */}
        {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE ACTION */}
        {/* ======================================================== */}
        {fileToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-5 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Xác nhận xóa tệp trên Google Drive?
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Bạn có chắc chắn muốn xóa vĩnh viễn tệp sau khỏi tài khoản Google Drive của bạn không?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-rose-300 truncate">
                  📄 {fileToDelete.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  Kích thước: {formatSize(fileToDelete.size)} • Cập nhật: {formatDate(fileToDelete.modifiedTime)}
                </div>
                <div className="text-[10px] text-rose-400/90 italic pt-1">
                  ⚠️ Hành động này sẽ xóa dữ liệu trên đám mây và không thể hoàn tác.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setFileToDelete(null)}
                  disabled={isOperating}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isOperating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác nhận xóa tệp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESTORE CONFIRMATION MODAL */}
        {restoreCandidate && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-5 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Khôi phục dữ liệu chấm công từ Drive
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Bạn có muốn nhập <strong>{restoreCandidate.records.length} bản ghi</strong> từ bản sao lưu &quot;{restoreCandidate.file.name}&quot; vào ứng dụng không?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                Các bản ghi này sẽ được tích hợp vào lịch sử chấm công hiện tại của bạn.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRestoreCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleExecuteRestore}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xác nhận nhập dữ liệu</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
