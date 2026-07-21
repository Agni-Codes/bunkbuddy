// ─── Statistics Page ──────────────────────────────────────────────────────────
// Deeper trend view — attendance over time, per-subject comparison, summary stats.

import { getData }          from '../storage.js';
import { calcStats, getAttendanceTrend, fmtPct } from '../calculations.js';

let trendChart = null;
let barChart   = null;

export function renderStats(container) {
  const data  = getData();
  const stats = calcStats();
  const { overall, subjects } = stats;

  // Destroy old Chart.js instances to avoid canvas reuse error
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  if (barChart)   { barChart.destroy();   barChart   = null; }

  const trend = getAttendanceTrend();

  container.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <h1 class="page-title">Statistics</h1>
          <p class="page-sub">The full picture — useful before exams</p>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="stats-summary-grid">
        <div class="stat-mini">
          <div class="stat-mini-num ${statusColor(overall.status)}">${fmtPct(overall.pct)}</div>
          <div class="stat-mini-label">Overall attendance</div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-num">${overall.attended}</div>
          <div class="stat-mini-label">Classes attended</div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-num">${overall.held}</div>
          <div class="stat-mini-label">Classes held</div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-num ${overall.safe < 0 ? 'danger' : 'safe'}">${overall.safe < 0 ? 0 : overall.safe}</div>
          <div class="stat-mini-label">Safe leaves left</div>
        </div>
      </div>

      <!-- Trend chart -->
      ${trend.length >= 2 ? `
        <div class="chart-wrap mb-md">
          <div class="card-header">
            <div class="card-title">Attendance trend</div>
            <div class="badge badge-${overall.status}">${fmtPct(overall.pct)} current</div>
          </div>
          <div class="chart-container">
            <canvas id="trend-chart"></canvas>
          </div>
        </div>
      ` : `
        <div class="card mb-md" style="text-align:center;padding:2rem">
          <div style="font-size:1.5rem;margin-bottom:0.5rem">📊</div>
          <div style="color:var(--text-3);font-size:0.875rem">Log at least 2 days of attendance to see your trend chart.</div>
        </div>
      `}

      <!-- Per-subject comparison -->
      ${subjects.length > 0 ? `
        <div class="chart-wrap mb-md">
          <div class="card-header">
            <div class="card-title">Per-subject comparison</div>
          </div>
          <div class="chart-container">
            <canvas id="bar-chart"></canvas>
          </div>
        </div>
      ` : ''}

      <!-- Subject detail table -->
      ${subjects.length > 0 ? `
        <h4 class="mb-sm">Subject details</h4>
        <div class="settings-card">
          ${subjects.map(buildSubjectDetailRow).join('')}
        </div>
      ` : ''}
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Render charts after DOM is painted
  requestAnimationFrame(() => {
    if (trend.length >= 2) renderTrendChart(trend, data.semester.required);
    if (subjects.length > 0) renderBarChart(subjects, data.semester.required);
  });
}

// ─── Trend line chart ──────────────────────────────────────────────────────────

function renderTrendChart(trend, required) {
  const canvas = document.getElementById('trend-chart');
  if (!canvas || !window.Chart) return;

  const labels = trend.map(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  });
  const values = trend.map(t => parseFloat(t.pct.toFixed(1)));

  trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Attendance %',
          data: values,
          fill: true,
          backgroundColor: 'rgba(129, 140, 248, 0.08)',
          borderColor: '#818cf8',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: '#818cf8',
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: `Target (${required}%)`,
          data: Array(values.length).fill(required),
          borderColor: 'rgba(239, 68, 68, 0.5)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: chartOptions(`${required}%`)
  });
}

// ─── Per-subject bar chart ─────────────────────────────────────────────────────

function renderBarChart(subjects, required) {
  const canvas = document.getElementById('bar-chart');
  if (!canvas || !window.Chart) return;

  barChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: subjects.map(s => s.name),
      datasets: [
        {
          label: 'Attendance %',
          data: subjects.map(s => parseFloat(s.pct.toFixed(1))),
          backgroundColor: subjects.map(s => s.color + 'cc'),
          borderColor: subjects.map(s => s.color),
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: `Target (${required}%)`,
          data: subjects.map(() => required),
          type: 'line',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: chartOptions(null, true)
  });
}

function chartOptions(yLabel = null, isBar = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#8e8ea8',
          font: { family: 'Inter', size: 12 },
          boxWidth: 12, boxHeight: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#1a1a28',
        borderColor: '#252538',
        borderWidth: 1,
        titleColor: '#eaeaf5',
        bodyColor: '#8e8ea8',
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#52526e', font: { family: 'Inter', size: 11 }, maxTicksLimit: 8 }
      },
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#52526e',
          font: { family: 'Inter', size: 11 },
          callback: v => v + '%'
        }
      }
    }
  };
}

// ─── Subject detail row ────────────────────────────────────────────────────────

function buildSubjectDetailRow(s) {
  return `
    <div class="settings-row">
      <div style="display:flex;align-items:center;gap:0.625rem;flex:1">
        <div style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
        <div>
          <div class="settings-row-label">${escHtml(s.name)}</div>
          <div class="settings-row-sub">${s.attended}/${s.held} classes attended</div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:1rem;font-weight:700;color:var(--${statusColor(s.status)})">${fmtPct(s.pct)}</div>
        <div class="text-xs text-muted">${s.safe < 0 ? `${s.recovery} needed` : `${s.safe} safe leaves`}</div>
      </div>
      <div class="badge badge-${s.status}">${s.status.toUpperCase()}</div>
    </div>
  `;
}

function statusColor(status) {
  return { safe: 'safe', warning: 'warning', danger: 'danger' }[status] || 'accent';
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
