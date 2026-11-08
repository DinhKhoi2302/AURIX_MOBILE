/**
 * AURIX MOBILE — User-Scoped Cart with Per-Item Selection & Independent "Buy Now" Checkout Service
 * - Each cart item has a `selected` boolean (default: true when added).
 * - Order summary totals (subtotal, discount, shipping, grandTotal) are calculated STRICTLY from selected items (`selected === true`).
 * - Proceeding to checkout from Cart passes ONLY selected items to `dathang.html`, and completing the order removes ONLY the ordered items while keeping unselected items intact.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  function getActiveUserId() {
    if (!TP.AuthService || typeof TP.AuthService.getCurrentSession !== 'function') return null;
    const s = TP.AuthService.getCurrentSession();
    return s && s.id ? String(s.id) : null;
  }

  function hydrateCartEntries(rawItems) {
    if (!Array.isArray(rawItems)) return [];
    const validItems = [];
    rawItems.forEach((entry) => {
      if (!entry || !entry.productId) return;
      const product = TP.ProductService.getById(entry.productId);
      if (!product) return;
      const qty = Math.max(1, Math.min(20, parseInt(entry.quantity, 10) || 1));
      const matchedVar = TP.ProductService.findMatchingVariant(product, entry.color, entry.storage);
      const color = entry.color || (matchedVar ? matchedVar.color : 'Tiêu chuẩn');
      const storage = entry.storage || (matchedVar ? matchedVar.storage : 'Tiêu chuẩn');
      const sku = entry.sku || (matchedVar ? matchedVar.sku : `AUR-${product.id.toUpperCase()}`);
      const rawPrice = TP.ProductService.calculateVariantPrice(product, storage, color);
      if (typeof rawPrice !== 'number' || rawPrice <= 0) return;

      const colorImgs = TP.ProductService.getGalleryForColor(product, color);
      const thumb = (colorImgs && colorImgs[0]) || (matchedVar && matchedVar.images && matchedVar.images[0]) || product.thumbnail;

      validItems.push({
        key: entry.key || `${product.id}__${color}__${storage}`,
        productId: product.id,
        sku,
        name: product.name,
        brand: product.brand,
        thumbnail: thumb,
        color,
        storage,
        unitPrice: rawPrice,
        originalPrice: (matchedVar && matchedVar.originalPrice) || product.originalPrice || rawPrice,
        quantity: qty,
        selected: entry.selected !== false
      });
    });
    return validItems;
  }

  function computeSummaryFromItems(allItems, couponCode, deliveryOption = 'standard', useOnlySelected = true) {
    const itemCount = allItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedItems = useOnlySelected
      ? allItems.filter((item) => item.selected !== false)
      : allItems.slice();

    const selectedItemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedDistinctCount = selectedItems.length;
    const allSelected = allItems.length > 0 && selectedItems.length === allItems.length;
    const someSelected = selectedItems.length > 0 && selectedItems.length < allItems.length;

    const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    let discount = 0;
    let appliedCoupon = null;
    const cleanCode = String(couponCode || '').trim().toUpperCase();
    if (selectedItemCount > 0 && cleanCode && TP.CONFIG.COUPONS && TP.CONFIG.COUPONS[cleanCode]) {
      const c = TP.CONFIG.COUPONS[cleanCode];
      if (subtotal >= c.minOrder) {
        appliedCoupon = c;
        if (c.discountAmount) {
          discount = c.discountAmount;
        } else if (c.discountPercent) {
          discount = Math.min(c.maxDiscount || Infinity, Math.round((subtotal * c.discountPercent) / 100));
        }
      }
    }

    let shipping = 0;
    if (selectedItemCount > 0) {
      if (deliveryOption === 'express') {
        shipping = TP.CONFIG.EXPRESS_SHIPPING_FEE;
      } else {
        shipping = subtotal >= TP.CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : TP.CONFIG.DEFAULT_SHIPPING_FEE;
      }
    }

    const grandTotal = selectedItemCount > 0 ? Math.max(0, subtotal - discount + shipping) : 0;

    return {
      items: allItems,
      selectedItems,
      itemCount,
      selectedItemCount,
      selectedDistinctCount,
      allSelected,
      someSelected,
      subtotal,
      discount,
      shipping,
      grandTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : '',
      couponLabel: appliedCoupon ? appliedCoupon.label : ''
    };
  }

  TP.CartService = {
    _readAllUserCarts() {
      const raw = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.CART, { byUser: {} });
      if (!raw || typeof raw !== 'object') return { byUser: {} };
      if (raw.byUser && typeof raw.byUser === 'object') {
        return raw;
      }
      if (Array.isArray(raw.items)) {
        return {
          byUser: {
            'usr-default-01': {
              items: raw.items,
              couponCode: raw.couponCode || ''
            }
          }
        };
      }
      return { byUser: {} };
    },
    getCartState() {
      const userId = getActiveUserId();
      if (!userId) {
        return { items: [], couponCode: '' };
      }
      const store = this._readAllUserCarts();
      const userCart = (store.byUser && store.byUser[userId]) || { items: [], couponCode: '' };
      const validItems = hydrateCartEntries(userCart.items);
      return {
        items: validItems,
        couponCode: String(userCart.couponCode || '').toUpperCase()
      };
    },
    saveCartState(state) {
      const userId = getActiveUserId();
      if (!userId) return;
      const store = this._readAllUserCarts();
      store.byUser = store.byUser || {};
      store.byUser[userId] = {
        items: (state.items || []).map((i) => ({
          key: i.key || `${i.productId}__${i.color}__${i.storage}`,
          productId: i.productId,
          sku: i.sku,
          color: i.color,
          storage: i.storage,
          quantity: i.quantity,
          selected: i.selected !== false
        })),
        couponCode: state.couponCode || '',
        updatedAt: new Date().toISOString()
      };
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.CART, store);
      TP.Events.emit('cart:updated', this.getSummary());
    },
    addItem(productId, options = {}) {
      if (!TP.AuthService.isLoggedIn()) {
        TP.AuthService.requireAuth({
          returnUrl: options.returnUrl || ((window.location.pathname.split('/').pop() || 'index.html') + (window.location.search || '')),
          message: 'Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.'
        });
        return null;
      }
      const product = TP.ProductService.getById(productId);
      if (!product) return null;
      const matchedVar = TP.ProductService.findMatchingVariant(product, options.color, options.storage);
      const color = options.color || (matchedVar ? matchedVar.color : 'Tiêu chuẩn');
      const storage = options.storage || (matchedVar ? matchedVar.storage : 'Tiêu chuẩn');
      const rawPrice = TP.ProductService.calculateVariantPrice(product, storage, color);
      if (typeof rawPrice !== 'number' || rawPrice <= 0) {
        return null;
      }

      const state = this.getCartState();
      const sku = options.sku || (matchedVar ? matchedVar.sku : `AUR-${product.id.toUpperCase()}`);
      const addQty = Math.max(1, parseInt(options.quantity, 10) || 1);
      const key = `${product.id}__${color}__${storage}`;

      const existing = state.items.find((item) => item.key === key);
      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + addQty);
        existing.selected = options.selected !== undefined ? Boolean(options.selected) : true;
      } else {
        state.items.push({
          key,
          productId: product.id,
          sku,
          color,
          storage,
          quantity: addQty,
          selected: options.selected !== undefined ? Boolean(options.selected) : true
        });
      }
      this.saveCartState(state);
      return this.getSummary();
    },
    toggleItemSelection(itemKey, forceSelected) {
      if (!TP.AuthService.isLoggedIn()) return this.getSummary();
      const state = this.getCartState();
      const target = state.items.find((item) => item.key === itemKey);
      if (target) {
        target.selected = forceSelected !== undefined ? Boolean(forceSelected) : !target.selected;
        this.saveCartState(state);
      }
      return this.getSummary();
    },
    setAllSelection(selectedBool) {
      if (!TP.AuthService.isLoggedIn()) return this.getSummary();
      const state = this.getCartState();
      const flag = Boolean(selectedBool);
      state.items.forEach((item) => {
        item.selected = flag;
      });
      this.saveCartState(state);
      return this.getSummary();
    },
    removeItemsByKeys(keysArray) {
      if (!TP.AuthService.isLoggedIn()) return this.getSummary();
      if (!Array.isArray(keysArray) || !keysArray.length) return this.getSummary();
      const removeSet = new Set(keysArray);
      const state = this.getCartState();
      state.items = state.items.filter((item) => !removeSet.has(item.key));
      if (!state.items.length) {
        state.couponCode = '';
      }
      this.saveCartState(state);
      return this.getSummary();
    },
    startBuyNowCheckout(productId, options = {}) {
      const detailUrl = `${(TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.PRODUCT_DETAIL) || 'chitietsanpham.html'}?id=${encodeURIComponent(productId)}`;
      if (!TP.AuthService.isLoggedIn()) {
        TP.AuthService.requireAuth({
          returnUrl: detailUrl,
          message: 'Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.'
        });
        return { ok: false, reason: 'unauthenticated' };
      }
      const product = TP.ProductService.getById(productId);
      if (!product) return { ok: false, reason: 'not_found' };
      const matchedVar = TP.ProductService.findMatchingVariant(product, options.color, options.storage);
      const color = options.color || (matchedVar ? matchedVar.color : 'Tiêu chuẩn');
      const storage = options.storage || (matchedVar ? matchedVar.storage : 'Tiêu chuẩn');
      const rawPrice = TP.ProductService.calculateVariantPrice(product, storage, color);
      if (typeof rawPrice !== 'number' || rawPrice <= 0) {
        return { ok: false, reason: 'invalid_price' };
      }

      const qty = Math.max(1, Math.min(20, parseInt(options.quantity, 10) || 1));
      const sku = options.sku || (matchedVar ? matchedVar.sku : `AUR-${product.id.toUpperCase()}`);
      const userId = getActiveUserId();
      const intentKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.CHECKOUT_INTENT) || 'aurix_checkout_intent_v1';

      const intentPayload = {
        source: 'buy_now',
        userId,
        couponCode: '',
        idempotencyKey: 'chk-bn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        createdAt: new Date().toISOString(),
        items: [
          {
            key: `${product.id}__${color}__${storage}`,
            productId: product.id,
            sku,
            color,
            storage,
            quantity: qty,
            selected: true
          }
        ]
      };
      TP.StorageService.setSession(intentKey, intentPayload);
      const checkoutRoute = (TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.CHECKOUT) || 'dathang.html';
      return {
        ok: true,
        redirectUrl: `${checkoutRoute}?source=buy_now`
      };
    },
    startCartCheckout() {
      const cartRoute = (TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.CART) || 'giohang.html';
      if (!TP.AuthService.isLoggedIn()) {
        TP.AuthService.requireAuth({
          returnUrl: cartRoute,
          message: 'Bạn cần đăng nhập để tiếp tục mua sắm tại AURIX MOBILE.'
        });
        return { ok: false, reason: 'unauthenticated' };
      }
      const state = this.getCartState();
      if (!state.items.length) {
        return { ok: false, reason: 'empty_cart', message: 'Giỏ hàng của bạn đang trống.' };
      }
      const selectedItems = state.items.filter((i) => i.selected !== false);
      if (!selectedItems.length) {
        return {
          ok: false,
          reason: 'no_selected_items',
          message: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.'
        };
      }
      const userId = getActiveUserId();
      const intentKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.CHECKOUT_INTENT) || 'aurix_checkout_intent_v1';
      TP.StorageService.setSession(intentKey, {
        source: 'cart',
        userId,
        couponCode: state.couponCode || '',
        idempotencyKey: 'chk-cart-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        createdAt: new Date().toISOString(),
        selectedKeys: selectedItems.map((i) => i.key),
        items: selectedItems
      });
      const checkoutRoute = (TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.CHECKOUT) || 'dathang.html';
      return {
        ok: true,
        redirectUrl: checkoutRoute
      };
    },
    getCheckoutIntent() {
      const userId = getActiveUserId();
      if (!userId) return null;
      const intentKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.CHECKOUT_INTENT) || 'aurix_checkout_intent_v1';
      const rawIntent = TP.StorageService.getSession(intentKey, null);
      if (rawIntent && rawIntent.userId === userId) {
        return rawIntent;
      }
      return null;
    },
    clearCheckoutIntent() {
      const intentKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.CHECKOUT_INTENT) || 'aurix_checkout_intent_v1';
      TP.StorageService.removeSession(intentKey);
    },
    getCheckoutSummary(deliveryOption = 'standard', explicitSource = null) {
      const userId = getActiveUserId();
      if (!userId) {
        return Object.assign(computeSummaryFromItems([], '', deliveryOption, false), {
          source: 'cart',
          selectedKeys: [],
          idempotencyKey: null
        });
      }
      const urlSource = TP.DOM && typeof TP.DOM.getQueryParam === 'function' ? TP.DOM.getQueryParam('source') : null;
      const intent = this.getCheckoutIntent();
      const wantBuyNow = (explicitSource === 'buy_now') || (urlSource === 'buy_now') || (explicitSource !== 'cart' && !urlSource && intent && intent.source === 'buy_now');

      if (wantBuyNow && intent && intent.source === 'buy_now' && Array.isArray(intent.items) && intent.items.length) {
        const hydrated = hydrateCartEntries(intent.items);
        const summary = computeSummaryFromItems(hydrated, intent.couponCode || '', deliveryOption, false);
        return Object.assign(summary, {
          source: 'buy_now',
          selectedKeys: hydrated.map((i) => i.key),
          idempotencyKey: intent.idempotencyKey || ('chk-bn-' + Date.now())
        });
      }

      // Cart checkout: use the selected items from CHECKOUT_INTENT if present, or currently selected items in Cart
      const cartState = this.getCartState();
      let targetSelectedItems = cartState.items.filter((i) => i.selected !== false);
      if (intent && intent.source === 'cart' && Array.isArray(intent.selectedKeys) && intent.selectedKeys.length) {
        const keySet = new Set(intent.selectedKeys);
        const fromCartByIntent = cartState.items.filter((i) => keySet.has(i.key));
        if (fromCartByIntent.length) {
          targetSelectedItems = fromCartByIntent;
        } else if (Array.isArray(intent.items) && intent.items.length) {
          targetSelectedItems = hydrateCartEntries(intent.items);
        }
      }

      const summary = computeSummaryFromItems(targetSelectedItems, cartState.couponCode, deliveryOption, false);
      return Object.assign(summary, {
        source: 'cart',
        selectedKeys: targetSelectedItems.map((i) => i.key),
        idempotencyKey: (intent && intent.source === 'cart' && intent.idempotencyKey)
          ? intent.idempotencyKey
          : ('chk-cart-' + userId + '-' + targetSelectedItems.map((i) => `${i.key}:${i.quantity}`).join('|'))
      });
    },
    updateQuantity(itemKey, newQty) {
      if (!TP.AuthService.isLoggedIn()) return this.getSummary();
      const state = this.getCartState();
      const parsed = parseInt(newQty, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return this.removeItem(itemKey);
      }
      const target = state.items.find((item) => item.key === itemKey);
      if (target) {
        target.quantity = Math.min(20, parsed);
        this.saveCartState(state);
      }
      return this.getSummary();
    },
    removeItem(itemKey) {
      if (!TP.AuthService.isLoggedIn()) return this.getSummary();
      const state = this.getCartState();
      state.items = state.items.filter((item) => item.key !== itemKey);
      this.saveCartState(state);
      return this.getSummary();
    },
    applyCoupon(code) {
      if (!TP.AuthService.isLoggedIn()) {
        return { ok: false, message: 'Vui lòng đăng nhập để sử dụng mã giảm giá.' };
      }
      const clean = String(code || '').trim().toUpperCase();
      const state = this.getCartState();
      if (!clean) {
        state.couponCode = '';
        this.saveCartState(state);
        return { ok: true, message: 'Đã gỡ mã giảm giá.' };
      }
      const coupon = TP.CONFIG.COUPONS[clean];
      if (!coupon) {
        return { ok: false, message: 'Mã giảm giá không tồn tại. Thử: AURIX500, WELCOME200 hoặc SVIT10.' };
      }
      const selectedItems = state.items.filter((i) => i.selected !== false);
      if (!selectedItems.length) {
        return { ok: false, message: 'Vui lòng tích chọn ít nhất một sản phẩm trước khi áp dụng mã giảm giá.' };
      }
      const subtotal = selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      if (subtotal < coupon.minOrder) {
        return {
          ok: false,
          message: `Tổng sản phẩm đã chọn cần tối thiểu ${TP.DOM.formatPrice(coupon.minOrder)} để dùng mã ${clean}.`
        };
      }
      state.couponCode = clean;
      this.saveCartState(state);
      return { ok: true, message: `Áp dụng thành công: ${coupon.label}` };
    },
    clearCart() {
      if (!TP.AuthService.isLoggedIn()) return;
      this.saveCartState({ items: [], couponCode: '' });
    },
    getSummary(deliveryOption = 'standard') {
      const state = this.getCartState();
      return computeSummaryFromItems(state.items, state.couponCode, deliveryOption, true);
    }
  };
})(window);
