/**
 * AURIX MOBILE — Register Page Controller (dangky.html)
 * Implements:
 * - Strictly 5 required fields: Họ và tên, Số điện thoại, Email, Mật khẩu, Xác nhận mật khẩu.
 * - Circular Avatar uploader (JPG, JPEG, PNG, WebP) with Canvas compression & instant preview.
 * - "Điền dữ liệu mẫu" button that populates valid non-duplicate sample registration data without auto-submitting.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.PageInit.register('register', function () {
    const form = TP.DOM.qs('#tp-register-form');
    const pwdInput = TP.DOM.qs('#tp-reg-password');
    const confirmInput = TP.DOM.qs('#tp-reg-confirm');
    const togglePwdBtn = TP.DOM.qs('#tp-toggle-reg-pwd');
    const toggleConfirmBtn = TP.DOM.qs('#tp-toggle-reg-confirm');
    const strengthBar = TP.DOM.qs('#tp-pwd-strength-bar');
    const strengthText = TP.DOM.qs('#tp-pwd-strength-text');
    const resultBox = TP.DOM.qs('#tp-register-success-box');
    const fillSampleBtn = TP.DOM.qs('#tp-fill-sample-register-btn');

    // Avatar uploader elements
    const avatarInput = TP.DOM.qs('#tp-reg-avatar-input');
    const avatarPreview = TP.DOM.qs('#tp-reg-avatar-preview');
    const avatarRemoveBtn = TP.DOM.qs('#tp-reg-avatar-remove-btn');
    const avatarErrorEl = TP.DOM.qs('#tp-reg-avatar-error');

    let selectedAvatarDataUrl = null;

    const updateStrengthUI = (pwdVal) => {
      const info = TP.AuthService.evaluatePasswordStrength(pwdVal);
      if (strengthBar) {
        strengthBar.style.width = `${info.percent}%`;
        strengthBar.style.backgroundColor = info.color;
      }
      if (strengthText) {
        strengthText.textContent = `Độ mạnh mật khẩu: ${info.label}`;
        strengthText.style.color = info.color;
      }
    };

    const setFieldError = (fieldName, msg) => {
      if (!form) return;
      const input = TP.DOM.qs(`[name="${fieldName}"]`, form);
      const errEl = TP.DOM.qs(`[data-error-for="${fieldName}"]`, form);
      if (input) {
        input.classList.toggle('is-invalid', Boolean(msg));
        input.setAttribute('aria-invalid', String(Boolean(msg)));
      }
      if (errEl) {
        errEl.textContent = msg || '';
      }
    };

    if (avatarInput) {
      avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files && avatarInput.files[0];
        if (!file) return;
        if (avatarErrorEl) avatarErrorEl.textContent = '';

        const res = await TP.AuthService.compressAvatarFile(file);
        if (!res.ok) {
          if (avatarErrorEl) avatarErrorEl.textContent = res.message;
          avatarInput.value = '';
          return;
        }
        selectedAvatarDataUrl = res.dataUrl;
        if (avatarPreview) avatarPreview.src = res.dataUrl;
        if (avatarRemoveBtn) avatarRemoveBtn.hidden = false;
      });
    }

    if (avatarRemoveBtn) {
      avatarRemoveBtn.addEventListener('click', () => {
        selectedAvatarDataUrl = null;
        if (avatarInput) avatarInput.value = '';
        if (avatarPreview) avatarPreview.src = TP.AuthService.getDefaultAvatar();
        if (avatarErrorEl) avatarErrorEl.textContent = '';
        avatarRemoveBtn.hidden = true;
      });
    }

    if (fillSampleBtn && form) {
      fillSampleBtn.addEventListener('click', () => {
        const sample = TP.AuthService.generateSampleRegistrationData();
        if (form.elements.fullName) form.elements.fullName.value = sample.fullName;
        if (form.elements.phone) form.elements.phone.value = sample.phone;
        if (form.elements.email) form.elements.email.value = sample.email;
        if (form.elements.password) form.elements.password.value = sample.password;
        if (form.elements.confirmPassword) form.elements.confirmPassword.value = sample.confirmPassword;

        ['fullName', 'phone', 'email', 'password', 'confirmPassword'].forEach((f) => setFieldError(f, ''));
        updateStrengthUI(sample.password);
        TP.Toast.show(`Đã điền dữ liệu mẫu (${sample.email}). Bạn có thể chỉnh sửa trước khi bấm Đăng ký.`, 'info');
      });
    }

    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        togglePwdBtn.textContent = isPwd ? 'Ẩn' : 'Hiện';
      });
    }

    if (toggleConfirmBtn && confirmInput) {
      toggleConfirmBtn.addEventListener('click', () => {
        const isPwd = confirmInput.type === 'password';
        confirmInput.type = isPwd ? 'text' : 'password';
        toggleConfirmBtn.textContent = isPwd ? 'Ẩn' : 'Hiện';
      });
    }

    if (pwdInput) {
      pwdInput.addEventListener('input', () => updateStrengthUI(pwdInput.value));
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        ['fullName', 'phone', 'email', 'password', 'confirmPassword'].forEach((f) => setFieldError(f, ''));

        const payload = {
          fullName: form.elements.fullName ? form.elements.fullName.value : '',
          phone: form.elements.phone ? form.elements.phone.value : '',
          email: form.elements.email ? form.elements.email.value : '',
          password: form.elements.password ? form.elements.password.value : '',
          confirmPassword: form.elements.confirmPassword ? form.elements.confirmPassword.value : '',
          avatar: selectedAvatarDataUrl
        };

        const res = TP.AuthService.register(payload);
        if (!res.ok) {
          Object.entries(res.errors || {}).forEach(([k, v]) => setFieldError(k, v));
          TP.Toast.show('Vui lòng kiểm tra lại các trường báo lỗi trong biểu mẫu.', 'error');
          return;
        }

        if (resultBox) {
          resultBox.hidden = false;
          resultBox.innerHTML = `
            <div class="tp-registered-preview">
              <strong class="tp-text-success d-block mb-1">✓ Đăng ký tài khoản thành viên thành công!</strong>
              <p class="tp-text-small mb-0">Đang chuyển sang trang Đăng nhập với địa chỉ Email <strong>${TP.DOM.escapeHtml(res.user.email)}</strong>...</p>
            </div>
          `;
        }
        TP.Toast.show('Đăng ký thành công! Đang chuyển sang trang đăng nhập...', 'success');

        setTimeout(() => {
          window.location.href = `dangnhap.html?registered=1&email=${encodeURIComponent(res.user.email)}`;
        }, 550);
      });
    }
  });
})(window);
