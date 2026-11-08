
/**
 * AURIX MOBILE — Product Card Renderer & Global Card Action Delegation
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.ProductCard = {
    render(product, options = {}) {
      if (!product) return '';

      const hasNumericPrice = typeof product.price === 'number' && product.price > 0;
      const hasDiscount = hasNumericPrice && typeof product.originalPrice === 'number' && product.originalPrice > product.price;
      const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

      let topBadgeText = 'Sản phẩm mới';
      let topBadgeClass = 'tp-badge-new';
      if (hasDiscount) {
        topBadgeText = 'Đang giảm giá';
        topBadgeClass = 'tp-badge-sale';
      } else if (product.bestseller) {
        topBadgeText = 'Bán chạy';
        topBadgeClass = 'tp-badge-hot';
      } else if (product.badges && product.badges[0] && product.badges[0].text) {
        const b0 = product.badges[0];
        if (!String(b0.text).toLowerCase().includes('trả góp')) {
          topBadgeText = b0.text;
          topBadgeClass = b0.type === 'hot' ? 'tp-badge-hot' : (b0.type === 'sale' ? 'tp-badge-sale' : 'tp-badge-new');
        }
      }

      const specsHtml = (product.shortSpecs || []).slice(0, 3).map(
        (s) => `<span class="tp-spec-chip">${TP.DOM.escapeHtml(s)}</span>`
      ).join('');

      const priceDisplay = hasNumericPrice ? TP.DOM.formatPrice(product.price) : 'Đang cập nhật';
      const oldPriceHtml = hasDiscount
        ? `<div class="d-flex align-items-center"><span class="tp-price-old">${TP.DOM.formatPrice(product.originalPrice)}</span><span class="tp-discount-pill">-${discountPct}%</span></div>`
        : '';

      const trustStripHtml = product.hasVerifiedWarranty
        ? `<div class="tp-card-trust-strip">
            <span class="tp-trust-pill">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Hàng chính hãng</span>
            </span>
          </div>`
        : '';

      const warrantyBarHtml = product.hasVerifiedWarranty
        ? `<div class="tp-card-warranty-bar">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Bảo hành theo hãng</span>
          </div>`
        : '';

      const ratingHtml = (product.rating && product.reviewCount)
        ? `<div class="tp-rating-pill mb-1">
            <span>★★★★★</span>
            <span class="tp-rating-count">${product.rating} (${product.reviewCount})</span>
          </div>`
        : '';

      const detailHref = `chitietsanpham.html?id=${encodeURIComponent(product.id)}`;
      const actionBtnHtml = hasNumericPrice
        ? `<button type="button" class="tp-btn-icon" data-action="add-to-cart" data-product-id="${TP.DOM.escapeHtml(product.id)}" aria-label="Thêm ${TP.DOM.escapeHtml(product.name)} vào giỏ hàng" title="Thêm vào giỏ hàng">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </button>`
        : `<a href="${detailHref}" class="tp-btn tp-btn-secondary tp-btn-sm" style="padding:0.32rem 0.65rem;font-size:0.75rem;" title="Xem chi tiết ${TP.DOM.escapeHtml(product.name)}">Chi tiết</a>`;

      // Nhãn nằm trong luồng bố cục, ngay dưới ảnh — không định vị tuyệt đối đè lên sản phẩm.
      const warrantyBadgeHtml = product.hasVerifiedWarranty
        ? `<div class="tp-card-warranty-slot" title="Bảo hành 1 đổi 1 trong 12 tháng">
            <img
              src="assets/images/badges/bao-hanh-1-doi-1.png"
              alt="Bảo hành 1 đổi 1 - 12 tháng"
              loading="lazy">
          </div>`
        : '';

      return `
        <article class="tp-product-card tp-tilt-card tp-reveal${product.hasVerifiedWarranty ? ' tp-has-warranty-badge' : ''}" data-product-card="${TP.DOM.escapeHtml(product.id)}">
          <div class="tp-card-top">
            <div class="tp-card-badges">
              <span class="tp-badge ${topBadgeClass}">
                ${TP.DOM.escapeHtml(topBadgeText)}
              </span>
            </div>
          </div>

          <div class="tp-card-media">
            <a href="${detailHref}" class="d-flex align-items-center justify-content-center w-100 h-100" data-shared-product-link="${TP.DOM.escapeHtml(product.id)}">
              <img src="${product.thumbnail}" alt="${TP.DOM.escapeHtml(product.name)}" loading="lazy">
            </a>
            <button type="button" class="tp-quick-view-trigger" data-action="quick-view" data-product-id="${TP.DOM.escapeHtml(product.id)}">Xem nhanh</button>
          </div>

          ${warrantyBadgeHtml}

          <div class="tp-card-body">
            ${trustStripHtml}
            <h3 class="tp-card-title">
              <a href="${detailHref}">${TP.DOM.escapeHtml(product.name)}</a>
            </h3>
            ${options.hideSpecs ? '' : `<div class="tp-card-specs">${specsHtml}</div>`}
            ${warrantyBarHtml}
            ${ratingHtml}
            <div class="tp-card-footer">
              <div class="tp-price-stack">
                ${oldPriceHtml}
                <span class="tp-price" style="${hasNumericPrice ? '' : 'font-size:0.88rem;color:var(--tp-primary);'}">${priceDisplay}</span>
              </div>
              ${actionBtnHtml}
            </div>
          </div>
        </article>
      `;
    },
    initGlobalDelegation() {
      if (document.body.dataset.tpCardDelegated) return;
      document.body.dataset.tpCardDelegated = 'true';

      document.addEventListener('click', (e) => {
        const wishBtn = e.target.closest('[data-action="toggle-wishlist"]');
        if (wishBtn) {
          e.preventDefault();
          const pid = wishBtn.getAttribute('data-product-id');
          const added = TP.WishlistService.toggle(pid);
          TP.DOM.qsa(`[data-action="toggle-wishlist"][data-product-id="${pid}"]`).forEach((btn) => {
            btn.classList.toggle('is-active', added);
            btn.setAttribute('aria-pressed', String(added));
          });
          const p = TP.ProductService.getById(pid);
          TP.Toast.show(
            added ? `Đã thêm "${p ? p.name : pid}" vào danh sách yêu thích ♥` : `Đã gỡ khỏi danh sách yêu thích`,
            added ? 'success' : 'info'
          );
          return;
        }

        const cartBtn = e.target.closest('[data-action="add-to-cart"]');
        if (cartBtn) {
          e.preventDefault();
          const pid = cartBtn.getAttribute('data-product-id');
          const p = TP.ProductService.getById(pid);
          if (!p) return;
          if (!TP.AuthService.isLoggedIn()) {
            TP.AuthService.requireAuth({
              returnUrl: (window.location.pathname.split('/').pop() || 'index.html') + (window.location.search || ''),
              message: 'Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.'
            });
            return;
          }
          if (typeof p.price !== 'number' || p.price <= 0) {
            TP.Toast.show(`"${p.name}" hiện đang cập nhật giá niêm yết. Vui lòng liên hệ để biết giá!`, 'info');
            return;
          }
          const addedSummary = TP.CartService.addItem(pid, { quantity: 1 });
          if (!addedSummary) return;
          if (TP.CartMotion && typeof TP.CartMotion.flyToCart === 'function') {
            TP.CartMotion.flyToCart(cartBtn, p.thumbnail);
          }
          TP.Toast.show(`Đã thêm "${p.name}" vào giỏ hàng AURIX MOBILE!`, 'success');
          return;
        }

        const qvBtn = e.target.closest('[data-action="quick-view"]');
        if (qvBtn) {
          e.preventDefault();
          const pid = qvBtn.getAttribute('data-product-id');
          if (TP.QuickView) TP.QuickView.open(pid);
        }
      });
    }
  };
})(window);
