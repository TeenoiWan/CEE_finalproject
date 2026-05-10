/**
 * scanner.js
 * ควบคุม Drop Zone, Progress Bar และเรียก API
 * import จาก api.js และส่งผลลัพธ์ไปยัง scans.js
 */

import { scanFile, ApiError } from './api.js';
import { addScanItem }        from './scans.js';

/* ── DOM refs ── */
const dropZone     = document.getElementById('dropZone');
const fileInput    = document.getElementById('fileInput');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressLbl  = document.getElementById('progressLabel');
const progressPct  = document.getElementById('progressPct');

/* ── State ── */
let isScanning = false;

/* ════════════════════════════
   Init — bind events
════════════════════════════ */
export function initScanner() {
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) startScan(fileInput.files[0]);
  });

  dropZone.addEventListener('click', () => {
    if (!isScanning) fileInput.click();
  });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    if (!isScanning) dropZone.classList.add('dragging');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file && !isScanning) startScan(file);
  });
}

/* ════════════════════════════
   Start scan flow
════════════════════════════ */
async function startScan(file) {
  if (isScanning) return;
  isScanning = true;
  _lockDropZone(true);
  _showProgress();

  try {
    const result = await scanFile(file, _onProgress);
    _setProgress(100, 'Scan complete ✓');

    await _delay(600);
    addScanItem(result);             // ส่งผลไป scans.js
    _resetProgress();

  } catch (err) {
    _handleError(err);
  } finally {
    isScanning = false;
    _lockDropZone(false);
    fileInput.value = '';            // reset input ให้เลือกซ้ำได้
  }
}

/* ════════════════════════════
   Progress helpers
════════════════════════════ */
function _onProgress(percent, label) {
  _setProgress(percent, label);
}

function _setProgress(percent, label) {
  progressFill.style.width = `${percent}%`;
  progressPct.textContent  = `${Math.floor(percent)}%`;
  progressLbl.textContent  = label;
}

function _showProgress() {
  progressWrap.style.display = 'block';
  _setProgress(0, 'Preparing…');
}

function _resetProgress() {
  setTimeout(() => {
    progressWrap.style.display = 'none';
    progressFill.style.width   = '0%';
  }, 400);
}

/* ════════════════════════════
   Error display
════════════════════════════ */
function _handleError(err) {
  const msg = err instanceof ApiError
    ? `[${err.code}] ${err.message}`
    : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';

  progressLbl.textContent = `❌ ${msg}`;
  progressPct.textContent = '';
  progressFill.style.background = 'var(--red)';

  setTimeout(_resetProgress, 3000);
  console.error('[Scanner]', err);
}

/* ════════════════════════════
   Lock / unlock drop zone
════════════════════════════ */
function _lockDropZone(locked) {
  dropZone.classList.toggle('scanning', locked);
  dropZone.style.pointerEvents = locked ? 'none' : '';
  dropZone.style.opacity       = locked ? '0.7'  : '';
}

/* ── Utility ── */
const _delay = ms => new Promise(r => setTimeout(r, ms));
