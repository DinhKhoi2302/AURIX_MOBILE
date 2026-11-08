/**
 * AURIX MOBILE — Hero Carousel "SIÊU PHẨM MỚI" (Section 4: 6 Official Banners from khungnoibat.zip)
 * Displays all 6 user-provided banners with:
 * - Top-left badge: "SIÊU PHẨM MỚI"
 * - Bottom-left button: "Mua ngay" (linking to exact product/series)
 * - Bottom-center pill indicator bar with animated active dash & dots (Requirement 3 / Hình 6)
 * - Prev/Next buttons, pause on hover/focus, and keyboard navigation.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const HERO_SLIDES = [
    {
      id: 'iphone-18-pro-max',
      badge: '🔥 SIÊU PHẨM MỚI',
      title: 'iPhone 18 Series — Siêu phẩm mới tại AURIX MOBILE',
      image: 'assets/images/banners/khungnoibat/thong-so-noi-bat-gioi-thieu-ip18series.webp',
      ctaHref: 'chitietsanpham.html?id=iphone-18-pro-max',
      bgColor: '#ECECEE',
      theme: 'light'
    },
    {
      id: 'iphone-duo',
      badge: '🔥 SIÊU PHẨM MỚI',
      title: 'iPhone Duo — Hàng sẵn kho tại AURIX MOBILE',
      image: 'assets/images/banners/khungnoibat/thong-so-noi-bat-ip-duo.webp',
      ctaHref: 'chitietsanpham.html?id=iphone-duo',
      bgColor: '#EFEFEF',
      theme: 'light'
    },
    {
      id: 'oppo-find-x9-ultra',
      badge: '🔥 SIÊU PHẨM MỚI',
      title: 'OPPO Find X9 Ultra — Camera 200MP & Snapdragon 8 Elite Gen 5',
      image: 'assets/images/banners/khungnoibat/thong-so-noi-bat-oppo-find-x9-ultra-cam-nau.webp',
      ctaHref: 'chitietsanpham.html?id=oppo-find-x9-ultra',
      bgColor: '#3B1E0E',
      theme: 'dark'
    },
    {
      id: 'galaxy-z-flip8',
      badge: '🔥 SIÊU PHẨM MỚI',
      title: 'Samsung Galaxy Z Flip8 — Galaxy AI',
      image: 'assets/images/banners/khungnoibat/thong-so-noi-bat-samsung-galaxy-z-flip8-hong-den-kem.webp',
      ctaHref: 'chitietsanpham.html?id=galaxy-z-flip8',
      bgColor: '#FDF2F4',
      theme: 'light'
    },
    {
      id: 'galaxy-z-fold8-ultra',
      badge: '🔥 SIÊU PHẨM MỚI',
      title: 'Samsung Galaxy Z Fold8 Ultra — Galaxy AI',
      image: 'assets/images/banners/khungnoibat/thong-so-noi-bat-samsung-galaxy-z-fold8-ultra-tim-den-kem.webp',
      ctaHref: 'chitietsanpham.html?id=galaxy-z-fold8-ultra',
      bgColor: '#1E152A',
      theme: 'dark'
    },
    {
      id: 'vivo-x300-ultra',
      badge: '🔥 SIÊU PHẨM MỚI',
      title: 'vivo X300 Ultra — Camera ZEISS 200MP & Snapdragon 8 Elite Gen 5',
      image: 'assets/images/banners/khungnoibat/thong-so-noi-bat-vivo-x300-ultra-den-xanh-la.webp',
      ctaHref: 'chitietsanpham.html?id=vivo-x300-ultra',
      bgColor: '#F3F4EF',
      theme: 'light'
    }
  ];

  TP.HeroReveal = {
    currentIdx: 0,
    timerId: null,
    isPaused: false,
    slides: HERO_SLIDES,

    init() {
      const hero = TP.DOM.qs('[data-hero-banner]');
      if (!hero || hero.dataset.bound) return;
      hero.dataset.bound = 'true';

      // Ensure bottom-center pagination pill bar exists (Requirement 3 / Hình 6)
      let dotsBar = hero.querySelector('[data-hero-dots]');
      if (!dotsBar) {
        dotsBar = document.createElement('div');
        dotsBar.className = 'tp-hero-dots-bar';
        dotsBar.setAttribute('data-hero-dots', 'true');
        dotsBar.setAttribute('role', 'tablist');
        dotsBar.setAttribute('aria-label', 'Chỉ báo chuyển ảnh banner nổi bật');
        hero.appendChild(dotsBar);
      }

      dotsBar.innerHTML = HERO_SLIDES.map((s, idx) => `
        <button type="button" class="tp-hero-dot ${idx === 0 ? 'is-active' : ''}" data-hero-dot-idx="${idx}" role="tab" aria-selected="${idx === 0}" aria-label="Xem banner ${idx + 1}: ${TP.DOM.escapeHtml(s.title)}"></button>
      `).join('');

      const applySlide = (idx) => {
        this.currentIdx = (idx + HERO_SLIDES.length) % HERO_SLIDES.length;
        const slide = HERO_SLIDES[this.currentIdx];

        const badgeEl = hero.querySelector('[data-hero-badge]');
        const imgEl = hero.querySelector('[data-hero-image]');
        const ctaBuy = hero.querySelector('[data-hero-buy]');

        hero.style.backgroundColor = slide.bgColor || '#ECECEE';
        hero.setAttribute('data-slide-theme', slide.theme || 'light');

        if (badgeEl) badgeEl.textContent = slide.badge;
        if (imgEl) {
          imgEl.src = slide.image;
          imgEl.alt = slide.title;
        }
        if (ctaBuy) {
          ctaBuy.setAttribute('href', slide.ctaHref);
          ctaBuy.setAttribute('data-hero-product-id', slide.id);
        }

        // Sync indicator pill dots
        TP.DOM.qsa('[data-hero-dot-idx]', dotsBar).forEach((dot) => {
          const dIdx = parseInt(dot.getAttribute('data-hero-dot-idx'), 10);
          const isAct = dIdx === this.currentIdx;
          dot.classList.toggle('is-active', isAct);
          dot.setAttribute('aria-selected', String(isAct));
        });
      };

      this.applySlide = applySlide;

      const startAutoPlay = () => {
        this.stopAutoPlay();
        if (TP.MotionFallbacks && TP.MotionFallbacks.prefersReducedMotion()) return;
        this.timerId = window.setInterval(() => {
          if (!this.isPaused) {
            applySlide(this.currentIdx + 1);
          }
        }, 4800);
      };

      this.stopAutoPlay = () => {
        if (this.timerId) {
          window.clearInterval(this.timerId);
          this.timerId = null;
        }
      };

      dotsBar.addEventListener('click', (e) => {
        const dot = e.target.closest('[data-hero-dot-idx]');
        if (!dot) return;
        const targetIdx = parseInt(dot.getAttribute('data-hero-dot-idx'), 10);
        if (!isNaN(targetIdx)) {
          applySlide(targetIdx);
          startAutoPlay();
        }
      });

      const prevBtn = hero.querySelector('[data-hero-prev]');
      const nextBtn = hero.querySelector('[data-hero-next]');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          applySlide(this.currentIdx - 1);
          startAutoPlay();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          applySlide(this.currentIdx + 1);
          startAutoPlay();
        });
      }

      hero.addEventListener('mouseenter', () => { this.isPaused = true; });
      hero.addEventListener('mouseleave', () => { this.isPaused = false; });
      hero.addEventListener('focusin', () => { this.isPaused = true; });
      hero.addEventListener('focusout', (e) => {
        if (!hero.contains(e.relatedTarget)) {
          this.isPaused = false;
        }
      });

      hero.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          applySlide(this.currentIdx - 1);
          startAutoPlay();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          applySlide(this.currentIdx + 1);
          startAutoPlay();
        }
      });

      applySlide(0);
      startAutoPlay();
    }
  };
})(window);
