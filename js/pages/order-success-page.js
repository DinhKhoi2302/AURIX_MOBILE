/**
 * AURIX MOBILE — Order Success Confirmation Page Controller (dathangthanhcong.html)
 * Reads newly created/confirmed order from OrderService and displays complete order details.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  function formatDateTimeVi(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return isoStr || '';
    }
  }

  TP.PageInit.register('order-success', function () {
    const container = TP.DOM.qs('#tp-order-success-container');

    if (!TP.AuthService.isLoggedIn()) {
      if (container) {
        container.innerHTML = `
          <div class="tp-empty-state">
            <div class="tp-empty-icon">🔒</div>
            <h1 class="tp-h2 mb-2">Vui lòng đăng nhập để xem xác nhận đơn hàng</h1>
            <p class="tp-text-small mb-3">Bạn cần đăng nhập tài khoản đã đặt hàng để xem chi tiết đơn hàng.</p>
            <a href="dangnhap.html" class="tp-btn tp-btn-primary">Đăng nhập ngay</a>
          </div>
        `;
      }
      TP.AuthService.requireAuth({ returnUrl: 'dathangthanhcong.html' + (window.location.search || '') });
      return;
    }

    const order = TP.OrderService.getLastOrder();
    if (!order) {
      if (container) {
        container.innerHTML = `
          <div class="tp-empty-state">
            <div class="tp-empty-icon">📦</div>
            <h1 class="tp-h2 mb-2">Chưa tìm thấy thông tin đơn hàng vừa đặt</h1>
            <p class="tp-text-small mb-3">Bạn có thể kiểm tra toàn bộ đơn hàng của mình trong trang Quản lý đơn hàng.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="donhang.html" class="tp-btn tp-btn-primary">Mở Đơn hàng của tôi</a>
              <a href="sanpham.html" class="tp-btn tp-btn-secondary">Tiếp tục mua sắm</a>
            </div>
          </div>
        `;
      }
      return;
    }

    const isBank = order.paymentMethod === 'BANK';
    const paymentNote = isBank
      ? 'Bạn đã xác nhận hoàn tất thanh toán chuyển khoản ngân hàng . Hệ thống đang chuẩn bị sản phẩm nguyên seal để giao tới bạn.'
      : 'Bạn sẽ thanh toán khi nhận hàng (COD). Quý khách được kiểm tra ngoại quan nguyên seal trước khi thanh toán cho nhân viên giao hàng.';

    if (container) {
      container.innerHTML = `
        <div class="tp-surface p-4 mb-4" style="border:2px solid var(--tp-success);border-radius:18px;">
          <div class="text-center mb-4">
            <div class="tp-empty-icon mx-auto mb-2" style="background:var(--tp-success-soft);color:var(--tp-success);width:68px;height:68px;font-size:2rem;display:flex;align-items:center;justify-content:center;border-radius:50%;">✓</div>
            <span class="tp-badge tp-badge-instock mb-2">ĐẶT HÀNG THÀNH CÔNG</span>
            <h1 class="tp-h2 mb-1">Cảm ơn ${TP.DOM.escapeHtml(order.receiver.fullName)} đã mua sắm tại AURIX MOBILE!</h1>
            <p class="tp-text-small mb-0">Mã đơn hàng của bạn là <strong class="tp-text-primary" style="font-size:1.05rem;">#${TP.DOM.escapeHtml(order.orderId)}</strong> · Đặt lúc ${TP.DOM.escapeHtml(formatDateTimeVi(order.createdAt))}</p>
          </div>

          <div class="p-3 rounded mb-4" style="background:#F0F6FF;border:1px solid #C8DDFD;">
            <strong class="tp-text-navy d-block mb-1">${isBank ? '🏦 Thông tin thanh toán chuyển khoản :' : '💵 Hướng dẫn thanh toán khi nhận hàng (COD):'}</strong>
            <p class="tp-text-small mb-0" style="color:var(--tp-text-primary);">${TP.DOM.escapeHtml(paymentNote)}</p>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-md-6">
              <div class="p-3 rounded h-100" style="background:#F8FAFC;border:1px solid var(--tp-border);">
                <h2 class="tp-h3 mb-2" style="font-size:1rem;">1. Thông tin người nhận &amp; Giao hàng</h2>
                <div class="tp-text-small mb-1"><strong>Họ và tên:</strong> ${TP.DOM.escapeHtml(order.receiver.fullName)}</div>
                <div class="tp-text-small mb-1"><strong>Số điện thoại:</strong> ${TP.DOM.escapeHtml(order.receiver.phone)}</div>
                ${order.receiver.email ? `<div class="tp-text-small mb-1"><strong>Email:</strong> ${TP.DOM.escapeHtml(order.receiver.email)}</div>` : ''}
                <div class="tp-text-small mb-1"><strong>Địa chỉ nhận hàng:</strong> ${TP.DOM.escapeHtml(order.customer.fullAddress || order.receiver.address)}</div>
                ${order.receiver.note ? `<div class="tp-text-small"><strong>Ghi chú:</strong> ${TP.DOM.escapeHtml(order.receiver.note)}</div>` : ''}
              </div>
            </div>

            <div class="col-md-6">
              <div class="p-3 rounded h-100" style="background:#F8FAFC;border:1px solid var(--tp-border);">
                <h2 class="tp-h3 mb-2" style="font-size:1rem;">2. Thông tin thanh toán</h2>
                <div class="tp-text-small mb-1"><strong>Mã đơn hàng:</strong> <span class="tp-text-primary fw-bold">#${TP.DOM.escapeHtml(order.orderId)}</span></div>
                <div class="tp-text-small mb-1"><strong>Phương thức thanh toán:</strong> ${TP.DOM.escapeHtml(order.paymentMethodLabel)}</div>
                <div class="tp-text-small mb-1"><strong>Trạng thái thanh toán:</strong> <span class="tp-badge ${String(order.paymentStatus || '').includes('Đã thanh toán') ? 'tp-payment-paid' : 'tp-payment-cod'}">${TP.DOM.escapeHtml(String(order.paymentStatus || '').includes('Đã thanh toán') ? 'Đã thanh toán' : 'Chưa thanh toán (COD)')}</span></div>
                <div class="tp-text-small"><strong>Tổng thanh toán:</strong> <span class="tp-price" style="font-size:1.15rem;">${TP.DOM.formatPrice(order.grandTotal)}</span></div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <h2 class="tp-h3 mb-2" style="font-size:1.02rem;">3. Danh sách sản phẩm đã đặt (${order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</h2>
            <div class="table-responsive rounded" style="border:1px solid var(--tp-border);">
              <table class="table tp-spec-table mb-0 bg-white">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Phiên bản</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map((item) => `
                    <tr>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <img src="${item.thumbnail}" alt="${TP.DOM.escapeHtml(item.name)}" width="44" height="44" style="object-fit:contain;">
                          <a href="chitietsanpham.html?id=${encodeURIComponent(item.productId)}" class="fw-bold tp-text-navy">${TP.DOM.escapeHtml(item.name)}</a>
                        </div>
                      </td>
                      <td>${TP.DOM.escapeHtml(item.color)} · ${TP.DOM.escapeHtml(item.storage)}</td>
                      <td>${TP.DOM.formatPrice(item.unitPrice)}</td>
                      <td>× ${item.quantity}</td>
                      <td class="text-end fw-bold tp-price">${TP.DOM.formatPrice(item.lineTotal || item.unitPrice * item.quantity)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="d-flex justify-content-center gap-3 flex-wrap pt-2">
            <a href="donhang.html?tab=orders&orderId=${encodeURIComponent(order.orderId)}" class="tp-btn tp-btn-primary tp-btn-lg">📦 Xem đơn hàng</a>
            <a href="sanpham.html" class="tp-btn tp-btn-secondary tp-btn-lg">🛍️ Tiếp tục mua sắm</a>
            <a href="index.html" class="tp-btn tp-btn-ghost tp-btn-lg">🏠 Về trang chủ</a>
          </div>
        </div>
      `;
    }
  });
})(window);
