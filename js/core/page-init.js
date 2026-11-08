/**
 * TechPhone — Page Registry & Initializer Dispatcher
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  const registry = {};

  TP.PageInit = {
    register(pageName, initFn) {
      registry[pageName] = initFn;
    },
    runCurrentPage() {
      const pageName = document.body.getAttribute('data-page') || 'home';
      const fn = registry[pageName];
      if (typeof fn === 'function') {
        TP.ErrorHandler.safeRun('PageInit:' + pageName, () => fn());
      }
    }
  };
})(window);
