/**
 * TechPhone — Shared Wishlist Service
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.WishlistService = {
    getIds() {
      const list = TP.StorageService.get(TP.CONFIG.STORAGE_KEYS.WISHLIST, []);
      return Array.isArray(list) ? list : [];
    },
    has(productId) {
      return this.getIds().includes(productId);
    },
    toggle(productId) {
      const ids = this.getIds();
      const idx = ids.indexOf(productId);
      let added = false;
      if (idx >= 0) {
        ids.splice(idx, 1);
      } else {
        ids.push(productId);
        added = true;
      }
      TP.StorageService.set(TP.CONFIG.STORAGE_KEYS.WISHLIST, ids);
      TP.Events.emit('wishlist:updated', { productId, added, count: ids.length });
      return added;
    },
    getProducts() {
      return this.getIds()
        .map((id) => TP.ProductService.getById(id))
        .filter(Boolean);
    }
  };
})(window);
