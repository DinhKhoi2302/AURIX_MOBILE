/**
 * TechPhone — Sitemap Page Controller (sodotrang.html)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.PageInit.register('sitemap', function () {
    const productLinksBox = TP.DOM.qs('#tp-sitemap-product-links');
    const newsLinksBox = TP.DOM.qs('#tp-sitemap-news-links');

    if (productLinksBox) {
      productLinksBox.innerHTML = TP.ProductService.getAll().slice(0, 8).map((p) => `
        <li>
          <a href="chitietsanpham.html?id=${encodeURIComponent(p.id)}" class="tp-sitemap-node">
            📱 ${TP.DOM.escapeHtml(p.name)} <span class="tp-caption d-block">${TP.DOM.formatPrice(p.price)}</span>
          </a>
        </li>
      `).join('');
    }

    if (newsLinksBox) {
      newsLinksBox.innerHTML = TP.NewsService.getAll().map((a) => `
        <li>
          <a href="chitiettintuc.html?id=${encodeURIComponent(a.id)}" class="tp-sitemap-node">
            📰 ${TP.DOM.escapeHtml(a.title)}
          </a>
        </li>
      `).join('');
    }
  });
})(window);
