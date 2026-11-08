/**
 * AURIX MOBILE — Navigation & Active State Manager
 * Uses URL and URLSearchParams so strictly ONE main navigation item is active per page/route.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const PROMO_QUERIES = ['giảm', 'giam', 'khuyến mãi', 'khuyen mai', 'khuyen-mai', 'promo', 'sale', 'ưu đãi', 'uu dai'];

  TP.Navigation = {
    resolveTargetNavHref() {
      let currentUrl;
      try {
        currentUrl = new URL(window.location.href);
      } catch (e) {
        currentUrl = { pathname: window.location.pathname || '/index.html', search: window.location.search || '' };
      }

      const rawPage = (currentUrl.pathname.split('/').pop() || 'index.html').toLowerCase();
      const params = new URLSearchParams(currentUrl.search || '');
      const category = (params.get('category') || '').trim().toLowerCase();
      const query = (params.get('q') || '').trim().toLowerCase();

      if (rawPage === '' || rawPage === 'index.html' || rawPage === 'index.html') {
        return 'index.html';
      }
      if (rawPage === 'chitietsanpham.html' || rawPage === 'chitietsanpham.html') {
        return 'sanpham.html?category=smartphone';
      }
      if (rawPage === 'sanpham.html' || rawPage === 'sanpham.html') {
        if (category === 'accessory') {
          return 'sanpham.html?category=accessory';
        }
        if (category === 'tablet') {
          return 'sanpham.html?category=tablet';
        }
        if (query && PROMO_QUERIES.includes(query)) {
          return 'sanpham.html?q=Giảm';
        }
        return 'sanpham.html?category=smartphone';
      }
      if (rawPage === 'tintuc.html' || rawPage === 'chitiettintuc.html' || rawPage === 'tintuc.html' || rawPage === 'chitiettintuc.html') {
        return 'tintuc.html';
      }
      if (rawPage === 'gioithieu.html' || rawPage === 'gioithieu.html') {
        return 'gioithieu.html';
      }
      if (rawPage === 'lienhe.html' || rawPage === 'lienhe.html') {
        return 'lienhe.html';
      }
      return '';
    },
    syncActiveLinks() {
      const targetHref = this.resolveTargetNavHref();
      const navLinks = TP.DOM.qsa('.tp-nav-link');

      navLinks.forEach((link) => {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      });

      if (!targetHref) return;

      const matched = navLinks.find(
        (link) => (link.getAttribute('href') || '').trim().toLowerCase() === targetHref.toLowerCase()
      );
      if (matched) {
        matched.classList.add('is-active');
        matched.setAttribute('aria-current', 'page');
      }
    },
    init() {
      this.syncActiveLinks();

      const mobileBtn = TP.DOM.qs('[data-mobile-nav-toggle]');
      const navMenu = TP.DOM.qs('[data-main-nav-links]');
      if (mobileBtn && navMenu && !mobileBtn.dataset.bound) {
        mobileBtn.dataset.bound = 'true';
        mobileBtn.addEventListener('click', () => {
          const expanded = navMenu.classList.toggle('is-open');
          mobileBtn.setAttribute('aria-expanded', String(expanded));
        });
      }
    }
  };
})(window);
