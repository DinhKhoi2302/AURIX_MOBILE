/**
 * TechPhone — Accessible Accordion Component (Effect 36)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Accordion = {
    init(scope = document) {
      TP.DOM.qsa('[data-accordion-trigger]', scope).forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          const targetId = btn.getAttribute('aria-controls');
          const panel = targetId ? document.getElementById(targetId) : btn.nextElementSibling;
          btn.setAttribute('aria-expanded', String(!expanded));
          if (panel) {
            panel.hidden = expanded;
          }
        });
      });
    }
  };
})(window);
