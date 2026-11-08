/**
 * TechPhone — Instant Search Service (Products & News)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.SearchService = {
    searchAll(query) {
      const q = String(query || '').trim();
      if (!q) {
        return {
          products: TP.ProductService.getFeatured('all', 4),
          articles: (TP.NEWS || []).slice(0, 2)
        };
      }
      const qLow = q.toLowerCase();
      const products = TP.ProductService.filterAndSort({
        q,
        category: 'all',
        includeAllCategories: true
      }).slice(0, 6);
      const articles = (TP.NEWS || []).filter(
        (a) => a.title.toLowerCase().includes(qLow) || a.excerpt.toLowerCase().includes(qLow) || a.category.toLowerCase().includes(qLow)
      ).slice(0, 3);
      return { products, articles };
    }
  };
})(window);
