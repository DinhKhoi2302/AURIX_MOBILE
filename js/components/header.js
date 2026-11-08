/**
 * AURIX MOBILE — Shared Header Synchronizer (Cart Badge, Avatar & Auth Status Dropdown, Flash Toast & Guest Guard)
 * - Displays user's circular avatar on the header and in the account dropdown menu when logged in.
 * - Renders the Logout button strictly ONCE inside the header account dropdown menu.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const PROTECTED_PAGES = new Set([
    'giohang.html',
    'dathang.html',
    'thanhtoan.html',
    'dathangthanhcong.html',
    'donhang.html'
  ]);

  const FLASH_TOAST_KEY = 'aurix_flash_toast_v1';

  TP.Header = {
    closeTimer: null,
    syncCartBadge() {
      const summary = TP.CartService.getSummary();
      TP.DOM.qsa('[data-cart-badge]').forEach((el) => {
        el.textContent = String(summary.itemCount);
        el.classList.remove('tp-badge-bounce');
        void el.offsetWidth;
        el.classList.add('tp-badge-bounce');
      });
      TP.DOM.qsa('[data-cart-text]').forEach((el) => {
        el.textContent = `${summary.itemCount} sản phẩm`;
      });
    },
    ensureAccountDropdown(accountLink) {
      if (!accountLink) return null;
      let wrapper = accountLink.closest('.tp-account-menu-wrap');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'tp-account-menu-wrap';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-flex';
        accountLink.parentNode.insertBefore(wrapper, accountLink);
        wrapper.appendChild(accountLink);
      }
      let dropdown = wrapper.querySelector('#tp-account-dropdown');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'tp-account-dropdown';
        dropdown.className = 'tp-account-dropdown';
        dropdown.hidden = true;
        dropdown.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;min-width:270px;background:#FFFFFF;border:1px solid var(--tp-border);border-radius:16px;box-shadow:0 18px 42px rgba(16,35,71,0.18);padding:0.75rem;z-index:1200;color:var(--tp-text-main);';
        wrapper.appendChild(dropdown);
      }
      return dropdown;
    },
    syncAuthStatus() {
      const session = TP.AuthService.getCurrentSession();
      TP.DOM.qsa('[data-auth-label]').forEach((el) => {
        el.textContent = session ? 'Xin chào,' : 'Đăng nhập';
      });
      TP.DOM.qsa('[data-auth-value]').forEach((el) => {
        el.textContent = session && session.fullName ? session.fullName.trim() : 'Đăng ký';
        if (session && session.fullName) {
          el.setAttribute('title', session.fullName.trim());
        } else {
          el.removeAttribute('title');
        }
      });

      const accountLink = TP.DOM.qs('[data-auth-label]') ? TP.DOM.qs('[data-auth-label]').closest('a.tp-action-item') : null;
      if (accountLink) {
        accountLink.setAttribute('href', 'dangnhap.html');

        const iconSpan = accountLink.querySelector('.tp-action-icon');
        if (iconSpan) {
          if (session && session.avatar) {
            iconSpan.innerHTML = `<img src="${TP.DOM.escapeHtml(session.avatar)}" alt="${TP.DOM.escapeHtml(session.fullName)}" class="tp-header-user-avatar" width="36" height="36">`;
          } else {
            iconSpan.innerHTML = `<img src="assets/icons/ui/user.svg" alt="" width="20" height="20">`;
          }
        }

        const dropdown = this.ensureAccountDropdown(accountLink);
        if (dropdown) {
          if (session) {
            const avatarSrc = TP.AuthService.getUserAvatar(session);
            dropdown.innerHTML = `
              <a href="dangnhap.html" class="d-flex align-items-center gap-2 px-3 py-2 mb-2" style="border-bottom:1px solid var(--tp-border);background:#F4F8FF;border-radius:12px;text-decoration:none;">
                <img src="${TP.DOM.escapeHtml(avatarSrc)}" alt="${TP.DOM.escapeHtml(session.fullName)}" width="44" height="44" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--tp-primary);flex-shrink:0;background:#FFF;">
                <div style="min-width:0;flex:1;">
                  <div class="fw-bold tp-text-navy text-truncate" style="font-size:0.92rem;">${TP.DOM.escapeHtml(session.fullName)}</div>
                  <div class="tp-caption text-truncate" style="color:var(--tp-text-secondary);">${TP.DOM.escapeHtml(session.email)}</div>
                </div>
              </a>
              <div class="d-flex flex-column gap-1">
                <a href="dangnhap.html" class="tp-account-dropdown-link">
                  <span>👤</span><span>Thông tin tài khoản</span>
                </a>
                <a href="giohang.html" class="tp-account-dropdown-link">
                  <span>🛒</span><span>Giỏ hàng của tôi</span>
                </a>
                <a href="donhang.html" class="tp-account-dropdown-link">
                  <span>📦</span><span>Đơn hàng &amp; Lịch sử</span>
                </a>
                <button type="button" id="tp-header-logout-btn" class="d-flex align-items-center gap-2 px-3 py-2 rounded tp-text-small fw-bold w-100 text-start mt-1" style="border:none;border-top:1px solid var(--tp-border);background:#FFF5F5;color:#E53935;cursor:pointer;">
                  <span>🚪</span><span>Đăng xuất</span>
                </button>
              </div>
            `;
            const logoutBtn = dropdown.querySelector('#tp-header-logout-btn');
            if (logoutBtn) {
              logoutBtn.onclick = (e) => {
                e.preventDefault();
                dropdown.hidden = true;
                TP.AuthService.logout();
                if (TP.Toast) TP.Toast.show('Đã đăng xuất tài khoản thành công.', 'info');
                const curPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
                if (PROTECTED_PAGES.has(curPage)) {
                  setTimeout(() => {
                    window.location.href = 'index.html';
                  }, 250);
                }
              };
            }
          } else {
            dropdown.hidden = true;
            dropdown.innerHTML = '';
          }
        }
      }
    },
    bindAccountAndProtectedLinks() {
      if (document.body.dataset.tpHeaderAuthBound) return;
      document.body.dataset.tpHeaderAuthBound = 'true';

      const accountLink = TP.DOM.qs('[data-auth-label]') ? TP.DOM.qs('[data-auth-label]').closest('a.tp-action-item') : null;
      const wrapper = accountLink ? accountLink.closest('.tp-account-menu-wrap') : null;

      if (wrapper) {
        wrapper.addEventListener('mouseenter', () => {
          if (!TP.AuthService.isLoggedIn()) return;
          if (this.closeTimer) clearTimeout(this.closeTimer);
          const dropdown = document.getElementById('tp-account-dropdown');
          if (dropdown) dropdown.hidden = false;
        });
        wrapper.addEventListener('mouseleave', () => {
          if (this.closeTimer) clearTimeout(this.closeTimer);
          this.closeTimer = setTimeout(() => {
            const dropdown = document.getElementById('tp-account-dropdown');
            if (dropdown) dropdown.hidden = true;
          }, 180);
        });
      }

      if (accountLink) {
        accountLink.addEventListener('click', (e) => {
          if (TP.AuthService.isLoggedIn()) {
            const dropdown = document.getElementById('tp-account-dropdown');
            const curPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
            // If dropdown is currently closed on mobile/touch, open it; if already on dangnhap.html, toggle dropdown
            if (dropdown && dropdown.hidden) {
              e.preventDefault();
              dropdown.hidden = false;
            } else if (curPage === 'dangnhap.html' && dropdown) {
              e.preventDefault();
              dropdown.hidden = !dropdown.hidden;
            }
          }
        });
      }

      document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('tp-account-dropdown');
        if (dropdown && !dropdown.hidden && !e.target.closest('.tp-account-menu-wrap')) {
          dropdown.hidden = true;
        }

        // Intercept guest clicks on protected routes (giohang.html, dathang.html, donhang.html, thanhtoan.html)
        const link = e.target.closest('a[href]');
        if (!link) return;
        const rawHref = (link.getAttribute('href') || '').trim();
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
        const targetFile = rawHref.split('?')[0].split('#')[0].split('/').pop().toLowerCase();
        if (PROTECTED_PAGES.has(targetFile) && !TP.AuthService.isLoggedIn()) {
          e.preventDefault();
          TP.AuthService.requireAuth({
            returnUrl: rawHref,
            message: 'Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.'
          });
        }
      });
    },
    consumeFlashToast() {
      const flash = TP.StorageService.getSession(FLASH_TOAST_KEY, null);
      if (flash && flash.message) {
        TP.StorageService.removeSession(FLASH_TOAST_KEY);
        setTimeout(() => {
          if (TP.Toast && typeof TP.Toast.show === 'function') {
            TP.Toast.show(flash.message, flash.type || 'success');
          }
        }, 120);
      }
    },
    initStickyAndProgress() {
      const header = TP.DOM.qs('.tp-header');
      let progressBar = TP.DOM.qs('.tp-scroll-progress');
      if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'tp-scroll-progress';
        document.body.prepend(progressBar);
      }

      const onScroll = () => {
        const y = window.scrollY || window.pageYOffset;
        if (header) {
          header.classList.toggle('is-scrolled', y > 24);
        }
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, Math.max(0, (y / docHeight) * 100)) : 0;
        progressBar.style.width = pct + '%';
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    },
    init() {
      this.syncCartBadge();
      this.syncAuthStatus();
      this.bindAccountAndProtectedLinks();
      this.initStickyAndProgress();
      this.consumeFlashToast();

      TP.Events.on('cart:updated', () => this.syncCartBadge());
      TP.Events.on('auth:changed', () => {
        this.syncAuthStatus();
        this.syncCartBadge();
      });

      TP.DOM.qsa('[data-cart-drawer-trigger]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          if (e.currentTarget.getAttribute('data-drawer-mode') === 'drawer') {
            e.preventDefault();
            if (!TP.AuthService.isLoggedIn()) {
              TP.AuthService.requireAuth({ returnUrl: TP.CONFIG.ROUTES.CART });
              return;
            }
            TP.CartDrawer.open();
          }
        });
      });
    }
  };
})(window);
