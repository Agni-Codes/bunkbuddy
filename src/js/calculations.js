// ─── Attendance Calculation Engine v2 ────────────────────────────────────────
// Supports multipliers: Theory=1, Lab=2.
// A lab "present" adds 2 to both attended and held.

import { getData } from './storage.js';

// ─── Per-subject counting ─────────────────────────────────────────────────────

function countSubject(subject, logs, start = '', end = '') {
  let attended = 0, held = 0;
  for (const [dateStr, dayLog] of Object.entries(logs)) {
    if (!dayLog) continue;
    if (start && dateStr < start) continue;
    if (end && dateStr > end) continue;
    for (const [key, value] of Object.entries(dayLog)) {
      let subId, status;
      if (value && typeof value === 'object') {
        subId = value.subjectId;
        status = value.status;
      } else {
        subId = key;
        status = value;
      }
      if (subId === subject.id) {
        if (status === 'present') { attended += 1; held += 1; }
        else if (status === 'absent') { held += 1; }
      }
    }
  }
  return { attended, held };
}

function computeSubjectStats(subject, logs, R, start = '', end = '') {
  const { attended, held } = countSubject(subject, logs, start, end);
  const pct = held === 0 ? 100 : (attended / held) * 100;
  const safe = held === 0 ? 0 : Math.floor((attended - R * held) / R);
  const recovery = safe < 0 ? Math.ceil((R * held - attended) / (1 - R)) : 0;

  let status;
  if (held === 0 || safe >= 5) status = 'safe';
  else if (safe >= 0) status = 'warning';
  else status = 'danger';

  return { ...subject, attended, held, pct, safe, recovery, status };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function calcStats() {
  const { semester, subjects, logs } = getData();
  const R = semester.required / 100;
  const start = semester.start || '';
  const end = semester.end || '';

  const subjectStats = subjects.map(s => computeSubjectStats(s, logs, R, start, end));

  const totalA = subjectStats.reduce((sum, s) => sum + s.attended, 0);
  const totalH = subjectStats.reduce((sum, s) => sum + s.held, 0);
  const overallPct  = totalH === 0 ? 100 : (totalA / totalH) * 100;
  const overallSafe = totalH === 0 ? 0 : Math.floor((totalA - R * totalH) / R);
  const overallRecovery = overallSafe < 0 ? Math.ceil((R * totalH - totalA) / (1 - R)) : 0;

  let overallStatus;
  if (totalH === 0 || overallSafe >= 5) overallStatus = 'safe';
  else if (overallSafe >= 0) overallStatus = 'warning';
  else overallStatus = 'danger';

  return {
    overall: {
      attended: totalA, held: totalH, pct: overallPct,
      safe: overallSafe, recovery: overallRecovery,
      status: overallStatus, required: semester.required
    },
    subjects: subjectStats
  };
}

// ─── What-if simulator ────────────────────────────────────────────────────────

export function whatIfSkip(skipN) {
  const { semester, subjects, logs } = getData();
  const R = semester.required / 100;
  const start = semester.start || '';
  const end = semester.end || '';

  let totalA = 0, totalH = 0;
  subjects.forEach(sub => {
    const { attended, held } = countSubject(sub, logs, start, end);
    totalA += attended;
    totalH += held;
  });

  const newH = totalH + skipN;
  const pct = newH === 0 ? 100 : (totalA / newH) * 100;
  const safe = Math.floor((totalA - R * newH) / R);
  const recovery = safe < 0 ? Math.ceil((R * newH - totalA) / (1 - R)) : 0;

  return { pct, safe, recovery, belowTarget: pct < semester.required };
}

// ─── Trend data for charts ────────────────────────────────────────────────────

export function getAttendanceTrend() {
  const { semester, subjects, logs } = getData();
  const start = semester.start || '';
  const end = semester.end || '';

  const sortedDates = Object.keys(logs)
    .filter(d => (!start || d >= start) && (!end || d <= end))
    .sort();

  let totalA = 0, totalH = 0;
  return sortedDates.map(date => {
    const dayLog = logs[date] || {};
    for (const [key, value] of Object.entries(dayLog)) {
      let subId, status;
      if (value && typeof value === 'object') {
        subId = value.subjectId;
        status = value.status;
      } else {
        subId = key;
        status = value;
      }
      const hasSub = subjects.some(s => s.id === subId);
      if (hasSub) {
        if (status === 'present') { totalA += 1; totalH += 1; }
        else if (status === 'absent') { totalH += 1; }
      }
    }
    return { date, pct: totalH === 0 ? 100 : (totalA / totalH) * 100 };
  });
}

/** Format percentage for display */
export function fmtPct(pct) {
  return `${pct.toFixed(1)}%`;
}
