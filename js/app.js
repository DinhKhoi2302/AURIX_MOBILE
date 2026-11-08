/**
 * AURIX MOBILE — Main Application Entry Point
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.App = {
    initialized: false,
    init() {
      if (this.initialized) return;
      this.initialized = true;

      TP.ErrorHandler.init();
      if (TP.ProductLoader) {
        TP.ProductLoader.hydrateFromSnapshot();
        TP.ProductLoader.loadCatalogAndModels();
      }
      TP.Navigation.init();
      TP.MegaMenu.init();
      TP.SearchOverlay.init();
      TP.Modal.init();
      TP.CartDrawer.init();
      TP.Header.init();
      TP.Footer.init();
      TP.ProductCard.initGlobalDelegation();
      TP.MotionManager.init();
      TP.PageInit.runCurrentPage();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TP.App.init());
  } else {
    TP.App.init();
  }
})(window);
