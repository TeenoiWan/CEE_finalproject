/**
 * api.js
 * จัดการการสื่อสารกับ Backend API ทั้งหมด
 *
 * Expected Response Format จาก POST /scan:
 * {
 *   "success": true,
 *   "data": {
 *     "scan_id":    "abc123",
 *     "file_name":  "document.pdf",
 *     "file_size":  204800,
 *     "risk_level": "high" | "medium" | "low",
 *     "risk_score": 87,           // 0–100
 *     "summary":    "พบ macro อันตราย...",
 *     "details": [
 *       { "type": "macro",   "severity": "high",   "description": "..." },
 *       { "type": "link",    "severity": "medium",  "description": "..." }
 *     ],
 *     "scanned_at": "2024-01-15T14:32:00Z"
 *   }
 * }
 *
 * Error Response:
 * {
 *   "success": false,
 *   "error": {
 *     "code":    "FILE_TOO_LARGE" | "UNSUPPORTED_TYPE" | "SCAN_FAILED",
 *     "message": "ข้อความแสดงข้อผิดพลาด"
 *   }
 * }
 */

const API_CONFIG = {
  BASE_URL: window.APP_API_BASE_URL || "http://54.158.23.156:3222/api",
  TIMEOUT_MS: 30000,
  MAX_SIZE_MB: 50,
};

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  const token = getToken();
  if (!token) {
    throw new ApiError("UNAUTHORIZED", "Please login first.");
  }
  return { Authorization: `Bearer ${token}` };
}

function normalizeScanResult(json, file) {
  const findings = Array.isArray(json?.findings) ? json.findings : [];
  const riskScore = Number(json?.riskScore || 0);
  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 30 ? "medium" : "low";
  const summary = findings.length
    ? `พบความเสี่ยง ${findings.length} รายการ`
    : "ไม่พบความเสี่ยง";

  return {
    scan_id: json?.scanId || null,
    file_name: file?.name || "manual-input",
    file_size: file?.size || 0,
    risk_level: riskLevel,
    risk_score: riskScore,
    summary,
    details: findings.map((item) => ({
      type: item.type || "Unknown",
      severity: riskLevel,
      description: item.value || "Sensitive content detected",
    })),
    scanned_at: new Date().toISOString(),
  };
}

export async function login(email, password) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new ApiError("LOGIN_FAILED", json?.error || "Login failed");
  }

  return json;
}

export async function register(name, email, password) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError("REGISTER_FAILED", json?.error || "Registration failed");
  }

  return json;
}

/**
 * อัปโหลดไฟล์และรับผล scan จาก API
 * @param {File} file
 * @param {function} onProgress  - callback(percent: number, label: string)
 * @returns {Promise<ScanResult>}
 */
export async function scanFile(file, onProgress = () => {}) {
  _validateFile(file);

  const formData = new FormData();
  formData.append("document", file);

  onProgress(10, 'Uploading file…');

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    onProgress(30, 'Sending to scanner…');

    const response = await fetch(`${API_CONFIG.BASE_URL}/scan`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
      signal: controller.signal,
    });

    onProgress(70, 'Analysing content…');

    const json = await response.json();

    if (!response.ok) {
      throw new ApiError(
        "SCAN_FAILED",
        json?.error || `HTTP ${response.status}`,
      );
    }

    onProgress(100, 'Scan complete ✓');
    return normalizeScanResult(json, file);

  } catch (err) {
    if (err.name === 'AbortError')
      throw new ApiError('TIMEOUT', 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * ดึงประวัติ scan ทั้งหมด (ถ้า backend รองรับ)
 * @returns {Promise<ScanResult[]>}
 */
export async function fetchScanHistory() {
  const response = await fetch(`${API_CONFIG.BASE_URL}/scans/history`, {
    headers: getAuthHeaders(),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new ApiError("FETCH_FAILED", json?.error || "Failed to load history");
  }

  const list = Array.isArray(json?.scans) ? json.scans : [];
  return list.map((item) => ({
    scan_id: item.id,
    file_name: item.fileName || "manual-input",
    file_size: 0,
    risk_level: Number(item.riskScore || 0) >= 70 ? "high" : Number(item.riskScore || 0) >= 30 ? "medium" : "low",
    risk_score: Number(item.riskScore || 0),
    summary: Array.isArray(item.categories) && item.categories.length
      ? `พบหมวดความเสี่ยง: ${item.categories.join(", ")}`
      : "ไม่พบความเสี่ยง",
    details: [],
    scanned_at: item.createdAt || new Date().toISOString(),
  }));
}

/* ── Private helpers ── */

function _validateFile(file) {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const maxBytes     = API_CONFIG.MAX_SIZE_MB * 1024 * 1024;

  if (!allowedTypes.includes(file.type))
    throw new ApiError('UNSUPPORTED_TYPE', `ไม่รองรับไฟล์ประเภท ${file.type}`);

  if (file.size > maxBytes)
    throw new ApiError('FILE_TOO_LARGE', `ไฟล์ต้องมีขนาดไม่เกิน ${API_CONFIG.MAX_SIZE_MB} MB`);
}

export async function deleteScan(scanId) {
  
  const response = await fetch(`${API_CONFIG.BASE_URL}/scans/${scanId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError("DELETE_FAILED", json?.error || "Failed to delete scan");
  }
  return json;
}

// api.js
export async function clearAllScans() {
  const response = await fetch(`${API_CONFIG.BASE_URL}/scans/all`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Include the actual HTTP status so you can distinguish 401 vs 404
    throw new ApiError("DELETE_FAILED", `[${response.status}] ${json?.error || "Failed to clear scans"}`);
  }
  return json;
}

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}