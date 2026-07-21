// ─── Leave Planner Page v3 ───────────────────────────────────────────────────────
// Figures out if you can afford to skip classes. Shows safe-leave count,
// per-subject breakdown, and a what-if simulator. Standardized to 1x.

import { getData }          from '../storage.js';
import { calcStats, whatIfSkip, fmtPct } from '../calculations.js';
import { celebrate } from '../fun.js';

export function renderLeave(container) {
  const data  = getData();
  const stats = calcStats();
  const { overall, subjects } = stats;

  container.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h1 class="page-title">Leave Planner</h1>
          <p class="page-sub">Figure out if you can afford to skip</p>
        </div>
      </div>

      <!-- Hero: safe leave count -->
      <div class="card card-lg mb-md" style="text-align:center;position:relative;overflow:hidden">
        <div class="leave-hero-label">
          ${overall.safe < 0 ? '⚠️ Below Target' : '✅ Classes you can safely miss'}
        </div>
        <div class="leave-hero-num num" id="leave-hero-num"
          style="color:var(--${colorForSafe(overall.safe)});text-shadow:0 0 40px var(--${colorForSafe(overall.safe)})">
          ${overall.safe < 0 ? overall.recovery : overall.safe}
        </div>
        <div class="leave-hero-sub">
          ${overall.safe < 0
            ? `Attend ${overall.recovery} class${overall.recovery === 1 ? '' : 'es'} in a row to reach ${data.semester.required}%`
            : overall.safe === 0
              ? 'You have no room to miss any class right now.'
              : `Miss up to ${overall.safe} more class${overall.safe === 1 ? '' : 'es'} and stay at or above ${data.semester.required}%.`
          }
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-top:1rem">
          <div class="badge badge-${overall.status}">${overall.status.toUpperCase()}</div>
          <span class="text-sm text-muted">${fmtPct(overall.pct)} overall · ${overall.attended}/${overall.held} classes</span>
        </div>
      </div>

      <!-- Recovery card (if below target) -->
      ${overall.safe < 0 ? `
        <div class="recovery-card mb-md">
          <div class="recovery-icon">🚨</div>
          <div class="recovery-body">
            <div class="recovery-title">Recovery Plan</div>
            <div class="recovery-sub">
              Attend <strong>${overall.recovery}</strong> consecutive class${overall.recovery === 1 ? '' : 'es'} 
              without missing any, and you'll be back at ${data.semester.required}%.
            </div>
          </div>
        </div>
      ` : ''}

      <!-- What-if simulator -->
      <div class="whatif-wrap mb-md">
        <div class="whatif-label">
          <span class="whatif-title">What-if simulator</span>
          <span class="whatif-value">Drag to simulate skips</span>
        </div>
        <div style="font-size:0.85rem;color:var(--text-3);margin-bottom:0.5rem">
          "If I skip <strong id="skip-count-label">0</strong> more class${''}<span id="skip-plural"></span>…"
        </div>
        <input type="range" class="slider-input" id="whatif-slider"
          min="0" max="${Math.max(20, (overall.safe || 0) + 10)}"
          value="0" step="1">
        <div class="whatif-result">
          <span class="whatif-result-label">My attendance would be</span>
          <span class="whatif-result-pct" id="whatif-pct">${fmtPct(overall.pct)}</span>
        </div>
        <div id="whatif-extra" style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-3)"></div>
      </div>

      <!-- Per-subject breakdown -->
      ${subjects.length > 0 ? `
        <h4 class="mb-sm">Per-subject breakdown</h4>
        <div class="leave-subjects-table">
          ${subjects.map(buildSubjectRow).join('')}
        </div>
      ` : ''}
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Celebrate if comfortably safe
  if (overall.safe >= 5) {
    const heroEl = document.getElementById('leave-hero-num');
    if (heroEl) setTimeout(() => celebrate(heroEl.parentElement), 400);
  }

  // Wire up the what-if slider
  const slider = document.getElementById('whatif-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      updateWhatIf(parseInt(slider.value), overall.pct, data.semester.required);
    });
  }
}

// ─── What-if updater (live) ───────────────────────────────────────────────────

function updateWhatIf(skipN, currentPct, required) {
  const countLabel  = document.getElementById('skip-count-label');
  const pluralEl    = document.getElementById('skip-plural');
  const pctEl       = document.getElementById('whatif-pct');
  const extraEl     = document.getElementById('whatif-extra');

  if (countLabel) countLabel.textContent = skipN;
  if (pluralEl)   pluralEl.textContent   = skipN === 1 ? '' : 'es';

  if (skipN === 0) {
    if (pctEl)  pctEl.textContent   = fmtPct(currentPct);
    if (pctEl)  pctEl.style.color   = '';
    if (extraEl) extraEl.textContent = '';
    return;
  }

  const result = whatIfSkip(skipN);

  if (pctEl) {
    pctEl.textContent = fmtPct(result.pct);
    pctEl.style.color = result.belowTarget ? 'var(--danger)' : result.pct < required + 5 ? 'var(--warning)' : 'var(--safe)';
  }

  if (extraEl) {
    if (result.belowTarget) {
      extraEl.innerHTML = `<span style="color:var(--danger)">⚠️ Below ${required}% — you'd need to attend ${result.recovery} more class${result.recovery === 1 ? '' : 'es'} to recover.</span>`;
    } else {
      extraEl.innerHTML = `<span style="color:var(--safe)">✓ Still above ${required}% — ${result.safe} safe leave${result.safe === 1 ? '' : 's'} remaining after this.</span>`;
    }
  }
}

// ─── Per-subject row ──────────────────────────────────────────────────────────

function buildSubjectRow(s) {
  const isBelowTarget = s.safe < 0;
  const displayNum    = isBelowTarget ? s.recovery : s.safe;
  const label         = isBelowTarget
    ? `attend ${s.recovery} to recover`
    : s.safe === 0 ? 'no room left' : 'safe to miss';

  return `
    <div class="leave-subject-row" style="margin-bottom:0.5rem">
      <div style="background:${s.color};width:10px;height:10px;border-radius:50%;flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div class="leave-subject-name">${escHtml(s.name)}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-right:1rem">
        <div class="leave-subject-count" style="color:var(--${colorForSafe(s.safe)})">${displayNum}</div>
        <div style="font-size:0.72rem;color:var(--text-3)">${label}</div>
      </div>
      <div class="badge badge-${s.status}" style="flex-shrink:0">${fmtPct(s.pct)}</div>
    </div>
  `;
}

function colorForSafe(safe) {
  if (safe < 0) return 'danger';
  if (safe <= 2) return 'warning';
  return 'safe';
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
