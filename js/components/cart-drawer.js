/**
 * AURIX MOBILE — Slide-out Animated Cart Drawer (Effect 38)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.CartDrawer = {
    ensureMarkup() {
      let backdrop = TP.DOM.qs('#tp-cart-drawer-backdrop');
      if (backdrop) return;
      backdrop = document.createElement('div');
      backdrop.id = 'tp-cart-drawer-backdrop';
      backdrop.className = 'tp-drawer-backdrop';
      backdrop.innerHTML = `
        <aside id="tp-cart-drawer" class="tp-drawer" role="dialog" aria-modal="true" aria-label="Giỏ hàng nhanh AURIX MOBILE">
          <div class="tp-drawer-header">
            <div>
              <strong class="tp-text-navy" style="font-size:1.05rem;">Giỏ hàng của bạn</strong>
              <span id="tp-drawer-count" class="tp-badge tp-badge-new ms-2">0</span>
            </div>
            <button type="button" class="tp-btn tp-btn-ghost tp-btn-sm" data-drawer-close aria-label="Đóng giỏ hàng">✕</button>
          </div>
          <div id="tp-drawer-items" class="tp-drawer-body"></div>
          <div class="tp-drawer-footer">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="tp-text-small fw-semibold">Tạm tính:</span>
              <strong id="tp-drawer-subtotal" class="tp-price" style="font-size:1.2rem;">0đ</strong>
            </div>
            <div class="d-grid gap-2">
              <a href="donhang.html?tab=cart" class="tp-btn tp-btn-secondary w-100">Xem giỏ hàng chi tiết</a>
              <a href="dathang.html" class="tp-btn tp-btn-primary w-100">Tiến hành đặt hàng →</a>
            </div>
          </div>
        </aside>
      `;
      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop || e.target.closest('[data-drawer-close]')) {
          this.close();
        }
        const rmBtn = e.target.closest('[data-drawer-remove]');
        if (rmBtn) {
          TP.CartService.removeItem(rmBtn.getAttribute('data-drawer-remove'));
        }
      });
    },
    render() {
      this.ensureMarkup();
      const summary = TP.CartService.getSummary();
      const countEl = TP.DOM.qs('#tp-drawer-count');
      const subEl = TP.DOM.qs('#tp-drawer-subtotal');
      const listEl = TP.DOM.qs('#tp-drawer-items');
      if (countEl) countEl.textContent = String(summary.itemCount);
      if (subEl) subEl.textContent = TP.DOM.formatPrice(summary.subtotal);
      if (!listEl) return;

      if (!summary.items.length) {
        listEl.innerHTML = `
          <div class="tp-empty-state py-4">
            <div class="tp-empty-icon">🛒</div>
            <h4 class="tp-h3 mb-2" style="font-size:1.05rem;">Giỏ hàng chưa có sản phẩm</h4>
            <p class="tp-text-small mb-3">Khám phá ngay các siêu phẩm iPhone 16 Pro Max, Galaxy S24 Ultra với ưu đãi trả góp 0%.</p>
            <a href="sanpham.html" class="tp-btn tp-btn-primary tp-btn-sm">Mua sắm ngay</a>
          </div>
        `;
        return;
      }

      listEl.innerHTML = summary.items.map((item) => `
        <div class="d-flex align-items-center justify-content-between gap-2 py-2" style="border-bottom:1px solid var(--tp-border);">
          <img src="${item.thumbnail}" alt="${TP.DOM.escapeHtml(item.name)}" width="54" height="54" style="object-fit:contain;">
          <div style="flex:1;min-width:0;">
            <a href="chitietsanpham.html?id=${encodeURIComponent(item.productId)}" class="fw-bold tp-text-navy d-block text-truncate" style="font-size:0.86rem;">${TP.DOM.escapeHtml(item.name)}</a>
            <div class="tp-caption">${TP.DOM.escapeHtml(item.color)} · ${TP.DOM.escapeHtml(item.storage)}</div>
            <div class="tp-price" style="font-size:0.88rem;">${TP.DOM.formatPrice(item.unitPrice)} × ${item.quantity}</div>
          </div>
          <button type="button" class="tp-btn tp-btn-ghost tp-btn-sm" data-drawer-remove="${TP.DOM.escapeHtml(item.key)}" aria-label="Xóa">✕</button>
        </div>
      `).join('');
    },
    open() {
      if (!TP.AuthService.isLoggedIn()) {
        TP.AuthService.requireAuth({ returnUrl: TP.CONFIG.ROUTES.CART });
        return;
      }
      this.render();
      const backdrop = TP.DOM.qs('#tp-cart-drawer-backdrop');
      const drawer = TP.DOM.qs('#tp-cart-drawer');
      if (backdrop && drawer) {
        backdrop.classList.add('is-open');
        drawer.classList.add('is-open');
      }
    },
    close() {
      const backdrop = TP.DOM.qs('#tp-cart-drawer-backdrop');
      const drawer = TP.DOM.qs('#tp-cart-drawer');
      if (backdrop && drawer) {
        backdrop.classList.remove('is-open');
        drawer.classList.remove('is-open');
      }
    },
    init() {
      this.ensureMarkup();
      TP.Events.on('cart:updated', () => this.render());
    }
  };
})(window);
