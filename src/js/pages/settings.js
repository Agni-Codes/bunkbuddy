// ─── Settings Page v3 ─────────────────────────────────────────────────────────
// Timetable configuration and subject management. Standardized to 1x attendance.

import { getData, updateSemester, saveData, generateId } from '../storage.js';
import { showToast } from '../toast.js';

const SUBJECT_COLORS = [
  '#c084fc', '#22d3ee', '#4ade80', '#fbbf24',
  '#fb7185', '#38bdf8', '#fb923c', '#e879f9'
];

let editingSubjectId = null;
let editingSlotId = null;
let selectedSettingsDay = 'Monday';

export function renderSettings(container) {
  editingSubjectId = null;
  editingSlotId = null;
  drawSettings(container);
}

function drawSettings(container) {
  const { semester, subjects, timetable } = getData();
  const daySlots = timetable[selectedSettingsDay] || [];
  daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  container.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-sub">Configure your semester, subjects, and timetable</p>
        </div>
      </div>

      <!-- Semester -->
      <div class="settings-section">
        <div class="settings-section-title">Semester</div>
        <div class="card flex-col gap-md">
          <div class="form-group">
            <label class="form-label" for="set-sem-name">Semester name</label>
            <input class="form-input" id="set-sem-name" type="text"
              value="${escHtml(semester.name)}" placeholder="e.g. Semester 5">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="set-sem-start">Start date</label>
              <input class="form-input" id="set-sem-start" type="date" value="${semester.start}">
            </div>
            <div class="form-group">
              <label class="form-label" for="set-sem-end">End date</label>
              <input class="form-input" id="set-sem-end" type="date" value="${semester.end}">
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="save-semester" style="align-self:flex-start">
            <i data-lucide="save"></i> Save semester
          </button>
        </div>
      </div>

      <!-- Attendance requirement -->
      <div class="settings-section">
        <div class="settings-section-title">Attendance requirement</div>
        <div class="card">
          <p class="text-sm text-muted mb-md">All safe-leave and recovery calculations use this number.</p>
          <div class="required-pct-grid mb-md">
            ${[60, 65, 70, 75, 80, 85].map(p => `
              <button class="pct-btn ${p === semester.required ? 'selected' : ''}" data-pct="${p}">${p}%</button>
            `).join('')}
          </div>
          <div class="form-group">
            <label class="form-label" for="set-custom-pct">Custom percentage</label>
            <input class="form-input" id="set-custom-pct" type="number" min="1" max="100"
              placeholder="e.g. 66"
              value="${[60,65,70,75,80,85].includes(semester.required) ? '' : semester.required}">
          </div>
          <button class="btn btn-primary btn-sm mt-md" id="save-required" style="align-self:flex-start">
            <i data-lucide="save"></i> Save requirement
          </button>
        </div>
      </div>

      <!-- Weekly Timetable -->
      <div class="settings-section">
        <div class="settings-section-title">Weekly Timetable</div>
        <div class="card flex-col gap-md">
          <p class="text-sm text-muted">Manage your weekly schedule. Adding classes here allows BunkBuddy to track your daily sessions.</p>

          <!-- Day picker tabs -->
          <div class="required-pct-grid mb-sm" style="grid-template-columns: repeat(7, 1fr); gap: 4px;">
            ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => `
              <button class="pct-btn ${d === selectedSettingsDay ? 'selected' : ''}" data-set-day="${d}" style="padding: 6px 4px; font-size: 0.72rem;">
                ${d.slice(0, 3)}
              </button>
            `).join('')}
          </div>

          <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.25rem;">
            Schedule for ${selectedSettingsDay}
          </div>

          <!-- Schedule list -->
          <div class="settings-card mb-sm">
            ${daySlots.length === 0
              ? `<div class="empty-state" style="padding: 1.5rem">
                  <div class="empty-sub">No classes scheduled for this day.</div>
                 </div>`
              : daySlots.map(slot => {
                  const sub = subjects.find(s => s.id === slot.subjectId);
                  return `
                    <div class="settings-row" style="padding: 0.6rem 1rem;">
                      <div style="display:flex;align-items:center;gap:0.625rem;flex:1;min-width:0">
                        <div style="width:10px;height:10px;border-radius:50%;background:${sub ? sub.color : '#ccc'};flex-shrink:0"></div>
                        <div style="flex:1;min-width:0">
                          <div class="settings-row-label" style="font-size:0.875rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${escHtml(sub ? sub.name : 'Unknown Subject')}
                          </div>
                          <div class="settings-row-sub" style="font-size:0.72rem;font-variant-numeric:tabular-nums;color:var(--text-3)">
                            ${slot.startTime} - ${slot.endTime}
                          </div>
                        </div>
                      </div>
                      <div style="display:flex;gap:0.25rem;align-items:center">
                        <button class="btn-icon" data-edit-slot-id="${slot.id}" aria-label="Edit class"
                          style="width:28px;height:28px;flex-shrink:0">
                          <i data-lucide="pencil" style="width:12px;height:12px"></i>
                        </button>
                        <button class="btn-icon" data-del-slot-id="${slot.id}" aria-label="Delete class"
                          style="width:28px;height:28px;color:var(--danger);border-color:rgba(248,113,113,0.3);flex-shrink:0">
                          <i data-lucide="trash-2" style="width:12px;height:12px"></i>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')
            }
          </div>

          <!-- Add slot sub-form -->
          <div style="border-top: 1px solid var(--border); padding-top: 1.25rem;">
            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem;">
              ${editingSlotId ? `Edit class slot` : `Add a class to ${selectedSettingsDay}`}
            </div>
            <div class="flex-col gap-md">
              <div class="form-group">
                <label class="form-label" for="set-slot-subject">Subject</label>
                <select class="form-select" id="set-slot-subject">
                  <option value="">-- Select Subject --</option>
                  ${subjects.map(sub => `
                    <option value="${sub.id}">${escHtml(sub.name)}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="set-slot-start">Start time</label>
                  <input class="form-input" id="set-slot-start" type="time" value="09:00">
                </div>
                <div class="form-group">
                  <label class="form-label" for="set-slot-end">End time</label>
                  <input class="form-input" id="set-slot-end" type="time" value="09:50">
                </div>
              </div>
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-primary btn-sm" id="save-timetable-slot">
                  <i data-lucide="${editingSlotId ? 'save' : 'plus'}"></i> ${editingSlotId ? 'Save changes' : 'Add class'}
                </button>
                <button class="btn btn-ghost btn-sm ${editingSlotId ? '' : 'hidden'}" id="cancel-edit-slot">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subjects -->
      <div class="settings-section">
        <div class="settings-section-title">Subjects (${subjects.length})</div>

        <div class="settings-card mb-sm" id="subject-list">
          ${subjects.length === 0
            ? `<div class="empty-state" style="padding:1.5rem">
                <div class="empty-emoji">📚</div>
                <div class="empty-sub">No subjects yet. Add one below.</div>
               </div>`
            : subjects.map(buildSubjectRow).join('')
          }
        </div>

        <!-- Add / Edit form -->
        <div class="card" id="subject-form-card">
          <div style="font-weight:700;font-size:0.9rem;margin-bottom:1rem" id="sub-form-title">Add a subject</div>
          <div class="flex-col gap-md">
            <div class="form-group">
              <label class="form-label" for="set-sub-name">Subject name</label>
              <input class="form-input" id="set-sub-name" type="text" placeholder="e.g. Data Structures">
            </div>
            <div class="form-group">
              <label class="form-label">Colour</label>
              <div class="color-picker" id="set-color-picker">
                ${SUBJECT_COLORS.map((c, i) => `
                  <div class="color-dot ${i === 0 ? 'selected' : ''}"
                    style="background:${c}" data-color="${c}"></div>
                `).join('')}
              </div>
            </div>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-primary btn-sm" id="save-subject">
                <i data-lucide="plus"></i> <span id="save-subject-label">Add subject</span>
              </button>
              <button class="btn btn-ghost btn-sm hidden" id="cancel-edit">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="settings-section">
        <div class="settings-section-title">Danger zone</div>
        <div class="card">
          <div class="settings-row" style="border:none">
            <div>
              <div class="settings-row-label">Reset all data</div>
              <div class="settings-row-sub">Deletes all logs, subjects, timetable and semester config. Cannot be undone.</div>
            </div>
            <button class="btn btn-danger-ghost btn-sm" id="reset-btn">
              <i data-lucide="trash-2"></i> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  let selectedColor = SUBJECT_COLORS[0];

  // Color picker
  document.querySelectorAll('#set-color-picker .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#set-color-picker .color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      selectedColor = dot.dataset.color;
    });
  });

  // Required % buttons
  document.querySelectorAll('.pct-btn[data-pct]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pct-btn[data-pct]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const ci = document.getElementById('set-custom-pct');
      if (ci) ci.value = '';
    });
  });

  // Save semester
  on('save-semester', 'click', () => {
    const name  = val('set-sem-name');
    const start = val('set-sem-start');
    const end   = val('set-sem-end');
    if (!start || !end) { showToast('Please enter both dates.', 'warning'); return; }
    if (start >= end)   { showToast('End must be after start.', 'warning'); return; }
    updateSemester({ name: name || 'My Semester', start, end });
    showToast('Semester saved!', 'success');
  });

  // Save required %
  on('save-required', 'click', () => {
    const selected = document.querySelector('.pct-btn[data-pct].selected');
    const custom   = val('set-custom-pct');
    let required;
    if (custom) {
      required = parseInt(custom);
      if (isNaN(required) || required < 1 || required > 100) {
        showToast('Enter a valid percentage.', 'warning'); return;
      }
    } else if (selected) {
      required = parseInt(selected.dataset.pct);
    } else {
      showToast('Select or enter a percentage.', 'warning'); return;
    }
    updateSemester({ required });
    showToast(`Requirement set to ${required}%`, 'success');
  });

  // Save / add subject
  on('save-subject', 'click', () => {
    const name = val('set-sub-name');
    if (!name) { showToast('Enter a subject name.', 'warning'); return; }

    const data = getData();

    if (editingSubjectId) {
      data.subjects = data.subjects.map(s =>
        s.id === editingSubjectId
          ? { ...s, name, color: selectedColor, type: 'theory', multiplier: 1 }
          : s
      );
      saveData(data);
      showToast(`${name} updated!`, 'success');
      editingSubjectId = null;
    } else {
      data.subjects.push({ id: generateId(), name, color: selectedColor, type: 'theory', multiplier: 1 });
      saveData(data);
      showToast(`${name} added!`, 'success');
    }
    drawSettings(container);
  });

  // Cancel edit
  on('cancel-edit', 'click', () => { editingSubjectId = null; drawSettings(container); });

  // Edit subject buttons
  document.querySelectorAll('[data-edit-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset.editSub;
      const sub = getData().subjects.find(s => s.id === id);
      if (!sub) return;

      editingSubjectId = id;
      const nameInput = document.getElementById('set-sub-name');
      if (nameInput) nameInput.value = sub.name;

      selectedColor = sub.color;
      document.querySelectorAll('#set-color-picker .color-dot').forEach(d => {
        d.classList.toggle('selected', d.dataset.color === sub.color);
      });

      const titleEl  = document.getElementById('sub-form-title');
      const labelEl  = document.getElementById('save-subject-label');
      const cancelEl = document.getElementById('cancel-edit');
      if (titleEl)  titleEl.textContent  = 'Edit subject';
      if (labelEl)  labelEl.textContent  = 'Save changes';
      if (cancelEl) cancelEl.classList.remove('hidden');
      document.getElementById('subject-form-card')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Delete subject buttons
  document.querySelectorAll('[data-del-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.delSub;
      const data = getData();
      const sub  = data.subjects.find(s => s.id === id);
      if (!sub) return;
      if (!confirm(`Remove "${sub.name}"? All logged attendance and timetable slots for this subject will be deleted.`)) return;
      
      data.subjects = data.subjects.filter(s => s.id !== id);
      // Remove from logs
      Object.keys(data.logs).forEach(date => {
        if (data.logs[date]) {
          Object.keys(data.logs[date]).forEach(slotId => {
            const entry = data.logs[date][slotId];
            if (entry && (entry.subjectId === id || slotId === id)) {
              delete data.logs[date][slotId];
            }
          });
          if (Object.keys(data.logs[date]).length === 0) delete data.logs[date];
        }
      });
      // Remove from timetable
      Object.keys(data.timetable).forEach(day => {
        data.timetable[day] = data.timetable[day].filter(slot => slot.subjectId !== id);
      });

      saveData(data);
      showToast(`${sub.name} removed.`, 'info');
      drawSettings(container);
    });
  });

  // Timetable Day selection click
  document.querySelectorAll('[data-set-day]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSettingsDay = btn.dataset.setDay;
      drawSettings(container);
    });
  });

  // Timetable Add / Save Class click
  on('save-timetable-slot', 'click', () => {
    const subjectId = document.getElementById('set-slot-subject').value;
    const startTime = document.getElementById('set-slot-start').value;
    const endTime   = document.getElementById('set-slot-end').value;

    if (!subjectId) { showToast('Please select a subject.', 'warning'); return; }
    if (!startTime || !endTime) { showToast('Please select times.', 'warning'); return; }
    if (startTime >= endTime) { showToast('End time must be after start time.', 'warning'); return; }

    const data = getData();
    if (editingSlotId) {
      data.timetable[selectedSettingsDay] = data.timetable[selectedSettingsDay].map(slot =>
        slot.id === editingSlotId
          ? { ...slot, subjectId, startTime, endTime }
          : slot
      );
      saveData(data);
      showToast('Class updated!', 'success');
      editingSlotId = null;
    } else {
      data.timetable[selectedSettingsDay].push({
        id: generateId(),
        subjectId,
        startTime,
        endTime
      });
      saveData(data);
      showToast('Class added!', 'success');
    }
    drawSettings(container);
  });

  // Timetable Cancel Edit Class click
  on('cancel-edit-slot', 'click', () => {
    editingSlotId = null;
    drawSettings(container);
  });

  // Timetable Edit Class click
  document.querySelectorAll('[data-edit-slot-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slotId = btn.dataset.editSlotId;
      const data = getData();
      const slot = data.timetable[selectedSettingsDay].find(s => s.id === slotId);
      if (!slot) return;

      editingSlotId = slotId;
      drawSettings(container);
      
      // Populate form controls
      document.getElementById('set-slot-subject').value = slot.subjectId;
      document.getElementById('set-slot-start').value = slot.startTime;
      document.getElementById('set-slot-end').value = slot.endTime;
    });
  });

  // Timetable Delete Class click
  document.querySelectorAll('[data-del-slot-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slotId = btn.dataset.delSlotId;
      const data = getData();
      data.timetable[selectedSettingsDay] = data.timetable[selectedSettingsDay].filter(slot => slot.id !== slotId);
      if (editingSlotId === slotId) editingSlotId = null;
      saveData(data);
      showToast('Class removed.', 'info');
      drawSettings(container);
    });
  });

  // Reset
  on('reset-btn', 'click', () => {
    if (!confirm('This will delete ALL your data and restart setup. Are you absolutely sure?')) return;
    localStorage.removeItem('bunkbuddy_v1');
    document.dispatchEvent(new CustomEvent('bunkbuddy:reset'));
  });
}

// ─── Subject row ──────────────────────────────────────────────────────────────

function buildSubjectRow(s) {
  return `
    <div class="subject-list-item">
      <div class="subject-list-dot" style="background:${s.color}"></div>
      <div style="flex:1;min-width:0">
        <div class="subject-list-name">${escHtml(s.name)}</div>
      </div>
      <button class="btn-icon" data-edit-sub="${s.id}" aria-label="Edit"
        style="width:30px;height:30px;flex-shrink:0">
        <i data-lucide="pencil" style="width:14px;height:14px"></i>
      </button>
      <button class="btn-icon" data-del-sub="${s.id}" aria-label="Delete"
        style="width:30px;height:30px;color:var(--danger);border-color:rgba(248,113,113,0.3);flex-shrink:0">
        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
      </button>
    </div>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function on(id, event, handler) { const el = document.getElementById(id); if (el) el.addEventListener(event, handler); }
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function escHtml(str) { return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
