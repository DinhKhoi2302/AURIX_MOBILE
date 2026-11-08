/**
 * AURIX MOBILE — News & Editorial Service (Section 10)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.NewsService = {
    getAll() {
      return Array.isArray(TP.NEWS) ? TP.NEWS.slice() : [];
    },
    getById(id) {
      const list = this.getAll();
      if (!id) return list[0] || null;
      if (id === 'ky-nguyen-ai-smartphone-2026') {
        return list[0] || null;
      }
      return list.find((a) => a.id === id || a.slug === id) || null;
    },
    getCategories() {
      const set = new Set(this.getAll().map((a) => a.category));
      return ['Tất cả', ...Array.from(set)];
    },
    filterArticles({ category = 'Tất cả', q = '' } = {}) {
      let list = this.getAll();
      if (category && category !== 'Tất cả') {
        list = list.filter((a) => a.category === category);
      }
      if (q && String(q).trim()) {
        const kw = String(q).trim().toLowerCase();
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(kw) ||
            (a.sapo || a.excerpt || '').toLowerCase().includes(kw) ||
            (a.contentParagraphs || []).some((p) => p.toLowerCase().includes(kw))
        );
      }
      return list;
    }
  };
})(window);
