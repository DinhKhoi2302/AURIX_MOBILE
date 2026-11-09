/**
 * AURIX MOBILE — Login & Personal Account Profile Page Controller (dangnhap.html)
 * Implements:
 * - Guest state: Modern Email + Password login form (no username field, no logout button).
 * - Upon login submit: Saves flash welcome toast, redirects immediately to index.html (or returnUrl).
 * - When visiting dangnhap.html while logged in (via "Thông tin tài khoản"): Hides login form completely
 *   and renders the 2-column Personal Account Profile with circular avatar, direct avatar file picker,
 *   and "Chỉnh sửa thông tin & Mật khẩu" modal.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const FLASH_TOAST_KEY = 'aurix_flash_toast_v1';

  function formatJoinDate(isoStr) {
    if (!isoStr) return 'Thành viên chính thức';
    try {
      return new Date(isoStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Thành viên chính thức';
    }
  }

  TP.PageInit.register('login', function () {
    const guestView = TP.DOM.qs('#tp-login-guest-view');
    const profileView = TP.DOM.qs('#tp-account-profile-view');
    const bcCurrent = TP.DOM.qs('#tp-login-bc-current');

    const form = TP.DOM.qs('#tp-login-form');
    const idInput = TP.DOM.qs('#tp-login-identifier');
    const pwdInput = TP.DOM.qs('#tp-login-password');
    const togglePwdBtn = TP.DOM.qs('#tp-toggle-login-pwd');
    const forgotBtn = TP.DOM.qs('#tp-forgot-pwd-btn');
    const feedbackBox = TP.DOM.qs('#tp-login-feedback');
    const quickDemoBtn = TP.DOM.qs('#tp-fill-demo-account');

    // Edit Profile Modal elements
    const editModalId = 'tp-edit-profile-modal';
    const editForm = TP.DOM.qs('#tp-edit-profile-form');
    const editAvatarImg = TP.DOM.qs('#tp-edit-avatar-preview');
    const editAvatarInput = TP.DOM.qs('#tp-edit-avatar-input');
    const editAvatarRemoveBtn = TP.DOM.qs('#tp-edit-avatar-remove-btn');
    const editAvatarErrorEl = TP.DOM.qs('#tp-edit-avatar-error');
    const toggleEditPwdBtn = TP.DOM.qs('#tp-toggle-edit-pwd');
    const editNewPwdInput = TP.DOM.qs('#tp-edit-new-password');
    const editConfirmPwdInput = TP.DOM.qs('#tp-edit-confirm-password');

    let pendingEditAvatar = undefined;

    // Pre-fill email if redirected from registration
    const registeredFlag = TP.DOM.getQueryParam('registered');
    const prefillEmail = TP.DOM.getQueryParam('email');
    if (idInput && prefillEmail) {
      idInput.value = prefillEmail;
    }
    if (registeredFlag === '1' && feedbackBox) {
      feedbackBox.hidden = false;
      feedbackBox.className = 'p-3 rounded mb-3';
      feedbackBox.style.background = 'var(--tp-success-soft)';
      feedbackBox.style.color = 'var(--tp-success)';
      feedbackBox.innerHTML = '<strong>✓ Đăng ký tài khoản thành công!</strong> Vui lòng nhập mật khẩu để đăng nhập vào hệ thống.';
    }

    const openEditProfileModal = () => {
      const session = TP.AuthService.getCurrentSession();
      if (!session || !editForm) return;
      pendingEditAvatar = undefined;
      if (editAvatarImg) {
        editAvatarImg.src = TP.AuthService.getUserAvatar(session);
      }
      if (editAvatarRemoveBtn) {
        editAvatarRemoveBtn.hidden = !session.avatar;
      }
      if (editAvatarErrorEl) editAvatarErrorEl.textContent = '';

      if (editForm.elements.fullName) editForm.elements.fullName.value = session.fullName || '';
      if (editForm.elements.phone) editForm.elements.phone.value = session.phone || '';
      if (editForm.elements.email) editForm.elements.email.value = session.email || '';
      if (editForm.elements.newPassword) editForm.elements.newPassword.value = '';
      if (editForm.elements.confirmNewPassword) editForm.elements.confirmNewPassword.value = '';

      ['fullName', 'phone', 'email', 'newPassword', 'confirmNewPassword'].forEach((f) => {
        const inp = editForm.elements[f];
        const err = TP.DOM.qs(`[data-edit-error-for="${f}"]`, editForm);
        if (inp) inp.classList.remove('is-invalid');
        if (err) err.textContent = '';
      });

      TP.Modal.open(editModalId);
    };

    const renderViewByAuthState = () => {
      const session = TP.AuthService.getCurrentSession();
      if (!session) {
        if (guestView) {
          guestView.hidden = false;
          guestView.style.display = '';
        }
        if (profileView) {
          profileView.hidden = true;
          profileView.style.display = 'none';
          profileView.innerHTML = '';
        }
        if (bcCurrent) bcCurrent.textContent = 'Đăng nhập tài khoản';
        return;
      }

      // Logged-in state: Hide login form completely, show modern Personal Account Profile
      if (guestView) {
        guestView.hidden = true;
        guestView.style.display = 'none';
      }
      if (bcCurrent) bcCurrent.textContent = 'Thông tin tài khoản của tôi';
      if (!profileView) return;

      const avatarSrc = TP.AuthService.getUserAvatar(session);
      const userOrders = TP.OrderService.getOrders();
      const orderCount = userOrders.length;
      const purchasedProductCount = userOrders.reduce((sum, ord) => {
        const items = Array.isArray(ord && ord.items) ? ord.items : [];
        const qty = items.reduce((s, it) => s + (Number(it && it.quantity) || 1), 0);
        return sum + (qty || (items.length ? items.length : 0));
      }, 0);

      profileView.hidden = false;
      profileView.style.display = 'block';
      profileView.innerHTML = `
        <section class="tp-profile-dashboard" aria-label="Hồ sơ tài khoản thành viên">
          <div class="tp-profile-banner">
            <div>
              <span class="tp-badge tp-badge-new mb-1" style="background:rgba(255,255,255,0.2);color:#FFF;">THÀNH VIÊN CHÍNH THỨC AURIX MOBILE</span>
              <h1 class="tp-h2 text-white mb-0" style="color:#FFFFFF;">Thông tin Tài khoản của tôi</h1>
            </div>
            <button type="button" id="tp-open-edit-profile-btn" class="tp-btn" style="background:#FFFFFF;color:var(--tp-primary);font-weight:700;">
              ✏️ Chỉnh sửa thông tin &amp; Mật khẩu
            </button>
          </div>

          <div class="tp-profile-body">
            <!-- Left Column: Circular Avatar & Direct Quick Photo Picker -->
            <div class="tp-profile-avatar-card">
              <div class="tp-profile-avatar-frame" id="tp-profile-avatar-click-frame" style="cursor:pointer;" title="Bấm để chọn ảnh đại diện mới">
                <img src="${TP.DOM.escapeHtml(avatarSrc)}" alt="${TP.DOM.escapeHtml(session.fullName)}" class="tp-profile-avatar-img" id="tp-profile-main-avatar">
              </div>
              <h2 class="tp-h3 mb-1" style="font-size:1.12rem;">${TP.DOM.escapeHtml(session.fullName)}</h2>
              <div class="tp-caption mb-3" style="color:var(--tp-primary);font-weight:700;">${TP.DOM.escapeHtml(session.role || 'Thành viên AURIX Member')}</div>
              <input type="file" id="tp-quick-avatar-file-input" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden>
              <button type="button" id="tp-quick-change-avatar-btn" class="tp-btn tp-btn-secondary tp-btn-sm w-100">
                📷 Đổi ảnh đại diện
              </button>
            </div>

            <!-- Right Column: Account Details & Streamlined Actions -->
            <div>
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h2 class="tp-h3 mb-0">Thông tin cá nhân đã xác thực</h2>
                <span class="tp-badge tp-badge-instock">✓ Đang hoạt động</span>
              </div>

              <div class="tp-profile-info-grid">
                <div class="tp-profile-info-item">
                  <div class="tp-profile-info-label">Họ và tên</div>
                  <div class="tp-profile-info-value">${TP.DOM.escapeHtml(session.fullName)}</div>
                </div>
                <div class="tp-profile-info-item">
                  <div class="tp-profile-info-label">Địa chỉ Email</div>
                  <div class="tp-profile-info-value">${TP.DOM.escapeHtml(session.email)}</div>
                </div>
                <div class="tp-profile-info-item">
                  <div class="tp-profile-info-label">Số điện thoại</div>
                  <div class="tp-profile-info-value">${TP.DOM.escapeHtml(session.phone || 'Chưa cập nhật')}</div>
                </div>
                <div class="tp-profile-info-item">
                  <div class="tp-profile-info-label">Đã mua</div>
                  <div class="tp-profile-info-value">Đã mua: ${purchasedProductCount} sản phẩm</div>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 pt-2">
                <a href="donhang.html" class="tp-btn tp-btn-primary">
                  📦 Đơn hàng của tôi (${orderCount})
                </a>
                <a href="sanpham.html" class="tp-btn tp-btn-secondary">
                  🛍️ Tiếp tục mua sắm →
                </a>
              </div>
            </div>
          </div>
        </section>
      `;

      const editBtn1 = TP.DOM.qs('#tp-open-edit-profile-btn');
      const quickAvatarBtn = TP.DOM.qs('#tp-quick-change-avatar-btn');
      const quickAvatarFrame = TP.DOM.qs('#tp-profile-avatar-click-frame');
      const quickAvatarInput = TP.DOM.qs('#tp-quick-avatar-file-input');

      if (editBtn1) editBtn1.onclick = openEditProfileModal;

      const triggerQuickAvatarPicker = () => {
        if (quickAvatarInput) quickAvatarInput.click();
      };
      if (quickAvatarBtn) quickAvatarBtn.onclick = triggerQuickAvatarPicker;
      if (quickAvatarFrame) quickAvatarFrame.onclick = triggerQuickAvatarPicker;

      if (quickAvatarInput) {
        quickAvatarInput.onchange = async () => {
          const file = quickAvatarInput.files && quickAvatarInput.files[0];
          if (!file) return;
          const res = await TP.AuthService.compressAvatarFile(file);
          if (!res.ok) {
            if (TP.Toast) TP.Toast.show(res.message || 'Không thể tải ảnh đại diện này.', 'error');
            quickAvatarInput.value = '';
            return;
          }
          const updateRes = TP.AuthService.updateProfile({ avatar: res.dataUrl });
          quickAvatarInput.value = '';
          if (!updateRes.ok) {
            if (TP.Toast) TP.Toast.show(updateRes.message || 'Không thể lưu ảnh đại diện.', 'error');
            return;
          }
          if (editAvatarImg) editAvatarImg.src = res.dataUrl;
          if (TP.Toast) TP.Toast.show('Đã cập nhật ảnh đại diện thành công!', 'success');
        };
      }
    };

    renderViewByAuthState();
    TP.Events.on('auth:changed', renderViewByAuthState);
    TP.Events.on('cart:updated', () => {
      if (TP.AuthService.isLoggedIn()) renderViewByAuthState();
    });

    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        togglePwdBtn.textContent = isPwd ? 'Ẩn' : 'Hiện';
      });
    }

    if (toggleEditPwdBtn && editNewPwdInput && editConfirmPwdInput) {
      toggleEditPwdBtn.addEventListener('click', () => {
        const isPwd = editNewPwdInput.type === 'password';
        editNewPwdInput.type = isPwd ? 'text' : 'password';
        editConfirmPwdInput.type = isPwd ? 'text' : 'password';
        toggleEditPwdBtn.textContent = isPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
      });
    }

    if (editAvatarInput) {
      editAvatarInput.addEventListener('change', async () => {
        const file = editAvatarInput.files && editAvatarInput.files[0];
        if (!file) return;
        if (editAvatarErrorEl) editAvatarErrorEl.textContent = '';
        const res = await TP.AuthService.compressAvatarFile(file);
        if (!res.ok) {
          if (editAvatarErrorEl) editAvatarErrorEl.textContent = res.message;
          editAvatarInput.value = '';
          return;
        }
        pendingEditAvatar = res.dataUrl;
        if (editAvatarImg) editAvatarImg.src = res.dataUrl;
        if (editAvatarRemoveBtn) editAvatarRemoveBtn.hidden = false;
      });
    }

    if (editAvatarRemoveBtn) {
      editAvatarRemoveBtn.addEventListener('click', () => {
        pendingEditAvatar = null;
        if (editAvatarInput) editAvatarInput.value = '';
        if (editAvatarImg) editAvatarImg.src = TP.AuthService.getDefaultAvatar();
        editAvatarRemoveBtn.hidden = true;
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ['fullName', 'phone', 'email', 'newPassword', 'confirmNewPassword'].forEach((f) => {
          const inp = editForm.elements[f];
          const err = TP.DOM.qs(`[data-edit-error-for="${f}"]`, editForm);
          if (inp) inp.classList.remove('is-invalid');
          if (err) err.textContent = '';
        });

        const payload = {
          fullName: editForm.elements.fullName ? editForm.elements.fullName.value : '',
          phone: editForm.elements.phone ? editForm.elements.phone.value : '',
          email: editForm.elements.email ? editForm.elements.email.value : '',
          newPassword: editForm.elements.newPassword ? editForm.elements.newPassword.value : '',
          confirmNewPassword: editForm.elements.confirmNewPassword ? editForm.elements.confirmNewPassword.value : '',
          avatar: pendingEditAvatar
        };

        const res = TP.AuthService.updateProfile(payload);
        if (!res.ok) {
          if (res.errors) {
            Object.entries(res.errors).forEach(([k, msg]) => {
              const inp = editForm.elements[k];
              const err = TP.DOM.qs(`[data-edit-error-for="${k}"]`, editForm);
              if (inp) inp.classList.add('is-invalid');
              if (err) err.textContent = msg;
            });
          }
          TP.Toast.show(res.message || 'Vui lòng kiểm tra lại thông tin chỉnh sửa.', 'error');
          return;
        }

        TP.Modal.close(editModalId);
        renderViewByAuthState();
        TP.Toast.show('Đã cập nhật thông tin tài khoản thành công!', 'success');
      });
    }

    if (quickDemoBtn && idInput && pwdInput) {
      quickDemoBtn.addEventListener('click', () => {
        idInput.value = 'truongdinhkhoi123@gmail.com';
        pwdInput.value = 'Dinhkhoi99@';
        TP.Toast.show('Đã điền tài khoản mẫu: Trương Đình Khôi (truongdinhkhoi123@gmail.com · 0941054053)', 'info');
      });
    }

    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        TP.Modal.open('tp-forgot-modal');
      });
    }

    const setFieldError = (fieldName, msg) => {
      if (!form) return;
      const input = TP.DOM.qs(`[name="${fieldName}"]`, form);
      const errEl = TP.DOM.qs(`[data-error-for="${fieldName}"]`, form);
      if (input) {
        input.classList.toggle('is-invalid', Boolean(msg));
        input.setAttribute('aria-invalid', String(Boolean(msg)));
      }
      if (errEl) errEl.textContent = msg || '';
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        setFieldError('identifier', '');
        setFieldError('password', '');

        const idVal = idInput ? idInput.value : '';
        const pwdVal = pwdInput ? pwdInput.value : '';

        const res = TP.AuthService.login(idVal, pwdVal);
        if (!res.ok) {
          if (res.errors) {
            Object.entries(res.errors).forEach(([k, msg]) => setFieldError(k, msg));
          }
          if (feedbackBox) {
            feedbackBox.hidden = false;
            feedbackBox.className = 'p-3 rounded mb-3';
            feedbackBox.style.background = 'var(--tp-error-soft)';
            feedbackBox.style.color = 'var(--tp-error)';
            feedbackBox.textContent = res.message;
          }
          if (idInput) idInput.setAttribute('aria-invalid', 'true');
          return;
        }

        if (idInput) idInput.setAttribute('aria-invalid', 'false');
        if (feedbackBox) {
          feedbackBox.hidden = false;
          feedbackBox.className = 'p-3 rounded mb-3';
          feedbackBox.style.background = 'var(--tp-success-soft)';
          feedbackBox.style.color = 'var(--tp-success)';
          feedbackBox.innerHTML = `<strong>✓ Đăng nhập thành công!</strong> Chào mừng <strong>${TP.DOM.escapeHtml(res.user.fullName)}</strong> quay trở lại AURIX MOBILE. Đang chuyển về Trang chủ...`;
        }

        TP.StorageService.setSession(FLASH_TOAST_KEY, {
          message: `✓ Đăng nhập thành công! Xin chào ${res.user.fullName}.`,
          type: 'success'
        });
        TP.Toast.show(`Đăng nhập thành công! Xin chào ${res.user.fullName}!`, 'success');

        const targetUrl = TP.AuthService.consumeReturnUrl('index.html');
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 420);
      });
    }
  });
})(window);
