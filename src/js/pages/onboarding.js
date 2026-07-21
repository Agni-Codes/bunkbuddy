// ─── Onboarding Flow v3 ───────────────────────────────────────────────────────
// 4-step wizard: Semester → Attendance Goal → Subjects → Timetable Setup
// All subjects count as 1 attendance. Time of classes is recorded.

import { updateData, generateId } from '../storage.js';
import { showToast } from '../toast.js';

const SUBJECT_COLORS = [
  '#c084fc', '#22d3ee', '#4ade80', '#fbbf24',
  '#fb7185', '#38bdf8', '#fb923c', '#e879f9'
];

let currentStep  = 1;
const totalSteps = 4;
let selectedOnboardDay = 'Monday';

let onboardData = {
  semester: { name: '', start: '', end: '', required: 75 },
  subjects: [],
  timetable: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  },
  newSubject: { name: '', color: SUBJECT_COLORS[0], type: 'theory', multiplier: 1 }
};

// ─── Entry point ──────────────────────────────────────────────────────────────

export function renderOnboarding(container) {
  currentStep  = 1;
  selectedOnboardDay = 'Monday';
  onboardData  = {
    semester: { name: '', start: '', end: '', required: 75 },
    subjects: [],
    timetable: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    },
    newSubject: { name: '', color: SUBJECT_COLORS[0], type: 'theory', multiplier: 1 }
  };
  container.innerHTML = buildShell();
  renderStep(container);
  listenInputs(container);
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function buildShell() {
  return `
    <div class="onboarding-shell">
      <div class="onboarding-card" id="ob-card">
        <div class="onboarding-logo">🎓</div>
        <div class="onboarding-brand">BunkBuddy</div>
        <div class="onboarding-step-indicator" id="ob-dots"></div>
        <div id="ob-step"></div>
      </div>
    </div>
  `;
}

// ─── Step renderer ────────────────────────────────────────────────────────────

function renderStep(container) {
  updateDots();
  const el = document.getElementById('ob-step');
  if (!el) return;

  if (currentStep === 1) el.innerHTML = buildStep1();
  if (currentStep === 2) el.innerHTML = buildStep2();
  if (currentStep === 3) el.innerHTML = buildStep3();
  if (currentStep === 4) el.innerHTML = buildStep4();

  if (window.lucide) lucide.createIcons();
  attachStepListeners(container);
}

function updateDots() {
  const el = document.getElementById('ob-dots');
  if (!el) return;
  el.innerHTML = Array.from({ length: totalSteps }, (_, i) => {
    const cls = i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'active' : '';
    return `<div class="step-dot ${cls}"></div>`;
  }).join('');
}

// ─── Step 1: Semester ─────────────────────────────────────────────────────────

function buildStep1() {
  const s = onboardData.semester;
  return `
    <h2 class="onboarding-title">Let's get you set up 👋</h2>
    <p class="onboarding-sub">Tell BunkBuddy about your semester so all the maths is done for you.</p>

    <div class="flex-col gap-md">
      <div class="form-group">
        <label class="form-label" for="ob-sem-name">Semester name</label>
        <input class="form-input" id="ob-sem-name" type="text"
          placeholder="e.g. Semester 5, Fall 2026…" value="${escHtml(s.name)}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="ob-sem-start">Start date</label>
          <input class="form-input" id="ob-sem-start" type="date" value="${s.start}">
        </div>
        <div class="form-group">
          <label class="form-label" for="ob-sem-end">End date</label>
          <input class="form-input" id="ob-sem-end" type="date" value="${s.end}">
        </div>
      </div>
    </div>

    <div class="onboarding-actions">
      <span></span>
      <button class="btn btn-primary" id="ob-next-1">
        Continue <i data-lucide="arrow-right"></i>
      </button>
    </div>
  `;
}

// ─── Step 2: Required % ───────────────────────────────────────────────────────

function buildStep2() {
  const options = [60, 65, 70, 75, 80, 85];
  const cur     = onboardData.semester.required;
  const isCustom = !options.includes(cur);

  return `
    <h2 class="onboarding-title">What's your attendance target? 🎯</h2>
    <p class="onboarding-sub">Set your university's minimum attendance requirement. All calculations use this number.</p>

    <div class="required-pct-grid mb-md">
      ${options.map(p => `
        <button class="pct-btn ${p === cur && !isCustom ? 'selected' : ''}" data-pct="${p}">${p}%</button>
      `).join('')}
    </div>

    <div class="form-group">
      <label class="form-label" for="ob-custom-pct">Or enter a custom percentage</label>
      <input class="form-input" id="ob-custom-pct" type="number"
        min="1" max="100" placeholder="e.g. 66" value="${isCustom ? cur : ''}">
    </div>

    <div class="onboarding-actions">
      <button class="btn btn-ghost" id="ob-back-2"><i data-lucide="arrow-left"></i> Back</button>
      <button class="btn btn-primary" id="ob-next-2">Continue <i data-lucide="arrow-right"></i></button>
    </div>
  `;
}

// ─── Step 3: Subjects ─────────────────────────────────────────────────────────

function buildStep3() {
  const ns = onboardData.newSubject;
  return `
    <h2 class="onboarding-title">Add your subjects 📚</h2>
    <p class="onboarding-sub">Add all the subjects in your syllabus (standard 1× attendance).</p>

    <div class="subject-add-list" id="ob-subject-list">
      ${onboardData.subjects.map(buildSubjectPill).join('')}
    </div>

    <div class="add-subject-form" id="ob-add-form">
      <div class="form-group">
        <label class="form-label" for="ob-sub-name">Subject name</label>
        <input class="form-input" id="ob-sub-name" type="text"
          placeholder="e.g. Data Structures, Physics…" value="${escHtml(ns.name)}">
      </div>

      <div class="form-group">
        <label class="form-label">Colour</label>
        <div class="color-picker" id="ob-color-picker">
          ${SUBJECT_COLORS.map(c => `
            <div class="color-dot ${c === ns.color ? 'selected' : ''}"
              style="background:${c}" data-color="${c}"></div>
          `).join('')}
        </div>
      </div>

      <button class="btn btn-ghost btn-sm w-full" id="ob-add-btn" style="justify-content:center">
        <i data-lucide="plus"></i> Add subject
      </button>
    </div>

    <div class="onboarding-actions">
      <button class="btn btn-ghost" id="ob-back-3"><i data-lucide="arrow-left"></i> Back</button>
      <button class="btn btn-primary ${onboardData.subjects.length === 0 ? 'hidden' : ''}" id="ob-next-3">
        Continue <i data-lucide="arrow-right"></i>
      </button>
    </div>
  `;
}

function buildSubjectPill(s) {
  return `
    <div class="subject-add-item" data-id="${s.id}">
      <div class="subject-add-item-dot" style="background:${s.color}"></div>
      <span class="subject-add-item-name">${escHtml(s.name)}</span>
      <button class="subject-add-item-del" data-del="${s.id}" aria-label="Remove">
        <i data-lucide="x"></i>
      </button>
    </div>
  `;
}

// ─── Step 4: Timetable Setup (NEW) ──────────────────────────────────────────

function buildStep4() {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daySlots = onboardData.timetable[selectedOnboardDay] || [];

  // Sort slots by start time
  daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return `
    <h2 class="onboarding-title">Set up your weekly timetable 📅</h2>
    <p class="onboarding-sub">Configure your weekly schedule and class timings so your logs are generated automatically.</p>

    <!-- Weekday tabs -->
    <div class="required-pct-grid mb-sm" style="grid-template-columns: repeat(4, 1fr); gap: 4px;">
      ${weekdays.map(d => `
        <button class="pct-btn ${d === selectedOnboardDay ? 'selected' : ''}" data-day="${d}" style="padding: 4px; font-size: 0.75rem;">
          ${d.slice(0, 3)}
        </button>
      `).join('')}
    </div>

    <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-2); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
      <span>Schedule for ${selectedOnboardDay}</span>
    </div>

    <!-- Day's current slots -->
    <div class="subject-add-list" style="max-height: 140px; margin-bottom: 0.75rem;">
      ${daySlots.length === 0 
        ? `<div class="empty-state" style="padding: 1rem 0; font-size: 0.8rem;">No classes scheduled yet.</div>`
        : daySlots.map(slot => {
            const sub = onboardData.subjects.find(s => s.id === slot.subjectId);
            return `
              <div class="subject-add-item">
                <div class="subject-add-item-dot" style="background:${sub ? sub.color : '#ccc'}"></div>
                <span class="subject-add-item-name">${escHtml(sub ? sub.name : 'Unknown Subject')}</span>
                <span style="font-size: 0.72rem; color: var(--text-3); font-variant-numeric: tabular-nums;">
                  ${slot.startTime} - ${slot.endTime}
                </span>
                <button class="subject-add-item-del" data-del-slot="${slot.id}" aria-label="Remove class">
                  <i data-lucide="x"></i>
                </button>
              </div>
            `;
          }).join('')
      }
    </div>

    <!-- Add slot form -->
    <div class="add-subject-form" style="padding: 0.75rem; gap: 0.5rem; background: var(--surface-3);">
      <div style="font-weight: 700; font-size: 0.8rem; margin-bottom: 0.25rem;">Add a class</div>
      
      <div class="form-group">
        <label class="form-label" for="ob-slot-subject">Subject</label>
        <select class="form-select" id="ob-slot-subject" style="padding: 0.4rem 2rem 0.4rem 0.6rem; font-size: 0.82rem;">
          <option value="">-- Select Subject --</option>
          ${onboardData.subjects.map(sub => `
            <option value="${sub.id}">${escHtml(sub.name)}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-row" style="gap: 0.5rem; margin-bottom: 0.25rem;">
        <div class="form-group">
          <label class="form-label" for="ob-slot-start">Start time</label>
          <input class="form-input" id="ob-slot-start" type="time" style="padding: 0.4rem; font-size: 0.82rem;" value="09:00">
        </div>
        <div class="form-group">
          <label class="form-label" for="ob-slot-end">End time</label>
          <input class="form-input" id="ob-slot-end" type="time" style="padding: 0.4rem; font-size: 0.82rem;" value="09:50">
        </div>
      </div>

      <button class="btn btn-ghost btn-sm w-full" id="ob-add-slot-btn" style="justify-content:center; padding: 0.4rem 0.75rem;">
        <i data-lucide="plus"></i> Add to timetable
      </button>
    </div>

    <div class="onboarding-actions" style="margin-top: 1rem;">
      <button class="btn btn-ghost" id="ob-back-4"><i data-lucide="arrow-left"></i> Back</button>
      <button class="btn btn-primary" id="ob-finish">
        Let's go! 🚀
      </button>
    </div>
  `;
}

// ─── Step listeners ───────────────────────────────────────────────────────────

function attachStepListeners(container) {
  // Step 1
  on('ob-next-1', 'click', () => {
    onboardData.semester.name  = val('ob-sem-name') || 'My Semester';
    onboardData.semester.start = val('ob-sem-start');
    onboardData.semester.end   = val('ob-sem-end');
    if (!onboardData.semester.start || !onboardData.semester.end) {
      showToast('Please enter both semester dates.', 'warning'); return;
    }
    if (onboardData.semester.start >= onboardData.semester.end) {
      showToast('End date must be after start date.', 'warning'); return;
    }
    currentStep = 2; renderStep(container);
  });

  // Step 2
  on('ob-back-2', 'click', () => { currentStep = 1; renderStep(container); });
  on('ob-next-2', 'click', () => {
    const custom = val('ob-custom-pct');
    if (custom) {
      const n = parseInt(custom);
      if (isNaN(n) || n < 1 || n > 100) {
        showToast('Enter a valid percentage (1–100).', 'warning'); return;
      }
      onboardData.semester.required = n;
    }
    currentStep = 3; renderStep(container);
  });
  document.querySelectorAll('.pct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pct-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onboardData.semester.required = parseInt(btn.dataset.pct);
      const ci = document.getElementById('ob-custom-pct');
      if (ci) ci.value = '';
    });
  });

  // Step 3
  on('ob-back-3', 'click', () => { currentStep = 2; renderStep(container); });
  on('ob-next-3', 'click', () => {
    if (onboardData.subjects.length === 0) {
      showToast('Add at least one subject to continue.', 'warning'); return;
    }
    currentStep = 4; renderStep(container);
  });

  // Color picker (Step 3)
  document.querySelectorAll('#ob-color-picker .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#ob-color-picker .color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      onboardData.newSubject.color = dot.dataset.color;
    });
  });

  // Add subject (Step 3)
  on('ob-add-btn', 'click', () => {
    const name = val('ob-sub-name') || onboardData.newSubject.name;
    if (!name) { showToast('Give the subject a name.', 'warning'); return; }

    onboardData.subjects.push({
      id: generateId(),
      name,
      color: onboardData.newSubject.color,
      type: 'theory',
      multiplier: 1
    });

    const ci = (SUBJECT_COLORS.indexOf(onboardData.newSubject.color) + 1) % SUBJECT_COLORS.length;
    onboardData.newSubject = { name: '', color: SUBJECT_COLORS[ci], type: 'theory', multiplier: 1 };
    renderStep(container);
    showToast(`${name} added!`, 'success', 1500);
  });

  // Delete subject (Step 3)
  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.dataset.del;
      onboardData.subjects = onboardData.subjects.filter(s => s.id !== subId);
      // Remove related slots from timetable too
      Object.keys(onboardData.timetable).forEach(day => {
        onboardData.timetable[day] = onboardData.timetable[day].filter(slot => slot.subjectId !== subId);
      });
      renderStep(container);
    });
  });

  // Step 4 Listeners
  if (currentStep === 4) {
    on('ob-back-4', 'click', () => { currentStep = 3; renderStep(container); });
    
    on('ob-finish', 'click', () => {
      updateData({ 
        onboarded: true, 
        semester: onboardData.semester, 
        subjects: onboardData.subjects, 
        timetable: onboardData.timetable,
        logs: {} 
      });
      document.dispatchEvent(new CustomEvent('bunkbuddy:onboarded'));
    });

    // Weekday tabs selection
    document.querySelectorAll('[data-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedOnboardDay = btn.dataset.day;
        renderStep(container);
      });
    });

    // Add slot click
    on('ob-add-slot-btn', 'click', () => {
      const subjectId = document.getElementById('ob-slot-subject').value;
      const startTime = document.getElementById('ob-slot-start').value;
      const endTime   = document.getElementById('ob-slot-end').value;

      if (!subjectId) { showToast('Please select a subject.', 'warning'); return; }
      if (!startTime || !endTime) { showToast('Please set class times.', 'warning'); return; }
      if (startTime >= endTime) { showToast('End time must be after start time.', 'warning'); return; }

      // Add to timetable
      onboardData.timetable[selectedOnboardDay].push({
        id: generateId(),
        subjectId,
        startTime,
        endTime
      });

      renderStep(container);
      showToast('Class added to schedule!', 'success', 1500);
    });

    // Delete slot click
    document.querySelectorAll('[data-del-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotId = btn.dataset.delSlot;
        onboardData.timetable[selectedOnboardDay] = onboardData.timetable[selectedOnboardDay].filter(slot => slot.id !== slotId);
        renderStep(container);
        showToast('Class removed.', 'info', 1200);
      });
    });
  }
}

// ─── Global input sync ────────────────────────────────────────────────────────

function listenInputs(container) {
  container.addEventListener('input', (e) => {
    if (e.target.id === 'ob-sem-name')  onboardData.semester.name  = e.target.value.trim();
    if (e.target.id === 'ob-sem-start') onboardData.semester.start = e.target.value;
    if (e.target.id === 'ob-sem-end')   onboardData.semester.end   = e.target.value;
    if (e.target.id === 'ob-sub-name')  onboardData.newSubject.name = e.target.value;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
