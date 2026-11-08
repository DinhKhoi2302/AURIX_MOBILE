/** AURIX MOBILE — Shared cart and current-session order history (Requirement 5: Only 2 payment states). */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', hour12: false, day: '2-digit', month: '2-digit', year: 'numeric'
  });

  function orderStatus() {
    return 'Chờ xác nhận';
  }

  function paymentLabel(status) {
    const raw = String(status || '').replace(/\s*\(mô phỏng\)/gi, '').trim();
    if (raw === 'Đã thanh toán') return 'Đã thanh toán';
    return 'Chưa thanh toán (COD)';
  }

  function paymentClass(status) {
    const text = paymentLabel(status);
    return text === 'Đã thanh toán' ? 'tp-payment-paid' : 'tp-payment-cod';
  }

  TP.PageInit.register('orders', function () {
    const cartTab = document.getElementById('tp-cart-tab');
    const historyTab = document.getElementById('tp-history-tab');
    const tablist = cartTab.parentElement;
    const cartPanel = document.getElementById('tp-orders-cart');
    const historyPanel = document.getElementById('tp-order-history');
    const orderCount = document.getElementById('tp-order-count');
    const detailBody = document.getElementById('tp-order-detail-body');
    const escape = TP.DOM.escapeHtml;
    const price = TP.DOM.formatPrice;

    function selectTab(tab) {
      const showCart = tab === cartTab;
      cartPanel.hidden = !showCart;
      historyPanel.hidden = showCart;
      [cartTab, historyTab].forEach(button => {
        const active = button === tab;
        button.tabIndex = active ? 0 : -1;
        button.setAttribute('aria-selected', String(active));
        button.classList.toggle('tp-btn-primary', active);
        button.classList.toggle('tp-btn-secondary', !active);
      });
    }

    function activateTab(tab) {
      selectTab(tab);
      TP.DOM.setQueryParam('orderId', null);
      const tabName = tab === cartTab ? 'cart' : 'orders';
      TP.DOM.setQueryParam('tab', tabName);
      if (!TP.AuthService.isLoggedIn()) TP.AuthService.saveReturnUrl('donhang.html?tab=' + tabName);
    }

    function renderHistory() {
      const orders = TP.OrderService.getOrders();
      orderCount.textContent = orders.length;

      if (!orders.length) {
        historyPanel.innerHTML = TP.AuthService.isLoggedIn() ? `
          <div class="tp-empty-state">
            <div class="tp-empty-icon" aria-hidden="true">📦</div>
            <h2 class="tp-h3 mb-2">Bạn chưa có đơn hàng</h2>
            <p class="tp-text-small mb-3">Đơn hàng bạn đặt trong phiên này sẽ hiển thị tại đây.</p>
            <a href="sanpham.html" class="tp-btn tp-btn-primary">Khám phá sản phẩm</a>
          </div>
        ` : `
          <div class="tp-empty-state">
            <div class="tp-empty-icon" aria-hidden="true">🔒</div>
            <h2 class="tp-h3 mb-2">Bạn cần đăng nhập để xem đơn hàng</h2>
            <a href="dangnhap.html" class="tp-btn tp-btn-primary">Đăng nhập ngay</a>
          </div>
        `;
        return;
      }

      historyPanel.innerHTML = `
        <p class="tp-text-small mb-3">Hiển thị <strong>${orders.length}</strong> đơn hàng gần đây của bạn. Bạn có thể bấm “Mua lại” để thêm nhanh sản phẩm vào giỏ hàng.</p>
        <div class="d-flex flex-column gap-3">
          ${orders.map(order => `
            <article class="tp-surface p-4" data-order-card="${escape(order.orderId)}">
              <div class="tp-order-card-head d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2 mb-3">
                <div>
                  <strong class="tp-text-navy">Đơn hàng #${escape(order.orderId)}</strong>
                  <span class="tp-caption"> · ${escape(dateFormat.format(new Date(order.createdAt)))}</span>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <span class="tp-badge tp-badge-new ${paymentClass(order.paymentStatus)}">${escape(paymentLabel(order.paymentStatus))}</span>
                  <span class="tp-badge tp-badge-new">${orderStatus(order)}</span>
                </div>
              </div>
              <div class="d-flex flex-column gap-2 mb-3">
                ${order.items.map(item => `
                  <div class="d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                      <img class="tp-order-item-image" src="${escape(item.thumbnail)}" alt="${escape(item.name)}" width="44" height="44" loading="lazy">
                      <div>
                        <div class="fw-bold tp-text-navy">${escape(item.name)}</div>
                        <div class="tp-caption">${escape(item.color)} · ${escape(item.storage)} × ${item.quantity} (Giá lúc mua: ${price(item.unitPrice)})</div>
                      </div>
                    </div>
                    <strong class="tp-price">${price(item.lineTotal)}</strong>
                  </div>
                `).join('')}
              </div>
              <div class="tp-order-card-foot d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2">
                <div><span class="tp-text-small">Tổng đơn hàng:</span> <strong class="tp-price">${price(order.grandTotal)}</strong></div>
                <div class="d-flex flex-wrap gap-2">
                  <button type="button" class="tp-btn tp-btn-secondary tp-btn-sm" data-view-order-detail="${escape(order.orderId)}">Xem chi tiết</button>
                  <button type="button" class="tp-btn tp-btn-primary tp-btn-sm" data-reorder-id="${escape(order.orderId)}">🔄 Mua lại đơn này</button>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }

    function openOrderDetail(orderId) {
      const order = TP.OrderService.getOrderById(orderId);
      if (!order) return;
      const receiver = order.receiver;
      const normPayLabel = paymentLabel(order.paymentStatus);
      const normPayClass = paymentClass(order.paymentStatus);
      detailBody.innerHTML = `
        <div class="tp-order-card-head tp-order-detail-head d-flex align-items-end justify-content-between flex-wrap gap-2 pb-2 mb-3">
          <div>
            <span class="tp-badge tp-badge-new mb-1">${orderStatus(order)}</span>
            <h2 id="tp-order-detail-title" class="tp-h3 mb-0">Chi tiết đơn hàng #${escape(order.orderId)}</h2>
          </div>
          <span class="tp-caption">Đặt lúc: ${escape(dateFormat.format(new Date(order.createdAt)))}</span>
        </div>

        <div class="tp-order-detail-info mb-3">
          <section class="tp-order-detail-box">
            <h3 class="fw-bold tp-text-navy mb-1">Thông tin người nhận</h3>
            <div class="tp-text-small"><strong>Họ tên:</strong> ${escape(receiver.fullName)}</div>
            <div class="tp-text-small"><strong>Điện thoại:</strong> ${escape(receiver.phone)}</div>
            <div class="tp-text-small"><strong>Địa chỉ:</strong> ${escape(order.customer.fullAddress)}</div>
          </section>
          <section class="tp-order-detail-box">
            <h3 class="fw-bold tp-text-navy mb-1">Thanh toán &amp; Vận chuyển</h3>
            <div class="tp-text-small"><strong>Phương thức:</strong> ${escape(order.paymentMethodLabel)}</div>
            <div class="tp-text-small"><strong>Trạng thái thanh toán:</strong> <span class="tp-badge tp-badge-new ${normPayClass}">${escape(normPayLabel)}</span></div>
            <div class="tp-text-small"><strong>Giao hàng:</strong> ${order.deliveryMethod === 'express' ? 'Giao nhanh' : 'Giao tiêu chuẩn'}</div>
          </section>
        </div>

        <div class="tp-order-detail-table mb-3">
          <table>
            <thead>
              <tr><th scope="col">Sản phẩm</th><th scope="col">Phiên bản</th><th scope="col">Đơn giá</th><th scope="col">SL</th><th scope="col" class="text-end">Thành tiền</th></tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img class="tp-order-item-image" src="${escape(item.thumbnail)}" alt="${escape(item.name)}" width="40" height="40">
                      <a href="chitietsanpham.html?id=${encodeURIComponent(item.productId)}" class="fw-bold tp-text-navy">${escape(item.name)}</a>
                    </div>
                  </td>
                  <td>${escape(item.color)} · ${escape(item.storage)}</td>
                  <td>${price(item.unitPrice)}</td>
                  <td>× ${item.quantity}</td>
                  <td class="text-end fw-bold tp-price">${price(item.lineTotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="tp-order-card-foot d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2">
          <div><span class="tp-text-small">Tổng cộng thanh toán:</span> <strong class="tp-price">${price(order.grandTotal)}</strong></div>
          <button type="button" class="tp-btn tp-btn-secondary tp-btn-sm" data-modal-close>Đóng</button>
        </div>
      `;
      TP.Modal.open('tp-order-detail-modal');
    }

    tablist.addEventListener('click', event => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) activateTab(tab);
    });

    tablist.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tab = event.key === 'Home' || (event.key !== 'End' && event.target === historyTab) ? cartTab : historyTab;
      activateTab(tab);
      tab.focus();
    });

    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = new URL(link.href);
      if (target.origin !== global.location.origin || target.pathname !== global.location.pathname || target.hash) return;
      event.preventDefault();
      activateTab(target.searchParams.get('tab') === 'cart' ? cartTab : historyTab);
      global.scrollTo(0, 0);
    });

    historyPanel.addEventListener('click', event => {
      const detailButton = event.target.closest('[data-view-order-detail]');
      if (detailButton) openOrderDetail(detailButton.dataset.viewOrderDetail);
      const reorderButton = event.target.closest('[data-reorder-id]');
      if (reorderButton) {
        const result = TP.OrderService.reorder(reorderButton.dataset.reorderId);
        TP.Toast.show(result.message, result.ok ? 'success' : 'error');
      }
    });

    TP.CartPage();
    const cartRequested = TP.DOM.getQueryParam('tab') === 'cart';
    selectTab(cartRequested ? cartTab : historyTab);
    renderHistory();
    TP.Events.on('order:created', renderHistory);
    TP.Events.on('order:updated', renderHistory);
    TP.Events.on('auth:changed', () => {
      if (detailBody.closest('.is-open')) TP.Modal.close('tp-order-detail-modal');
      detailBody.replaceChildren();
      renderHistory();
    });

    if (!TP.AuthService.isLoggedIn()) {
      TP.AuthService.requireAuth();
      return;
    }
    const orderId = TP.DOM.getQueryParam('orderId');
    if (orderId && !cartRequested) openOrderDetail(orderId);
  });
})(window);
