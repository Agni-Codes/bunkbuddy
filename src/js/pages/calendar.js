// ─── Calendar Page v2 ────────────────────────────────────────────────────────
// Semester-aware: locked to semester start/end dates.
// Days outside the semester range are greyed and non-clickable.

import { getData, today } from '../storage.js';

let viewYear, viewMonth;

// ─── Entry point ──────────────────────────────────────────────────────────────

export function renderCalendar(container) {
  const { semester } = getData();

  // Start at the semester start month (or today if before semester)
  const ref = semester.start
    ? new Date(semester.start + 'T00:00:00')
    : new Date();
  const todayDate = new Date(today() + 'T00:00:00');

  // If today is after semester start, start at today's month
  const startRef = ref > todayDate ? ref : todayDate;
  viewYear  = startRef.getFullYear();
  viewMonth = startRef.getMonth();

  drawCalendar(container);
}

// ─── Main draw ────────────────────────────────────────────────────────────────

function drawCalendar(container) {
  const data      = getData();
  const logs      = data.logs;
  const todayStr  = today();
  const semStart  = data.semester.start || '';
  const semEnd    = data.semester.end   || '';

  const monthName = new Date(viewYear, viewMonth)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Build day grid (Mon-first)
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // 0=Mon … 6=Sun

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Navigation limits
  const semStartDate = semStart ? new Date(semStart + 'T00:00:00') : null;
  const semEndDate   = semEnd   ? new Date(semEnd   + 'T00:00:00') : null;
  const viewDate     = new Date(viewYear, viewMonth);

  const canGoPrev = semStartDate
    ? viewDate > new Date(semStartDate.getFullYear(), semStartDate.getMonth())
    : true;
  const canGoNext = semEndDate
    ? viewDate < new Date(semEndDate.getFullYear(), semEndDate.getMonth())
    : true;

  container.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendar</h1>
          <p class="page-sub">
            ${semStart && semEnd
              ? `Semester: ${fmtDate(semStart)} → ${fmtDate(semEnd)}`
              : 'Visual attendance history'}
          </p>
        </div>
      </div>

      <div class="card">
        <!-- Month navigation -->
        <div class="calendar-header">
          <button class="btn-icon" id="cal-prev" aria-label="Previous month"
            ${canGoPrev ? '' : 'disabled style="opacity:0.3;cursor:not-allowed"'}>
            <i data-lucide="chevron-left"></i>
          </button>
          <span class="calendar-title">${monthName}</span>
          <button class="btn-icon" id="cal-next" aria-label="Next month"
            ${canGoNext ? '' : 'disabled style="opacity:0.3;cursor:not-allowed"'}>
            <i data-lucide="chevron-right"></i>
          </button>
        </div>

        <!-- Weekday labels -->
        <div class="calendar-weekdays">
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
            `<div class="calendar-weekday">${d}</div>`
          ).join('')}
        </div>

        <!-- Day grid -->
        <div class="calendar-grid">
          ${cells.map(day => {
            if (!day) return `<div></div>`;

            const dateStr   = `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`;
            const isToday   = dateStr === todayStr;
            const isSemEnd  = dateStr === semEnd;
            const dayLog    = logs[dateStr] || {};
            const statuses  = Object.values(dayLog);
            const hasData   = statuses.length > 0;

            // Is this day outside the semester range?
            const beforeSem = semStart && dateStr < semStart;
            const afterSem  = semEnd   && dateStr > semEnd;
            const outsideRange = beforeSem || afterSem;

            const dots = statuses.slice(0, 4).map(s => {
              const status = s && typeof s === 'object' ? s.status : s;
              return `<div class="cal-dot ${status}"></div>`;
            }).join('');

            let cls = '';
            if (isToday)      cls += ' today';
            if (isSemEnd)     cls += ' semester-end';
            if (outsideRange) cls += ' outside-range';
            if (hasData && !outsideRange) cls += ' has-data';

            const isFuture = dateStr > todayStr;
            const clickable = !outsideRange && !isFuture;

            return `
              <div class="cal-day${cls}"
                ${clickable ? `data-date="${dateStr}" role="button" tabindex="0"` : ''}
                title="${dateStr}${isSemEnd ? ' — Semester ends' : ''}">
                <span>${day}</span>
                ${hasData && !outsideRange ? `<div class="cal-dots">${dots}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Legend -->
        <div class="cal-legend">
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background:var(--safe)"></div>
            <span>Present</span>
          </div>
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background:var(--danger)"></div>
            <span>Absent</span>
          </div>
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background:var(--text-3)"></div>
            <span>Cancelled</span>
          </div>
          ${semEnd ? `
            <div class="cal-legend-item">
              <div class="cal-legend-dot" style="background:var(--warning)"></div>
              <span>Semester end</span>
            </div>
          ` : ''}
          <div class="cal-legend-item">
            <div class="cal-legend-dot" style="background:var(--accent)"></div>
            <span>Today</span>
          </div>
        </div>
      </div>

      <!-- Monthly summary -->
      ${buildMonthlySummary(logs, viewYear, viewMonth, semStart, semEnd)}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  attachListeners(container, canGoPrev, canGoNext, semStart, semEnd);
}

// ─── Monthly summary card ─────────────────────────────────────────────────────

function buildMonthlySummary(logs, year, month, semStart, semEnd) {
  const prefix = `${year}-${pad(month + 1)}`;
  let present = 0, absent = 0, cancelled = 0;

  Object.entries(logs).forEach(([date, dayLog]) => {
    if (!date.startsWith(prefix)) return;
    if (semStart && date < semStart) return;
    if (semEnd   && date > semEnd)   return;
    Object.values(dayLog).forEach(s => {
      const status = s && typeof s === 'object' ? s.status : s;
      if (status === 'present')   present++;
      if (status === 'absent')    absent++;
      if (status === 'cancelled') cancelled++;
    });
  });

  const total = present + absent;
  if (total === 0) return `
    <div class="card mt-md" style="text-align:center;padding:1.5rem">
      <div style="color:var(--text-3);font-size:0.85rem">No attendance logged this month yet.</div>
    </div>
  `;

  const pct = (present / total) * 100;
  const pctColor = pct >= 75 ? 'var(--safe)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';

  return `
    <div class="card mt-md">
      <div class="card-header">
        <div class="card-title">${new Date(year, month).toLocaleDateString('en-IN',{month:'long',year:'numeric'})} Summary</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;text-align:center">
        <div>
          <div style="font-size:1.75rem;font-weight:800;color:var(--safe);text-shadow:var(--safe-glow)">${present}</div>
          <div class="text-xs text-muted mt-xs">Present</div>
        </div>
        <div>
          <div style="font-size:1.75rem;font-weight:800;color:var(--danger)">${absent}</div>
          <div class="text-xs text-muted mt-xs">Absent</div>
        </div>
        <div>
          <div style="font-size:1.75rem;font-weight:800;color:var(--text-3)">${cancelled}</div>
          <div class="text-xs text-muted mt-xs">Cancelled</div>
        </div>
        <div>
          <div style="font-size:1.75rem;font-weight:800;color:${pctColor}">${pct.toFixed(0)}%</div>
          <div class="text-xs text-muted mt-xs">This month</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Listeners ────────────────────────────────────────────────────────────────

function attachListeners(container, canGoPrev, canGoNext) {
  if (canGoPrev) {
    container.querySelector('#cal-prev')?.addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      drawCalendar(container);
    });
  }

  if (canGoNext) {
    container.querySelector('#cal-next')?.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      drawCalendar(container);
    });
  }

  // Click a day → navigate to log for that date
  container.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      const dateStr = el.dataset.date;
      if (dateStr) {
        sessionStorage.setItem('bunkbuddy_log_date', dateStr);
        window.location.hash = '#/log';
      }
    });
  });
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}
