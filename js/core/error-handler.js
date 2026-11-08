/**
 * AURIX MOBILE — Resilient Error Handler
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.ErrorHandler = {
    init() {
      window.addEventListener('error', (event) => {
        if (window.location.protocol === 'about:') return;
        // Fallback for broken images
        if (event.target && event.target.tagName === 'IMG') {
          const img = event.target;
          if (!img.dataset.fallbackApplied) {
            img.dataset.fallbackApplied = 'true';
            img.dataset.originalSrc = img.getAttribute('src') || '';
            img.src = 'assets/images/placeholders/placeholder-default.svg';
          }
        }
      }, true);
    },
    safeRun(label, fn) {
      try {
        return fn();
      } catch (err) {
        console.warn('[AURIX SafeRun Warning] ' + label + ':', err);
        return null;
      }
    }
  };
})(window);
