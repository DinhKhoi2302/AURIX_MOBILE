/**
 * AURIX MOBILE — Shared Footer & Newsletter Subscription Handler
 * Automatically hides the ".tp-newsletter-strip" ("Đăng ký ngay - Nhận ưu đãi đặc biệt!") row
 * once the user has registered/logged in an account or subscribed to the newsletter (Requirement 8).
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.Footer = {
    syncNewsletterVisibility() {
      const isLoggedIn = Boolean(
        TP.AuthService &&
        typeof TP.AuthService.isLoggedIn === 'function' &&
        TP.AuthService.isLoggedIn()
      );
      const list = (TP.StorageService && TP.CONFIG && TP.CONFIG.STORAGE_KEYS)
        ? TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.NEWSLETTER, [])
        : [];
      const isSubscribed = Array.isArray(list) && list.length > 0;
      const shouldHide = isLoggedIn || isSubscribed;

      TP.DOM.qsa('.tp-newsletter-strip').forEach((strip) => {
        strip.hidden = shouldHide;
        strip.style.display = shouldHide ? 'none' : '';
      });
    },

    init() {
      this.syncNewsletterVisibility();

      if (TP.Events && !this._authListenerBound) {
        this._authListenerBound = true;
        TP.Events.on('auth:changed', () => this.syncNewsletterVisibility());
      }

      TP.DOM.qsa('[data-newsletter-form]').forEach((form) => {
        if (form.dataset.bound) return;
        form.dataset.bound = 'true';
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = form.querySelector('input[type="email"]');
          const email = input ? input.value.trim() : '';
          if (!TP.AuthService.REGEX.EMAIL.test(email)) {
            TP.Toast.show('Vui lòng nhập địa chỉ email hợp lệ để nhận ưu đãi!', 'error');
            if (input) input.focus();
            return;
          }
          const list = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.NEWSLETTER, []);
          if (!list.includes(email)) {
            list.push(email);
            TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.NEWSLETTER, list);
          }
          if (input) input.value = '';
          TP.Toast.show('Đăng ký nhận bản tin ưu đãi AURIX MOBILE thành công! Mã giảm 200K: WELCOME200', 'success');
          this.syncNewsletterVisibility();
        });
      });
    }
  };
})(window);
