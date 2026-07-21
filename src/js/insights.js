// ─── Smart Insights Engine ────────────────────────────────────────────────────
// Generates plain-language guidance from raw numbers. No AI, just conditional
// logic against current attendance stats.

/**
 * Generate the primary insight for the dashboard card.
 * @param {{ overall: object, subjects: object[] }} stats
 * @returns {string} HTML-safe insight string
 */
export function getPrimaryInsight(stats) {
  const { overall, subjects } = stats;
  const { safe, recovery, pct, required, held } = overall;

  if (held === 0) {
    return "Start logging your attendance to see insights here.";
  }

  if (safe < 0) {
    return `⚠️ Attend the next <strong>${recovery}</strong> classes in a row to get back to ${required}%.`;
  }

  if (safe === 0) {
    return `🎯 You're right at the line. Don't miss a single class.`;
  }

  if (safe <= 2) {
    return `⚡ You can miss <strong>${safe}</strong> more class${safe === 1 ? '' : 'es'}. Tread carefully.`;
  }

  if (pct >= 90) {
    return `✨ You can safely miss <strong>${safe}</strong> more classes. Comfortably ahead!`;
  }

  return `👍 You can safely miss <strong>${safe}</strong> more classes while staying above ${required}%.`;
}

/**
 * Generate per-subject insights for the leave planner.
 * Returns an array of plain-text messages.
 */
export function getSubjectInsights(subjects) {
  return subjects.map(s => {
    if (s.held === 0) return `${s.name}: No classes logged yet.`;
    if (s.safe < 0) return `${s.name}: Attend ${s.recovery} more to recover ⚠️`;
    if (s.safe === 0) return `${s.name}: No room to miss. Attend everything.`;
    if (s.safe <= 2) return `${s.name}: Only ${s.safe} safe leave${s.safe === 1 ? '' : 's'} left. Be careful.`;
    return `${s.name}: ${s.safe} safe leaves available ✓`;
  });
}

/**
 * Returns a status-level string: 'safe', 'warning', or 'danger'
 * based on overall safe leaves.
 */
export function getStatusLevel(safe, held) {
  if (held === 0) return 'safe';
  if (safe < 0) return 'danger';
  if (safe <= 2) return 'warning';
  return 'safe';
}

/**
 * Generate a short daily tip for the dashboard.
 */
export function getDailyTip(stats) {
  const { overall, subjects } = stats;
  const dangerSubs = subjects.filter(s => s.status === 'danger');
  const warningSubs = subjects.filter(s => s.status === 'warning');

  if (dangerSubs.length > 0) {
    const names = dangerSubs.map(s => s.name).join(', ');
    return `⚠️ ${names} ${dangerSubs.length === 1 ? 'is' : 'are'} below target. Prioritise these today.`;
  }

  if (warningSubs.length > 0) {
    return `🟡 ${warningSubs.map(s => s.name).join(', ')} ${warningSubs.length === 1 ? 'has' : 'have'} thin margins. Don't skip these.`;
  }

  if (overall.pct >= 90) {
    return "You're in great shape across all subjects. Keep it up.";
  }

  return "All subjects are above target. You're doing well.";
}

/**
 * Generate a prediction message based on current trend.
 * Simple linear extrapolation: if you maintain current rate.
 * @param {number} currentPct
 * @param {number} required
 */
export function getPredictionMessage(currentPct, required) {
  const diff = currentPct - required;
  if (diff >= 15) return "At this rate, you'll easily clear exams. 🎉";
  if (diff >= 5) return "On track. A few missed classes won't hurt.";
  if (diff >= 0) return "Just above the line. Don't let your guard down.";
  return "You'll need to attend more classes to hit your target.";
}
