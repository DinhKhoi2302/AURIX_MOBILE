/**
 * TechPhone — Animated Price & Statistic Counters (Effect 20)
 * Always guarantees exact final numeric value.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Counters = {
    animatePrice(el, targetValue) {
      if (!el) return;
      const finalVal = Number(targetValue) || 0;
      if (TP.MotionFallbacks.prefersReducedMotion()) {
        el.textContent = TP.DOM.formatPrice(finalVal);
        return;
      }
      el.textContent = TP.DOM.formatPrice(finalVal);
      el.animate(
        [
          { transform: 'scale(1.06)', color: '#0866F5' },
          { transform: 'scale(1)', color: '#FF5147' }
        ],
        { duration: 240, easing: 'ease-out' }
      );
    }
  };
})(window);
