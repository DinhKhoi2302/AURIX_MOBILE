/**
 * AURIX MOBILE — Home Page Controller (index.html)
 * Implements:
 * - Requirement 8: Compact Horizontal Ad Banner Slider (150px desktop height, 4 auto-sliding banners)
 * - Requirement 1 & 2: Dark-Blue FLASH SALE Showcase with white title & 6 discounted products
 * - Requirement 4A: Top Bán Chạy Nhất Tuần (8 products: first 4 Apple, next 4 Android, placed BEFORE Featured)
 * - Requirement 4B: Sản phẩm nổi bật (12 high-end flagship products, placed AFTER Best Sellers)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  function getSyntheticOriginalPrice(product) {
    if (product.originalPrice && product.originalPrice > product.price) {
      return product.originalPrice;
    }
    const raw = Math.round((product.price * 1.18) / 10000) * 10000;
    return raw > product.price ? raw : product.price + 200000;
  }

  function computeSoldStats(productId) {
    let hash = 0;
    const str = String(productId || 'aurix');
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    const total = (hash % 2 === 0) ? 15 : 20;
    const sold = 4 + (hash % (total - 6));
    const pct = Math.min(92, Math.max(24, Math.round((sold / total) * 100)));
    return { sold, total, pct };
  }

  function renderFlashSaleCard(product) {
    const displayObj = (product.originalPrice && product.originalPrice > product.price)
      ? product
      : Object.assign({}, product, {
        originalPrice: getSyntheticOriginalPrice(product)
      });

    const baseCardHtml = TP.ProductCard.render(displayObj);
    const { sold, total, pct } = computeSoldStats(product.id);

    const soldBarHtml = `
      <div class="tp-fs-sold-bar" aria-label="Đã bán ${sold} trên ${total} suất">
        <div class="tp-fs-sold-fill" style="width:${pct}%;"></div>
        <span class="tp-fs-sold-icon" aria-hidden="true">🔥</span>
        <span class="tp-fs-sold-text">Đã bán ${sold}/${total} suất</span>
      </div>
    `;

    const closeIdx = baseCardHtml.lastIndexOf('</article>');
    if (closeIdx !== -1) {
      return baseCardHtml.slice(0, closeIdx) + soldBarHtml + baseCardHtml.slice(closeIdx);
    }
    return baseCardHtml;
  }

  function initAdBannerSlider() {
    const slider = TP.DOM.qs('[data-ad-banner-slider]');
    if (!slider) return;
    const slides = TP.DOM.qsa('[data-ad-slide]', slider);
    const dots = TP.DOM.qsa('[data-ad-dot]', slider);
    const prevBtn = TP.DOM.qs('[data-ad-prev]', slider);
    const nextBtn = TP.DOM.qs('[data-ad-next]', slider);
    if (!slides.length) return;

    let currentIdx = 0;
    let timer = null;

    const showSlide = (idx) => {
      currentIdx = (idx + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === currentIdx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === currentIdx));
    };

    const startAuto = () => {
      stopAuto();
      timer = window.setInterval(() => {
        showSlide(currentIdx + 1);
      }, 4000);
    };

    const stopAuto = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(currentIdx - 1);
        startAuto();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(currentIdx + 1);
        startAuto();
      });
    }
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(idx);
        startAuto();
      });
    });

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
    startAuto();
  }

  TP.PageInit.register('home', function () {
    initAdBannerSlider();

    const featuredGrid = TP.DOM.qs('#tp-home-featured-grid');
    const tabContainer = TP.DOM.qs('#tp-home-category-tabs');
    const campaignTabs = TP.DOM.qs('#tp-flashsale-campaign-tabs');
    const prevBtn = TP.DOM.qs('[data-flash-prev]');
    const nextBtn = TP.DOM.qs('[data-flash-next]');
    const slotWrap = TP.DOM.qs('#tp-flashsale-slots');
    const bestsellerTrack = TP.DOM.qs('#tp-home-bestseller-track');
    const featuredShowcaseGrid = TP.DOM.qs('#tp-home-featured-showcase-grid');
    const featuredShowcaseTabs = TP.DOM.qs('#tp-home-featured-showcase-tabs');
    const newsGrid = TP.DOM.qs('#tp-home-news-grid');

    let currentCategory = 'all';
    let currentCampaign = 'flashsale';
    let pageOffset = 0;
    let currentFeaturedCategory = 'smartphone';

    const getFlashSalePool = (category, campaign) => {
      const all = TP.ProductService.getAll();
      const phonesDisc = all.filter((p) => p.category === 'smartphone' && p.originalPrice && p.originalPrice > p.price);
      const tablets = all.filter((p) => p.category === 'tablet');
      const accessories = all.filter((p) => p.category === 'accessory');

      let pool = [];
      if (category === 'smartphone') {
        pool = phonesDisc.length >= 6 ? phonesDisc.slice() : all.filter((p) => p.category === 'smartphone');
      } else if (category === 'accessory') {
        pool = accessories.slice();
      } else if (category === 'tablet') {
        pool = tablets.slice();
      } else {
        const topPhones = phonesDisc.slice(0, 12);
        const topAccs = accessories.slice(0, 6);
        const topTabs = tablets.slice(0, 6);
        pool = [
          ...topPhones.slice(0, 3),
          ...topAccs.slice(0, 2),
          ...topTabs.slice(0, 1),
          ...topPhones.slice(3, 7),
          ...topAccs.slice(2, 4),
          ...topTabs.slice(1, 3),
          ...topPhones.slice(7, 12)
        ].filter(Boolean);
      }

      if (campaign === 'sandeal' && pool.length > 6) {
        pool = pool.slice(2).concat(pool.slice(0, 2));
      } else if (campaign === 'hotsale' && pool.length > 6) {
        pool = pool.slice(4).concat(pool.slice(0, 4));
      }

      return pool;
    };

    const renderFlashSale = () => {
      if (!featuredGrid) return;
      TP.LoadingMotion.pulseContainer(featuredGrid);
      const pool = getFlashSalePool(currentCategory, currentCampaign);
      if (!pool.length) {
        featuredGrid.innerHTML = `
          <div class="tp-empty-state" style="grid-column: 1 / -1; background: rgba(255,255,255,0.96);">
            <div class="tp-empty-icon">⚡</div>
            <h3 class="tp-h3 mb-2">Đang cập nhật sản phẩm Flash Sale</h3>
            <button type="button" class="tp-btn tp-btn-primary tp-btn-sm" data-switch-home-all>Xem tất cả Deal giảm giá</button>
          </div>
        `;
        return;
      }

      const items = [];
      const count = Math.min(6, pool.length);
      for (let i = 0; i < count; i++) {
        items.push(pool[(pageOffset + i) % pool.length]);
      }

      featuredGrid.innerHTML = items.map((p) => renderFlashSaleCard(p)).join('');
      TP.MotionManager.refreshDynamic(featuredGrid);
    };

    if (tabContainer) {
      tabContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-home-tab]');
        if (!btn) return;
        currentCategory = btn.getAttribute('data-home-tab') || 'all';
        pageOffset = 0;
        TP.DOM.qsa('[data-home-tab]', tabContainer).forEach((b) => b.classList.toggle('is-active', b === btn));
        renderFlashSale();
      });
    }

    if (campaignTabs) {
      campaignTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-flash-campaign]');
        if (!btn) return;
        currentCampaign = btn.getAttribute('data-flash-campaign') || 'flashsale';
        pageOffset = 0;
        TP.DOM.qsa('[data-flash-campaign]', campaignTabs).forEach((b) => b.classList.toggle('is-active', b === btn));
        renderFlashSale();
      });
    }

    if (slotWrap) {
      slotWrap.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-flash-slot]');
        if (!pill) return;
        TP.DOM.qsa('[data-flash-slot]', slotWrap).forEach((b) => b.classList.toggle('is-active', b === pill));
        pageOffset = (pageOffset + 3) % 12;
        renderFlashSale();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const pool = getFlashSalePool(currentCategory, currentCampaign);
        if (pool.length > 0) {
          pageOffset = (pageOffset - 6 + pool.length * 6) % pool.length;
          renderFlashSale();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const pool = getFlashSalePool(currentCategory, currentCampaign);
        if (pool.length > 0) {
          pageOffset = (pageOffset + 6) % pool.length;
          renderFlashSale();
        }
      });
    }

    // Live Flash Sale Countdown Timer
    const hoursEl = TP.DOM.qs('#tp-fs-hours');
    const minsEl = TP.DOM.qs('#tp-fs-mins');
    const secsEl = TP.DOM.qs('#tp-fs-secs');

    if (hoursEl && minsEl && secsEl) {
      let remainingSeconds = 2 * 3600 + 38 * 60 + 45;

      const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');

      const updateTimerUI = () => {
        const h = Math.floor(remainingSeconds / 3600);
        const m = Math.floor((remainingSeconds % 3600) / 60);
        const s = remainingSeconds % 60;

        hoursEl.textContent = pad2(h);
        minsEl.textContent = pad2(m);
        secsEl.textContent = pad2(s);
      };

      updateTimerUI();

      window.setInterval(() => {
        if (remainingSeconds > 0) {
          remainingSeconds--;
        } else {
          remainingSeconds = 2 * 3600 + 59 * 60 + 59;
        }

        updateTimerUI();
      }, 1000);
    }

    renderFlashSale();
    TP.Events.on('products:loaded', renderFlashSale);

    // Requirement 4: Top Bán Chạy Nhất Tuần (12 products in 4-4-4 format, auto-sliding back & forth)
    if (bestsellerTrack) {
      const bsSection = TP.DOM.qs('#tp-bestsellers-section') || bestsellerTrack.closest('.tp-section');
      const bsPrevBtn = TP.DOM.qs('#tp-bestseller-prev');
      const bsNextBtn = TP.DOM.qs('#tp-bestseller-next');
      let bsPage = 0; // 0, 1, 2 (each page = 4 products)
      let bsDirection = 1; // +1 forward, -1 backward (ping-pong "chạy qua chạy lại")
      let bsTimer = null;
      const totalPages = 3;

      const scrollToBsPage = (pageIdx) => {
        bsPage = Math.max(0, Math.min(totalPages - 1, pageIdx));
        const items = TP.DOM.qsa('.tp-carousel-item', bestsellerTrack);
        const targetItem = items[bsPage * 4];
        if (targetItem) {
          const targetLeft = targetItem.offsetLeft - bestsellerTrack.offsetLeft;
          bestsellerTrack.scrollTo({ left: targetLeft, behavior: 'smooth' });
        } else {
          const pageWidth = bestsellerTrack.clientWidth;
          bestsellerTrack.scrollTo({ left: bsPage * pageWidth, behavior: 'smooth' });
        }
      };

      const stopBsAuto = () => {
        if (bsTimer) {
          window.clearInterval(bsTimer);
          bsTimer = null;
        }
      };

      const startBsAuto = () => {
        stopBsAuto();
        bsTimer = window.setInterval(() => {
          if (bsPage + bsDirection >= totalPages) {
            bsDirection = -1;
          } else if (bsPage + bsDirection < 0) {
            bsDirection = 1;
          }
          scrollToBsPage(bsPage + bsDirection);
        }, 3600);
      };

      if (bsPrevBtn) {
        bsPrevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const nextP = bsPage > 0 ? bsPage - 1 : totalPages - 1;
          bsDirection = -1;
          scrollToBsPage(nextP);
          startBsAuto();
        });
      }

      if (bsNextBtn) {
        bsNextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const nextP = bsPage < totalPages - 1 ? bsPage + 1 : 0;
          bsDirection = 1;
          scrollToBsPage(nextP);
          startBsAuto();
        });
      }

      if (bsSection) {
        bsSection.addEventListener('mouseenter', stopBsAuto);
        bsSection.addEventListener('mouseleave', startBsAuto);
      }

      const renderBestsellers = () => {
        const bestsellers = TP.ProductService.getBestsellers(12);
        bestsellerTrack.innerHTML = bestsellers
          .map((p) => `<div class="tp-carousel-item">${TP.ProductCard.render(p)}</div>`)
          .join('');
        TP.MotionManager.refreshDynamic(bestsellerTrack);
        bsPage = 0;
        bsDirection = 1;
        startBsAuto();
      };
      renderBestsellers();
      TP.Events.on('products:loaded', renderBestsellers);
    }

    // Requirement 4B: Sản phẩm nổi bật (12 high-end flagship products)
    const renderFeaturedShowcase = () => {
      if (!featuredShowcaseGrid) return;
      TP.LoadingMotion.pulseContainer(featuredShowcaseGrid);
      const list = TP.ProductService.getFeatured(currentFeaturedCategory, 12);
      if (!list.length) {
        featuredShowcaseGrid.innerHTML = `
          <div class="tp-empty-state" style="grid-column: 1 / -1;">
            <div class="tp-empty-icon">📦</div>
            <h3 class="tp-h3 mb-2">Đang cập nhật sản phẩm nổi bật</h3>
          </div>
        `;
        return;
      }
      featuredShowcaseGrid.innerHTML = list.map((p) => TP.ProductCard.render(p)).join('');
      TP.MotionManager.refreshDynamic(featuredShowcaseGrid);
    };

    if (featuredShowcaseTabs) {
      featuredShowcaseTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-featured-tab]');
        if (!btn) return;
        currentFeaturedCategory = btn.getAttribute('data-featured-tab') || 'smartphone';
        TP.DOM.qsa('[data-featured-tab]', featuredShowcaseTabs).forEach((b) => b.classList.toggle('is-active', b === btn));
        renderFeaturedShowcase();
      });
    }

    renderFeaturedShowcase();
    TP.Events.on('products:loaded', renderFeaturedShowcase);

    if (newsGrid) {
      const articles = TP.NewsService.getAll().slice(0, 3);
      newsGrid.innerHTML = articles.map((a) => {
        const href = a.detailUrl || `chitiettintuc.html?id=${encodeURIComponent(a.id)}`;
        return `
          <article class="tp-news-card tp-reveal">
            <a href="${TP.DOM.escapeHtml(href)}">
              <img src="${TP.DOM.escapeHtml(a.thumbnail)}" alt="${TP.DOM.escapeHtml(a.altText || a.title)}" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;">
            </a>
            <div class="tp-news-card-body">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="tp-badge tp-badge-new">${TP.DOM.escapeHtml(a.category)}</span>
                <span class="tp-caption">${TP.DOM.escapeHtml(a.publishedAt)}</span>
              </div>
              <h3 class="tp-card-title" style="font-size:1.02rem;">
                <a href="${TP.DOM.escapeHtml(href)}">${TP.DOM.escapeHtml(a.title)}</a>
              </h3>
              <p class="tp-text-small mb-3" style="flex:1;">${TP.DOM.escapeHtml(a.sapo || a.excerpt)}</p>
              <a href="${TP.DOM.escapeHtml(href)}" class="tp-text-primary fw-bold" style="font-size:0.86rem;">Đọc bài viết →</a>
            </div>
          </article>
        `;
      }).join('');
      TP.MotionManager.refreshDynamic(newsGrid);
    }
  });
})(window);
