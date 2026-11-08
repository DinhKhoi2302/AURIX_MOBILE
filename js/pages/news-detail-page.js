/**
 * AURIX MOBILE — News Detail Page Controller (chitiettintuc.html - Section 10)
 * Renders 100% verbatim title, sapo, ordered paragraphs, embedded image, and official reference links.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.PageInit.register('news-detail', function () {
    const id = TP.DOM.getQueryParam('id') || 'iphone-duo-chinh-thuc-xuat-hien';
    const article = TP.NewsService.getById(id);
    const contentWrap = TP.DOM.qs('#tp-article-wrap');
    const notFoundWrap = TP.DOM.qs('#tp-article-not-found');

    if (!article) {
      if (contentWrap) contentWrap.hidden = true;
      if (notFoundWrap) notFoundWrap.hidden = false;
      return;
    }

    document.title = `${article.title} | Tin tức AURIX MOBILE`;

    const bcEl = TP.DOM.qs('#tp-article-bc');
    const catEl = TP.DOM.qs('#tp-article-category');
    const titleEl = TP.DOM.qs('#tp-article-title');
    const metaEl = TP.DOM.qs('#tp-article-meta');
    const heroImg = TP.DOM.qs('#tp-article-hero');
    const excerptEl = TP.DOM.qs('#tp-article-excerpt');
    const tocEl = TP.DOM.qs('#tp-article-toc');
    const bodyEl = TP.DOM.qs('#tp-article-body');
    const relatedEl = TP.DOM.qs('#tp-article-related');

    if (bcEl) bcEl.textContent = article.title;
    if (catEl) catEl.textContent = `${article.articleIndex ? article.articleIndex + ' · ' : ''}${article.category}`;
    if (titleEl) titleEl.textContent = article.title;
    if (metaEl) metaEl.textContent = article.publishedAt;
    if (heroImg) {
      heroImg.src = article.heroImage || article.thumbnail;
      heroImg.alt = article.altText || article.title;
    }
    if (excerptEl) excerptEl.textContent = article.sapo || article.excerpt;

    // Hide synthetic TOC when rendering verbatim multi-paragraph news articles
    if (tocEl) {
      tocEl.hidden = true;
      tocEl.innerHTML = '';
    }

    if (bodyEl) {
      let bodyHtml = '';
      if (Array.isArray(article.contentParagraphs) && article.contentParagraphs.length) {
        bodyHtml += article.contentParagraphs.map((para) => `<p class="mb-3" style="line-height:1.8;font-size:1rem;">${TP.DOM.escapeHtml(para)}</p>`).join('');
      } else if (Array.isArray(article.content)) {
        bodyHtml += article.content.map((sec, i) => `
          <section id="sec-${i}" class="mb-4">
            <h2>${TP.DOM.escapeHtml(sec.heading)}</h2>
            <p>${TP.DOM.escapeHtml(sec.body)}</p>
          </section>
        `).join('');
      }

      if (Array.isArray(article.sources) && article.sources.length) {
        const linksHtml = article.sources.map((url) => `<a href="${TP.DOM.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="tp-text-primary fw-semibold" style="word-break:break-all;">${TP.DOM.escapeHtml(url)}</a>`).join(' &nbsp;|&nbsp; ');
        bodyHtml += `
          <div class="p-3 rounded mt-4" style="background:#F8FAFC;border:1px solid var(--tp-border);font-size:0.86rem;">
            <strong class="tp-text-navy">Nguồn tham khảo chính thức:</strong> ${linksHtml}
          </div>
        `;
      }
      bodyEl.innerHTML = bodyHtml;
    }

    if (relatedEl) {
      const rel = (article.relatedArticleIds || [])
        .map((rid) => TP.NewsService.getById(rid))
        .filter(Boolean);
      relatedEl.innerHTML = rel.map((a) => {
        const href = a.detailUrl || `chitiettintuc.html?id=${encodeURIComponent(a.id)}`;
        return `
          <article class="tp-news-card">
            <a href="${TP.DOM.escapeHtml(href)}">
              <img src="${TP.DOM.escapeHtml(a.thumbnail)}" alt="${TP.DOM.escapeHtml(a.altText || a.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;" loading="lazy">
            </a>
            <div class="tp-news-card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="tp-badge tp-badge-new">${TP.DOM.escapeHtml(a.category)}</span>
                <span class="tp-caption">${TP.DOM.escapeHtml(a.publishedAt)}</span>
              </div>
              <h3 class="tp-h3 mb-2" style="font-size:1rem;">
                <a href="${TP.DOM.escapeHtml(href)}">${TP.DOM.escapeHtml(a.title)}</a>
              </h3>
              <p class="tp-text-small mb-2">${TP.DOM.escapeHtml(a.sapo || a.excerpt)}</p>
              <a href="${TP.DOM.escapeHtml(href)}" class="tp-text-primary fw-bold" style="font-size:0.85rem;">Đọc chi tiết →</a>
            </div>
          </article>
        `;
      }).join('');
    }
  });
})(window);
