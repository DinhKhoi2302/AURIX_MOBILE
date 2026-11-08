/**
 * TechPhone — IntersectionObserver Staggered Scroll Reveal (Effects 03, 09, 32, 33)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.ScrollReveal = {
    observer: null,
    init(scope = document) {
      const items = TP.DOM.qsa('.tp-reveal', scope);
      if (!items.length) return;

      if (TP.MotionFallbacks.prefersReducedMotion() || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      document.documentElement.classList.add('js-motion-ready');

      if (!this.observer) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                this.observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
        );
      }

      items.forEach((el, idx) => {
        if (!el.classList.contains('is-visible')) {
          el.style.transitionDelay = `${Math.min(idx % 6, 5) * 45}ms`;
          this.observer.observe(el);
        }
      });
    }
  };
})(window);
