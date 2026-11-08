/**
 * AURIX MOBILE — Member Authentication, 5-Field Registration, Avatar Compression & Profile Update Service
 * - Registration requires strictly 5 fields: Họ và tên, Số điện thoại, Email, Mật khẩu, Xác nhận mật khẩu (+ optional Avatar).
 * - Compresses uploaded avatars (JPG, JPEG, PNG, WebP) via HTML5 Canvas into circular-ready square Data URLs stored per user in localStorage.
 * - Supports full profile & password & avatar editing while logged in.
 * - Keeps login session in sessionStorage; logout removes only sessionStorage without deleting localStorage data.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const DEFAULT_AVATAR_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="60" fill="#EBF3FF"/>
        <circle cx="60" cy="45" r="21" fill="#0666F5"/>
        <path d="M24 104c5-20 21-31 36-31s31 11 36 31" fill="#0666F5"/>
      </svg>`
    );

  const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  const ALLOWED_IMAGE_EXTS = /\.(jpe?g|png|webp)$/i;
  const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024; // 8 MB max raw upload before Canvas compression

  TP.AuthService = {
    DEFAULT_AVATAR_SVG,
    REGEX: {
      EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      PHONE_VN: /^0[0-9]{9,10}$/,
      FULLNAME: /^[\p{L}\s'.-]{2,60}$/u
    },
    getDefaultAvatar() {
      return DEFAULT_AVATAR_SVG;
    },
    getUserAvatar(userOrSession) {
      if (userOrSession && typeof userOrSession.avatar === 'string' && userOrSession.avatar.trim()) {
        return userOrSession.avatar.trim();
      }
      return DEFAULT_AVATAR_SVG;
    },
    getAllUsers() {
      const stored = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.USERS, []);
      const customUsers = Array.isArray(stored) ? stored : [];
      const demoUsers = Array.isArray(TP.DEMO_USERS) ? TP.DEMO_USERS : [];
      const mapByEmail = new Map();
      // Load demo users first, then custom/updated users override by email or id
      demoUsers.concat(customUsers).forEach((u) => {
        if (u && u.email) {
          mapByEmail.set(String(u.email).toLowerCase(), u);
        }
      });
      return Array.from(mapByEmail.values());
    },
    getCurrentSession() {
      const sKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.ACTIVE_SESSION) || 'aurix_active_session_v1';
      const session = TP.StorageService.getSession(sKey, null);
      if (!session || !session.id) return null;
      // Sync latest profile fields (e.g. avatar, fullName, phone, email) from localStorage user record if available
      const all = this.getAllUsers();
      const latest = all.find((u) => u && u.id === session.id);
      if (latest) {
        return Object.assign({}, session, {
          fullName: latest.fullName || session.fullName,
          email: latest.email || session.email,
          phone: latest.phone || session.phone,
          avatar: latest.avatar || session.avatar || null,
          role: latest.role || session.role || 'Thành viên AURIX Member'
        });
      }
      return session;
    },
    isLoggedIn() {
      const s = this.getCurrentSession();
      return Boolean(s && s.id);
    },
    saveReturnUrl(url) {
      const rKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.RETURN_URL) || 'aurix_return_url_v1';
      if (!url) return;
      const clean = String(url).trim();
      if (clean && !clean.includes('dangnhap.html') && !clean.includes('dangky.html')) {
        TP.StorageService.setSession(rKey, clean);
      }
    },
    getReturnUrl() {
      const rKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.RETURN_URL) || 'aurix_return_url_v1';
      return TP.StorageService.getSession(rKey, null);
    },
    consumeReturnUrl(defaultUrl) {
      const rKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.RETURN_URL) || 'aurix_return_url_v1';
      const saved = TP.StorageService.getSession(rKey, null);
      TP.StorageService.removeSession(rKey);
      return saved || defaultUrl || (TP.CONFIG.ROUTES ? TP.CONFIG.ROUTES.HOME : 'index.html');
    },
    compressAvatarFile(file) {
      return new Promise((resolve) => {
        if (!file) {
          resolve({ ok: false, message: 'Vui lòng chọn một tệp hình ảnh.' });
          return;
        }
        const mime = String(file.type || '').toLowerCase();
        const name = String(file.name || '');
        if (!ALLOWED_IMAGE_MIMES.has(mime) && !ALLOWED_IMAGE_EXTS.test(name)) {
          resolve({
            ok: false,
            message: 'Định dạng ảnh không hợp lệ. Vui lòng chọn ảnh JPG, JPEG, PNG hoặc WebP.'
          });
          return;
        }
        if (typeof file.size === 'number' && file.size > MAX_RAW_FILE_BYTES) {
          resolve({
            ok: false,
            message: 'Kích thước ảnh quá lớn (tối đa 8MB). Vui lòng chọn ảnh nhỏ hơn.'
          });
          return;
        }

        const reader = new FileReader();
        reader.onerror = () => {
          resolve({ ok: false, message: 'Không thể đọc tệp ảnh đã chọn.' });
        };
        reader.onload = (ev) => {
          const rawDataUrl = ev.target && ev.target.result ? String(ev.target.result) : '';
          if (!rawDataUrl) {
            resolve({ ok: false, message: 'Dữ liệu ảnh trống hoặc không hợp lệ.' });
            return;
          }
          // If running in non-browser test environment without Image/Canvas, return rawDataUrl safely
          if (typeof Image === 'undefined' || typeof document === 'undefined' || !document.createElement) {
            resolve({ ok: true, dataUrl: rawDataUrl });
            return;
          }
          const img = new Image();
          img.onerror = () => {
            resolve({ ok: false, message: 'Tệp hình ảnh bị lỗi hoặc không đúng định dạng.' });
          };
          img.onload = () => {
            try {
              const targetSize = 220;
              const canvas = document.createElement('canvas');
              canvas.width = targetSize;
              canvas.height = targetSize;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve({ ok: true, dataUrl: rawDataUrl });
                return;
              }
              // Center-crop square so circular avatar is never stretched or distorted
              const minSide = Math.min(img.width || targetSize, img.height || targetSize);
              const sx = Math.max(0, Math.floor(((img.width || targetSize) - minSide) / 2));
              const sy = Math.max(0, Math.floor(((img.height || targetSize) - minSide) / 2));
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, targetSize, targetSize);
              ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
              let compressed = canvas.toDataURL('image/webp', 0.82);
              if (!compressed || compressed.length > 90000 || !compressed.startsWith('data:image/')) {
                compressed = canvas.toDataURL('image/jpeg', 0.8);
              }
              resolve({ ok: true, dataUrl: compressed });
            } catch (err) {
              resolve({ ok: true, dataUrl: rawDataUrl });
            }
          };
          img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    generateSampleRegistrationData() {
      const existingEmails = new Set(this.getAllUsers().map((u) => String(u.email || '').toLowerCase()));
      let candidateEmail = 'nguyenvana@aurixmobile.vn';
      let counter = 1;
      while (existingEmails.has(candidateEmail.toLowerCase())) {
        counter += 1;
        candidateEmail = `nguyenvana${counter}@aurixmobile.vn`;
      }
      return {
        fullName: 'Nguyễn Văn A',
        phone: '0912345678',
        email: candidateEmail,
        password: 'Aurix@12345',
        confirmPassword: 'Aurix@12345'
      };
    },
    ensureAuthGuardModal() {
      let modal = document.getElementById('tp-auth-guard-modal');
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'tp-auth-guard-modal';
      modal.className = 'tp-modal-backdrop';
      modal.setAttribute('aria-hidden', 'true');
      const loginHref = (TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.LOGIN) || 'dangnhap.html';
      const regHref = (TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.REGISTER) || 'dangky.html';
      modal.innerHTML = `
        <div class="tp-modal-dialog" style="max-width:460px;text-align:center;padding:2rem 1.75rem;" role="dialog" aria-modal="true" aria-labelledby="tp-auth-guard-title">
          <button type="button" class="tp-modal-close" data-modal-close aria-label="Đóng">✕</button>
          <div class="tp-empty-icon mx-auto mb-3" style="background:rgba(6,102,245,0.1);color:var(--tp-primary);width:64px;height:64px;font-size:1.75rem;display:flex;align-items:center;justify-content:center;border-radius:50%;">🔒</div>
          <span class="tp-badge tp-badge-new mb-2">DÀNH CHO THÀNH VIÊN AURIX</span>
          <h3 id="tp-auth-guard-title" class="tp-h3 mb-2">Yêu cầu đăng nhập tài khoản</h3>
          <p id="tp-auth-guard-msg" class="tp-text-small mb-4" style="color:var(--tp-text-secondary);line-height:1.6;">
            Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.
          </p>
          <div class="d-grid gap-2">
            <a href="${loginHref}" id="tp-auth-guard-login-btn" class="tp-btn tp-btn-primary tp-btn-lg w-100">Đăng nhập ngay</a>
            <a href="${regHref}" id="tp-auth-guard-register-btn" class="tp-btn tp-btn-secondary w-100">Đăng ký tài khoản mới</a>
            <button type="button" class="tp-btn tp-btn-ghost tp-btn-sm mt-1" data-modal-close>Để sau</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('[data-modal-close]')) {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }
      });
      return modal;
    },
    requireAuth(options = {}) {
      if (this.isLoggedIn()) return true;
      const currentRel = (window.location.pathname.split('/').pop() || 'index.html') + (window.location.search || '');
      const returnUrl = options.returnUrl || currentRel;
      this.saveReturnUrl(returnUrl);

      const modal = this.ensureAuthGuardModal();
      const msgEl = modal.querySelector('#tp-auth-guard-msg');
      if (msgEl) {
        msgEl.textContent = options.message || 'Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.';
      }
      if (TP.Modal && typeof TP.Modal.open === 'function') {
        TP.Modal.open('tp-auth-guard-modal');
      } else {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }
      return false;
    },
    evaluatePasswordStrength(password) {
      const pwd = String(password || '');
      let score = 0;
      if (pwd.length >= 8) score += 2;
      if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
      const clamped = Math.min(4, score);
      const labels = ['Rất yếu', 'Yếu', 'Đạt yêu cầu', 'Mạnh', 'Rất mạnh'];
      const colors = ['#E53935', '#E53935', '#0866F5', '#0866F5', '#16A765'];
      return {
        score: clamped,
        percent: pwd.length === 0 ? 0 : Math.max(15, (clamped / 4) * 100),
        label: pwd.length === 0 ? 'Chưa nhập' : (labels[clamped] || 'Rất yếu'),
        color: colors[clamped] || '#E53935'
      };
    },
    register(formData = {}) {
      const fullName = String(formData.fullName || '').trim();
      const email = String(formData.email || '').trim().toLowerCase();
      const phone = String(formData.phone || '').trim().replace(/\s+/g, '');
      const password = String(formData.password || '');
      const confirmPassword = String(formData.confirmPassword || '');
      const avatar = formData.avatar && String(formData.avatar).startsWith('data:image/')
        ? String(formData.avatar)
        : null;

      const errors = {};
      if (!fullName || fullName.length < 2) {
        errors.fullName = 'Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).';
      }
      if (!this.REGEX.PHONE_VN.test(phone)) {
        errors.phone = 'Số điện thoại Việt Nam phải bắt đầu bằng số 0 và gồm 10–11 chữ số.';
      }
      if (!this.REGEX.EMAIL.test(email)) {
        errors.email = 'Địa chỉ email không đúng định dạng (ví dụ: ten@domain.com).';
      }
      if (password.length < 8) {
        errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự trở lên.';
      }
      if (!confirmPassword || password !== confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
      }

      const existing = this.getAllUsers();
      if (!errors.email && existing.some((u) => String(u.email || '').toLowerCase() === email)) {
        errors.email = 'Email này đã được đăng ký tài khoản thành viên.';
      }

      if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
      }

      const derivedUsername = (email.includes('@') ? email.split('@')[0].replace(/[^a-z0-9_.-]/g, '') : '') || ('member_' + Date.now().toString().slice(-5));
      const newUser = {
        id: 'usr-' + Date.now() + '-' + Math.floor(100 + Math.random() * 899),
        fullName,
        email,
        phone,
        username: derivedUsername,
        avatar,
        role: 'Thành viên AURIX Member',
        passwordDigest: TP.hashDemoSecret(password),
        createdAt: new Date().toISOString()
      };

      const customUsers = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.USERS, []);
      const list = Array.isArray(customUsers) ? customUsers : [];
      list.push(newUser);
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.USERS, list);

      const publicSummary = {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        role: newUser.role,
        createdAt: newUser.createdAt
      };
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.LAST_REGISTERED, publicSummary);

      return { ok: true, user: publicSummary };
    },
    login(emailOrIdentifier, password) {
      const idClean = String(emailOrIdentifier || '').trim().toLowerCase();
      const pwd = String(password || '');
      const errors = {};
      if (!idClean) {
        errors.identifier = 'Vui lòng nhập địa chỉ Email đăng nhập.';
      } else if (!this.REGEX.EMAIL.test(idClean)) {
        // Still allow legacy username if an existing test passes it, otherwise validate email format
        const allUsers = this.getAllUsers();
        const matchesLegacyUsername = allUsers.some((u) => String(u.username || '').toLowerCase() === idClean);
        if (!matchesLegacyUsername) {
          errors.identifier = 'Địa chỉ Email không đúng định dạng (ví dụ: ten@domain.com).';
        }
      }
      if (!pwd) {
        errors.password = 'Vui lòng nhập mật khẩu.';
      }
      if (Object.keys(errors).length > 0) {
        return { ok: false, errors, message: errors.identifier || errors.password };
      }

      const digest = TP.hashDemoSecret(pwd);
      const matched = this.getAllUsers().find((u) => {
        const emailMatch = String(u.email || '').toLowerCase() === idClean;
        const userMatch = String(u.username || '').toLowerCase() === idClean;
        const pwdMatch = u.passwordDigest === digest || (u.password && u.password === pwd);
        return (emailMatch || userMatch) && pwdMatch;
      });

      if (!matched) {
        return {
          ok: false,
          message: 'Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại thông tin đăng nhập.'
        };
      }

      const sessionUser = {
        id: matched.id,
        fullName: matched.fullName,
        email: matched.email,
        phone: matched.phone,
        avatar: matched.avatar || null,
        role: matched.role || 'Thành viên AURIX Member',
        createdAt: matched.createdAt || '2026-01-15T08:00:00.000Z',
        loggedInAt: new Date().toISOString()
      };

      const sKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.ACTIVE_SESSION) || 'aurix_active_session_v1';
      TP.StorageService.setSession(sKey, sessionUser);
      TP.Events.emit('auth:changed', sessionUser);
      if (TP.CartService && typeof TP.CartService.getSummary === 'function') {
        TP.Events.emit('cart:updated', TP.CartService.getSummary());
      }
      return { ok: true, user: sessionUser };
    },
    updateProfile(updates = {}) {
      const session = this.getCurrentSession();
      if (!session || !session.id) {
        return { ok: false, message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' };
      }

      const fullName = String(updates.fullName !== undefined ? updates.fullName : session.fullName).trim();
      const phone = String(updates.phone !== undefined ? updates.phone : session.phone).trim().replace(/\s+/g, '');
      const email = String(updates.email !== undefined ? updates.email : session.email).trim().toLowerCase();
      const newPassword = String(updates.newPassword || '');
      const confirmNewPassword = String(updates.confirmNewPassword || '');

      const errors = {};
      if (!fullName || fullName.length < 2) {
        errors.fullName = 'Họ và tên phải có tối thiểu 2 ký tự.';
      }
      if (!this.REGEX.PHONE_VN.test(phone)) {
        errors.phone = 'Số điện thoại Việt Nam phải bắt đầu bằng số 0 và gồm 10–11 chữ số.';
      }
      if (!this.REGEX.EMAIL.test(email)) {
        errors.email = 'Địa chỉ Email không đúng định dạng.';
      }

      const allUsers = this.getAllUsers();
      if (!errors.email && allUsers.some((u) => u.id !== session.id && String(u.email || '').toLowerCase() === email)) {
        errors.email = 'Email này đã được sử dụng bởi một tài khoản khác.';
      }

      if (newPassword) {
        if (newPassword.length < 8) {
          errors.newPassword = 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
        }
        if (newPassword !== confirmNewPassword) {
          errors.confirmNewPassword = 'Xác nhận mật khẩu mới không trùng khớp.';
        }
      }

      if (Object.keys(errors).length > 0) {
        return { ok: false, errors, message: 'Vui lòng kiểm tra lại các thông tin cần chỉnh sửa.' };
      }

      const stored = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.USERS, []);
      const customList = Array.isArray(stored) ? stored.slice() : [];
      const baseUser = allUsers.find((u) => u.id === session.id) || session;

      const nextAvatar = updates.avatar === undefined
        ? (baseUser.avatar || null)
        : (updates.avatar && String(updates.avatar).startsWith('data:image/') ? String(updates.avatar) : null);

      const updatedUserRecord = Object.assign({}, baseUser, {
        id: session.id,
        fullName,
        phone,
        email,
        avatar: nextAvatar,
        passwordDigest: newPassword ? TP.hashDemoSecret(newPassword) : baseUser.passwordDigest,
        updatedAt: new Date().toISOString()
      });

      const existingIdx = customList.findIndex((u) => u && u.id === session.id);
      if (existingIdx >= 0) {
        customList[existingIdx] = updatedUserRecord;
      } else {
        customList.push(updatedUserRecord);
      }
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.USERS, customList);

      const updatedSession = Object.assign({}, session, {
        fullName: updatedUserRecord.fullName,
        phone: updatedUserRecord.phone,
        email: updatedUserRecord.email,
        avatar: updatedUserRecord.avatar
      });
      const sKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.ACTIVE_SESSION) || 'aurix_active_session_v1';
      TP.StorageService.setSession(sKey, updatedSession);
      TP.Events.emit('auth:changed', updatedSession);

      return { ok: true, user: updatedSession };
    },
    logout() {
      const sKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.ACTIVE_SESSION) || 'aurix_active_session_v1';
      const cKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.CHECKOUT_INTENT) || 'aurix_checkout_intent_v1';
      TP.StorageService.removeSession(sKey);
      TP.StorageService.removeSession(cKey);
      TP.Events.emit('auth:changed', null);
      TP.Events.emit('cart:updated', {
        items: [],
        selectedItems: [],
        itemCount: 0,
        selectedItemCount: 0,
        selectedDistinctCount: 0,
        allSelected: false,
        someSelected: false,
        subtotal: 0,
        discount: 0,
        shipping: 0,
        grandTotal: 0
      });
    },
    getSavedAddress() {
      const session = this.getCurrentSession();
      if (!session) return null;
      const map = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.SAVED_ADDRESSES, {});
      return (map && typeof map === 'object' && map[session.id]) ? map[session.id] : null;
    },
    saveUserAddress(addrObj) {
      const session = this.getCurrentSession();
      if (!session || !addrObj) return;
      const map = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.SAVED_ADDRESSES, {});
      const nextMap = (map && typeof map === 'object' && !Array.isArray(map)) ? map : {};
      nextMap[session.id] = Object.assign({}, addrObj, { updatedAt: new Date().toISOString() });
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.SAVED_ADDRESSES, nextMap);
    }
  };
})(window);
