/**
 * AURIX MOBILE — Shared Cart Page & Panel Controller (giohang.html & donhang.html?tab=cart)
 * Implements:
 * - Per-item selection checkbox on the left of each cart item.
 * - Green highlight border (.is-selected) when checked, with 0px layout shift.
 * - "Chọn tất cả" checkbox supporting checked, unchecked, and partial (indeterminate) states.
 * - Totals calculated STRICTLY from selected items.
 * - Disabled checkout button + helpful prompt when 0 items are selected.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.CartPage = function () {
    const itemsContainer = TP.DOM.qs('#tp-cart-items-list');
    const emptyState = TP.DOM.qs('#tp-cart-empty');
    const contentLayout = TP.DOM.qs('#tp-cart-filled-layout');
    const subtotalEl = TP.DOM.qs('#tp-cart-subtotal');
    const discountEl = TP.DOM.qs('#tp-cart-discount');
    const shippingEl = TP.DOM.qs('#tp-cart-shipping');
    const totalEl = TP.DOM.qs('#tp-cart-total');
    const couponForm = TP.DOM.qs('#tp-coupon-form');
    const couponInput = TP.DOM.qs('#tp-coupon-input');
    const couponMsg = TP.DOM.qs('#tp-coupon-msg');
    const clearCartBtn = TP.DOM.qs('#tp-clear-cart-btn');
    const proceedCheckoutBtn = TP.DOM.qs('#tp-proceed-checkout-btn');

    if (!itemsContainer || itemsContainer.dataset.tpCartBound) return;
    itemsContainer.dataset.tpCartBound = 'true';

    // Ensure "Chọn tất cả" toolbar and "Vui lòng chọn ít nhất một sản phẩm" hint exist in DOM
    let selectBarEl = TP.DOM.qs('#tp-cart-select-bar');
    if (!selectBarEl && itemsContainer.parentNode) {
      selectBarEl = document.createElement('div');
      selectBarEl.id = 'tp-cart-select-bar';
      selectBarEl.className = 'tp-cart-select-bar';
      itemsContainer.parentNode.insertBefore(selectBarEl, itemsContainer);
    }

    let selectHintEl = TP.DOM.qs('#tp-cart-select-hint');
    if (!selectHintEl && proceedCheckoutBtn && proceedCheckoutBtn.parentNode) {
      selectHintEl = document.createElement('div');
      selectHintEl.id = 'tp-cart-select-hint';
      selectHintEl.className = 'tp-cart-select-hint';
      selectHintEl.hidden = true;
      selectHintEl.textContent = 'Vui lòng chọn ít nhất một sản phẩm để thanh toán';
      proceedCheckoutBtn.parentNode.insertBefore(selectHintEl, proceedCheckoutBtn);
    }

    const renderCartPage = () => {
      if (!TP.AuthService.isLoggedIn()) {
        if (contentLayout) contentLayout.hidden = true;
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.innerHTML = `
            <div class="tp-empty-icon">🔒</div>
            <h1 class="tp-h2 mb-2">Bạn cần đăng nhập để xem giỏ hàng</h1>
            <p class="tp-text-small mb-3">Mỗi tài khoản thành viên tại AURIX MOBILE có giỏ hàng và ưu đãi riêng biệt.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="dangnhap.html" class="tp-btn tp-btn-primary">Đăng nhập ngay</a>
              <a href="dangky.html" class="tp-btn tp-btn-secondary">Đăng ký tài khoản mới</a>
            </div>
          `;
        }
        return;
      }

      const summary = TP.CartService.getSummary();
      if (!summary.items.length) {
        if (emptyState) {
          emptyState.hidden = false;
          emptyState.innerHTML = `
            <div class="tp-empty-icon">🛒</div>
            <h1 class="tp-h2 mb-2">Giỏ hàng của bạn đang trống</h1>
            <p class="tp-text-small mb-3">Hãy khám phá các dòng điện thoại, máy tính bảng và phụ kiện chính hãng tại AURIX MOBILE.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="sanpham.html" class="tp-btn tp-btn-primary">Tiếp tục mua sắm →</a>
            </div>
          `;
        }
        if (contentLayout) contentLayout.hidden = true;
        return;
      }
      if (emptyState) emptyState.hidden = true;
      if (contentLayout) contentLayout.hidden = false;

      if (selectBarEl) {
        selectBarEl.innerHTML = `
          <label class="tp-cart-select-all-label" for="tp-cart-select-all">
            <input type="checkbox" id="tp-cart-select-all" class="tp-cart-checkbox" ${summary.allSelected ? 'checked' : ''}>
            <span>Chọn tất cả (${summary.selectedDistinctCount}/${summary.items.length} sản phẩm)</span>
          </label>
          <span class="tp-badge ${summary.selectedItemCount > 0 ? 'tp-badge-instock' : 'tp-badge-new'}">
            Đã chọn ${summary.selectedItemCount} sản phẩm để thanh toán
          </span>
        `;
        const selectAllCheckbox = selectBarEl.querySelector('#tp-cart-select-all');
        if (selectAllCheckbox) {
          selectAllCheckbox.indeterminate = Boolean(summary.someSelected);
          selectAllCheckbox.onchange = () => {
            TP.CartService.setAllSelection(selectAllCheckbox.checked);
          };
        }
      }

      if (itemsContainer) {
        itemsContainer.innerHTML = summary.items.map((item) => {
          const isSel = item.selected !== false;
          return `
            <div class="tp-cart-item ${isSel ? 'is-selected' : ''}" data-cart-row="${TP.DOM.escapeHtml(item.key)}">
              <div class="tp-cart-item-check-col">
                <input
                  type="checkbox"
                  class="tp-cart-checkbox"
                  data-cart-select="${TP.DOM.escapeHtml(item.key)}"
                  aria-label="Chọn thanh toán ${TP.DOM.escapeHtml(item.name)}"
                  ${isSel ? 'checked' : ''}
                >
              </div>
              <a href="chitietsanpham.html?id=${encodeURIComponent(item.productId)}" class="p-2 rounded bg-light d-flex align-items-center justify-content-center">
                <img src="${item.thumbnail}" alt="${TP.DOM.escapeHtml(item.name)}" width="72" height="72" style="object-fit:contain;">
              </a>
              <div>
                <span class="tp-caption fw-bold tp-text-primary">${TP.DOM.escapeHtml(item.brand)}</span>
                <h3 class="tp-h3" style="font-size:1.02rem;margin-bottom:0.2rem;">
                  <a href="chitietsanpham.html?id=${encodeURIComponent(item.productId)}">${TP.DOM.escapeHtml(item.name)}</a>
                </h3>
                <div class="tp-text-small mb-2">Phiên bản: <strong>${TP.DOM.escapeHtml(item.color)}</strong> · <strong>${TP.DOM.escapeHtml(item.storage)}</strong></div>
                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <span class="tp-price">${TP.DOM.formatPrice(item.unitPrice)}</span>
                  <div class="tp-qty-stepper" aria-label="Điều chỉnh số lượng">
                    <button type="button" class="tp-qty-btn" data-qty-dec="${TP.DOM.escapeHtml(item.key)}" aria-label="Giảm số lượng">−</button>
                    <input type="number" class="tp-qty-input" value="${item.quantity}" min="1" max="20" data-qty-input="${TP.DOM.escapeHtml(item.key)}" aria-label="Số lượng">
                    <button type="button" class="tp-qty-btn" data-qty-inc="${TP.DOM.escapeHtml(item.key)}" aria-label="Tăng số lượng">+</button>
                  </div>
                </div>
              </div>
              <div class="text-end">
                <div class="fw-bold tp-text-navy mb-2" style="font-size:1.05rem;">${TP.DOM.formatPrice(item.unitPrice * item.quantity)}</div>
                <button type="button" class="tp-btn tp-btn-ghost tp-btn-sm tp-text-coral" data-cart-remove="${TP.DOM.escapeHtml(item.key)}">Xóa</button>
              </div>
            </div>
          `;
        }).join('');
      }

      if (subtotalEl) subtotalEl.textContent = TP.DOM.formatPrice(summary.subtotal);
      if (discountEl) discountEl.textContent = summary.discount > 0 ? `-${TP.DOM.formatPrice(summary.discount)}` : '0đ';
      if (shippingEl) {
        shippingEl.textContent = summary.selectedItemCount === 0
          ? '0đ'
          : (summary.shipping === 0 ? 'Miễn phí' : TP.DOM.formatPrice(summary.shipping));
      }
      if (totalEl) {
        if (TP.Counters && typeof TP.Counters.animatePrice === 'function') {
          TP.Counters.animatePrice(totalEl, summary.grandTotal);
        } else {
          totalEl.textContent = TP.DOM.formatPrice(summary.grandTotal);
        }
      }
      if (couponInput && summary.couponCode) couponInput.value = summary.couponCode;

      const hasSelection = summary.selectedItemCount > 0;
      if (selectHintEl) {
        selectHintEl.hidden = hasSelection;
      }
      if (proceedCheckoutBtn) {
        proceedCheckoutBtn.classList.toggle('is-disabled', !hasSelection);
        proceedCheckoutBtn.setAttribute('aria-disabled', String(!hasSelection));
        if (proceedCheckoutBtn.tagName === 'BUTTON') {
          proceedCheckoutBtn.disabled = !hasSelection;
        }
        const btnLabel = proceedCheckoutBtn.querySelector('span') || proceedCheckoutBtn;
        btnLabel.textContent = hasSelection
          ? `Tiến hành thanh toán (${summary.selectedItemCount} SP) →`
          : 'Tiến hành thanh toán →';
      }
    };

    itemsContainer.addEventListener('click', (e) => {
      const selectChk = e.target.closest('[data-cart-select]');
      if (selectChk) {
        const key = selectChk.getAttribute('data-cart-select');
        TP.CartService.toggleItemSelection(key, selectChk.checked);
        return;
      }

      const dec = e.target.closest('[data-qty-dec]');
      if (dec) {
        const key = dec.getAttribute('data-qty-dec');
        const item = TP.CartService.getCartState().items.find((i) => i.key === key);
        if (item) {
          if (item.quantity <= 1) {
            TP.CartService.removeItem(key);
            TP.Toast.show('Đã xóa sản phẩm khỏi giỏ hàng.', 'info');
          } else {
            TP.CartService.updateQuantity(key, item.quantity - 1);
          }
        }
        return;
      }

      const inc = e.target.closest('[data-qty-inc]');
      if (inc) {
        const key = inc.getAttribute('data-qty-inc');
        const item = TP.CartService.getCartState().items.find((i) => i.key === key);
        if (item) TP.CartService.updateQuantity(key, item.quantity + 1);
        return;
      }

      const rm = e.target.closest('[data-cart-remove]');
      if (rm) {
        TP.CartService.removeItem(rm.getAttribute('data-cart-remove'));
        TP.Toast.show('Đã xóa sản phẩm khỏi giỏ hàng.', 'info');
        return;
      }

      // Clicking non-interactive area of the cart card toggles selection smoothly
      if (!e.target.closest('a, button, input, .tp-qty-stepper')) {
        const row = e.target.closest('[data-cart-row]');
        if (row) {
          TP.CartService.toggleItemSelection(row.getAttribute('data-cart-row'));
        }
      }
    });

    itemsContainer.addEventListener('change', (e) => {
      const inp = e.target.closest('[data-qty-input]');
      if (!inp) return;
      const key = inp.getAttribute('data-qty-input');
      const val = parseInt(inp.value, 10);
      if (isNaN(val) || val <= 0) {
        TP.CartService.removeItem(key);
      } else {
        TP.CartService.updateQuantity(key, val);
      }
    });

    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        TP.CartService.clearCart();
        TP.Toast.show('Đã xóa toàn bộ sản phẩm trong giỏ hàng.', 'info');
        renderCartPage();
      });
    }

    if (proceedCheckoutBtn) {
      proceedCheckoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const res = TP.CartService.startCartCheckout();
        if (!res || !res.ok) {
          TP.Toast.show((res && res.message) || 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'error');
          return;
        }
        if (res.redirectUrl) {
          window.location.href = res.redirectUrl;
        }
      });
    }

    if (couponForm) {
      couponForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = couponInput ? couponInput.value : '';
        const res = TP.CartService.applyCoupon(code);
        if (couponMsg) {
          couponMsg.textContent = res.message;
          couponMsg.style.color = res.ok ? 'var(--tp-success)' : 'var(--tp-error)';
        }
        renderCartPage();
      });
    }

    TP.Events.on('cart:updated', renderCartPage);
    TP.Events.on('auth:changed', renderCartPage);
    renderCartPage();
  };

  if (TP.PageInit && typeof TP.PageInit.register === 'function') {
    TP.PageInit.register('cart', TP.CartPage);
  }
})(window);
