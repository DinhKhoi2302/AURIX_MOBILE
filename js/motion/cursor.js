/**
 * TechPhone — Non-Intrusive Desktop Custom Cursor Follower (Effect 45)
 * Only activates on fine pointer desktop and disables over inputs/textareas.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Cursor = {
    init() {
      if (TP.MotionFallbacks.prefersReducedMotion() || !TP.MotionFallbacks.hasFinePointer()) return;
      if (TP.DOM.qs('#tp-custom-cursor')) return;

      const dot = document.createElement('div');
      dot.id = 'tp-custom-cursor';
      dot.className = 'tp-custom-cursor-dot';
      document.body.appendChild(dot);

      window.addEventListener('mousemove', (e) => {
        dot.classList.add('is-active');
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
        const interactive = e.target && e.target.closest('a, button, [role="button"]');
        const isInput = e.target && e.target.closest('input, textarea, select');
        dot.classList.toggle('is-hover', Boolean(interactive && !isInput));
        dot.style.opacity = isInput ? '0' : '1';
      }, { passive: true });
    }
  };
})(window);
