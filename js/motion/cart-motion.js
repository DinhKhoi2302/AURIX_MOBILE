/**
 * TechPhone — Add-to-Cart Fly Animation & Cart Badge Bounce (Effects 37, 39, 40)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.CartMotion = {
    flyToCart(sourceEl, imgSrc) {
      if (TP.MotionFallbacks.prefersReducedMotion() || !sourceEl) return;
      const cartIcon = TP.DOM.qs('[data-cart-icon-target]') || TP.DOM.qs('[data-cart-badge]');
      if (!cartIcon) return;

      const sRect = sourceEl.getBoundingClientRect();
      const tRect = cartIcon.getBoundingClientRect();

      const clone = document.createElement('img');
      clone.src = imgSrc || 'assets/images/logo/favicon.svg';
      clone.className = 'tp-fly-clone';
      clone.style.left = `${sRect.left}px`;
      clone.style.top = `${sRect.top}px`;
      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        const dx = tRect.left - sRect.left;
        const dy = tRect.top - sRect.top;
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.25)`;
        clone.style.opacity = '0.2';
      });

      setTimeout(() => {
        if (clone.parentNode) clone.parentNode.removeChild(clone);
      }, 650);
    }
  };
})(window);
