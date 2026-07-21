// ─── BunkBuddy Storage Layer v2 ───────────────────────────────────────────────
// Subject model: { id, name, color, type: 'theory'|'lab', multiplier: 1|2 }
// No fixed weekly schedule — log any subject on any date.

const STORAGE_KEY = 'bunkbuddy_v1';

const DEFAULT_STATE = {
  onboarded: false,
  semester: {
    name: 'My Semester',
    start: '',
    end: '',
    required: 75
  },
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
  // logs: { 'YYYY-MM-DD': { slotId: { subjectId, status, startTime, endTime } } }
  logs: {}
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

export function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const data = JSON.parse(raw);
    return migrate(data);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateData(patch) {
  const current = getData();
  const next = { ...current, ...patch };
  saveData(next);
  return next;
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Migration ────────────────────────────────────────────────────────────────
// Ensures old data gets converted to multiplier 1 and timetable initialized.

function migrate(data) {
  let dirty = false;
  if (data.subjects) {
    data.subjects = data.subjects.map(s => {
      if (s.multiplier !== 1 || s.type !== 'theory') {
        dirty = true;
        return { ...s, type: 'theory', multiplier: 1 };
      }
      return s;
    });
  }
  if (!data.timetable) {
    data.timetable = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
    dirty = true;
  }
  if (dirty) saveData(data);
  return data;
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export function addSubject(subject) {
  const data = getData();
  data.subjects.push(subject);
  saveData(data);
}

export function updateSubject(id, patch) {
  const data = getData();
  data.subjects = data.subjects.map(s => s.id === id ? { ...s, ...patch } : s);
  saveData(data);
}

export function deleteSubject(id) {
  const data = getData();
  data.subjects = data.subjects.filter(s => s.id !== id);
  Object.keys(data.logs).forEach(date => {
    if (data.logs[date]) delete data.logs[date][id];
  });
  saveData(data);
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function getLog(date) {
  const data = getData();
  return data.logs[date] || {};
}

export function setLog(date, subjectId, status) {
  const data = getData();
  if (!data.logs[date]) data.logs[date] = {};
  if (status === null || status === undefined) {
    delete data.logs[date][subjectId];
    if (Object.keys(data.logs[date]).length === 0) delete data.logs[date];
  } else {
    data.logs[date][subjectId] = status;
  }
  saveData(data);
}

// ─── Semester ─────────────────────────────────────────────────────────────────

export function updateSemester(patch) {
  const data = getData();
  data.semester = { ...data.semester, ...patch };
  saveData(data);
  return data;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Returns today's date string in YYYY-MM-DD */
export function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a YYYY-MM-DD string to a human-readable short form */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
