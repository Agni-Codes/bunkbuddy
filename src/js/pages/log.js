// ─── Attendance Log Page v3 ───────────────────────────────────────────────────
// Timetable-driven logging. Shows only scheduled classes for the selected weekday.
// Supports custom extra classes and standard 1x attendance.

import { getData, saveData, getLog, setLog, today } from '../storage.js';
import { showToast } from '../toast.js';

let currentDate = today();

// ─── Entry point ──────────────────────────────────────────────────────────────

export function renderLog(container, targetDate) {
  const calDate = sessionStorage.getItem('bunkbuddy_log_date');
  if (calDate) {
    currentDate = calDate;
    sessionStorage.removeItem('bunkbuddy_log_date');
  } else {
    currentDate = targetDate || today();
  }
  drawPage(container);
}

// ─── Main draw ────────────────────────────────────────────────────────────────

function drawPage(container) {
  const data       = getData();
  const todayStr   = today();
  const isToday    = currentDate === todayStr;
  const isPast     = currentDate < todayStr;
  
  // Weekday details
  const dayOfWeek  = getWeekdayName(currentDate);
  const scheduled  = data.timetable[dayOfWeek] || [];
  const logged     = getLog(currentDate);

  // Merge scheduled timetable slots and logged slots for this day
  const displayItems = [];
  const processedSlotIds = new Set();

  scheduled.forEach(slot => {
    const logEntry = logged[slot.id];
    let status = null;
    if (logEntry) {
      status = typeof logEntry === 'object' ? logEntry.status : logEntry;
    }
    displayItems.push({
      id: slot.id,
      subjectId: slot.subjectId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: status,
      isExtra: false
    });
    processedSlotIds.add(slot.id);
  });

  // Include any extra class logs
  Object.entries(logged).forEach(([slotId, logVal]) => {
    if (processedSlotIds.has(slotId)) return;
    let subjectId, status, startTime, endTime;
    if (logVal && typeof logVal === 'object') {
      subjectId = logVal.subjectId;
      status    = logVal.status;
      startTime = logVal.startTime || '--';
      endTime   = logVal.endTime || '--';
    } else {
      subjectId = slotId;
      status    = logVal;
      startTime = '--';
      endTime   = '--';
    }
    displayItems.push({
      id: slotId,
      subjectId,
      startTime,
      endTime,
      status,
      isExtra: true
    });
  });

  // Sort chronologically
  displayItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

  container.innerHTML = `
    <div class="page-enter" id="log-root">
      <div class="page-header">
        <div>
          <h1 class="page-title">Attendance Log</h1>
          <p class="page-sub">Mark your scheduled classes for the day</p>
        </div>
      </div>

      <!-- Date navigator -->
      <div class="log-date-nav">
        <button class="btn-icon" id="log-prev" aria-label="Previous day">
          <i data-lucide="chevron-left"></i>
        </button>
        <div class="log-date-center">
          <div class="log-date-display">${formatDateDisplay(currentDate)}</div>
          <div class="log-date-sub">
            ${isToday ? '📅 Today' : isPast ? 'Past date — editing allowed' : '⚠️ Future date'} 
            (${dayOfWeek})
          </div>
        </div>
        <button class="btn-icon" id="log-next" ${currentDate >= todayStr ? 'disabled' : ''} aria-label="Next day">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>

      <!-- Subject cards -->
      ${displayItems.length === 0
        ? buildNoClasses(dayOfWeek)
        : buildSubjectGrid(displayItems, data.subjects)
      }

      <!-- Bulk actions -->
      ${displayItems.length > 0 ? `
        <div class="log-bulk-bar">
          <button class="btn btn-ghost btn-sm" id="log-all-present">
            <i data-lucide="check-check"></i> All present
          </button>
          <button class="btn btn-ghost btn-sm" id="log-all-absent">
            <i data-lucide="ban"></i> All absent
          </button>
          <button class="btn btn-ghost btn-sm" id="log-clear-day">
            <i data-lucide="rotate-ccw"></i> Clear day
          </button>
        </div>
      ` : ''}

      <!-- Add Unscheduled Class section -->
      <div class="card mt-lg" style="border-style: dashed;">
        <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.375rem;">
          <i data-lucide="plus-circle" style="width:16px;height:16px;color:var(--accent);"></i>
          <span>Log Unscheduled / Extra Class</span>
        </div>
        <p class="text-xs text-muted mb-md">Had a special class, test, or schedule change? Log it here without modifying your timetable.</p>
        
        <div class="flex-col gap-sm">
          <div class="form-group">
            <label class="form-label" for="extra-subject">Subject</label>
            <select class="form-select" id="extra-subject" style="padding: 0.45rem 2rem 0.45rem 0.6rem; font-size: 0.82rem;">
              <option value="">-- Select Subject --</option>
              ${data.subjects.map(sub => `
                <option value="${sub.id}">${escHtml(sub.name)}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-row" style="gap:0.5rem">
            <div class="form-group">
              <label class="form-label" for="extra-start">Start time</label>
              <input class="form-input" id="extra-start" type="time" style="padding: 0.4rem; font-size: 0.82rem;" value="12:00">
            </div>
            <div class="form-group">
              <label class="form-label" for="extra-end">End time</label>
              <input class="form-input" id="extra-end" type="time" style="padding: 0.4rem; font-size: 0.82rem;" value="12:50">
            </div>
          </div>
          <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
            <button class="btn btn-ghost btn-sm" id="log-extra-present" style="flex:1; justify-content:center; border-color:var(--safe); color:var(--safe);">
              ✓ Log Present
            </button>
            <button class="btn btn-ghost btn-sm" id="log-extra-absent" style="flex:1; justify-content:center; border-color:var(--danger); color:var(--danger);">
              ✗ Log Absent
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  attachListeners(container, displayItems, data.subjects);
}

// ─── Subject grid ─────────────────────────────────────────────────────────────

function buildSubjectGrid(displayItems, subjects) {
  return `
    <div class="log-subject-grid" id="log-subject-grid">
      ${displayItems.map(item => {
        const sub = subjects.find(s => s.id === item.subjectId);
        return buildSubjectCard(item, sub);
      }).join('')}
    </div>
  `;
}

function buildSubjectCard(item, sub) {
  const cardClass = item.status ? `status-${item.status}` : '';
  const statusText = {
    present:   'Present ✓',
    absent:    'Absent ✗',
    cancelled: 'Cancelled'
  }[item.status] || '';
  const statusClass = item.status || '';

  return `
    <div class="log-subject-card ${cardClass}" data-sub-id="${item.id}">
      <!-- Top row: name + time + badges -->
      <div class="log-subject-top">
        <div class="log-subject-info">
          <div class="log-subject-dot" style="background:${sub ? sub.color : '#ccc'}"></div>
          <span class="log-subject-name">${escHtml(sub ? sub.name : 'Unknown')}</span>
        </div>
        <div class="log-subject-badges">
          <span style="font-size:0.75rem; font-weight:600; color:var(--text-2); font-variant-numeric: tabular-nums; margin-right: 4px;">
            ${item.startTime} - ${item.endTime}
          </span>
          ${item.isExtra ? `<span class="badge badge-accent" style="font-size:0.6rem; padding:0.1rem 0.35rem;">Extra</span>` : ''}
          ${item.status ? `<span class="log-subject-status-text ${statusClass}">${statusText}</span>` : ''}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="log-action-row">
        <button class="log-action-btn ${item.status === 'present' ? 'active-present' : ''}"
          data-log-action="present" data-slot-id="${item.id}">
          ✓ Present
        </button>
        <button class="log-action-btn ${item.status === 'absent' ? 'active-absent' : ''}"
          data-log-action="absent" data-slot-id="${item.id}">
          ✗ Absent
        </button>
        <button class="log-action-btn ${item.status === 'cancelled' ? 'active-cancelled' : ''}"
          data-log-action="cancelled" data-slot-id="${item.id}">
          — Cancel
        </button>
      </div>
    </div>
  `;
}

function buildNoClasses(dayOfWeek) {
  return `
    <div class="empty-state" style="padding: 2rem 1.5rem;">
      <div class="empty-emoji">📅</div>
      <div class="empty-title">No scheduled classes</div>
      <div class="empty-sub">
        You don't have any classes scheduled for <strong>${dayOfWeek}</strong>.
        You can log an unscheduled class below or modify your schedule in <a href="#/settings" style="color:var(--accent);font-weight:600">Settings</a>.
      </div>
    </div>
  `;
}

// ─── Event listeners ──────────────────────────────────────────────────────────

function attachListeners(container, displayItems, subjects) {
  // Date navigation
  container.querySelector('#log-prev')?.addEventListener('click', () => {
    currentDate = offsetDate(currentDate, -1);
    drawPage(container);
  });

  container.querySelector('#log-next')?.addEventListener('click', () => {
    if (currentDate < today()) {
      currentDate = offsetDate(currentDate, 1);
      drawPage(container);
    }
  });

  // Action clicks
  container.querySelectorAll('[data-log-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.logAction;
      const slotId = btn.dataset.slotId;
      const item   = displayItems.find(x => x.id === slotId);
      if (!item) return;

      const currentEntry = getLog(currentDate)[slotId];
      const currentStatus = currentEntry && typeof currentEntry === 'object' ? currentEntry.status : currentEntry;

      const newStatus = currentStatus === action ? null : action;

      if (newStatus === null) {
        setLog(currentDate, slotId, null);
      } else {
        setLog(currentDate, slotId, {
          subjectId: item.subjectId,
          status: newStatus,
          startTime: item.startTime,
          endTime: item.endTime
        });
      }

      drawPage(container);
    });
  });

  // Bulk actions
  container.querySelector('#log-all-present')?.addEventListener('click', () => {
    displayItems.forEach(item => {
      setLog(currentDate, item.id, {
        subjectId: item.subjectId,
        status: 'present',
        startTime: item.startTime,
        endTime: item.endTime
      });
    });
    drawPage(container);
    showToast('All marked present ✓', 'success', 2000);
  });

  container.querySelector('#log-all-absent')?.addEventListener('click', () => {
    displayItems.forEach(item => {
      setLog(currentDate, item.id, {
        subjectId: item.subjectId,
        status: 'absent',
        startTime: item.startTime,
        endTime: item.endTime
      });
    });
    drawPage(container);
    showToast('All marked absent', 'info', 2000);
  });

  container.querySelector('#log-clear-day')?.addEventListener('click', () => {
    displayItems.forEach(item => {
      setLog(currentDate, item.id, null);
    });
    drawPage(container);
    showToast('Day cleared', 'info', 1800);
  });

  // Extra class logging
  const handleLogExtra = (status) => {
    const subjectId = document.getElementById('extra-subject').value;
    const startTime = document.getElementById('extra-start').value;
    const endTime   = document.getElementById('extra-end').value;

    if (!subjectId) { showToast('Please select a subject.', 'warning'); return; }
    if (!startTime || !endTime) { showToast('Please select times.', 'warning'); return; }
    if (startTime >= endTime) { showToast('End time must be after start time.', 'warning'); return; }

    const extraId = 'extra_' + Math.random().toString(36).slice(2, 10);
    setLog(currentDate, extraId, {
      subjectId,
      status,
      startTime,
      endTime
    });

    showToast('Extra class logged!', 'success', 1500);
    drawPage(container);
  };

  container.querySelector('#log-extra-present')?.addEventListener('click', () => handleLogExtra('present'));
  container.querySelector('#log-extra-absent')?.addEventListener('click', () => handleLogExtra('absent'));
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getWeekdayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
