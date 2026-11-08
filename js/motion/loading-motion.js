/**
 * TechPhone — Skeleton & Order Success Motion Helper (Effects 43 & 44)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.LoadingMotion = {
    pulseContainer(container) {
      if (!container || TP.MotionFallbacks.prefersReducedMotion()) return;
      container.classList.add('is-updating');
      setTimeout(() => container.classList.remove('is-updating'), 180);
    }
  };
})(window);
