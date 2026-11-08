/**
 * AURIX MOBILE — Simulated Bank Transfer & QR Payment Page Controller (thanhtoan.html)
 * Renders local SVG illustrative QR code, bank transfer metadata, copy buttons,
 * and confirmation modal that updates paymentStatus to "Đã thanh toán (mô phỏng)".
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  function buildSimulatedQrSvg(orderId, amount) {
    // Deterministic decorative QR matrix pattern generated locally as inline SVG
    const seedStr = `${orderId}_${amount}`;
    let hash = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      hash ^= seedStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const cells = [];
    const size = 21;
    const isFinder = (r, c) =>
      (r < 7 && c < 7) ||
      (r < 7 && c >= size - 7) ||
      (r >= size - 7 && c < 7);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFinder(r, c)) continue;
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        if ((hash >>> 0) % 2 === 0) {
          cells.push(`<rect x="${16 + c * 8}" y="${16 + r * 8}" width="7" height="7" rx="1.5" fill="#102347"/>`);
        }
      }
    }

    const finderSvg = (x, y) => `
      <rect x="${x}" y="${y}" width="56" height="56" rx="8" fill="none" stroke="#0666F5" stroke-width="6"/>
      <rect x="${x + 14}" y="${y + 14}" width="28" height="28" rx="4" fill="#102347"/>
    `;

    return `
      <svg viewBox="0 0 200 226" width="220" height="248" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mã QR minh họa học tập — Không chuyển tiền thật">
        <rect x="2" y="2" width="196" height="222" rx="16" fill="#FFFFFF" stroke="#C8DDFD" stroke-width="2"/>
        ${finderSvg(16, 16)}
        ${finderSvg(128, 16)}
        ${finderSvg(16, 128)}
        ${cells.join('')}
        <rect x="78" y="78" width="44" height="44" rx="8" fill="#0666F5"/>
        <text x="100" y="105" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="800" font-size="13">AURIX</text>
        <rect x="12" y="192" width="176" height="22" rx="6" fill="#FFF4E5"/>
        <text x="100" y="207" text-anchor="middle" fill="#B45309" font-family="sans-serif" font-weight="700" font-size="9.5">QR MINH HỌA · KHÔNG CHUYỂN TIỀN</text>
      </svg>
    `;
  }

  function copyTextToClipboard(text, label) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        TP.Toast.show(`Đã sao chép ${label}: ${text}`, 'success');
      }).catch(() => {
        TP.Toast.show(`Đã sao chép ${label}: ${text}`, 'success');
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      document.body.removeChild(ta);
      TP.Toast.show(`Đã sao chép ${label}: ${text}`, 'success');
    }
  }

  TP.PageInit.register('payment', function () {
    const container = TP.DOM.qs('#tp-payment-container');
    const confirmModalId = 'tp-bank-confirm-modal';

    if (!TP.AuthService.isLoggedIn()) {
      if (container) {
        container.innerHTML = `
          <div class="tp-empty-state">
            <div class="tp-empty-icon">🔒</div>
            <h1 class="tp-h2 mb-2">Vui lòng đăng nhập để thực hiện thanh toán</h1>
            <p class="tp-text-small mb-3">Phiên làm việc của bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin thanh toán đơn hàng.</p>
            <a href="dangnhap.html" class="tp-btn tp-btn-primary">Đăng nhập ngay</a>
          </div>
        `;
      }
      TP.AuthService.requireAuth({ returnUrl: 'thanhtoan.html' + (window.location.search || '') });
      return;
    }

    const order = TP.OrderService.getLastOrder();
    if (!order) {
      if (container) {
        container.innerHTML = `
          <div class="tp-empty-state">
            <div class="tp-empty-icon">🧾</div>
            <h1 class="tp-h2 mb-2">Không tìm thấy đơn hàng cần thanh toán</h1>
            <p class="tp-text-small mb-3">Bạn chưa có đơn hàng nào đang chờ thanh toán hoặc mã đơn hàng không tồn tại.</p>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
              <a href="donhang.html?tab=cart" class="tp-btn tp-btn-primary">Mở giỏ hàng</a>
              <a href="sanpham.html" class="tp-btn tp-btn-secondary">Tiếp tục mua sắm</a>
            </div>
          </div>
        `;
      }
      return;
    }

    const bank = TP.CONFIG.SIMULATED_BANK_INFO || {
      BANK_NAME: 'Vietcombank — Ngân hàng TMCP Ngoại thương Việt Nam',
      BANK_SHORT: 'Vietcombank',
      ACCOUNT_HOLDER: 'CONG TY TNHH AURIX MOBILE VIET NAM',
      ACCOUNT_NUMBER: '1048889999',
      BRANCH: 'Chi nhánh TP. Hồ Chí Minh'
    };

    const transferContent = order.transferContent || `AURIX ${order.orderId}`;
    const isAlreadyPaid = String(order.paymentStatus || '').includes('Đã thanh toán');

    if (container) {
      container.innerHTML = `
        

        <div class="tp-cart-layout">
          <div class="tp-surface p-4">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-3" style="border-bottom:1px solid var(--tp-border);">
              <div>
                <span class="tp-badge tp-badge-new mb-1">CHUYỂN KHOẢN NGÂN HÀNG </span>
                <h1 class="tp-h2 mb-0">Thanh toán đơn hàng #${TP.DOM.escapeHtml(order.orderId)}</h1>
              </div>
              <span class="tp-badge ${isAlreadyPaid ? 'tp-badge-instock' : 'tp-badge-hot'}" id="tp-pay-status-badge">
                ${TP.DOM.escapeHtml(order.paymentStatus)}
              </span>
            </div>

            <div class="row g-4 align-items-center">
              <div class="col-md-5 text-center">
                <div class="p-3 rounded d-inline-block" style="background:#F8FAFC;border:1px dashed var(--tp-primary);">
                  ${buildSimulatedQrSvg(order.orderId, order.grandTotal)}
                  <div class="tp-caption fw-bold tp-text-navy mt-2">Quét Mã QR Chuyển Khoản Ngân Hàng</div>
                </div>
              </div>

              <div class="col-md-7">
                <h2 class="tp-h3 mb-3">Thông tin chuyển khoản ngân hàng</h2>
                <div class="d-flex flex-column gap-2 p-3 rounded mb-3" style="background:#F8FAFC;border:1px solid var(--tp-border);">
                  <div class="d-flex justify-content-between align-items-center py-1" style="border-bottom:1px dashed var(--tp-border);">
                    <span class="tp-text-small">Ngân hàng:</span>
                    <strong class="tp-text-navy">${TP.DOM.escapeHtml(bank.BANK_NAME)}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-1" style="border-bottom:1px dashed var(--tp-border);">
                    <span class="tp-text-small">Chủ tài khoản:</span>
                    <strong class="tp-text-navy">${TP.DOM.escapeHtml(bank.ACCOUNT_HOLDER)}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-1" style="border-bottom:1px dashed var(--tp-border);">
                    <span class="tp-text-small">Số tài khoản minh họa:</span>
                    <div class="d-flex align-items-center gap-2">
                      <strong class="tp-text-primary" style="font-size:1.05rem;" id="tp-bank-acc-num">${TP.DOM.escapeHtml(bank.ACCOUNT_NUMBER)}</strong>
                      <button type="button" class="tp-btn tp-btn-secondary tp-btn-sm" id="tp-copy-acc-btn" style="padding:0.2rem 0.6rem;font-size:0.76rem;">Sao chép STK</button>
                    </div>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-1" style="border-bottom:1px dashed var(--tp-border);">
                    <span class="tp-text-small">Số tiền thanh toán:</span>
                    <strong class="tp-price" style="font-size:1.18rem;">${TP.DOM.formatPrice(order.grandTotal)}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-1">
                    <span class="tp-text-small">Nội dung chuyển khoản:</span>
                    <div class="d-flex align-items-center gap-2">
                      <strong class="tp-badge tp-badge-new" style="font-size:0.9rem;" id="tp-bank-transfer-memo">${TP.DOM.escapeHtml(transferContent)}</strong>
                      <button type="button" class="tp-btn tp-btn-secondary tp-btn-sm" id="tp-copy-memo-btn" style="padding:0.2rem 0.6rem;font-size:0.76rem;">Sao chép nội dung</button>
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-2 mt-3">
                  <button type="button" id="tp-confirm-bank-pay-btn" class="tp-btn tp-btn-primary tp-btn-lg" style="flex:1;min-width:220px;">
                    ✓ Xác nhận thanh toán
                  </button>
                  <a href="donhang.html?tab=cart" class="tp-btn tp-btn-secondary">Về giỏ hàng</a>
                  <a href="dathang.html" class="tp-btn tp-btn-ghost">Quay lại đặt hàng</a>
                </div>
              </div>
            </div>
          </div>

          <aside class="tp-summary-card" aria-label="Tóm tắt đơn hàng">
            <h2 class="tp-h3 mb-3">Chi tiết đơn hàng</h2>
            <div class="tp-text-small mb-3 p-2 rounded" style="background:#F8FAFC;border:1px solid var(--tp-border);">
              <div><strong>Người nhận:</strong> ${TP.DOM.escapeHtml(order.receiver.fullName)}</div>
              <div><strong>SĐT:</strong> ${TP.DOM.escapeHtml(order.receiver.phone)}</div>
              <div><strong>Địa chỉ:</strong> ${TP.DOM.escapeHtml(order.customer.fullAddress || order.receiver.address)}</div>
            </div>
            <div class="mb-3">
              ${order.items.map((item) => `
                <div class="d-flex align-items-center justify-content-between py-2" style="border-bottom:1px solid var(--tp-border);">
                  <div class="d-flex align-items-center gap-2">
                    <img src="${item.thumbnail}" alt="${TP.DOM.escapeHtml(item.name)}" width="42" height="42" style="object-fit:contain;">
                    <div>
                      <div class="fw-bold tp-text-navy" style="font-size:0.84rem;">${TP.DOM.escapeHtml(item.name)}</div>
                      <div class="tp-caption">${TP.DOM.escapeHtml(item.color)} · ${TP.DOM.escapeHtml(item.storage)} × ${item.quantity}</div>
                    </div>
                  </div>
                  <strong class="tp-text-navy" style="font-size:0.86rem;">${TP.DOM.formatPrice(item.lineTotal || item.unitPrice * item.quantity)}</strong>
                </div>
              `).join('')}
            </div>
            <div class="tp-summary-row">
              <span class="tp-text-muted">Tạm tính:</span>
              <strong>${TP.DOM.formatPrice(order.subtotal)}</strong>
            </div>
            <div class="tp-summary-row">
              <span class="tp-text-muted">Giảm giá:</span>
              <strong class="tp-text-success">${order.discount > 0 ? '-' + TP.DOM.formatPrice(order.discount) : '0đ'}</strong>
            </div>
            <div class="tp-summary-row">
              <span class="tp-text-muted">Phí vận chuyển:</span>
              <strong>${order.shipping === 0 ? 'Miễn phí' : TP.DOM.formatPrice(order.shipping)}</strong>
            </div>
            <div class="tp-summary-row tp-summary-total">
              <span>Tổng thanh toán:</span>
              <span class="tp-price" style="font-size:1.3rem;">${TP.DOM.formatPrice(order.grandTotal)}</span>
            </div>
          </aside>
        </div>
      `;

      const copyAccBtn = TP.DOM.qs('#tp-copy-acc-btn');
      if (copyAccBtn) {
        copyAccBtn.addEventListener('click', () => copyTextToClipboard(bank.ACCOUNT_NUMBER, 'Số tài khoản'));
      }
      const copyMemoBtn = TP.DOM.qs('#tp-copy-memo-btn');
      if (copyMemoBtn) {
        copyMemoBtn.addEventListener('click', () => copyTextToClipboard(transferContent, 'Nội dung chuyển khoản'));
      }

      const confirmBtn = TP.DOM.qs('#tp-confirm-bank-pay-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          TP.Modal.open(confirmModalId);
        });
      }

      
      const finalConfirmBtn = TP.DOM.qs('#tp-modal-confirm-paid-btn');
      const modalBackdrop = TP.DOM.qs('#tp-bank-confirm-modal');
      const modalDialog = modalBackdrop ? modalBackdrop.querySelector('.tp-modal-dialog') : null;
      const modalCloseBtns = modalBackdrop ? modalBackdrop.querySelectorAll('.tp-modal-close, [data-modal-close]') : [];

      if (finalConfirmBtn) {
        finalConfirmBtn.onclick = () => {
          // 1. Khoá nút và vô hiệu hoá các nút đóng modal để tránh người dùng bấm lặp lại
          finalConfirmBtn.disabled = true;
          modalCloseBtns.forEach((btn) => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.4';
          });

          // 2. Đổi nội dung nút thành spinner xoay tròn và trạng thái đang đối soát
          const originalText = finalConfirmBtn.innerHTML;
          finalConfirmBtn.innerHTML = `<span class="tp-spinner" aria-hidden="true"></span>Đang xác thực giao dịch chuyển khoản...`;

          const descEl = modalDialog ? modalDialog.querySelector('.tp-text-small') : null;
          if (descEl) {
            descEl.innerHTML = `
        <span class="d-inline-block fw-bold tp-text-primary mb-1">🔄 Đang kiểm tra mã giao dịch #${TP.DOM.escapeHtml(order.orderId)} với ngân hàng...</span><br>
        <span class="tp-text-muted" style="font-size:0.8rem;">Hệ thống đang đối soát dữ liệu, vui lòng chờ trong giây lát (khoảng 2–3 giây).</span>
      `;
          }

          // 3. Tạo độ trễ mô phỏng 2.5 giây (2500ms) trước khi xác nhận đơn và chuyển trang
          setTimeout(() => {
            const res = TP.OrderService.confirmSimulatedBankPayment(order.orderId);
            TP.Modal.close(confirmModalId);

            if (!res.ok) {
              finalConfirmBtn.disabled = false;
              finalConfirmBtn.innerHTML = originalText;
              modalCloseBtns.forEach((btn) => {
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
              });
              TP.Toast.show(res.message || 'Không thể xác nhận thanh toán.', 'error');
              return;
            }

            TP.Toast.show('Xác nhận thanh toán thành công! Đang chuyển hướng...', 'success');
            window.location.href = res.nextUrl; // Chuyển sang trang dathangthanhcong.html
          }, 2500);
        };
      }
    }
  });
})(window);
