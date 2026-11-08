/**
 * AURIX MOBILE — News Page Controller (tintuc.html - Section 10)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.PageInit.register('news', function () {
    const state = {
      category: 'Tất cả',
      q: '',
      page: 1
    };

    const catWrap = TP.DOM.qs('#tp-news-categories');
    const searchInput = TP.DOM.qs('#tp-news-search');
    const listGrid = TP.DOM.qs('#tp-news-grid');
    const pagWrap = TP.DOM.qs('#tp-news-pagination');
    const popularWrap = TP.DOM.qs('#tp-news-popular');

    if (catWrap) {
      const cats = TP.NewsService.getCategories();
      catWrap.innerHTML = cats.map((c) => `
        <button type="button" class="tp-pill-tab ${c === state.category ? 'is-active' : ''}" data-news-cat="${TP.DOM.escapeHtml(c)}">${TP.DOM.escapeHtml(c)}</button>
      `).join('');

      catWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-news-cat]');
        if (!btn) return;
        state.category = btn.getAttribute('data-news-cat');
        state.page = 1;
        TP.DOM.qsa('[data-news-cat]', catWrap).forEach((b) => b.classList.toggle('is-active', b === btn));
        renderNews();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.q = searchInput.value.trim();
        state.page = 1;
        renderNews();
      });
    }

    if (popularWrap) {
      const pop = TP.NewsService.getAll().slice(0, 4);
      popularWrap.innerHTML = pop.map((a) => `
        <a href="${TP.DOM.escapeHtml(a.detailUrl || ('chitiettintuc.html?id=' + encodeURIComponent(a.id)))}" class="d-block py-2" style="border-bottom:1px solid var(--tp-border);">
          <span class="tp-caption tp-text-primary fw-bold">${TP.DOM.escapeHtml(a.category)} · ${TP.DOM.escapeHtml(a.publishedAt)}</span>
          <div class="fw-bold tp-text-navy" style="font-size:0.88rem;">${TP.DOM.escapeHtml(a.title)}</div>
        </a>
      `).join('');
    }

    const renderNews = () => {
      if (!listGrid) return;
      const filtered = TP.NewsService.filterArticles(state);
      const perPage = TP.CONFIG.NEWS_PER_PAGE || 6;
      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
      if (state.page > totalPages) state.page = 1;

      const items = filtered.slice((state.page - 1) * perPage, state.page * perPage);
      if (!items.length) {
        listGrid.innerHTML = `<div class="tp-empty-state" style="grid-column:1/-1;">Không tìm thấy bài viết phù hợp.</div>`;
      } else {
        listGrid.innerHTML = items.map((a) => {
          const href = a.detailUrl || `chitiettintuc.html?id=${encodeURIComponent(a.id)}`;
          return `
            <article class="tp-news-card tp-reveal">
              <a href="${TP.DOM.escapeHtml(href)}">
                <img src="${TP.DOM.escapeHtml(a.thumbnail)}" alt="${TP.DOM.escapeHtml(a.altText || a.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;" loading="lazy">
              </a>
              <div class="tp-news-card-body">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-2">
                  <span class="tp-badge tp-badge-new">${TP.DOM.escapeHtml(a.category)}</span>
                  <span class="tp-caption">${TP.DOM.escapeHtml(a.publishedAt)}</span>
                </div>
                <h3 class="tp-h3 mb-2" style="font-size:1.06rem;">
                  <a href="${TP.DOM.escapeHtml(href)}">${TP.DOM.escapeHtml(a.title)}</a>
                </h3>
                <p class="tp-text-small mb-3" style="flex:1;">${TP.DOM.escapeHtml(a.sapo || a.excerpt)}</p>
                <a href="${TP.DOM.escapeHtml(href)}" class="tp-btn tp-btn-secondary tp-btn-sm align-self-start">Đọc chi tiết →</a>
              </div>
            </article>
          `;
        }).join('');
        TP.MotionManager.refreshDynamic(listGrid);
      }

      TP.Pagination.render(pagWrap, {
        currentPage: state.page,
        totalPages,
        onPageChange(p) {
          state.page = p;
          renderNews();
        }
      });
    };

    renderNews();
  });
})(window);
