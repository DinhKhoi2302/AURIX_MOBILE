/** AURIX MOBILE — Orders, simulated bank payments & partial cart removal on checkout. */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.OrderService = {
    _getAllOrdersRaw() {
      const list = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.ORDERS, []);
      return Array.isArray(list) ? list : [];
    },
    _saveAllOrdersRaw(list) {
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.ORDERS, list);
    },
    getOrders() {
      const session = TP.AuthService.getCurrentSession();
      if (!session || !session.id) return [];
      const all = this._getAllOrdersRaw();
      let mutated = false;
      all.forEach((o) => {
        if (!o) return;
        const cleanPay = String(o.paymentStatus || '').replace(/\s*\(mô phỏng\)/gi, '').trim();
        const normPay = cleanPay === 'Đã thanh toán' ? 'Đã thanh toán' : 'Chưa thanh toán (COD)';
        if (o.paymentStatus !== normPay) {
          o.paymentStatus = normPay;
          mutated = true;
        }
        if (o.orderStatus === 'Chờ thanh toán' || o.status === 'Chờ thanh toán') {
          o.orderStatus = 'Chờ xác nhận';
          o.status = 'Chờ xác nhận';
          mutated = true;
        }
      });
      if (mutated) this._saveAllOrdersRaw(all);
      return all
        .filter((o) => o && o.userId === session.id)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    },
    getOrderById(orderId) {
      if (!orderId) return null;
      const cleanId = String(orderId).trim();
      return this.getOrders().find((o) => o.orderId === cleanId) || null;
    },
    reorder(orderId) {
      const order = this.getOrderById(orderId);
      if (!order || !order.items.length) {
        return { ok: false, message: 'Không tìm thấy sản phẩm trong đơn hàng.' };
      }
      const cart = TP.CartService;
      const before = cart.getSummary().itemCount;
      for (const item of order.items) {
        const product = TP.ProductService.getById(item.productId);
        if (!product) continue;
        cart.addItem(item.productId, {
          sku: item.sku,
          color: item.color,
          storage: item.storage,
          quantity: Math.min(item.quantity, 20),
          selected: true
        });
      }
      const added = cart.getSummary().itemCount - before;
      return added > 0
        ? { ok: true, message: `Đã thêm ${added} sản phẩm vào giỏ hàng.` }
        : { ok: false, message: 'Giỏ hàng đã đủ số lượng hoặc sản phẩm không còn khả dụng.' };
    },
    getLastOrder() {
      const queryId = TP.DOM && typeof TP.DOM.getQueryParam === 'function' ? TP.DOM.getQueryParam('orderId') : null;
      if (queryId) {
        const byQuery = this.getOrderById(queryId);
        if (byQuery) return byQuery;
      }
      const lKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.LAST_ORDER_ID) || 'aurix_last_order_id_v1';
      const lastId = TP.StorageService.getSession(lKey, null);
      if (lastId) {
        const bySession = this.getOrderById(lastId);
        if (bySession) return bySession;
      }
      const userOrders = this.getOrders();
      return userOrders.length ? userOrders[0] : null;
    },
    setLastOrderId(orderId) {
      const lKey = (TP.CONFIG.SESSION_STORAGE_KEYS && TP.CONFIG.SESSION_STORAGE_KEYS.LAST_ORDER_ID) || 'aurix_last_order_id_v1';
      if (orderId) {
        TP.StorageService.setSession(lKey, String(orderId));
      } else {
        TP.StorageService.removeSession(lKey);
      }
    },
    validateCheckoutForm(data) {
      const errors = {};
      const fullNameClean = String(data.fullName || '').trim().replace(/\s+/g, ' ');
      if (!TP.AuthService.REGEX.FULLNAME.test(fullNameClean)) {
        errors.fullName = 'Họ và tên người nhận phải gồm ít nhất 2 từ, chỉ chứa chữ cái (VD: Trương Đình Khôi).';
      }
      const phoneClean = String(data.phone || '').trim().replace(/\s+/g, '');
      if (!TP.AuthService.REGEX.PHONE_VN.test(phoneClean)) {
        errors.phone = 'Số điện thoại nhận hàng không hợp lệ (bắt đầu bằng 0, 10–11 số).';
      }
      const emailClean = String(data.email || '').trim();
      if (emailClean && !TP.AuthService.REGEX.EMAIL.test(emailClean)) {
        errors.email = 'Email nhận thông tin đơn hàng không đúng định dạng.';
      }
      if (!data.city || !String(data.city).trim()) {
        errors.city = 'Vui lòng chọn Tỉnh / Thành phố.';
      }
      if (data.district !== undefined && !String(data.district).trim()) {
        errors.district = 'Vui lòng nhập Quận / Huyện.';
      }
      if (data.ward !== undefined && !String(data.ward).trim()) {
        errors.ward = 'Vui lòng nhập Phường / Xã.';
      }
      if (!data.address || String(data.address).trim().length < 4) {
        errors.address = 'Vui lòng nhập địa chỉ giao hàng cụ thể (số nhà, tên đường).';
      }
      return {
        ok: Object.keys(errors).length === 0,
        errors
      };
    },
    createOrder(customerData = {}) {
      const session = TP.AuthService.getCurrentSession();
      if (!session || !session.id) {
        TP.AuthService.requireAuth({
          returnUrl: (TP.CONFIG.ROUTES && TP.CONFIG.ROUTES.CHECKOUT) || 'dathang.html'
        });
        return { ok: false, message: 'Bạn cần đăng nhập để đặt hàng tại AURIX MOBILE.' };
      }

      const deliveryMethod = customerData.deliveryMethod || 'standard';
      const checkoutSummary = TP.CartService.getCheckoutSummary(deliveryMethod, customerData.source || null);
      if (!checkoutSummary.items || !checkoutSummary.items.length) {
        return { ok: false, message: 'Không có sản phẩm nào được chọn để đặt hàng. Vui lòng chọn ít nhất một sản phẩm.' };
      }

      const validation = this.validateCheckoutForm(customerData);
      if (!validation.ok) {
        return { ok: false, errors: validation.errors, message: 'Vui lòng kiểm tra lại thông tin người nhận hàng.' };
      }

      const allOrders = this._getAllOrdersRaw();
      const idemKey = customerData.idempotencyKey || checkoutSummary.idempotencyKey || null;
      if (idemKey) {
        const existingDup = allOrders.find((o) => o && o.userId === session.id && o.idempotencyKey === idemKey);
        if (existingDup) {
          this.setLastOrderId(existingDup.orderId);
          return { ok: true, order: existingDup, duplicate: true };
        }
      }

      const rawPay = String(customerData.paymentMethod || 'COD').toUpperCase();
      const isBank = rawPay === 'BANK' || rawPay === 'QR_TRANSFER' || rawPay === 'BANK_TRANSFER';
      const paymentMethod = isBank ? 'BANK' : 'COD';
      const paymentMethodLabel = isBank
        ? 'Chuyển khoản ngân hàng'
        : 'Thanh toán khi nhận hàng (COD)';
      const paymentStatus = 'Chưa thanh toán (COD)';
      const orderStatus = 'Chờ xác nhận';
      const nowIso = new Date().toISOString();
      const datePart = nowIso.slice(2, 10).replace(/-/g, '');
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const orderId = `AUR${datePart}${randPart}`;

      const receiver = {
        fullName: String(customerData.fullName).trim(),
        phone: String(customerData.phone).trim().replace(/\s+/g, ''),
        email: String(customerData.email || session.email || '').trim(),
        city: String(customerData.city).trim(),
        district: String(customerData.district || 'Quận trung tâm').trim(),
        ward: String(customerData.ward || 'Phường trung tâm').trim(),
        address: String(customerData.address).trim(),
        note: String(customerData.note || '').trim()
      };

      const fullAddressLine = [receiver.address, receiver.ward, receiver.district, receiver.city]
        .filter(Boolean)
        .join(', ');

      const snapshotItems = checkoutSummary.items.map((item) => ({
        key: item.key,
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        thumbnail: item.thumbnail,
        color: item.color,
        storage: item.storage,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice || item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity
      }));

      const orderRecord = {
        orderId,
        userId: session.id,
        source: checkoutSummary.source || 'cart',
        idempotencyKey: idemKey || ('idem-' + orderId),
        createdAt: nowIso,
        updatedAt: nowIso,
        orderStatus,
        status: orderStatus,
        paymentMethod,
        paymentMethodLabel,
        paymentStatus,
        deliveryMethod,
        transferContent: `AURIX ${orderId}`,
        receiver,
        customer: Object.assign({}, receiver, { fullAddress: fullAddressLine }),
        items: snapshotItems,
        subtotal: checkoutSummary.subtotal,
        discount: checkoutSummary.discount,
        couponCode: checkoutSummary.couponCode || '',
        shipping: checkoutSummary.shipping,
        grandTotal: checkoutSummary.grandTotal
      };

      allOrders.unshift(orderRecord);
      this._saveAllOrdersRaw(allOrders);

      if (customerData.saveAddress) {
        TP.AuthService.saveUserAddress({
          fullName: receiver.fullName,
          phone: receiver.phone,
          email: receiver.email,
          city: receiver.city,
          district: receiver.district,
          ward: receiver.ward,
          address: receiver.address
        });
      }

      // Requirement 3.5: Only remove the selected & ordered items from the cart; keep unselected items intact!
      if (checkoutSummary.source === 'cart') {
        const orderedKeys = snapshotItems.map((i) => i.key);
        TP.CartService.removeItemsByKeys(orderedKeys);
      }
      TP.CartService.clearCheckoutIntent();
      this.setLastOrderId(orderRecord.orderId);
      TP.Events.emit('order:created', orderRecord);

      const routes = TP.CONFIG.ROUTES || {};
      const nextUrl = isBank
        ? `${routes.PAYMENT || 'thanhtoan.html'}?orderId=${encodeURIComponent(orderId)}`
        : `${routes.ORDER_SUCCESS || 'dathangthanhcong.html'}?orderId=${encodeURIComponent(orderId)}`;

      return {
        ok: true,
        order: orderRecord,
        nextUrl
      };
    },
    confirmSimulatedBankPayment(orderId) {
      const session = TP.AuthService.getCurrentSession();
      if (!session || !session.id) {
        return { ok: false, message: 'Phiên đăng nhập không hợp lệ.' };
      }
      const allOrders = this._getAllOrdersRaw();
      const target = allOrders.find((o) => o && o.orderId === orderId && o.userId === session.id);
      if (!target) {
        return { ok: false, message: 'Không tìm thấy đơn hàng cần xác nhận thanh toán.' };
      }

      target.paymentStatus = 'Đã thanh toán';
      target.orderStatus = 'Chờ xác nhận';
      target.status = 'Chờ xác nhận';
      target.updatedAt = new Date().toISOString();

      this._saveAllOrdersRaw(allOrders);
      this.setLastOrderId(target.orderId);
      TP.Events.emit('order:updated', target);
      const routes = TP.CONFIG.ROUTES || {};
      return {
        ok: true,
        order: target,
        nextUrl: `${routes.ORDER_SUCCESS || 'dathangthanhcong.html'}?orderId=${encodeURIComponent(target.orderId)}`
      };
    }
  };
})(window);
