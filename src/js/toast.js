// ─── Toast Notifications ─────────────────────────────────────────────────────

const container = () => document.getElementById('toast-container');

let toastCount = 0;

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration - ms before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3000) {
  const id = `toast-${++toastCount}`;
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = id;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="document.getElementById('${id}').remove()" aria-label="Dismiss">
      <i data-lucide="x"></i>
    </button>
  `;

  container().appendChild(toast);

  // Render icons
  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  // Animate in
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
