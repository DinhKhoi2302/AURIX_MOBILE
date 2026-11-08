/**
 * TechPhone — Magnetic CTA Button Interaction (Effects 12 & 49)
 * Avoids duplicate bindings on the same button per Section VII.49.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.MagneticButton = {
    init(scope = document) {
      if (TP.MotionFallbacks.prefersReducedMotion() || !TP.MotionFallbacks.hasFinePointer()) return;

      TP.DOM.qsa('[data-magnetic]', scope).forEach((btn) => {
        if (btn.dataset.magneticBound) return;
        btn.dataset.magneticBound = 'true';

        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
          const y = (e.clientY - rect.top - rect.height / 2) * 0.22;
          btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
        });
      });
    }
  };
})(window);
