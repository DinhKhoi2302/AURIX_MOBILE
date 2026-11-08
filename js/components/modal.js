/**
 * TechPhone — Accessible Modal Manager
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Modal = {
    open(modalId) {
      const el = TP.DOM.qs('#' + modalId);
      if (!el) return;
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const focusable = el.querySelector('button, [href], input, select, textarea');
      if (focusable) setTimeout(() => focusable.focus(), 40);
    },
    close(modalId) {
      const el = typeof modalId === 'string' ? TP.DOM.qs('#' + modalId) : modalId;
      if (!el) return;
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },
    init() {
      if (document.body.dataset.tpModalBound) return;
      document.body.dataset.tpModalBound = 'true';

      document.addEventListener('click', (e) => {
        const closeTrigger = e.target.closest('[data-modal-close]');
        if (closeTrigger) {
          const backdrop = closeTrigger.closest('.tp-modal-backdrop');
          if (backdrop) this.close(backdrop);
        }
        if (e.target.classList && e.target.classList.contains('tp-modal-backdrop')) {
          this.close(e.target);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          TP.DOM.qsa('.tp-modal-backdrop.is-open').forEach((m) => this.close(m));
        }
      });
    }
  };
})(window);
