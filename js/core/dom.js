/**
 * TechPhone — Core DOM & Formatting Utilities
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.DOM = {
    qs(selector, scope = document) {
      return (scope || document).querySelector(selector);
    },
    qsa(selector, scope = document) {
      return Array.from((scope || document).querySelectorAll(selector));
    },
    formatPrice(amount) {
      const num = Number(amount);
      if (!Number.isFinite(num)) return '0đ';
      return num.toLocaleString('vi-VN') + 'đ';
    },
    escapeHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    getQueryParam(name) {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
      } catch (e) {
        return null;
      }
    },
    setQueryParam(name, value) {
      try {
        const url = new URL(window.location.href);
        if (value === null || value === undefined || value === '') {
          url.searchParams.delete(name);
        } else {
          url.searchParams.set(name, value);
        }
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        // Ignore on restricted file:// environments
      }
    }
  };
})(window);
