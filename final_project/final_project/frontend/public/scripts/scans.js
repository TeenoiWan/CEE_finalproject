/**
 * scans.js
 * จัดการ Recent Scans list — add, remove, filter, render
 * รับ ScanResult object จาก scanner.js
 */

import { deleteScan as apiDeleteScan, clearAllScans as apiClearAllScans } from './api.js';

/* ── DOM refs ── */
const scanList   = document.getElementById('scanList');
const filterBtns = document.querySelectorAll('[data-filter]');
const statsRed   = document.querySelector('.stat-card.red   .stat-value');
const statsYel   = document.querySelector('.stat-card.yellow .stat-value');
const statsGrn   = document.querySelector('.stat-card.green  .stat-value');

/* ── In-memory store ── */
let scans       = [];     // ScanResult[]
let activeFilter = 'all'; // 'all' | 'high' | 'medium' | 'low'

/* ════════════════════════════
   Init
════════════════════════════ */
export function initScans(initialScans = []) {
  scans = initialScans;
  _render();
  _updateStats();

  /* Filter buttons */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _render();
    });
  });

  /* Clear all */
  document.getElementById('btnClearAll')
    ?.addEventListener('click', clearScans);
}

/* ════════════════════════════
   Public API
════════════════════════════ */

/**
 * เพิ่ม scan ใหม่ (เรียกจาก scanner.js)
 * @param {object} result - ScanResult จาก API
 */
export function addScanItem(result) {
  const item = _normalise(result);
  scans.unshift(item);
  _render();
  _updateStats();
  _animateNewItem();
}

/**
 * ลบ scan ออก
 * @param {string} scanId
 */
export async function removeScanItem(scanId) {
  if (scanId) {                          // ← only call API if we have a real ID
    try {
      await apiDeleteScan(scanId);
    } catch (err) {
     console.warn('[scans] clear API failed:', err.message); // will now show [401] or [404]
}
  }
  scans = scans.filter(s => s.scan_id !== scanId);
  _render();
  _updateStats();
}

/**
 * ล้างทั้งหมด
 */
export async function clearScans() {
  try {
    await apiClearAllScans();
  } catch (err) {
  console.warn('[scans] clear API failed:', err.message); // will now show [401] or [404]
}
  scans = [];
  _render();
  _updateStats();
}

/* ════════════════════════════
   Render
════════════════════════════ */
function _render() {
  const filtered = activeFilter === 'all'
    ? scans
    : scans.filter(s => s.risk_level === activeFilter);

  if (filtered.length === 0) {
    scanList.innerHTML = `
      <p class="scan-empty">ไม่มีรายการ${activeFilter !== 'all' ? 'ที่ตรงกับตัวกรอง' : ''}</p>`;
    return;
  }

  scanList.innerHTML = filtered.map(_renderItem).join('');

  /* Bind remove buttons */
  scanList.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeScanItem(btn.dataset.id);
    });
  });

  /* Bind view buttons */
  scanList.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _openDetail(btn.dataset.id);
    });
  });
}

function _renderItem(s) {
  const cfg = _riskConfig(s.risk_level);
  const mb  = s.file_size ? (s.file_size / 1048576).toFixed(1) + ' MB' : '—';
  const time = _formatTime(s.scanned_at);

  return `
    <div class="scan-item" data-id="${s.scan_id}">
      <div class="scan-icon ${cfg.cls}">${cfg.icon}</div>
      <div class="scan-info">
        <p class="scan-name">${_escHtml(s.file_name)}</p>
        <p class="scan-meta">${mb} &nbsp;·&nbsp; ${time}</p>
      </div>
      ${s.risk_score != null
        ? `<span class="risk-score ${cfg.cls}">${s.risk_score}</span>`
        : ''}
      <span class="scan-badge ${cfg.cls}">
        <span class="badge-dot"></span>${cfg.label}
      </span>
      <button class="btn-view"   data-id="${s.scan_id}">View →</button>
      <button class="btn-remove" data-id="${s.scan_id}" title="Remove">✕</button>
    </div>`;
}

/* ════════════════════════════
   Detail modal (lightweight)
════════════════════════════ */
function _openDetail(scanId) {
  const s = scans.find(x => x.scan_id === scanId);
  if (!s) return;

  const cfg      = _riskConfig(s.risk_level);
  const existing = document.getElementById('scanModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id        = 'scanModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-icon ${cfg.cls}">${cfg.icon}</span>
        <div>
          <p class="modal-filename">${_escHtml(s.file_name)}</p>
          <span class="scan-badge ${cfg.cls}">
            <span class="badge-dot"></span>${cfg.label}
            ${s.risk_score != null ? ` · Score ${s.risk_score}/100` : ''}
          </span>
        </div>
        <button class="modal-close" id="modalClose">✕</button>
      </div>

      ${s.summary ? `<p class="modal-summary">${_escHtml(s.summary)}</p>` : ''}

      ${s.details?.length ? `
        <div class="modal-details">
          <p class="modal-section-title">รายละเอียดที่พบ</p>
          ${s.details.map(d => `
            <div class="modal-detail-row">
              <span class="detail-badge ${d.severity}">${d.type}</span>
              <span class="detail-desc">${_escHtml(d.description)}</span>
            </div>`).join('')}
        </div>` : ''}

      <p class="modal-time">สแกนเมื่อ ${_formatTime(s.scanned_at, true)}</p>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));

  const close = () => { modal.classList.remove('open'); setTimeout(() => modal.remove(), 250); };
  document.getElementById('modalClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

/* ════════════════════════════
   Stats counter
════════════════════════════ */
function _updateStats() {
  if (statsRed) statsRed.textContent = scans.filter(s => s.risk_level === 'high').length;
  if (statsYel) statsYel.textContent = scans.filter(s => s.risk_level === 'medium').length;
  if (statsGrn) statsGrn.textContent = scans.filter(s => s.risk_level === 'low').length;
}

/* ════════════════════════════
   Animate newest item
════════════════════════════ */
function _animateNewItem() {
  const first = scanList.querySelector('.scan-item');
  if (!first) return;
  first.classList.add('new');
  requestAnimationFrame(() => first.classList.remove('new'));
}

/* ════════════════════════════
   Helpers
════════════════════════════ */

/** แปลง API response → internal format */
function _normalise(raw) {
  return {
    scan_id:    raw.scan_id    || _uid(),
    file_name:  raw.file_name  || 'unknown',
    file_size:  raw.file_size  || 0,
    risk_level: _mapRisk(raw.risk_level),
    risk_score: raw.risk_score ?? null,
    summary:    raw.summary    || '',
    details:    raw.details    || [],
    scanned_at: raw.scanned_at || new Date().toISOString(),
  };
}

function _mapRisk(level = '') {
  const map = { high: 'high', medium: 'medium', low: 'low', safe: 'low' };
  return map[level.toLowerCase()] || 'low';
}

function _riskConfig(level) {
  return {
    high:   { cls: 'red',    icon: '⚠️', label: 'High Risk' },
    medium: { cls: 'yellow', icon: '🔍', label: 'Medium'    },
    low:    { cls: 'green',  icon: '✅', label: 'Safe'      },
  }[level] || { cls: 'green', icon: '✅', label: 'Safe' };
}

function _formatTime(iso, full = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (full) return d.toLocaleString('th-TH');
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? `Today, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const _escHtml = s => s.replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const _uid = () => Math.random().toString(36).slice(2, 10);