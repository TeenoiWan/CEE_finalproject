/**
 * main.js
 * Entry point — เรียก init ทุก module
 *
 * โครงสร้างไฟล์:
 *   main.js      ← ตัวนี้ (entry)
 *   api.js       ← fetch / POST /scan
 *   scanner.js   ← drop zone + progress bar
 *   scans.js     ← recent scans list + modal
 */

import { initScanner } from './scanner.js';
import { initScans }   from './scans.js';
import { fetchScanHistory } from "./api.js";

/* ════════════════════════════
   Bootstrap
════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Token confirmed — reveal the page
  document.body.style.visibility = "visible";

  // ── Logout ──────────────────────────────────────────────
  const logoutBtn = document.querySelector(".btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("login.html");
    });
  }

  // Show logged-in user's name in the welcome bar
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const nameEl = document.querySelector(".welcome-text h1");
    if (nameEl && user.name) {
      nameEl.innerHTML = `Welcome back, ${user.name} <span class="wave">👋</span>`;
    }
  } catch (_e) {}
  // ────────────────────────────────────────────────────────

  // ── Theme Toggle ─────────────────────────────────────────
  const themeToggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme") || "dark";
  
  // Apply initial theme
  document.documentElement.setAttribute("data-theme", currentTheme);
  if (themeToggle) {
    themeToggle.textContent = currentTheme === "light" ? "☀️" : "🌙";
    
    themeToggle.addEventListener("click", () => {
      const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      themeToggle.textContent = newTheme === "light" ? "☀️" : "🌙";
    });
  }
  // ────────────────────────────────────────────────────────

  initClock();
  initScanner();

  try {
    const scans = await fetchScanHistory();
    initScans(scans);
  } catch (_error) {
    initScans([]);
  }
});

/* ════════════════════════════
   Clock
════════════════════════════ */
function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => (el.textContent = new Date().toLocaleTimeString('en-GB'));
  tick();
  setInterval(tick, 1000);
}

/* ════════════════════════════
   Mock initial data
   ลบออกได้เมื่อ backend พร้อม
════════════════════════════ */
function _mockInitialScans() {
  return [
    {
      scan_id:    'mock-001',
      file_name:  'invoice_Q4_2024.pdf',
      file_size:  2411724,
      risk_level: 'high',
      risk_score: 91,
      summary:    'พบ macro อันตรายและลิงก์ที่น่าสงสัย 3 รายการ',
      details: [
        { type: 'macro',       severity: 'high',   description: 'พบ VBA macro ที่ซ่อนอยู่' },
        { type: 'suspicious link', severity: 'medium', description: 'ลิงก์ไปยัง domain ที่ไม่รู้จัก' },
      ],
      scanned_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      scan_id:    'mock-002',
      file_name:  'contract_draft.pdf',
      file_size:  1153433,
      risk_level: 'medium',
      risk_score: 45,
      summary:    'พบข้อมูลส่วนตัวที่อาจรั่วไหล',
      details: [
        { type: 'PII', severity: 'medium', description: 'พบหมายเลขบัตรประชาชน' },
      ],
      scanned_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      scan_id:    'mock-003',
      file_name:  'report_annual.pdf',
      file_size:  4927488,
      risk_level: 'low',
      risk_score: 5,
      summary:    'ไม่พบความเสี่ยง',
      details:    [],
      scanned_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}