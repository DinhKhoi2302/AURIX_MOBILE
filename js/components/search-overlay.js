/**
 * AURIX MOBILE — Instant Search Overlay & Live Autocomplete (Effect 25)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.SearchOverlay = {
    ensureMarkup() {
      let el = TP.DOM.qs('#tp-search-overlay');
      if (el) return el;
      el = document.createElement('div');
      el.id = 'tp-search-overlay';
      el.className = 'tp-search-overlay';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="tp-search-panel" role="dialog" aria-modal="true" aria-label="Tìm kiếm nhanh sản phẩm và tin tức">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <strong class="tp-text-navy" style="font-size:1.05rem;">Tìm kiếm thông minh AURIX MOBILE</strong>
            <button type="button" class="tp-btn tp-btn-ghost tp-btn-sm" data-search-close>Đóng (Esc)</button>
          </div>
          <form id="tp-overlay-search-form" class="tp-search-bar mb-3" style="max-width:100%;">
            <input type="search" id="tp-overlay-search-input" placeholder="Nhập tên iPhone 16 Pro Max, Galaxy S24 Ultra, Xiaomi, iPad, AirPods..." autocomplete="off">
            <button type="submit" class="tp-search-submit" aria-label="Tìm kiếm">🔍</button>
          </form>
          <div class="mb-2 tp-caption">Từ khóa phổ biến:
            <button type="button" class="tp-filter-chip ms-1" data-quick-kw="iPhone 16">iPhone 16</button>
            <button type="button" class="tp-filter-chip ms-1" data-quick-kw="Samsung">Samsung S24</button>
            <button type="button" class="tp-filter-chip ms-1" data-quick-kw="Xiaomi">Xiaomi Leica</button>
            <button type="button" class="tp-filter-chip ms-1" data-quick-kw="AirPods">AirPods Pro</button>
          </div>
          <div id="tp-search-live-results" style="max-height:52vh;overflow-y:auto;margin-top:0.75rem;"></div>
        </div>
      `;
      document.body.appendChild(el);
      return el;
    },
    renderResults(query) {
      const box = TP.DOM.qs('#tp-search-live-results');
      if (!box) return;
      const { products, articles } = TP.SearchService.searchAll(query);

      const prodHtml = products.length
        ? products.map((p) => `
          <a href="chitietsanpham.html?id=${encodeURIComponent(p.id)}" class="d-flex align-items-center justify-content-between p-2 rounded mb-1" style="border:1px solid var(--tp-border);background:#FAFBFD;">
            <div class="d-flex align-items-center gap-3">
              <img src="${p.thumbnail}" alt="${TP.DOM.escapeHtml(p.name)}" width="46" height="46" style="object-fit:contain;">
              <div>
                <div class="fw-bold tp-text-navy" style="font-size:0.9rem;">${TP.DOM.escapeHtml(p.name)}</div>
                <div class="tp-caption">${TP.DOM.escapeHtml(p.brand)} · ⭐ ${p.rating} (${p.reviewCount})</div>
              </div>
            </div>
            <div class="tp-price" style="font-size:0.95rem;">${TP.DOM.formatPrice(p.price)}</div>
          </a>
        `).join('')
        : '<div class="tp-text-small py-2">Không tìm thấy sản phẩm khớp từ khóa.</div>';

      const newsHtml = articles.length
        ? articles.map((a) => `
          <a href="chitiettintuc.html?id=${encodeURIComponent(a.id)}" class="d-block p-2 rounded mb-1" style="border:1px solid var(--tp-border);">
            <span class="tp-badge tp-badge-new me-2">${TP.DOM.escapeHtml(a.category)}</span>
            <strong class="tp-text-navy" style="font-size:0.86rem;">${TP.DOM.escapeHtml(a.title)}</strong>
          </a>
        `).join('')
        : '';

      box.innerHTML = `
        <div class="mb-3">
          <div class="tp-caption fw-bold mb-2">SẢN PHẨM GỢI Ý (${products.length})</div>
          ${prodHtml}
        </div>
        ${newsHtml ? `<div><div class="tp-caption fw-bold mb-2">BÀI VIẾT CÔNG NGHỆ</div>${newsHtml}</div>` : ''}
      `;
    },
    open(initialQuery = '') {
      const overlay = this.ensureMarkup();
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      const input = TP.DOM.qs('#tp-overlay-search-input');
      if (input) {
        input.value = initialQuery;
        this.renderResults(initialQuery);
        setTimeout(() => input.focus(), 50);
      }
    },
    close() {
      const overlay = TP.DOM.qs('#tp-search-overlay');
      if (overlay) {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
      }
    },
    init() {
      const overlay = this.ensureMarkup();
      if (overlay.dataset.bound) return;
      overlay.dataset.bound = 'true';

      const headerForm = TP.DOM.qs('#tp-header-search-form');
      const headerInput = TP.DOM.qs('#tp-header-search-input');
      if (headerForm && headerInput) {
        headerInput.addEventListener('focus', () => {
          if (headerInput.dataset.openOverlayOnFocus === 'true') {
            this.open(headerInput.value);
          }
        });
        headerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const q = headerInput.value.trim();
          window.location.href = q ? `sanpham.html?q=${encodeURIComponent(q)}` : 'sanpham.html';
        });
      }

      const ovForm = TP.DOM.qs('#tp-overlay-search-form');
      const ovInput = TP.DOM.qs('#tp-overlay-search-input');
      if (ovInput) {
        ovInput.addEventListener('input', () => this.renderResults(ovInput.value));
      }
      if (ovForm) {
        ovForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const q = ovInput ? ovInput.value.trim() : '';
          window.location.href = q ? `sanpham.html?q=${encodeURIComponent(q)}` : 'sanpham.html';
        });
      }

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('[data-search-close]')) {
          this.close();
        }
        const kwBtn = e.target.closest('[data-quick-kw]');
        if (kwBtn && ovInput) {
          ovInput.value = kwBtn.getAttribute('data-quick-kw');
          this.renderResults(ovInput.value);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.open();
        }
      });
    }
  };
})(window);
