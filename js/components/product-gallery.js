/**
 * AURIX MOBILE — Multi-Image Product Detail Gallery (Sections 1 & 2)
 * Features: Main image stage with fixed geometry (0px layout jump), prev/next navigation, 1/N indicator, thumbnail strip, and color-aware gallery switching with autoplay.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.ProductGallery = {
    currentImages: [],
    currentIndex: 0,
    productName: '',
    colorName: '',
    timerId: null,

    init(stageEl, images = [], productName = '', colorName = '') {
      if (!stageEl) return;
      global.clearInterval(this.timerId);
      this.productName = productName || 'Sản phẩm';
      this.colorName = colorName || '';
      const uniqueImgs = [];
      (Array.isArray(images) ? images : []).forEach((src) => {
        if (src && !uniqueImgs.includes(src)) uniqueImgs.push(src);
      });
      this.currentImages = uniqueImgs;
      this.currentIndex = 0;

      const mainImg = stageEl.querySelector('[data-gallery-main]');
      const thumbWrap = stageEl.parentElement.querySelector('[data-gallery-thumbs]');

      this.ensureControls(stageEl);

      if (!this.currentImages.length) {
        if (mainImg) mainImg.hidden = true;
        const msgEl = stageEl.querySelector('[data-gallery-empty-color]');
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.textContent = 'Hình ảnh sản phẩm chính hãng.';
        }
        if (thumbWrap) thumbWrap.innerHTML = '';
        this.updateControls(stageEl);
        return;
      }

      if (mainImg) mainImg.hidden = false;
      const msgEl = stageEl.querySelector('[data-gallery-empty-color]');
      if (msgEl) msgEl.hidden = true;

      this.renderThumbnails(stageEl, thumbWrap);
      this.goTo(stageEl, 0, false);

      if (!stageEl.dataset.galleryBound) {
        stageEl.dataset.galleryBound = 'true';
        stageEl.addEventListener('click', (e) => {
          const pBtn = e.target.closest('[data-gallery-prev]');
          if (pBtn) {
            e.preventDefault();
            this.step(stageEl, -1);
            this.startAutoPlay(stageEl);
            return;
          }
          const nBtn = e.target.closest('[data-gallery-next]');
          if (nBtn) {
            e.preventDefault();
            this.step(stageEl, 1);
            this.startAutoPlay(stageEl);
          }
        });

        stageEl.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.step(stageEl, -1);
            this.startAutoPlay(stageEl);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.step(stageEl, 1);
            this.startAutoPlay(stageEl);
          }
        });

        if (thumbWrap) {
          thumbWrap.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-thumb-idx]');
            if (!btn) return;
            const idx = parseInt(btn.getAttribute('data-thumb-idx'), 10) || 0;
            this.goTo(stageEl, idx, true);
            this.startAutoPlay(stageEl);
          });
        }
      }
      this.startAutoPlay(stageEl);
    },

    startAutoPlay(stageEl) {
      global.clearInterval(this.timerId);
      if (this.currentImages.length < 2) return;
      const gallery = stageEl.parentElement;
      this.timerId = global.setInterval(() => {
        if (document.hidden || !stageEl.isConnected || TP.MotionFallbacks.prefersReducedMotion()) return;
        const hovering = global.matchMedia('(hover: hover)').matches && gallery.matches(':hover');
        if (hovering || gallery.querySelector(':focus-visible')) return;
        this.step(stageEl, 1);
      }, 4800);
    },

    ensureControls(stageEl) {
      if (!stageEl.querySelector('[data-gallery-prev]')) {
        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'tp-gallery-nav tp-gallery-prev';
        prev.setAttribute('data-gallery-prev', '');
        prev.setAttribute('aria-label', 'Ảnh trước');
        prev.innerHTML = '‹';
        stageEl.appendChild(prev);
      }
      if (!stageEl.querySelector('[data-gallery-next]')) {
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'tp-gallery-nav tp-gallery-next';
        next.setAttribute('data-gallery-next', '');
        next.setAttribute('aria-label', 'Ảnh tiếp theo');
        next.innerHTML = '›';
        stageEl.appendChild(next);
      }
      if (!stageEl.querySelector('[data-gallery-counter]')) {
        const badge = document.createElement('span');
        badge.className = 'tp-gallery-counter';
        badge.setAttribute('data-gallery-counter', '');
        stageEl.appendChild(badge);
      }
      if (!stageEl.querySelector('[data-gallery-empty-color]')) {
        const empty = document.createElement('div');
        empty.className = 'tp-gallery-empty-notice';
        empty.setAttribute('data-gallery-empty-color', '');
        empty.hidden = true;
        stageEl.appendChild(empty);
      }
    },

    renderThumbnails(stageEl, thumbWrap) {
      if (!thumbWrap) return;
      const total = this.currentImages.length;
      if (total === 0) {
        thumbWrap.innerHTML = '';
        return;
      }
      thumbWrap.scrollLeft = 0;
      thumbWrap.innerHTML = this.currentImages.map((src, idx) => `
        <button type="button" class="tp-thumb-btn ${idx === this.currentIndex ? 'is-active' : ''}" data-thumb-idx="${idx}" aria-label="Ảnh ${idx + 1}/${total} của ${TP.DOM.escapeHtml(this.productName)}" aria-pressed="${idx === this.currentIndex}">
          <img src="${src}" alt="${TP.DOM.escapeHtml(this.productName)}${this.colorName ? ' (' + TP.DOM.escapeHtml(this.colorName) + ')' : ''} - Ảnh ${idx + 1}" width="60" height="60" loading="lazy">
        </button>
      `).join('');
    },

    updateControls(stageEl) {
      const total = this.currentImages.length;
      const counterEl = stageEl.querySelector('[data-gallery-counter]');
      const prevBtn = stageEl.querySelector('[data-gallery-prev]');
      const nextBtn = stageEl.querySelector('[data-gallery-next]');

      if (counterEl) {
        counterEl.textContent = total > 0 ? `${this.currentIndex + 1} / ${total}` : '0 / 0';
        counterEl.hidden = total === 0;
      }
      if (prevBtn) prevBtn.hidden = total <= 1;
      if (nextBtn) nextBtn.hidden = total <= 1;
    },

    step(stageEl, delta) {
      const total = this.currentImages.length;
      if (total <= 1) return;
      const nextIdx = (this.currentIndex + delta + total) % total;
      this.goTo(stageEl, nextIdx, true);
    },

    goTo(stageEl, index, animate = true) {
      const total = this.currentImages.length;
      if (!total) return;
      this.currentIndex = Math.max(0, Math.min(total - 1, index));
      const targetSrc = this.currentImages[this.currentIndex];
      const targetAlt = `${this.productName}${this.colorName ? ' - Màu ' + this.colorName : ''} (${this.currentIndex + 1}/${total})`;

      const mainImg = stageEl.querySelector('[data-gallery-main]');
      if (mainImg) {
        mainImg.setAttribute('width', '360');
        mainImg.setAttribute('height', '360');
        if (animate && !TP.MotionFallbacks.prefersReducedMotion()) {
          this.switchImage(mainImg, targetSrc, targetAlt);
        } else {
          mainImg.src = targetSrc;
          mainImg.alt = targetAlt;
          mainImg.classList.remove('is-switching');
        }
      }

      this.updateControls(stageEl);

      const thumbWrap = stageEl.parentElement.querySelector('[data-gallery-thumbs]');
      if (thumbWrap) {
        const btns = TP.DOM.qsa('.tp-thumb-btn', thumbWrap);
        btns.forEach((b, i) => {
          const active = i === this.currentIndex;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        const activeThumb = btns[this.currentIndex];
        if (animate && activeThumb) {
          const thumb = activeThumb.getBoundingClientRect();
          const strip = thumbWrap.getBoundingClientRect();
          if (thumb.left < strip.left) thumbWrap.scrollLeft += thumb.left - strip.left;
          if (thumb.right > strip.right) thumbWrap.scrollLeft += thumb.right - strip.right;
        }
      }
    },

    switchImage(mainImg, newSrc, newAlt) {
      if (!mainImg || !newSrc) return;
      if (mainImg.getAttribute('src') === newSrc) {
        if (newAlt) mainImg.alt = newAlt;
        return;
      }
      mainImg.classList.add('is-switching');
      mainImg.src = newSrc;
      if (newAlt) mainImg.alt = newAlt;
      setTimeout(() => {
        mainImg.classList.remove('is-switching');
      }, 140);
    }
  };
})(window);
