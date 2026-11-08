/**
 * TechPhone — Page Curtain & Crossfade Navigation (Effects 22, 23, 27)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.PageTransition = {
    init() {
      if (TP.MotionFallbacks.prefersReducedMotion()) return;
      let curtain = TP.DOM.qs('.tp-page-curtain');
      if (!curtain) {
        curtain = document.createElement('div');
        curtain.className = 'tp-page-curtain';
        document.body.appendChild(curtain);
      }
    }
  };
})(window);
