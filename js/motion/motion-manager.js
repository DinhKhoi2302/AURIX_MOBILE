/**
 * TechPhone — Central Motion Manager (Orchestrates all 50 Effects & Reduced Motion)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.MotionManager = {
    init() {
      TP.ErrorHandler.safeRun('HeroReveal', () => TP.HeroReveal && TP.HeroReveal.init());
      TP.ErrorHandler.safeRun('ScrollReveal', () => TP.ScrollReveal && TP.ScrollReveal.init());
      TP.ErrorHandler.safeRun('Parallax', () => TP.Parallax && TP.Parallax.init());
      TP.ErrorHandler.safeRun('Product3D', () => TP.Product3D && TP.Product3D.init());
      TP.ErrorHandler.safeRun('ProductCardMotion', () => TP.ProductCardMotion && TP.ProductCardMotion.init());
      TP.ErrorHandler.safeRun('MagneticButton', () => TP.MagneticButton && TP.MagneticButton.init());
      TP.ErrorHandler.safeRun('PageTransition', () => TP.PageTransition && TP.PageTransition.init());
      TP.ErrorHandler.safeRun('SharedElement', () => TP.SharedElement && TP.SharedElement.init());
      TP.ErrorHandler.safeRun('Cursor', () => TP.Cursor && TP.Cursor.init());
      TP.ErrorHandler.safeRun('HeroParticles', () => TP.MotionFallbacks && TP.MotionFallbacks.initHeroParticles());
    },
    refreshDynamic(scope = document) {
      if (TP.ScrollReveal) TP.ScrollReveal.init(scope);
      if (TP.ProductCardMotion) TP.ProductCardMotion.init(scope);
      if (TP.MagneticButton) TP.MagneticButton.init(scope);
    }
  };
})(window);
