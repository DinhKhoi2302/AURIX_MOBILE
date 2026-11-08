/**
 * TechPhone — Subtle Scroll Parallax & Camera Movement (Effects 04 & 30)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Parallax = {
    init() {
      if (TP.MotionFallbacks.prefersReducedMotion()) return;
      const layers = TP.DOM.qsa('[data-parallax-speed]');
      if (!layers.length) return;

      const onScroll = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        layers.forEach((el) => {
          const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.06;
          const offset = Math.max(-28, Math.min(28, scrollY * speed));
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
    }
  };
})(window);
