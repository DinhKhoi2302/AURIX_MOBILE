/**
 * AURIX MOBILE — In-Memory Product Repository (Section 5)
 * Stores validated & normalized phone models loaded from assets/data/catalog.json and assets/data/products/{brand}/{model}.json.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const byId = new Map();
  let orderedList = [];

  TP.ProductRepository = {
    clear() {
      byId.clear();
      orderedList = [];
    },
    upsert(normalizedProduct) {
      if (!normalizedProduct || !normalizedProduct.id) return;
      byId.set(normalizedProduct.id, normalizedProduct);
    },
    rebuildIndex() {
      orderedList = Array.from(byId.values());
    },
    getAll() {
      return orderedList.slice();
    },
    getById(id) {
      if (!id) return null;
      return byId.get(id) || null;
    },
    getBySku(sku) {
      if (!sku) return null;
      for (const prod of orderedList) {
        const matchedVar = (prod.variants || []).find((v) => v.sku === sku);
        if (matchedVar) {
          return { product: prod, variant: matchedVar };
        }
      }
      return null;
    },
    count() {
      return byId.size;
    }
  };
})(window);
