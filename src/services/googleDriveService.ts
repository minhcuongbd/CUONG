import { getAccessToken } from './googleDriveAuth';
import { CheckInRecord } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

export interface DriveAboutInfo {
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
  limitBytes?: number;
  usageBytes?: number;
}

/**
 * Helper to get active Bearer header or throw if unauthenticated
 */
async function getAuthHeader(): Promise<HeadersInit> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn. Vui lòng bấm "Đăng nhập Google" lại.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetch information about current Google Drive user and storage quota
 */
export async function fetchDriveAbout(): Promise<DriveAboutInfo> {
  const headers = await getAuthHeader();
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Lỗi lấy thông tin Google Drive (${res.status})`);
  }

  const data = await res.json();
  return {
    userName: data.user?.displayName,
    userEmail: data.user?.emailAddress,
    userPhoto: data.user?.photoLink,
    limitBytes: data.storageQuota?.limit ? Number(data.storageQuota.limit) : undefined,
    usageBytes: data.storageQuota?.usage ? Number(data.storageQuota.usage) : undefined,
  };
}

/**
 * List files from Google Drive
 * @param query Optional search query in Google Drive format (e.g. name contains 'minh_cuong')
 * @param pageSize Number of files to return (default 20)
 */
export async function listDriveFiles(query?: string, pageSize = 20): Promise<DriveFileItem[]> {
  const headers = await getAuthHeader();
  const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink)';
  
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    fields,
    orderBy: 'modifiedTime desc',
  });

  if (query && query.trim()) {
    // Only fetch non-trashed files matching the search
    params.set('q', `trashed = false and (${query.trim()})`);
  } else {
    params.set('q', 'trashed = false');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Lỗi tải danh sách tệp Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Upload a JSON or CSV file to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string,
  mimeType: string,
  description?: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Chưa có token xác thực Google Drive.');
  }

  const metadata = {
    name: fileName,
    mimeType,
    description: description || 'Tệp tạo bởi ứng dụng MINH CƯỜNG Check-In Alarm',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Lỗi tải tệp lên Google Drive (${res.status})`);
  }

  return await res.json();
}

/**
 * Download file text content from Google Drive
 */
export async function downloadDriveFileContent(fileId: string): Promise<string> {
  const headers = await getAuthHeader();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Không thể đọc nội dung tệp từ Google Drive (${res.status})`);
  }

  return await res.text();
}

/**
 * Permanently delete a file or move to trash in Google Drive.
 * NOTE: Calling UI MUST present an explicit confirmation dialog before invoking this!
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const headers = await getAuthHeader();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok && res.status !== 204) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Không thể xóa tệp từ Google Drive (${res.status})`);
  }

  return true;
}

/**
 * Generate CSV text for check-in records
 */
export function generateCheckInCSV(records: CheckInRecord[]): string {
  const headers = ['Mã chấm công', 'Ngày', 'Giờ chấm', 'Trạng thái', 'Công ty', 'Khoảng cách (m)', 'Ghi chú'];
  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.dateStr}"`,
    `"${r.formattedTime}"`,
    `"${r.status === 'ON_TIME' ? 'Đúng giờ' : 'Trễ giờ'}"`,
    `"${(r.companyName || '').replace(/"/g, '""')}"`,
    r.distanceAtCheckin,
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

/**
 * Backup Check-In Records to Google Drive as JSON
 */
export async function backupRecordsToDrive(records: CheckInRecord[]): Promise<DriveFileItem> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `minh_cuong_checkins_backup_${dateStr}_${timeStr}.json`;
  
  const payload = {
    appName: 'MINH CƯỜNG Check-In Alarm',
    exportedAt: now.toISOString(),
    totalRecords: records.length,
    records,
  };

  return await uploadFileToDrive(
    fileName,
    JSON.stringify(payload, null, 2),
    'application/json',
    `Bản sao lưu lịch sử chấm công MINH CƯỜNG ngày ${dateStr} lúc ${now.toLocaleTimeString('vi-VN')}`
  );
}

/**
 * Export Check-In Records to Google Drive as CSV (Spreadsheet-friendly)
 */
export async function exportRecordsToCSVInDrive(records: CheckInRecord[]): Promise<DriveFileItem> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `Bang_Cham_Cong_Minh_Cuong_${dateStr}.csv`;
  const csvContent = '\uFEFF' + generateCheckInCSV(records); // Include BOM for Vietnamese Excel compatibility

  return await uploadFileToDrive(
    fileName,
    csvContent,
    'text/csv',
    `Bảng chấm công xuất từ ứng dụng MINH CƯỜNG ngày ${dateStr}`
  );
}
