/**
 * TechPhone — Toast Notification Component
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Toast = {
    ensureContainer() {
      let c = TP.DOM.qs('#tp-toast-container');
      if (!c) {
        c = document.createElement('div');
        c.id = 'tp-toast-container';
        c.className = 'tp-toast-container';
        c.setAttribute('aria-live', 'polite');
        document.body.appendChild(c);
      }
      return c;
    },
    show(message, type = 'info', duration = 3400) {
      const container = this.ensureContainer();
      const item = document.createElement('div');
      item.className = `tp-toast is-${type}`;
      item.innerHTML = `
        <span>${TP.DOM.escapeHtml(message)}</span>
        <button type="button" aria-label="Đóng thông báo" style="color:#FFFFFF;opacity:0.8;font-weight:700;">✕</button>
      `;
      const closeBtn = item.querySelector('button');
      const removeToast = () => {
        if (item.parentNode) item.parentNode.removeChild(item);
      };
      if (closeBtn) closeBtn.addEventListener('click', removeToast);
      container.appendChild(item);
      if (duration > 0) {
        setTimeout(removeToast, duration);
      }
    }
  };
})(window);
