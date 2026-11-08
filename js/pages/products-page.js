/**
 * AURIX MOBILE — Products Catalog Page Controller (sanpham.html)
 * Implements:
 * - Automatic 5-tier Smartphone Price Segment classification (<5M, 5M-<10M, 10M-<15M, 15M-<25M, >=25M)
 * - Multi-Brand OR selection with active checkmarks & "Tất cả" reset chip
 * - Special Feature toggles (Hỗ trợ 5G, Màn hình gập)
 * - Active Filter Tags bar with individual removal (×) and "Xóa tất cả bộ lọc"
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const CATEGORY_LABELS = {
    smartphone: 'mẫu điện thoại chính hãng',
    all: 'mẫu điện thoại chính hãng',
    tablet: 'mẫu máy tính bảng (Tablet)',
    accessory: 'mẫu phụ kiện chính hãng',
    smartwatch: 'mẫu đồng hồ thông minh'
  };

  const BRANDS_BY_CATEGORY = {
    smartphone: ['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'POCO', 'OPPO', 'vivo', 'realme', 'HONOR', 'Nothing', 'TECNO', 'nubia', 'Motorola'],
    tablet: ['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'OPPO', 'Lenovo', 'HONOR'],
    accessory: ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Anker', 'Baseus', 'Ugreen', 'Xmobile', 'Logitech', 'Uniq', 'Typecase', 'JBL', 'Soundcore']
  };

  const SEGMENT_LABELS = {
    'entry-level': 'Phổ thông',
    'midrange': 'Tầm trung',
    'upper-midrange': 'Cận cao cấp',
    'high-end': 'Cao cấp',
    'flagship': 'Flagship'
  };

  const FEATURE_LABELS = {
    '5g-ready': 'Hỗ trợ 5G',
    'foldable': 'Màn hình gập'
  };

  const PRICE_RANGE_LABELS = {
    'under-10m': 'Dưới 10 triệu',
    '10m-20m': 'Từ 10 – 20 triệu',
    '20m-30m': 'Từ 20 – 30 triệu',
    'above-30m': 'Trên 30 triệu'
  };

  TP.PageInit.register('products', function () {
    const rawCatParam = TP.DOM.getQueryParam('category') || 'smartphone';
    const rawBrandParam = TP.DOM.getQueryParam('brand') || '';
    const rawSegParam = TP.DOM.getQueryParam('segment') || TP.DOM.getQueryParam('priceSegment') || '';
    const rawFeatParam = TP.DOM.getQueryParam('feature') || '';

    let initialCategory = rawCatParam;
    let initialSegment = rawSegParam || 'all';
    const initialFeatures = [];

    if (SEGMENT_LABELS[rawCatParam]) {
      initialCategory = 'smartphone';
      initialSegment = rawCatParam;
    } else if (FEATURE_LABELS[rawCatParam]) {
      initialCategory = 'smartphone';
      initialFeatures.push(rawCatParam);
    } else if (rawCatParam === 'all') {
      initialCategory = 'smartphone';
    }

    if (rawFeatParam && FEATURE_LABELS[rawFeatParam] && !initialFeatures.includes(rawFeatParam)) {
      initialFeatures.push(rawFeatParam);
    }

    const initialBrands = rawBrandParam && rawBrandParam.toLowerCase() !== 'all'
      ? rawBrandParam.split(',').map((b) => b.trim()).filter(Boolean)
      : [];

    const state = {
      q: TP.DOM.getQueryParam('q') || '',
      category: initialCategory,
      priceSegment: initialSegment,
      features: initialFeatures,
      brands: initialBrands,
      series: TP.DOM.getQueryParam('series') || 'all',
      subcat: TP.DOM.getQueryParam('subcat') || 'all',
      os: TP.DOM.getQueryParam('os') || 'all',
      priceRange: 'all',
      storage: 'all',
      ram: 'all',
      stock: 'all',
      sort: 'featured',
      page: 1
    };

    const gridEl = TP.DOM.qs('#tp-catalog-grid');
    const countEl = TP.DOM.qs('#tp-catalog-count');
    const pagEl = TP.DOM.qs('#tp-catalog-pagination');
    const kwInput = TP.DOM.qs('#tp-filter-keyword');
    const sortSelect = TP.DOM.qs('#tp-sort-select');
    const stockCheck = TP.DOM.qs('#tp-filter-instock');
    const clearBtn = TP.DOM.qs('#tp-clear-filters');
    const brandGroupEl = TP.DOM.qs('[data-filter-group="brand"]');
    const priceSegGroupEl = TP.DOM.qs('[data-filter-group="priceSegment"]');
    const featureGroupEl = TP.DOM.qs('[data-filter-group="feature"]');
    const osGroupEl = TP.DOM.qs('[data-filter-group="os"]');
    const activeTagsBarEl = TP.DOM.qs('#tp-active-filters-bar');

    if (kwInput) kwInput.value = state.q;

    const getCategoryCounts = () => {
      const all = TP.ProductService.getAll();
      const counts = {
        smartphone: 0,
        tablet: 0,
        accessory: 0,
        segments: {
          'entry-level': 0,
          'midrange': 0,
          'upper-midrange': 0,
          'high-end': 0,
          'flagship': 0
        }
      };
      all.forEach((p) => {
        if (p.category === 'smartphone') {
          counts.smartphone += 1;
          const seg = TP.ProductService.getProductPriceSegment(p);
          if (seg && counts.segments[seg] !== undefined) {
            counts.segments[seg] += 1;
          }
        } else if (p.category === 'tablet') {
          counts.tablet += 1;
        } else if (p.category === 'accessory') {
          counts.accessory += 1;
        }
      });
      return counts;
    };

    const updateBrandChipsForCategory = () => {
      if (!brandGroupEl) return;
      const chipList = brandGroupEl.querySelector('.tp-chip-list');
      const titleEl = brandGroupEl.querySelector('.tp-filter-title');
      if (!chipList) return;
      const activeCat = (state.category === 'tablet' || state.category === 'accessory') ? state.category : 'smartphone';
      const brands = BRANDS_BY_CATEGORY[activeCat] || BRANDS_BY_CATEGORY.smartphone;
      if (titleEl) {
        const selectedCount = state.brands.length;
        titleEl.innerHTML = selectedCount > 0
          ? `Thương hiệu <span class="tp-badge tp-badge-new ms-1">Đã chọn ${selectedCount}</span>`
          : `Thương hiệu (${brands.length} Hãng · Chọn nhiều)`;
      }
      const isAllActive = state.brands.length === 0;
      const selectedLowerSet = new Set(state.brands.map((b) => b.toLowerCase()));

      chipList.innerHTML = [
        `<button type="button" class="tp-filter-chip ${isAllActive ? 'is-active' : ''}" data-filter-val="all" aria-pressed="${isAllActive}">Tất cả</button>`,
        ...brands.map((b) => {
          const isAct = selectedLowerSet.has(b.toLowerCase());
          return `<button type="button" class="tp-filter-chip ${isAct ? 'is-active' : ''}" data-filter-val="${TP.DOM.escapeHtml(b)}" aria-pressed="${isAct}">${isAct ? '✓ ' : ''}${TP.DOM.escapeHtml(b)}</button>`;
        })
      ].join('');
    };

    const syncChipStates = () => {
      const counts = getCategoryCounts();
      updateBrandChipsForCategory();

      // Hide or show smartphone-only groups when switching to Tablet / Accessory
      const isSmartphoneView = state.category === 'smartphone' || state.category === 'all';
      if (priceSegGroupEl) priceSegGroupEl.hidden = !isSmartphoneView;
      if (featureGroupEl) featureGroupEl.hidden = !isSmartphoneView;
      if (osGroupEl) osGroupEl.hidden = state.category === 'accessory';

      // Update Category chips
      const catGroup = TP.DOM.qs('[data-filter-group="category"]');
      if (catGroup) {
        TP.DOM.qsa('[data-filter-val]', catGroup).forEach((btn) => {
          const val = btn.getAttribute('data-filter-val');
          const normVal = val === 'all' ? 'smartphone' : val;
          btn.classList.toggle('is-active', normVal === state.category);
          btn.setAttribute('aria-pressed', String(normVal === state.category));
          if (normVal === 'smartphone') btn.textContent = `Điện thoại (${counts.smartphone})`;
          if (normVal === 'tablet') btn.textContent = `Tablet (${counts.tablet})`;
          if (normVal === 'accessory') btn.textContent = `Phụ kiện (${counts.accessory})`;
        });
      }

      // Update Price Segment chips
      if (priceSegGroupEl) {
        TP.DOM.qsa('[data-filter-val]', priceSegGroupEl).forEach((btn) => {
          const val = btn.getAttribute('data-filter-val');
          const isAct = val === state.priceSegment;
          btn.classList.toggle('is-active', isAct);
          btn.setAttribute('aria-pressed', String(isAct));
        });
      }

      // Update Special Feature chips (multi-toggle)
      if (featureGroupEl) {
        TP.DOM.qsa('[data-filter-val]', featureGroupEl).forEach((btn) => {
          const val = btn.getAttribute('data-filter-val');
          const isAct = state.features.includes(val);
          btn.classList.toggle('is-active', isAct);
          btn.setAttribute('aria-pressed', String(isAct));
        });
      }

      // Update single-select groups (os, priceRange, storage, ram)
      ['os', 'priceRange', 'storage', 'ram'].forEach((key) => {
        const grp = TP.DOM.qs(`[data-filter-group="${key}"]`);
        if (!grp) return;
        TP.DOM.qsa('[data-filter-val]', grp).forEach((btn) => {
          const val = btn.getAttribute('data-filter-val');
          const isAct = String(val).toLowerCase() === String(state[key]).toLowerCase();
          btn.classList.toggle('is-active', isAct);
          btn.setAttribute('aria-pressed', String(isAct));
        });
      });
    };

    const renderActiveFilterTags = (totalFilteredCount) => {
      if (!activeTagsBarEl) return;
      const tags = [];

      if (state.q) {
        tags.push({ type: 'q', val: state.q, label: `Từ khóa: "${state.q}"` });
      }
      if (state.category === 'smartphone' && state.priceSegment && state.priceSegment !== 'all') {
        tags.push({
          type: 'priceSegment',
          val: state.priceSegment,
          label: `Phân khúc: ${SEGMENT_LABELS[state.priceSegment] || state.priceSegment}`
        });
      }
      state.features.forEach((f) => {
        tags.push({
          type: 'feature',
          val: f,
          label: `Tính năng: ${FEATURE_LABELS[f] || f}`
        });
      });
      state.brands.forEach((b) => {
        tags.push({
          type: 'brand',
          val: b,
          label: `Hãng: ${b}`
        });
      });
      if (state.series && state.series !== 'all') {
        tags.push({ type: 'series', val: state.series, label: `Dòng: ${state.series}` });
      }
      if (state.subcat && state.subcat !== 'all') {
        tags.push({ type: 'subcat', val: state.subcat, label: `Nhóm phụ kiện: ${state.subcat}` });
      }
      if (state.os && state.os !== 'all') {
        tags.push({ type: 'os', val: state.os, label: `HĐH: ${state.os}` });
      }
      if (state.priceRange && state.priceRange !== 'all') {
        tags.push({ type: 'priceRange', val: state.priceRange, label: `Mức giá: ${PRICE_RANGE_LABELS[state.priceRange] || state.priceRange}` });
      }
      if (state.storage && state.storage !== 'all') {
        tags.push({ type: 'storage', val: state.storage, label: `Bộ nhớ: ${state.storage}` });
      }
      if (state.ram && state.ram !== 'all') {
        tags.push({ type: 'ram', val: state.ram, label: `RAM: ${state.ram}` });
      }
      if (state.stock && state.stock !== 'all') {
        tags.push({ type: 'stock', val: state.stock, label: 'Chỉ sản phẩm còn hàng' });
      }

      if (!tags.length) {
        activeTagsBarEl.hidden = true;
        activeTagsBarEl.innerHTML = '';
        return;
      }

      activeTagsBarEl.hidden = false;
      activeTagsBarEl.innerHTML = `
        <div class="d-flex align-items-center flex-wrap gap-2 p-3 mb-3 rounded" style="background:#F0F6FF;border:1px solid #C8DDFD;">
          <span class="tp-text-small fw-bold tp-text-navy me-1">Đang lọc (${totalFilteredCount} kết quả):</span>
          ${tags.map((t) => `
            <button type="button" class="tp-filter-chip is-active d-inline-flex align-items-center gap-1" style="padding:0.28rem 0.68rem;font-size:0.8rem;" data-remove-tag-type="${TP.DOM.escapeHtml(t.type)}" data-remove-tag-val="${TP.DOM.escapeHtml(t.val)}" title="Bỏ bộ lọc ${TP.DOM.escapeHtml(t.label)}">
              <span>${TP.DOM.escapeHtml(t.label)}</span>
              <span aria-hidden="true" style="font-weight:800;margin-left:2px;">×</span>
            </button>
          `).join('')}
          <button type="button" class="tp-btn tp-btn-ghost tp-btn-sm ms-auto fw-bold" data-clear-all-tags style="color:var(--tp-error);padding:0.25rem 0.65rem;">
            ↺ Xóa tất cả bộ lọc
          </button>
        </div>
      `;
    };

    const syncUrlParams = () => {
      TP.DOM.setQueryParam('q', state.q || null);
      TP.DOM.setQueryParam('category', state.category || 'smartphone');
      TP.DOM.setQueryParam('segment', state.priceSegment !== 'all' ? state.priceSegment : null);
      TP.DOM.setQueryParam('brand', state.brands.length ? state.brands.join(',') : null);
      TP.DOM.setQueryParam('series', state.series !== 'all' ? state.series : null);
      TP.DOM.setQueryParam('subcat', state.subcat !== 'all' ? state.subcat : null);
      if (TP.Navigation && typeof TP.Navigation.syncActiveLinks === 'function') {
        TP.Navigation.syncActiveLinks();
      }
    };

    const renderCatalog = () => {
      if (!gridEl) return;
      syncChipStates();
      TP.LoadingMotion.pulseContainer(gridEl);

      let filtered = TP.ProductService.filterAndSort({
        q: state.q,
        category: state.category,
        priceSegment: state.priceSegment,
        features: state.features,
        brands: state.brands,
        series: state.series,
        subcat: state.subcat,
        os: state.os,
        priceRange: state.priceRange,
        storage: state.storage,
        ram: state.ram,
        stock: state.stock,
        sort: state.sort
      });

      if (state.q && filtered.length === 0 && state.brands.length === 0 && state.priceSegment === 'all' && state.features.length === 0) {
        for (const altCat of ['smartphone', 'tablet', 'accessory']) {
          if (altCat === state.category) continue;
          const altList = TP.ProductService.filterAndSort({ q: state.q, category: altCat, sort: state.sort });
          if (altList.length > 0) {
            state.category = altCat;
            syncChipStates();
            filtered = altList;
            break;
          }
        }
      }

      renderActiveFilterTags(filtered.length);

      const perPage = TP.CONFIG.PRODUCTS_PER_PAGE || 12;
      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
      if (state.page > totalPages) state.page = 1;

      const start = (state.page - 1) * perPage;
      const pageItems = filtered.slice(start, start + perPage);

      if (countEl) {
        const unitLabel = CATEGORY_LABELS[state.category] || 'sản phẩm';
        const extraLabel = [];
        if (state.priceSegment && state.priceSegment !== 'all' && state.category === 'smartphone') {
          extraLabel.push(SEGMENT_LABELS[state.priceSegment] || state.priceSegment);
        }
        if (state.brands.length) {
          extraLabel.push(`Thương hiệu: ${state.brands.join(', ')}`);
        }
        if (state.features.length) {
          extraLabel.push(state.features.map((f) => FEATURE_LABELS[f] || f).join(', '));
        }
        if (state.series && state.series !== 'all') extraLabel.push(`Dòng: ${state.series}`);
        if (state.subcat && state.subcat !== 'all') extraLabel.push(`Nhóm: ${state.subcat}`);
        const suffix = extraLabel.length ? ` (${extraLabel.join(' · ')})` : '';
        countEl.textContent = `Hiển thị ${pageItems.length} trên tổng số ${filtered.length} ${unitLabel}${suffix}`;
      }

      if (!pageItems.length) {
        const isSmartwatch = state.category === 'smartwatch';
        const emptyTitle = isSmartwatch
          ? 'Danh mục Đồng hồ thông minh'
          : 'Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại';
        const emptyDesc = isSmartwatch
          ? 'Hiện tại danh mục dữ liệu AURIX MOBILE tập trung vào Điện thoại, Máy tính bảng và Phụ kiện chính hãng.'
          : 'Hãy thử bỏ bớt một số điều kiện lọc (như RAM, Bộ nhớ, Mức giá) hoặc bấm nút bên dưới để đặt lại bộ lọc.';
        const btnLabel = isSmartwatch ? 'Xem danh mục Điện thoại' : 'Xóa tất cả bộ lọc';

        gridEl.innerHTML = `
          <div class="tp-empty-state" style="grid-column: 1 / -1;">
            <div class="tp-empty-icon">${isSmartwatch ? '⌚' : '🔍'}</div>
            <h3 class="tp-h3 mb-2">${TP.DOM.escapeHtml(emptyTitle)}</h3>
            <p class="tp-text-small mb-3">${TP.DOM.escapeHtml(emptyDesc)}</p>
            <button type="button" class="tp-btn tp-btn-primary" id="tp-empty-reset-btn">${TP.DOM.escapeHtml(btnLabel)}</button>
          </div>
        `;
        const resetEmpty = TP.DOM.qs('#tp-empty-reset-btn');
        if (resetEmpty) resetEmpty.addEventListener('click', resetFilters);
      } else {
        gridEl.innerHTML = pageItems.map((p) => TP.ProductCard.render(p)).join('');
        TP.MotionManager.refreshDynamic(gridEl);
      }

      TP.Pagination.render(pagEl, {
        currentPage: state.page,
        totalPages,
        onPageChange(newPage) {
          state.page = newPage;
          renderCatalog();
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }
      });
    };

    const resetFilters = () => {
      state.q = '';
      state.category = 'smartphone';
      state.priceSegment = 'all';
      state.features = [];
      state.brands = [];
      state.series = 'all';
      state.subcat = 'all';
      state.os = 'all';
      state.priceRange = 'all';
      state.storage = 'all';
      state.ram = 'all';
      state.stock = 'all';
      state.sort = 'featured';
      state.page = 1;
      if (kwInput) kwInput.value = '';
      if (sortSelect) sortSelect.value = 'featured';
      if (stockCheck) stockCheck.checked = false;
      syncUrlParams();
      renderCatalog();
    };

    // Delegate clicks on active filter tag removal bar
    if (activeTagsBarEl) {
      activeTagsBarEl.addEventListener('click', (e) => {
        if (e.target.closest('[data-clear-all-tags]')) {
          resetFilters();
          return;
        }
        const rmBtn = e.target.closest('[data-remove-tag-type]');
        if (!rmBtn) return;
        const type = rmBtn.getAttribute('data-remove-tag-type');
        const val = rmBtn.getAttribute('data-remove-tag-val');
        if (type === 'q') {
          state.q = '';
          if (kwInput) kwInput.value = '';
        } else if (type === 'priceSegment') {
          state.priceSegment = 'all';
        } else if (type === 'feature') {
          state.features = state.features.filter((f) => f !== val);
        } else if (type === 'brand') {
          state.brands = state.brands.filter((b) => b.toLowerCase() !== String(val).toLowerCase());
        } else if (type === 'stock') {
          state.stock = 'all';
          if (stockCheck) stockCheck.checked = false;
        } else if (type in state) {
          state[type] = 'all';
        }
        state.page = 1;
        syncUrlParams();
        renderCatalog();
      });
    }

    // Bind sidebar filter groups
    TP.DOM.qsa('[data-filter-group]').forEach((group) => {
      const key = group.getAttribute('data-filter-group');
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter-val]');
        if (!btn) return;
        const rawVal = btn.getAttribute('data-filter-val');
        state.page = 1;

        if (key === 'category') {
          if (SEGMENT_LABELS[rawVal]) {
            state.category = 'smartphone';
            state.priceSegment = state.priceSegment === rawVal ? 'all' : rawVal;
          } else if (FEATURE_LABELS[rawVal]) {
            state.category = 'smartphone';
            if (state.features.includes(rawVal)) {
              state.features = state.features.filter((f) => f !== rawVal);
            } else {
              state.features.push(rawVal);
            }
          } else {
            const nextCat = rawVal === 'all' ? 'smartphone' : rawVal;
            if (state.category !== nextCat) {
              state.category = nextCat;
              state.brands = [];
              state.series = 'all';
              state.subcat = 'all';
              if (nextCat !== 'smartphone') {
                state.priceSegment = 'all';
                state.features = [];
              }
            }
          }
        } else if (key === 'priceSegment') {
          if (rawVal === 'all') {
            state.priceSegment = 'all';
          } else {
            // Toggle segment off if clicked again, or switch to the clicked segment
            state.priceSegment = state.priceSegment === rawVal ? 'all' : rawVal;
          }
        } else if (key === 'feature') {
          if (rawVal === 'all') {
            state.features = [];
          } else if (state.features.includes(rawVal)) {
            state.features = state.features.filter((f) => f !== rawVal);
          } else {
            state.features.push(rawVal);
          }
        } else if (key === 'brand') {
          state.series = 'all';
          if (rawVal === 'all') {
            state.brands = [];
          } else {
            const existsIdx = state.brands.findIndex((b) => b.toLowerCase() === rawVal.toLowerCase());
            if (existsIdx >= 0) {
              state.brands.splice(existsIdx, 1);
            } else {
              state.brands.push(rawVal);
            }
          }
        } else {
          // Toggleable single-value filter (clicking active chip resets to 'all')
          if (rawVal === 'all') {
            state[key] = 'all';
          } else {
            state[key] = String(state[key]).toLowerCase() === String(rawVal).toLowerCase() ? 'all' : rawVal;
          }
        }

        syncUrlParams();
        renderCatalog();
      });
    });

    if (kwInput) {
      kwInput.addEventListener('input', () => {
        state.q = kwInput.value.trim();
        state.page = 1;
        renderCatalog();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        state.page = 1;
        renderCatalog();
      });
    }

    if (stockCheck) {
      stockCheck.addEventListener('change', () => {
        state.stock = stockCheck.checked ? 'in_stock' : 'all';
        state.page = 1;
        renderCatalog();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', resetFilters);
    }

    renderCatalog();
    TP.Events.on('products:loaded', renderCatalog);
  });
})(window);
