/**
 * TechPhone — Reusable Pagination Component
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.Pagination = {
    render(container, { currentPage, totalPages, onPageChange }) {
      if (!container) return;
      if (totalPages <= 1) {
        container.innerHTML = '';
        return;
      }
      let buttonsHtml = `
        <button type="button" class="tp-page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Trang trước">‹ Trước</button>
      `;
      for (let p = 1; p <= totalPages; p++) {
        buttonsHtml += `
          <button type="button" class="tp-page-btn ${p === currentPage ? 'is-active' : ''}" data-page="${p}" aria-current="${p === currentPage ? 'page' : 'false'}">${p}</button>
        `;
      }
      buttonsHtml += `
        <button type="button" class="tp-page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Trang tiếp">Tiếp ›</button>
      `;
      container.innerHTML = buttonsHtml;

      container.onclick = (e) => {
        const btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        const nextP = parseInt(btn.getAttribute('data-page'), 10);
        if (nextP && nextP !== currentPage && typeof onPageChange === 'function') {
          onPageChange(nextP);
        }
      };
    }
  };
})(window);
