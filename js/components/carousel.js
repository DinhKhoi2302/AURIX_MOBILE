/**
 * TechPhone — Horizontal Product Carousel with Keyboard & Touch Support (Effect 10)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Carousel = {
    init(scope = document) {
      TP.DOM.qsa('[data-carousel]', scope).forEach((wrap) => {
        if (wrap.dataset.bound) return;
        wrap.dataset.bound = 'true';
        const track = wrap.querySelector('[data-carousel-track]');
        const prevBtn = wrap.querySelector('[data-carousel-prev]');
        const nextBtn = wrap.querySelector('[data-carousel-next]');
        if (!track) return;

        const step = () => Math.max(260, Math.round(track.clientWidth * 0.75));
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -step(), behavior: 'smooth' });
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: step(), behavior: 'smooth' });
          });
        }
      });
    }
  };
})(window);
