/**
 * TechPhone — Shared Element Product Transition State Helper (Effect 21)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.SharedElement = {
    init() {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-shared-product-link]');
        if (!link) return;
        const pid = link.getAttribute('data-shared-product-link');
        if (pid) {
          TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.PREFERENCES, {
            lastClickedProductId: pid,
            timestamp: Date.now()
          });
        }
      });
    }
  };
})(window);
