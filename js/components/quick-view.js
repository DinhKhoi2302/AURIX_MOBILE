/**
 * AURIX MOBILE — Product Quick View Modal (Effect 18)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.QuickView = {
    ensureModal() {
      let el = TP.DOM.qs('#tp-quick-view-modal');
      if (el) return el;
      el = document.createElement('div');
      el.id = 'tp-quick-view-modal';
      el.className = 'tp-modal-backdrop';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="tp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="tp-qv-title">
          <button type="button" class="tp-modal-close" data-modal-close aria-label="Đóng cửa sổ xem nhanh">✕</button>
          <div id="tp-quick-view-body"></div>
        </div>
      `;
      document.body.appendChild(el);
      return el;
    },
    open(productId) {
      const p = TP.ProductService.getById(productId);
      if (!p) return;
      this.ensureModal();
      const body = TP.DOM.qs('#tp-quick-view-body');
      const specsList = Object.entries(p.specifications || {}).slice(0, 4).map(
        ([k, v]) => `<li class="py-1" style="border-bottom:1px solid var(--tp-border);font-size:0.86rem;"><strong>${TP.DOM.escapeHtml(k)}:</strong> ${TP.DOM.escapeHtml(v)}</li>`
      ).join('');

      const hasNumericPrice = typeof p.price === 'number' && p.price > 0;
      const priceText = hasNumericPrice ? TP.DOM.formatPrice(p.price) : 'Liên hệ để biết giá';
      const primaryBtn = hasNumericPrice
        ? `<button type="button" class="tp-btn tp-btn-primary" data-action="add-to-cart" data-product-id="${TP.DOM.escapeHtml(p.id)}">Thêm vào giỏ hàng</button>`
        : `<a href="lienhe.html" class="tp-btn tp-btn-primary">Liên hệ nhận báo giá</a>`;

      body.innerHTML = `
        <div class="row g-4 align-items-center">
          <div class="col-md-5 text-center">
            <div class="p-3 rounded" style="background:var(--tp-bg-page);">
              <img src="${p.thumbnail}" alt="${TP.DOM.escapeHtml(p.name)}" style="max-height:240px;margin:0 auto;">
            </div>
          </div>
          <div class="col-md-7">
            <span class="tp-badge tp-badge-new mb-2">${TP.DOM.escapeHtml(p.brand)} Chính Hãng VN/A</span>
            <h3 id="tp-qv-title" class="tp-h3 mb-2">${TP.DOM.escapeHtml(p.name)}</h3>
            <div class="d-flex align-items-baseline gap-2 mb-3">
              <span class="tp-price" style="font-size:1.45rem;">${priceText}</span>
              ${hasNumericPrice && p.originalPrice && p.originalPrice > p.price ? `<span class="tp-price-old">${TP.DOM.formatPrice(p.originalPrice)}</span>` : ''}
            </div>
            <p class="tp-text-small mb-3">${TP.DOM.escapeHtml(p.description)}</p>
            <ul class="mb-3">${specsList}</ul>
            <div class="d-flex flex-wrap gap-2">
              ${primaryBtn}
              <a href="chitietsanpham.html?id=${encodeURIComponent(p.id)}" class="tp-btn tp-btn-secondary">Xem chi tiết đầy đủ →</a>
            </div>
          </div>
        </div>
      `;
      TP.Modal.open('tp-quick-view-modal');
    }
  };
})(window);
