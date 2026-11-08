/**
 * AURIX MOBILE — Contact Page Controller (lienhe.html)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.PageInit.register('contact', function () {
    TP.Accordion.init();

    const form = TP.DOM.qs('#tp-contact-form');
    const successBox = TP.DOM.qs('#tp-contact-success');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = String(form.elements.fullName.value || '').trim();
        const email = String(form.elements.email.value || '').trim();
        const phone = String(form.elements.phone.value || '').trim();
        const subject = String(form.elements.subject.value || '').trim();
        const message = String(form.elements.message.value || '').trim();

        let hasErr = false;
        const setErr = (name, msg) => {
          const inp = form.elements[name];
          const err = TP.DOM.qs(`[data-error-for="${name}"]`, form);
          if (inp) inp.classList.toggle('is-invalid', Boolean(msg));
          if (err) err.textContent = msg || '';
          if (msg) hasErr = true;
        };

        setErr('fullName', fullName.length < 3 ? 'Vui lòng nhập họ và tên (tối thiểu 3 ký tự).' : '');
        setErr('email', !TP.AuthService.REGEX.EMAIL.test(email) ? 'Email liên hệ không hợp lệ.' : '');
        setErr('phone', !TP.AuthService.REGEX.PHONE_VN.test(phone) ? 'Số điện thoại gồm 10 chữ số hợp lệ.' : '');
        setErr('message', message.length < 10 ? 'Nội dung lời nhắn cần tối thiểu 10 ký tự.' : '');

        if (hasErr) {
          TP.Toast.show('Vui lòng kiểm tra lại thông tin liên hệ.', 'error');
          return;
        }

        const list = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.CONTACTS, []);
        const ticket = {
          ticketId: 'SUP-' + Math.floor(10000 + Math.random() * 90000),
          fullName,
          email,
          phone,
          subject,
          createdAt: new Date().toISOString()
        };
        list.unshift(ticket);
        TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.CONTACTS, list);

        form.reset();
        if (successBox) {
          successBox.hidden = false;
          successBox.innerHTML = `
            <div class="p-3 rounded mt-3" style="background:var(--tp-success-soft);border:1px solid var(--tp-success);">
              <strong class="tp-text-success">✓ Gửi yêu cầu hỗ trợ thành công!</strong>
              <div class="tp-text-small mt-1">Mã phiếu hỗ trợ của bạn là <strong>${TP.DOM.escapeHtml(ticket.ticketId)}</strong>. Cảm ơn ${TP.DOM.escapeHtml(ticket.fullName)} đã liên hệ AURIX MOBILE!</div>
            </div>
          `;
        }
        TP.Toast.show(`Đã gửi yêu cầu hỗ trợ (${ticket.ticketId})!`, 'success');
      });
    }
  });
})(window);
