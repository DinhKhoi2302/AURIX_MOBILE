/**
 * TechPhone — 3D Card Tilt Hover & Elevation (Effects 11, 13, 19)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.ProductCardMotion = {
    init(scope = document) {
      if (TP.MotionFallbacks.prefersReducedMotion() || !TP.MotionFallbacks.hasFinePointer()) return;

      TP.DOM.qsa('.tp-tilt-card', scope).forEach((card) => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = 'true';

        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `translateY(-6px) perspective(700px) rotateX(${(-dy * 5).toFixed(2)}deg) rotateY(${(dx * 5).toFixed(2)}deg)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }
  };
})(window);
