// ─── Dashboard Page v3 ───────────────────────────────────────────────────────────
// Overview dashboard featuring the overall attendance donut chart, safe bunk count,
// today's schedule, per-subject stats cards, and motivation.

import { getData, today, formatDate } from '../storage.js';
import { calcStats, fmtPct }          from '../calculations.js';
import { getPrimaryInsight, getDailyTip } from '../insights.js';
import { getMemeCard, getQuote, getSafeMessage, celebrate } from '../fun.js';

export function renderDashboard(container) {
  const data  = getData();
  const stats = calcStats();
  const { overall, subjects } = stats;

  const meme   = getMemeCard(overall.pct);
  const quote  = getQuote();
  const insight = getPrimaryInsight(stats);
  const tip     = getDailyTip(stats);
  const safeMsg = getSafeMessage(overall.safe);

  // Today's schedule calculations
  const todayStr   = today();
  const todayDate  = new Date(todayStr + 'T00:00:00');
  const dayOfWeek  = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = data.timetable[dayOfWeek] || [];
  todaySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayLogs  = data.logs[todayStr] || {};

  container.innerHTML = `
    <div class="page-enter">
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">${data.semester.name} &middot; Target: ${data.semester.required}%</p>
        </div>
        <a href="#/log" class="btn btn-primary btn-sm">
          <i data-lucide="pencil-line"></i> Log today
        </a>
      </div>

      <!-- Hero card -->
      <div class="card card-lg mb-md" id="hero-card">
        <div class="dashboard-hero">
          <!-- Donut chart -->
          <div class="donut-wrap">
            ${buildDonut(overall.pct, overall.status)}
          </div>

          <!-- Stats -->
          <div class="hero-stats">
            <div class="hero-stat-row">
              <span class="hero-label">Safe to miss</span>
              <div class="flex items-center gap-sm">
                <span class="hero-number ${overall.safe < 0 ? 'danger' : overall.safe <= 2 ? 'warning' : 'safe'} num" id="safe-num">
                  ${overall.safe < 0 ? 0 : overall.safe}
                </span>
                <span class="badge badge-${overall.status}" style="margin-top:2px">
                  ${overall.status.toUpperCase()}
                </span>
              </div>
              <span class="text-sm text-muted">${safeMsg}</span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:0.5rem">
              <div>
                <div class="hero-label">Attended</div>
                <div style="font-size:1.2rem;font-weight:700;font-variant-numeric:tabular-nums">
                  ${overall.attended}/${overall.held}
                </div>
              </div>
              <div>
                <div class="hero-label">Required</div>
                <div style="font-size:1.2rem;font-weight:700">${data.semester.required}%</div>
              </div>
            </div>
          </div>
        </div>

        ${overall.safe < 0 ? `
          <div class="recovery-card mt-md">
            <div class="recovery-icon">🚨</div>
            <div class="recovery-body">
              <div class="recovery-title">Attend ${overall.recovery} consecutive classes to recover</div>
              <div class="recovery-sub">Assuming no further misses, you'll be back at ${data.semester.required}% after these.</div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Insight card -->
      <div class="insight-card mb-md">
        <div class="insight-icon">💡</div>
        <div class="insight-body">
          <div class="insight-title">${insight}</div>
          <div class="insight-sub">${tip}</div>
        </div>
      </div>

      <!-- Today's Schedule -->
      <div class="card mb-md">
        <div class="card-header" style="margin-bottom: 0.75rem;">
          <div class="card-title">Today's Schedule (${dayOfWeek})</div>
          <a href="#/log" class="btn btn-ghost btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">
            <i data-lucide="pencil-line" style="width:12px;height:12px"></i> Manage Log
          </a>
        </div>
        <div class="flex-col gap-xs">
          ${todaySlots.length === 0 
            ? `<div class="empty-state" style="padding: 1rem 0;">
                <div class="empty-sub">No classes scheduled for today. Enjoy your day! 🙌</div>
               </div>`
            : todaySlots.map(slot => {
                const sub = data.subjects.find(s => s.id === slot.subjectId);
                const logVal = todayLogs[slot.id];
                const status = logVal && typeof logVal === 'object' ? logVal.status : logVal;
                
                const badgeClass = status === 'present' ? 'badge-safe' : status === 'absent' ? 'badge-danger' : status === 'cancelled' ? 'badge-accent' : 'badge-yellow';
                const badgeLabel = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'cancelled' ? 'Cancelled' : 'Not Logged';
                
                return `
                  <div class="subject-add-item" style="border: 1px solid var(--border); background: var(--surface-2); padding: 0.5rem 0.75rem;">
                    <div class="subject-add-item-dot" style="background:${sub ? sub.color : '#ccc'}"></div>
                    <span class="subject-add-item-name" style="font-weight:600; font-size: 0.85rem;">${escHtml(sub ? sub.name : 'Unknown Subject')}</span>
                    <span style="font-size:0.75rem; color:var(--text-3); font-variant-numeric:tabular-nums; margin-right:8px;">
                      ${slot.startTime} - ${slot.endTime}
                    </span>
                    <span class="badge ${badgeClass}" style="font-size:0.62rem; padding:0.15rem 0.45rem;">${badgeLabel}</span>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>

      <!-- Subjects -->
      ${subjects.length > 0 ? `
        <h4 class="mb-sm">Subjects</h4>
        <div class="subjects-grid" id="subjects-grid">
          ${subjects.map(buildSubjectCard).join('')}
        </div>
      ` : ''}

      <!-- Meme card + quote -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1rem">
        <div class="meme-card">
          <div class="meme-emoji">${meme.emoji}</div>
          <div>
            <div class="meme-title">${meme.title}</div>
            <div class="meme-sub">${meme.sub}</div>
          </div>
        </div>
        <div class="card" style="display:flex;flex-direction:column;justify-content:center;gap:0.25rem">
          <div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Quote of the session</div>
          <div style="font-size:0.85rem;font-style:italic;color:var(--text-2);line-height:1.5">"${quote}"</div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Animate donut on load
  setTimeout(() => animateDonut(overall.pct, overall.status), 100);

  // Celebrate if attendance improved since last render (simple: just show if > target)
  if (overall.pct > data.semester.required && overall.held > 0) {
    const heroCard = document.getElementById('hero-card');
    if (heroCard) setTimeout(() => celebrate(heroCard), 600);
  }
}

// ─── Donut chart ─────────────────────────────────────────────────────────────

function buildDonut(pct, status) {
  const r    = 80;
  const circ = 2 * Math.PI * r;
  const colors = { safe: '#22c55e', warning: '#eab308', danger: '#ef4444' };
  const stroke = colors[status] || colors.safe;

  return `
    <svg class="donut-chart" viewBox="0 0 200 200" role="img" aria-label="${pct.toFixed(1)}% attendance">
      <!-- Track -->
      <circle cx="100" cy="100" r="${r}" fill="none"
        stroke="var(--surface-2)" stroke-width="18"/>
      <!-- Progress -->
      <circle cx="100" cy="100" r="${r}" fill="none"
        stroke="${stroke}" stroke-width="18"
        stroke-dasharray="${circ.toFixed(2)}"
        stroke-dashoffset="${circ.toFixed(2)}"
        stroke-linecap="round"
        transform="rotate(-90 100 100)"
        class="donut-progress" id="donut-arc"
        data-target="${(circ * (1 - pct / 100)).toFixed(2)}"
        data-circ="${circ.toFixed(2)}"/>
      <!-- Percentage text -->
      <text x="100" y="92" text-anchor="middle"
        fill="var(--text-1)" font-size="30" font-weight="800"
        font-family="Inter, sans-serif"
        dominant-baseline="middle">${pct.toFixed(1)}%</text>
      <text x="100" y="118" text-anchor="middle"
        fill="var(--text-3)" font-size="12" font-weight="500"
        font-family="Inter, sans-serif">attendance</text>
    </svg>
  `;
}

function animateDonut(pct, status) {
  const arc = document.getElementById('donut-arc');
  if (!arc) return;
  const target = parseFloat(arc.dataset.target);
  arc.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.25, 0.1, 0.25, 1)';
  arc.setAttribute('stroke-dashoffset', target);
}

// ─── Subject card ─────────────────────────────────────────────────────────────

function buildSubjectCard(s) {
  const barPct   = Math.min(s.pct, 100);
  const statusLabel = s.safe < 0
    ? `Attend ${s.recovery} to recover`
    : s.safe === 0
      ? 'No room left'
      : `${s.safe} safe leave${s.safe === 1 ? '' : 's'}`;

  return `
    <div class="subject-card">
      <div class="subject-card-header">
        <div class="subject-name-wrap">
          <div class="subject-dot" style="background:${s.color}"></div>
          <span class="subject-name">${escHtml(s.name)}</span>
        </div>
        <span class="subject-pct ${s.status}">${fmtPct(s.pct)}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar ${s.status}" style="width:${barPct}%"></div>
      </div>
      <div class="subject-meta">
        <span>${s.attended}/${s.held} classes</span>
        <span class="badge badge-${s.status}">${statusLabel}</span>
      </div>
    </div>
  `;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
