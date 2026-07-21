// ─── BunkBuddy — App Entry Point & Router ─────────────────────────────────────
// Orchestrates onboarding vs main app, handles page routing.
// No framework. Just a clean, minimal SPA shell.

import { getData }            from './storage.js';
import { renderOnboarding }   from './pages/onboarding.js';
import { renderDashboard }    from './pages/dashboard.js';
import { renderLog }          from './pages/log.js';
import { renderCalendar }     from './pages/calendar.js';
import { renderLeave }        from './pages/leave.js';
import { renderStats }        from './pages/stats.js';
import { renderSettings }     from './pages/settings.js';

// ─── State ────────────────────────────────────────────────────────────────────

const PAGES = {
  dashboard: { label: 'Dashboard', icon: 'layout-dashboard', render: renderDashboard },
  log:       { label: 'Log',       icon: 'pencil-line',      render: renderLog },
  calendar:  { label: 'Calendar',  icon: 'calendar',         render: renderCalendar },
  leave:     { label: 'Leave Planner', icon: 'umbrella',     render: renderLeave },
  stats:     { label: 'Statistics', icon: 'bar-chart-2',     render: renderStats },
  settings:  { label: 'Settings',  icon: 'settings',         render: renderSettings }
};

// Shared navigate function (used by pages that need to cross-navigate)
export function navigate(pageId, _extra) {
  window.location.hash = `#/${pageId}`;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

function boot() {
  const data = getData();
  const root = document.getElementById('app');

  if (!data.onboarded) {
    showOnboarding(root);
  } else {
    showMainApp(root);
  }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function showOnboarding(root) {
  root.innerHTML = '';
  const container = document.createElement('div');
  root.appendChild(container);
  renderOnboarding(container);

  document.addEventListener('bunkbuddy:onboarded', () => {
    showMainApp(root);
  }, { once: true });
}

// ─── Main App Shell ───────────────────────────────────────────────────────────

function showMainApp(root) {
  root.innerHTML = buildAppShell();
  if (window.lucide) lucide.createIcons();

  updateSemesterPill();
  routeTo(currentPage());

  window.addEventListener('hashchange', () => {
    const page = currentPage();
    routeTo(page);
    updateNavActive(page);
  });

  document.addEventListener('bunkbuddy:reset', () => {
    window.location.reload();
  }, { once: true });
}

function buildAppShell() {
  const navItems = (items, cls, showLabels = true) =>
    items.map(([id, icon, label]) => `
      <a href="#/${id}" class="${cls}" data-page="${id}" id="nav-${id}" aria-label="${label}">
        <i data-lucide="${icon}"></i>
        ${showLabels ? `<span>${label}</span>` : ''}
      </a>
    `).join('');

  const desktopItems = [
    ['dashboard', 'layout-dashboard', 'Dashboard'],
    ['log',       'pencil-line',      'Log'],
    ['calendar',  'calendar',         'Calendar'],
    ['leave',     'umbrella',         'Leave Planner'],
    ['stats',     'bar-chart-2',      'Statistics'],
    ['settings',  'settings',         'Settings']
  ];

  const mobileItems = [
    ['dashboard', 'layout-dashboard', 'Home'],
    ['log',       'pencil-line',      'Log'],
    ['leave',     'umbrella',         'Leave'],
    ['stats',     'bar-chart-2',      'Stats'],
    ['settings',  'settings',         'More']
  ];

  return `
    <div class="app-shell">
      <!-- Desktop Top Navbar -->
      <header id="top-navbar">
        <div class="navbar-logo">
          <span class="logo-emoji">🎓</span>
          <span class="logo-text">BunkBuddy</span>
        </div>
        <nav class="navbar-nav" role="navigation" aria-label="Main navigation">
          ${navItems(desktopItems, 'nav-item')}
        </nav>
        <div class="navbar-footer">
          <div class="semester-pill" id="sidebar-semester-pill">
            <i data-lucide="calendar" style="width:13px;height:13px"></i>
            <span id="semester-name-label">Loading…</span>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main id="page-content" role="main" aria-live="polite"></main>

      <!-- Bottom nav (mobile) -->
      <nav id="bottom-nav" role="navigation" aria-label="Mobile navigation">
        ${navItems(mobileItems, 'bottom-nav-item', true)}
      </nav>
    </div>
  `;
}

// ─── Router ───────────────────────────────────────────────────────────────────

function currentPage() {
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  return PAGES[hash] ? hash : 'dashboard';
}

function routeTo(pageId) {
  const page    = PAGES[pageId];
  const content = document.getElementById('page-content');
  if (!page || !content) return;

  content.innerHTML = '';
  page.render(content);
  if (window.lucide) lucide.createIcons();
  updateNavActive(pageId);

  // Scroll to top on navigation
  content.scrollTop = 0;
  window.scrollTo(0, 0);
}

function updateNavActive(pageId) {
  // Desktop sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
  // Mobile bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

function updateSemesterPill() {
  const el = document.getElementById('semester-name-label');
  if (!el) return;
  const { semester } = getData();
  el.textContent = semester.name || 'My Semester';
}

// ─── Go ───────────────────────────────────────────────────────────────────────

boot();
