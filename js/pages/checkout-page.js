/**
 * AURIX MOBILE — Checkout Page Controller (dathang.html)
 * Supports both Cart checkout and independent "Mua ngay" checkout, COD vs Simulated Bank Transfer,
 * receiver address validation, and idempotent order creation.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.PageInit.register('checkout', function () {
    const form = TP.DOM.qs('#tp-checkout-form');
    const emptyGuard = TP.DOM.qs('#tp-checkout-empty-guard');
    const mainGrid = TP.DOM.qs('#tp-checkout-main-grid');
    const summaryItemsEl = TP.DOM.qs('#tp-checkout-items');
    const sourceBadgeEl = TP.DOM.qs('#tp-checkout-source-badge');
    const subEl = TP.DOM.qs('#tp-co-subtotal');
    const discEl = TP.DOM.qs('#tp-co-discount');
    const shipEl = TP.DOM.qs('#tp-co-shipping');
    const totEl = TP.DOM.qs('#tp-co-total');
    const submitBtn = TP.DOM.qs('#tp-checkout-submit-btn');

    let deliveryMethod = 'standard';
    let isSubmitting = false;

    const prefillFromSessionAndAddress = () => {
      const session = TP.AuthService.getCurrentSession();
      if (!session || !form) return;
      const savedAddr = TP.AuthService.getSavedAddress();

      const setIfEmpty = (name, val) => {
        if (form.elements[name] && !form.elements[name].value && val) {
          form.elements[name].value = val;
        }
      };

      setIfEmpty('fullName', (savedAddr && savedAddr.fullName) || session.fullName || '');
      setIfEmpty('phone', (savedAddr && savedAddr.phone) || session.phone || '');
      setIfEmpty('email', (savedAddr && savedAddr.email) || session.email || '');
      if (savedAddr) {
        if (form.elements.city && savedAddr.city) form.elements.city.value = savedAddr.city;
        setIfEmpty('district', savedAddr.district || '');
        setIfEmpty('ward', savedAddr.ward || '');
        setIfEmpty('address', savedAddr.address || '');
      }
    };

    const renderCheckoutSummary = () => {
      if (!TP.AuthService.isLoggedIn()) {
        if (mainGrid) mainGrid.hidden = true;
        if (emptyGuard) {
          emptyGuard.hidden = false;
          emptyGuard.innerHTML = `
            <div class="tp-empty-icon">🔒</div>
            <h1 class="tp-h2 mb-2">Bạn cần đăng nhập để đặt hàng</h1>
            <p class="tp-text-small mb-3">Vui lòng đăng nhập tài khoản thành viên để tiếp tục đặt hàng tại AURIX MOBILE.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="dangnhap.html" class="tp-btn tp-btn-primary">Đăng nhập ngay</a>
              <a href="dangky.html" class="tp-btn tp-btn-secondary">Đăng ký tài khoản</a>
            </div>
          `;
        }
        TP.AuthService.requireAuth({ returnUrl: 'dathang.html' + (window.location.search || '') });
        return;
      }

      const summary = TP.CartService.getCheckoutSummary(deliveryMethod);
      if (!summary.items || !summary.items.length) {
        if (emptyGuard) {
          emptyGuard.hidden = false;
          emptyGuard.innerHTML = `
            <div class="tp-empty-icon">🛍️</div>
            <h1 class="tp-h2 mb-2">Chưa có sản phẩm nào để đặt hàng</h1>
            <p class="tp-text-small mb-3">Vui lòng chọn sản phẩm vào giỏ hàng hoặc bấm "Mua ngay" trên trang sản phẩm trước khi đặt hàng.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="sanpham.html" class="tp-btn tp-btn-primary">Quay lại chọn sản phẩm</a>
              <a href="donhang.html" class="tp-btn tp-btn-secondary">Xem đơn hàng của tôi</a>
            </div>
          `;
        }
        if (mainGrid) mainGrid.hidden = true;
        return;
      }

      if (emptyGuard) emptyGuard.hidden = true;
      if (mainGrid) mainGrid.hidden = false;

      if (sourceBadgeEl) {
        sourceBadgeEl.textContent = summary.source === 'buy_now'
          ? '⚡ Mua ngay sản phẩm đã chọn (Không ảnh hưởng giỏ hàng)'
          : `🛒 Thanh toán từ Giỏ hàng (${summary.itemCount} sản phẩm)`;
      }

      if (summaryItemsEl) {
        summaryItemsEl.innerHTML = summary.items.map((item) => `
          <div class="d-flex align-items-center justify-content-between py-2" style="border-bottom:1px solid var(--tp-border);">
            <div class="d-flex align-items-center gap-2">
              <img src="${item.thumbnail}" alt="${TP.DOM.escapeHtml(item.name)}" width="48" height="48" style="object-fit:contain;background:#F8FAFC;border-radius:8px;padding:4px;">
              <div>
                <div class="fw-bold tp-text-navy" style="font-size:0.86rem;">${TP.DOM.escapeHtml(item.name)}</div>
                <div class="tp-caption">${TP.DOM.escapeHtml(item.color)} · ${TP.DOM.escapeHtml(item.storage)} × <strong>${item.quantity}</strong></div>
                <div class="tp-caption tp-text-primary">${TP.DOM.formatPrice(item.unitPrice)} / sản phẩm</div>
              </div>
            </div>
            <strong class="tp-text-navy" style="font-size:0.9rem;">${TP.DOM.formatPrice(item.unitPrice * item.quantity)}</strong>
          </div>
        `).join('');
      }

      if (subEl) subEl.textContent = TP.DOM.formatPrice(summary.subtotal);
      if (discEl) discEl.textContent = summary.discount > 0 ? `-${TP.DOM.formatPrice(summary.discount)}` : '0đ';
      if (shipEl) shipEl.textContent = summary.shipping === 0 ? 'Miễn phí' : TP.DOM.formatPrice(summary.shipping);
      if (totEl) totEl.textContent = TP.DOM.formatPrice(summary.grandTotal);
    };

    if (form) {
      form.addEventListener('change', (e) => {
        if (e.target.name === 'deliveryMethod') {
          deliveryMethod = e.target.value;
          renderCheckoutSummary();
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        ['fullName', 'phone', 'email', 'city', 'district', 'ward', 'address'].forEach((f) => {
          const inp = form.elements[f];
          const err = TP.DOM.qs(`[data-error-for="${f}"]`, form);
          if (inp) {
            inp.classList.remove('is-invalid');
            inp.setAttribute('aria-invalid', 'false');
          }
          if (err) err.textContent = '';
        });

        const summary = TP.CartService.getCheckoutSummary(deliveryMethod);
        const data = {
          source: summary.source,
          idempotencyKey: summary.idempotencyKey,
          fullName: form.elements.fullName ? form.elements.fullName.value : '',
          phone: form.elements.phone ? form.elements.phone.value : '',
          email: form.elements.email ? form.elements.email.value : '',
          city: form.elements.city ? form.elements.city.value : '',
          district: form.elements.district ? form.elements.district.value : 'Quận 1',
          ward: form.elements.ward ? form.elements.ward.value : 'Phường Bến Nghé',
          address: form.elements.address ? form.elements.address.value : '',
          note: form.elements.note ? form.elements.note.value : '',
          saveAddress: form.elements.saveAddress ? form.elements.saveAddress.checked : true,
          deliveryMethod: (form.elements.deliveryMethod && form.elements.deliveryMethod.value) || 'standard',
          paymentMethod: (form.elements.paymentMethod && form.elements.paymentMethod.value) || 'COD'
        };

        const res = TP.OrderService.createOrder(data);
        if (!res.ok) {
          if (res.errors) {
            Object.entries(res.errors).forEach(([k, msg]) => {
              const inp = form.elements[k];
              const err = TP.DOM.qs(`[data-error-for="${k}"]`, form);
              if (inp) {
                inp.classList.add('is-invalid');
                inp.setAttribute('aria-invalid', 'true');
              }
              if (err) err.textContent = msg;
            });
          }
          TP.Toast.show(res.message || 'Vui lòng điền đầy đủ thông tin người nhận hàng.', 'error');
          return;
        }

        isSubmitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Đang xử lý đơn hàng...';
        }

        TP.Toast.show(`Khởi tạo đơn hàng #${res.order.orderId} thành công!`, 'success');
        window.location.href = res.nextUrl;
      });
    }

    prefillFromSessionAndAddress();
    renderCheckoutSummary();
    TP.Events.on('auth:changed', () => {
      prefillFromSessionAndAddress();
      renderCheckoutSummary();
    });
  });
})(window);
