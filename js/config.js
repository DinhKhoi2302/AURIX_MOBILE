/**
 * AURIX MOBILE — Global Configuration, Vietnamese Routes & Storage Keys
 * Supports both HTTP Server (VS Code Live Server) and local offline execution.
 */
(function (global) {
  'use strict';

  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.CONFIG = {
    APP_NAME: 'AURIX MOBILE',
    TAGLINE: 'AURIX MOBILE',
    VERSION: '4.0.0',
    CURRENCY_LOCALE: 'vi-VN',
    PRODUCTS_PER_PAGE: 12,
    NEWS_PER_PAGE: 6,
    FREE_SHIPPING_THRESHOLD: 5000000,
    DEFAULT_SHIPPING_FEE: 35000,
    EXPRESS_SHIPPING_FEE: 65000,
    ROUTES: {
      HOME: 'index.html',
      PRODUCTS: 'sanpham.html',
      PRODUCT_DETAIL: 'chitietsanpham.html',
      CART: 'donhang.html?tab=cart',
      CHECKOUT: 'dathang.html',
      PAYMENT: 'thanhtoan.html',
      ORDER_SUCCESS: 'dathangthanhcong.html',
      ORDERS: 'donhang.html',
      LOGIN: 'dangnhap.html',
      REGISTER: 'dangky.html',
      NEWS: 'tintuc.html',
      NEWS_DETAIL: 'chitiettintuc.html',
      ABOUT: 'gioithieu.html',
      CONTACT: 'lienhe.html',
      SITEMAP: 'sodotrang.html',
      WARRANTY: 'chinhsachbaohanh.html'
    },
    DATA_PATHS: {
      CATALOG: 'assets/data/catalog.json',
      BRANDS: 'assets/data/brands.json',
      CATEGORIES: 'assets/data/categories.json',
      IMAGE_MANIFEST: 'assets/data/image-manifest.json'
    },
    STORAGE_KEYS: {
      CART: 'aurix_cart_v1',
      WISHLIST: 'aurix_wishlist_v1',
      ORDERS: 'aurix_orders_v1',
      USERS: 'aurix_users_v1',
      SESSION: 'aurix_session_v1',
      LAST_REGISTERED: 'aurix_last_registered_v1',
      SAVED_ADDRESSES: 'aurix_saved_addresses_v1',
      PREFERENCES: 'aurix_preferences_v1',
      CONTACTS: 'aurix_contacts_v1',
      NEWSLETTER: 'aurix_newsletter_v1'
    },
    SESSION_STORAGE_KEYS: {
      ACTIVE_SESSION: 'aurix_active_session_v1',
      RETURN_URL: 'aurix_return_url_v1',
      CHECKOUT_INTENT: 'aurix_checkout_intent_v1',
      LAST_ORDER_ID: 'aurix_last_order_id_v1'
    },
    SIMULATED_BANK_INFO: {
      BANK_NAME: 'Vietcombank — Ngân hàng TMCP Ngoại thương Việt Nam',
      BANK_SHORT: 'Vietcombank',
      ACCOUNT_HOLDER: 'CONG TY TNHH AURIX MOBILE VIET NAM',
      ACCOUNT_NUMBER: '1048889999',
      BRANCH: 'Chi nhánh TP. Hồ Chí Minh'
    },
    COUPONS: {
      AURIX500: { code: 'AURIX500', discountAmount: 500000, minOrder: 10000000, label: 'Giảm 500.000đ cho đơn từ 10 triệu tại AURIX MOBILE' },
      WELCOME200: { code: 'WELCOME200', discountAmount: 200000, minOrder: 3000000, label: 'Giảm 200.000đ chào bạn mới AURIX' },
      SVIT10: { code: 'SVIT10', discountPercent: 5, maxDiscount: 1000000, minOrder: 5000000, label: 'Ưu đãi giảm 5% (tối đa 1 triệu)' }
    }
  };
})(window);
