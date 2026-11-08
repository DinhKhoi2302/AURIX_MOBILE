/**
 * AURIX MOBILE — Product Detail Page Controller (chitietsanpham.html)
 * Implements:
 * - Multi-image gallery with color-switching & 0px layout shift (Sections 1 & 2)
 * - No public SKU display in summary box or sticky bar while keeping internal SKU in Cart/Order (Section 2.4)
 * - Vertical 2-column specification table + true overlay Modal for full specs without legacy group count labels (Section 3)
 * - Collapsible 100% Verbatim product description ("Xem thêm" / "Thu gọn") interleaved with model-verified images (Section 5)
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const SUBHEADINGS = new Set([
    'Tổng quan sản phẩm',
    'Giới thiệu tổng quan',
    'Thiết kế và màn hình',
    'Hiệu năng và bộ vi xử lý',
    'Hiệu năng và vi xử lý',
    'Camera và trải nghiệm chụp ảnh',
    'Camera và khả năng chụp ảnh',
    'Pin và công nghệ sạc',
    'Phần mềm và tính năng đặc biệt',
    'Độ bền và kết nối',
    'Kết nối và độ bền',
    'Ưu điểm',
    'Hạn chế',
    'Đối tượng sử dụng phù hợp',
    'Kết luận'
  ]);

  function humanizeImageCaption(productName, imgPath, fallbackLabel) {
    if (!imgPath) return `${productName} — ${fallbackLabel || 'Hình ảnh thực tế'}`;
    const base = imgPath.split('/').pop().replace(/\.[a-z0-9]+$/i, '').toLowerCase();
    if (base.includes('tong-quan') || base.includes('thong-so-noi-bat') || base.includes('overview')) {
      return `${productName} — Tổng quan thiết kế & tính năng nổi bật`;
    }
    if (base.includes('camera') || base.includes('ong-kinh') || base.includes('chup-anh') || base.includes('nhiep-anh')) {
      return `${productName} — Hệ thống Camera & Nhiếp ảnh`;
    }
    if (base.includes('pin') || base.includes('sac') || base.includes('battery')) {
      return `${productName} — Thời lượng Pin & Công nghệ sạc`;
    }
    if (base.includes('hieu-nang') || base.includes('chip') || base.includes('vi-xu-ly') || base.includes('snapdragon') || base.includes('dimensity') || base.includes('exynos')) {
      return `${productName} — Hiệu năng xử lý & Đa nhiệm`;
    }
    if (base.includes('thong-so-man-hinh') || base.includes('man-hinh') || base.includes('display') || base.includes('mat-truoc')) {
      return `${productName} — Không gian hiển thị màn hình`;
    }
    if (base.includes('tro-ly-ai') || base.includes('galaxy-ai') || base.includes('tinh-nang')) {
      return `${productName} — Tính năng thông minh & Trải nghiệm thực tế`;
    }
    if (base.includes('tuy-chon-mau') || base.includes('kinh-ceramic') || base.includes('mat-lung')) {
      return `${productName} — Ngôn ngữ thiết kế & Chất liệu hoàn thiện`;
    }
    if (base.includes('mat-truoc-sau') || base.includes('mat-truoc-mat-sau') || base.includes('front-back')) {
      return `${productName} — Thiết kế tổng quan mặt trước và mặt sau`;
    }
    if (base.includes('canh-ben') || base.includes('canh-trai') || base.includes('canh-tren') || base.includes('canh-duoi') || base.includes('khung')) {
      return `${productName} — Hoàn thiện khung viền & Cạnh máy`;
    }
    return `${productName} — ${fallbackLabel || 'Hình ảnh chi tiết sản phẩm'}`;
  }

  function isOverviewOrFeatureImage(src) {
    if (!src || typeof src !== 'string') return false;
    const base = src.split('/').pop().toLowerCase();
    // Exclude plain studio cutout angle shots and color avatars
    const plainCutoutTokens = [
      'anh-dai-dien',
      'mat-truoc-mat-sau',
      'mat-truoc-sau',
      '02-front-back',
      'canh-trai',
      'canh-phai',
      'canh-tren',
      'canh-duoi',
      'mat-lung-goc',
      'man-hinh-goc',
      'goc-nghieng-camera',
      'phu-kien-trong-hop'
    ];
    if (plainCutoutTokens.some((tk) => base.includes(tk))) {
      return false;
    }
    const overviewTokens = [
      'tong-quan',
      'thong-so',
      'tinh-nang',
      'he-thong-camera',
      'cum-camera',
      'can-canh',
      'hieu-nang',
      'vi-xu-ly',
      'chip-',
      'snapdragon',
      'dimensity',
      'exynos',
      'apple-a',
      'dung-luong-pin',
      'thoi-luong-pin',
      'pin-',
      'sac-nhanh',
      'cong-nghe',
      'do-sang',
      'tan-so-quet',
      'khang-nuoc',
      'do-ben',
      'kinh-ceramic',
      'tro-ly-ai',
      'galaxy-ai',
      'trai-nghiem',
      'thiet-ke-nhiep-anh',
      'tuy-chon-mau',
      'banner-',
      'quang-cao',
      'overview',
      'feature',
      'display',
      'performance',
      'battery'
    ];
    return overviewTokens.some((tk) => base.includes(tk)) || base.endsWith('.jpg');
  }

  function scoreOverviewImage(src) {
    const base = String(src || '').split('/').pop().toLowerCase();
    if (base.includes('tong-quan') || base.includes('thong-so-noi-bat') || base.endsWith('.jpg')) return 10;
    if (base.includes('he-thong-camera') || base.includes('cum-camera') || base.includes('thiet-ke-nhiep-anh')) return 9;
    if (base.includes('dung-luong-pin') || base.includes('thoi-luong-pin') || base.includes('hieu-nang') || base.includes('vi-xu-ly')) return 8;
    if (base.includes('thong-so-man-hinh') || base.includes('tinh-nang') || base.includes('tro-ly-ai') || base.includes('trai-nghiem')) return 7;
    if (base.includes('kinh-ceramic') || base.includes('tuy-chon-mau') || base.includes('can-canh')) return 6;
    return 1;
  }

  function buildInterleavedDescriptionHtml(product, selectedColor) {
    const rawParas = Array.isArray(product.verbatimDescription) ? product.verbatimDescription.filter((x) => String(x || '').trim()) : [];
    if (!rawParas.length) {
      return `<div class="p-3 rounded text-center" style="background:#F8FAFC;border:1px solid var(--tp-border);color:var(--tp-text-secondary);font-weight:600;">Thông tin mô tả sản phẩm chính hãng ${TP.DOM.escapeHtml(product.name)}.</div>`;
    }

    // Collect all candidate images for this product model
    const colorPool = (selectedColor && product.imagesByColor && Array.isArray(product.imagesByColor[selectedColor]))
      ? product.imagesByColor[selectedColor]
      : [];
    const secImgs = product.imagesBySection || {};
    const sectionList = [secImgs.feature, secImgs.camera, secImgs.performance, secImgs.battery, secImgs.screen, secImgs.design].filter(Boolean);
    const descImgs = Array.isArray(product.descriptionImages) ? product.descriptionImages : [];
    const galleryImgs = Array.isArray(product.images) ? product.images : [];
    const rawGallery = (product.rawJson && product.rawJson.images && Array.isArray(product.rawJson.images.gallery))
      ? product.rawJson.images.gallery
      : [];

    const allUniqueImgs = [];
    rawGallery.concat(galleryImgs, descImgs, sectionList, colorPool).forEach((src) => {
      if (src && typeof src === 'string' && !allUniqueImgs.includes(src) && !src.includes('placeholder')) {
        allUniqueImgs.push(src);
      }
    });

    // Requirement 7 (Hình 4): Prioritize visual Overview / Feature / Infographic images first!
    // If a product does not have overview images, fall back cleanly to its regular detail/color images.
    const overviewPool = allUniqueImgs
      .filter((src) => isOverviewOrFeatureImage(src))
      .sort((a, b) => scoreOverviewImage(b) - scoreOverviewImage(a));

    const regularDetailPool = [];
    colorPool.concat(descImgs, galleryImgs, allUniqueImgs).forEach((src) => {
      if (src && !overviewPool.includes(src) && !regularDetailPool.includes(src) && !src.toLowerCase().includes('anh-dai-dien')) {
        regularDetailPool.push(src);
      }
    });

    const avatarFallbackPool = allUniqueImgs.filter(
      (src) => !overviewPool.includes(src) && !regularDetailPool.includes(src)
    );

    const imagePool = overviewPool.concat(regularDetailPool, avatarFallbackPool);

    const usedImgs = new Set();
    let poolCursor = 0;

    const pickContextualOverviewImage = (paragraphText) => {
      const txtLow = String(paragraphText || '').toLowerCase();
      const unusedOverviews = overviewPool.filter((src) => !usedImgs.has(src));
      if (!unusedOverviews.length) return null;

      let topicTokens = [];
      if (txtLow.includes('camera') || txtLow.includes('nhiếp ảnh') || txtLow.includes('chụp') || txtLow.includes('hasselblad') || txtLow.includes('leica') || txtLow.includes('tele')) {
        topicTokens = ['he-thong-camera', 'cum-camera', 'can-canh', 'thiet-ke-nhiep-anh', 'trai-nghiem-chup-anh', 'camera'];
      } else if (txtLow.includes('pin') || txtLow.includes('mah') || txtLow.includes('sạc') || txtLow.includes('supervooc')) {
        topicTokens = ['dung-luong-pin', 'thoi-luong-pin', 'pin-', 'sac-', 'battery'];
      } else if (txtLow.includes('snapdragon') || txtLow.includes('dimensity') || txtLow.includes('exynos') || txtLow.includes('a20') || txtLow.includes('a19') || txtLow.includes('a18') || txtLow.includes('vi xử lý') || txtLow.includes('hiệu năng')) {
        topicTokens = ['hieu-nang', 'vi-xu-ly', 'chip-', 'snapdragon', 'dimensity', 'exynos', 'performance'];
      } else if (txtLow.includes('màn hình') || txtLow.includes('amoled') || txtLow.includes('oled') || txtLow.includes('tần số quét') || txtLow.includes('nit')) {
        topicTokens = ['thong-so-man-hinh', 'display', 'man-hinh', 'tong-quan', 'thong-so-noi-bat'];
      }

      if (topicTokens.length) {
        const matched = unusedOverviews.find((src) => {
          const b = src.split('/').pop().toLowerCase();
          return topicTokens.some((tk) => b.includes(tk));
        });
        if (matched) {
          usedImgs.add(matched);
          return matched;
        }
      }
      return null;
    };

    const takeNextImage = (paragraphText) => {
      const contextual = pickContextualOverviewImage(paragraphText);
      if (contextual) return contextual;
      while (poolCursor < imagePool.length) {
        const cand = imagePool[poolCursor++];
        if (!usedImgs.has(cand)) {
          usedImgs.add(cand);
          return cand;
        }
      }
      return null;
    };

    const renderFigure = (imgSrc, fallbackCaption) => {
      if (!imgSrc) return '';
      const cap = humanizeImageCaption(product.name, imgSrc, fallbackCaption);
      return `
        <figure class="tp-desc-figure">
          <img src="${TP.DOM.escapeHtml(imgSrc)}" alt="${TP.DOM.escapeHtml(cap)}" width="640" height="360" loading="lazy">
          <figcaption>${TP.DOM.escapeHtml(cap)}</figcaption>
        </figure>
      `;
    };

    let blocks = [];
    if (rawParas.length === 1 && rawParas[0].length > 120) {
      const sentences = rawParas[0].match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [rawParas[0]];
      if (sentences.length >= 3) {
        sentences.forEach((s) => {
          if (s.trim()) blocks.push({ type: 'p', text: s.trim() });
        });
      } else if (sentences.length === 2) {
        blocks.push({ type: 'p', text: sentences[0].trim() });
        blocks.push({ type: 'p', text: sentences[1].trim() });
      } else {
        blocks.push({ type: 'p', text: rawParas[0] });
      }
    } else {
      rawParas.forEach((line) => {
        const trimmed = String(line || '').trim();
        if (!trimmed) return;
        if (SUBHEADINGS.has(trimmed)) {
          blocks.push({ type: 'h3', text: trimmed });
        } else {
          blocks.push({ type: 'p', text: trimmed });
        }
      });
    }

    const introParts = [];
    const extraParts = [];
    let pCount = 0;
    const introParagraphLimit = blocks.length > 3 ? 2 : 1;
    const shouldCollapse = blocks.length >= 2 || imagePool.length >= 2;

    blocks.forEach((b, idx) => {
      const targetArr = (!shouldCollapse || pCount < introParagraphLimit) ? introParts : extraParts;
      if (b.type === 'h3') {
        targetArr.push(`<h3 class="tp-desc-subheading">${TP.DOM.escapeHtml(b.text)}</h3>`);
      } else {
        pCount += 1;
        targetArr.push(`<p>${TP.DOM.escapeHtml(b.text)}</p>`);
        if (pCount === 1 || pCount % 2 === 0 || idx === blocks.length - 1) {
          const nextImg = takeNextImage(b.text);
          if (nextImg) {
            targetArr.push(renderFigure(nextImg, `Góc nhìn chi tiết #${usedImgs.size}`));
          }
        }
      }
    });

    while (usedImgs.size < Math.min(3, imagePool.length)) {
      const extraImg = takeNextImage('');
      if (!extraImg) break;
      extraParts.push(renderFigure(extraImg, `Góc nhìn chi tiết #${usedImgs.size}`));
    }

    if (!shouldCollapse || !extraParts.length) {
      return `
        <div class="tp-desc-collapsible-wrap">
          <div class="tp-verbatim-desc">${introParts.concat(extraParts).join('')}</div>
        </div>
      `;
    }

    return `
      <div class="tp-desc-collapsible-wrap" data-desc-collapsible>
        <div class="tp-verbatim-desc">
          <div class="tp-desc-intro-block">${introParts.join('')}</div>
          <div id="tp-desc-extra-content" class="tp-desc-extra-block" hidden>${extraParts.join('')}</div>
        </div>
        <div class="tp-desc-fade-overlay" data-desc-fade></div>
        <div class="tp-desc-toggle-wrap">
          <button type="button" id="tp-desc-toggle-btn" class="tp-btn tp-btn-secondary tp-desc-toggle-btn" aria-expanded="false" aria-controls="tp-desc-extra-content">
            Xem thêm nội dung mô tả ▾
          </button>
        </div>
      </div>
    `;
  }

  TP.PageInit.register('product-detail', function () {
    let lastSpecModalTrigger = null;

    const ensureSpecModal = () => {
      let modal = TP.DOM.qs('#tp-spec-detail-modal');
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'tp-spec-detail-modal';
      modal.className = 'tp-modal-backdrop';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="tp-modal-dialog tp-spec-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="tp-spec-modal-title">
          <div class="tp-spec-modal-header">
            <div>
              <span class="tp-badge tp-badge-new mb-1">THÔNG SỐ KỸ THUẬT</span>
              <h3 id="tp-spec-modal-title" class="tp-h3 mb-0">Cấu hình chi tiết sản phẩm</h3>
            </div>
            <button type="button" class="tp-modal-close" data-spec-modal-close aria-label="Đóng bảng cấu hình chi tiết">×</button>
          </div>
          <div id="tp-spec-modal-body" class="tp-spec-modal-body" tabindex="0"></div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeSpecModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastSpecModalTrigger && typeof lastSpecModalTrigger.focus === 'function') {
          setTimeout(() => lastSpecModalTrigger.focus(), 20);
        }
      };

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('[data-spec-modal-close]')) {
          e.preventDefault();
          closeSpecModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          e.preventDefault();
          closeSpecModal();
        }
      });

      modal._closeSpecModal = closeSpecModal;
      return modal;
    };

    const renderDetail = () => {
      const productId = TP.DOM.getQueryParam('id') || 'iphone-16-pro-max';
      const product = TP.ProductService.getById(productId);
      const contentWrap = TP.DOM.qs('#tp-detail-content');
      const notFoundWrap = TP.DOM.qs('#tp-detail-not-found');

      if (!product) {
        if (contentWrap) contentWrap.hidden = true;
        if (notFoundWrap) notFoundWrap.hidden = false;
        return;
      }
      if (contentWrap) contentWrap.hidden = false;
      if (notFoundWrap) notFoundWrap.hidden = true;

      document.title = `${product.name} | AURIX MOBILE Chính Hãng`;

      let selectedColor = product.colors && product.colors[0] ? product.colors[0].name : 'Tiêu chuẩn';
      let selectedStorage = product.storageOptions && product.storageOptions[0] ? product.storageOptions[0].label : product.storage;
      let quantity = 1;
      let showFullGallery = product.brandId === 'oppo' && product.category === 'smartphone' && product.colors.length > 1;

      const bcCurrent = TP.DOM.qs('#tp-detail-bc-name');
      const titleEl = TP.DOM.qs('#tp-detail-title');
      const brandEl = TP.DOM.qs('#tp-detail-brand');
      const statusBadgeEl = TP.DOM.qs('#tp-detail-stock-badge');
      const ratingEl = TP.DOM.qs('#tp-detail-rating');
      const priceEl = TP.DOM.qs('#tp-detail-price');
      const oldPriceEl = TP.DOM.qs('#tp-detail-old-price');
      const descEl = TP.DOM.qs('#tp-detail-description');
      const descHeadingEl = TP.DOM.qs('#heading-product-desc');
      const featSpecsSection = TP.DOM.qs('#tp-detail-featured-specs-section');
      const featSpecsGrid = TP.DOM.qs('#tp-detail-featured-specs-grid');
      const toggleSpecsBtn = TP.DOM.qs('#tp-toggle-full-specs-btn');
      const fullSpecsCollapse = TP.DOM.qs('#tp-full-specs-collapse');
      const colorWrap = TP.DOM.qs('#tp-detail-colors');
      const colorLabelEl = TP.DOM.qs('#tp-detail-color-selected-label');
      const storageWrap = TP.DOM.qs('#tp-detail-storages');
      const storageLabelEl = TP.DOM.qs('#tp-detail-storage-selected-label');
      const storageGroupLabel = storageWrap ? storageWrap.previousElementSibling : null;
      const selectedSummaryEl = TP.DOM.qs('#tp-detail-selected-variant');
      const qtyInput = TP.DOM.qs('#tp-detail-qty');
      const galleryStage = TP.DOM.qs('#tp-detail-gallery-stage');
      const addCartBtn = TP.DOM.qs('#tp-detail-add-cart');
      const buyNowBtn = TP.DOM.qs('#tp-detail-buy-now');
      const stickyAddBtn = TP.DOM.qs('#tp-sticky-add-btn');
      const stickyBuyBtn = TP.DOM.qs('#tp-sticky-buy-btn');
      const stickyInstallmentBtn = TP.DOM.qs('#tp-sticky-installment-btn');

      // Hide legacy inline collapse block permanently (replaced by accessible Spec Modal in Section 3.2)
      if (fullSpecsCollapse) fullSpecsCollapse.hidden = true;

      if (bcCurrent) bcCurrent.textContent = product.name;
      if (titleEl) titleEl.textContent = product.name;
      if (brandEl) brandEl.textContent = product.brand;
      if (ratingEl) {
        if (product.rating && product.reviewCount) {
          ratingEl.hidden = false;
          ratingEl.textContent = `★★★★★ ${product.rating}/5 (${product.reviewCount} đánh giá)`;
        } else {
          ratingEl.hidden = true;
        }
      }

      // Adapt storage group label for accessories vs phones/tablets
      if (storageGroupLabel && product.category === 'accessory') {
        storageGroupLabel.innerHTML = `2. Chọn phiên bản: <strong id="tp-detail-storage-selected-label" class="tp-text-primary">${TP.DOM.escapeHtml(selectedStorage)}</strong>`;
      }

      const bindDescriptionToggle = () => {
        if (!descEl) return;
        const toggleBtn = descEl.querySelector('#tp-desc-toggle-btn');
        const extraBlock = descEl.querySelector('#tp-desc-extra-content');
        const fadeOverlay = descEl.querySelector('[data-desc-fade]');
        if (!toggleBtn || !extraBlock) return;

        toggleBtn.onclick = () => {
          const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
          const nextState = !isExpanded;
          extraBlock.hidden = !nextState;
          if (fadeOverlay) fadeOverlay.hidden = nextState;
          toggleBtn.setAttribute('aria-expanded', String(nextState));
          toggleBtn.textContent = nextState ? 'Thu gọn nội dung mô tả ▲' : 'Xem thêm nội dung mô tả ▾';

          if (!nextState && descHeadingEl) {
            const rect = descHeadingEl.getBoundingClientRect();
            if (rect.top < 0) {
              descHeadingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        };
      };

      const renderDescriptionForCurrentState = () => {
        if (!descEl) return;
        descEl.innerHTML = buildInterleavedDescriptionHtml(product, selectedColor);
        bindDescriptionToggle();
      };

      const renderVerticalFeaturedSpecs = (matchedVar) => {
        if (!featSpecsSection || !featSpecsGrid) return;
        const baseList = Array.isArray(product.featuredSpecs) ? product.featuredSpecs.slice() : [];
        if (!baseList.length) {
          featSpecsSection.hidden = true;
          featSpecsGrid.innerHTML = '';
          return;
        }
        featSpecsSection.hidden = false;

        // Reflect active RAM/ROM variant dynamically if applicable
        const activeRows = baseList.map((item) => {
          const lbl = item.label;
          let val = item.value;
          if (matchedVar) {
            if (lbl === 'RAM' && matchedVar.ram) val = matchedVar.ram;
            if ((lbl === 'Bộ nhớ trong' || lbl === 'Dung lượng lưu trữ') && matchedVar.rom && matchedVar.rom !== 'Tiêu chuẩn') {
              val = matchedVar.rom;
            }
          }
          return { label: lbl, value: val };
        });

        // Render as a clean 2-column vertical table (Section 3.1: no mini-card grid)
        featSpecsGrid.className = 'tp-vertical-specs-wrap';
        featSpecsGrid.innerHTML = `
          <table class="tp-vertical-spec-table">
            <tbody>
              ${activeRows.map((r) => `
                <tr>
                  <th scope="row">${TP.DOM.escapeHtml(r.label)}</th>
                  <td>${TP.DOM.escapeHtml(r.value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      };

      const populateSpecModalContent = (matchedVar) => {
        const modal = ensureSpecModal();
        const modalTitle = modal.querySelector('#tp-spec-modal-title');
        const modalBody = modal.querySelector('#tp-spec-modal-body');
        if (modalTitle) {
          const varSuffix = (selectedStorage && selectedStorage !== 'Tiêu chuẩn')
            ? ` (${selectedColor} · ${selectedStorage})`
            : ` (${selectedColor})`;
          modalTitle.textContent = `Cấu hình chi tiết ${product.name}${varSuffix}`;
        }
        if (!modalBody) return;

        let html = '';
        if (product.groupedSpecifications && Object.keys(product.groupedSpecifications).length > 0) {
          Object.entries(product.groupedSpecifications).forEach(([groupTitle, fields]) => {
            const cleanGroupTitle = String(groupTitle).replace(/^\d+\.\s*/, '').trim();
            const validEntries = Object.entries(fields).filter(([, v]) => v !== null && v !== undefined && v !== '');
            if (validEntries.length) {
              html += `<h4 class="tp-spec-group-heading">${TP.DOM.escapeHtml(cleanGroupTitle)}</h4>`;
              html += `<table class="tp-spec-table"><tbody>`;
              validEntries.forEach(([k, v]) => {
                let displayVal = String(v);
                if (matchedVar) {
                  if (k === 'Dung lượng RAM' && matchedVar.ram) displayVal = `${matchedVar.ram} (${displayVal})`;
                  if (k === 'Bộ nhớ trong' && matchedVar.rom && matchedVar.rom !== 'Tiêu chuẩn') displayVal = `${matchedVar.rom} (Đang chọn)`;
                  if (k === 'Màu sắc' && selectedColor) displayVal = `${selectedColor} (Đang chọn) / ${displayVal}`;
                }
                html += `
                  <tr>
                    <th scope="row">${TP.DOM.escapeHtml(k)}</th>
                    <td>${TP.DOM.escapeHtml(displayVal)}</td>
                  </tr>
                `;
              });
              html += `</tbody></table>`;
            }
          });
        }

        if (!html && Array.isArray(product.featuredSpecs) && product.featuredSpecs.length) {
          html += `<table class="tp-spec-table"><tbody>`;
          product.featuredSpecs.forEach((item) => {
            html += `
              <tr>
                <th scope="row">${TP.DOM.escapeHtml(item.label)}</th>
                <td>${TP.DOM.escapeHtml(item.value)}</td>
              </tr>
            `;
          });
          html += `</tbody></table>`;
        }

        modalBody.innerHTML = html || `<p class="text-center py-3 mb-0">Thông số kỹ thuật chính hãng ${TP.DOM.escapeHtml(product.name)}.</p>`;
      };

      if (toggleSpecsBtn) {
        toggleSpecsBtn.textContent = 'Xem cấu hình chi tiết';
        toggleSpecsBtn.removeAttribute('aria-controls');
        toggleSpecsBtn.setAttribute('aria-haspopup', 'dialog');
        toggleSpecsBtn.onclick = (e) => {
          e.preventDefault();
          lastSpecModalTrigger = toggleSpecsBtn;
          const matchedVar = TP.ProductService.findMatchingVariant(product, selectedColor, selectedStorage);
          populateSpecModalContent(matchedVar);
          const modal = ensureSpecModal();
          modal.classList.add('is-open');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          const closeBtn = modal.querySelector('[data-spec-modal-close]');
          if (closeBtn) setTimeout(() => closeBtn.focus(), 30);
        };
      }

      const syncGalleryForColor = () => {
        if (!galleryStage) return;
        const galleryColor = showFullGallery ? '' : selectedColor;
        const images = TP.ProductService.getGalleryForColor(product, galleryColor);
        TP.ProductGallery.init(galleryStage, images, product.name, galleryColor);
      };

      const syncVariantUI = (colorChanged = false) => {
        const matchedVar = TP.ProductService.findMatchingVariant(product, selectedColor, selectedStorage);
        const currentPrice = matchedVar && typeof matchedVar.price === 'number' && matchedVar.price > 0
          ? matchedVar.price
          : TP.ProductService.calculateVariantPrice(product, selectedStorage, selectedColor);
        const hasValidPrice = typeof currentPrice === 'number' && currentPrice > 0;

        if (colorLabelEl) colorLabelEl.textContent = selectedColor;
        const currentStorageLabelEl = TP.DOM.qs('#tp-detail-storage-selected-label');
        if (currentStorageLabelEl) currentStorageLabelEl.textContent = selectedStorage;


        if (statusBadgeEl) {
          statusBadgeEl.className = 'tp-badge tp-badge-instock';
          statusBadgeEl.textContent = '✓ Còn hàng chính hãng';

          // Nhãn bảo hành 1 đổi 1 - 12 tháng
          let warrantyBadge = statusBadgeEl.parentElement
            .querySelector('.tp-detail-warranty-badge');

          if (product.hasVerifiedWarranty) {
            if (!warrantyBadge) {
              warrantyBadge = document.createElement('span');
              warrantyBadge.className = 'tp-detail-warranty-badge';
              warrantyBadge.title = 'Bảo hành 1 đổi 1 trong 12 tháng';

              const warrantyImg = document.createElement('img');
              warrantyImg.src = 'assets/images/badges/bao-hanh-1-doi-1.png';
              warrantyImg.alt = 'Bảo hành 1 đổi 1 - 12 tháng';

              warrantyBadge.appendChild(warrantyImg);
              statusBadgeEl.insertAdjacentElement('afterend', warrantyBadge);
            }
          } else if (warrantyBadge) {
            warrantyBadge.remove();
          }
        }


        if (priceEl) {
          priceEl.textContent = hasValidPrice ? TP.DOM.formatPrice(currentPrice) : TP.DOM.formatPrice(product.price);
          priceEl.setAttribute('data-current-price', String(hasValidPrice ? currentPrice : product.price));
        }
        if (oldPriceEl) {
          const orig = (matchedVar && matchedVar.originalPrice) || product.originalPrice;
          oldPriceEl.textContent = (orig && hasValidPrice && orig > currentPrice) ? TP.DOM.formatPrice(orig) : '';
        }

        // Section 2.4: Remove public SKU display from summary box and sticky bar (keep internal SKU in data/cart)
        const showStorageInSummary = selectedStorage && selectedStorage !== 'Tiêu chuẩn';
        if (selectedSummaryEl) {
          selectedSummaryEl.innerHTML = showStorageInSummary
            ? `Đang chọn: <strong data-selected-color>${TP.DOM.escapeHtml(selectedColor)}</strong> · <strong data-selected-storage>${TP.DOM.escapeHtml(selectedStorage)}</strong>`
            : `Đang chọn: <strong data-selected-color>${TP.DOM.escapeHtml(selectedColor)}</strong>`;
        }

        if (colorChanged) {
          syncGalleryForColor();
        }

        renderVerticalFeaturedSpecs(matchedVar);

        const activeValPrice = hasValidPrice ? currentPrice : (product.price || 0);
        const totalWarEl = TP.DOM.qs("#tp-detail-total-warranty");
        const bonusWarEl = TP.DOM.qs("#tp-detail-bonus-warranty");
        const boxAccEl = TP.DOM.qs("#tp-commitment-box-accessories");
        if (totalWarEl && bonusWarEl) {
          if (activeValPrice >= 25000000) {
            totalWarEl.textContent = "36 tháng";
            bonusWarEl.textContent = "24 tháng";
          } else if (activeValPrice >= 10000000) {
            totalWarEl.textContent = "24 tháng";
            bonusWarEl.textContent = "12 tháng";
          } else {
            totalWarEl.textContent = "18 tháng";
            bonusWarEl.textContent = "06 tháng";
          }
        }
        if (boxAccEl) {
          boxAccEl.textContent = product.category === "accessory"
            ? `${product.name} chính hãng nguyên hộp, đầy đủ phụ kiện và sách hướng dẫn từ nhà sản xuất.`
            : `${product.name}, hộp đựng nguyên seal, cáp sạc nhanh, que lấy SIM và sách hướng dẫn NSX.`;
        }

        const stickyThumb = TP.DOM.qs('#tp-sticky-thumb');
        const stickyTitle = TP.DOM.qs('#tp-sticky-title');
        const stickyPrice = TP.DOM.qs('#tp-sticky-price');
        const stickyOldPrice = TP.DOM.qs('#tp-sticky-old-price');
        const stickyInstallmentSub = TP.DOM.qs('#tp-sticky-installment-sub');
        const stickyVariant = TP.DOM.qs('#tp-sticky-variant');

        const activeColorGallery = TP.ProductService.getGalleryForColor(product, selectedColor);
        if (stickyThumb) {
          stickyThumb.src = (activeColorGallery && activeColorGallery[0]) || product.thumbnail;
          stickyThumb.alt = product.name;
        }
        if (stickyTitle) stickyTitle.textContent = product.name;
        if (stickyPrice) stickyPrice.textContent = TP.DOM.formatPrice(activeValPrice);
        if (stickyOldPrice) {
          const rawOrigPrice = (matchedVar && matchedVar.originalPrice) || product.originalPrice;
          const effOldPrice = (rawOrigPrice && rawOrigPrice > activeValPrice)
            ? rawOrigPrice
            : Math.round((activeValPrice * 1.15) / 10000) * 10000;
          stickyOldPrice.textContent = TP.DOM.formatPrice(effOldPrice);
        }
        if (stickyInstallmentSub) {
          const monthlyVal = Math.max(100000, Math.round((activeValPrice * 0.7) / 6 / 1000) * 1000);
          stickyInstallmentSub.textContent = `${TP.DOM.formatPrice(monthlyVal)}/tháng`;
        }
        if (stickyVariant) {
          const cleanStorage = showStorageInSummary ? String(selectedStorage).replace(/\//g, ' ') : '';
          stickyVariant.textContent = cleanStorage
            ? `${cleanStorage}-${selectedColor}`
            : `${selectedColor}`;
        }
      };

      if (colorWrap && product.colors) {
        colorWrap.innerHTML = product.colors.map((c, idx) => `
          <button type="button" class="tp-variant-btn ${idx === 0 ? 'is-active' : ''}" data-color-name="${TP.DOM.escapeHtml(c.name)}" aria-pressed="${idx === 0}">
            <span class="tp-color-swatch" style="background:${TP.DOM.escapeHtml(c.hex)};"></span>
            <span>${TP.DOM.escapeHtml(c.name)}</span>
          </button>
        `).join('');

        colorWrap.onclick = (e) => {
          const btn = e.target.closest('[data-color-name]');
          if (!btn) return;
          const nextColor = btn.getAttribute('data-color-name');
          if (nextColor === selectedColor && !showFullGallery) return;
          showFullGallery = false;
          selectedColor = nextColor;
          TP.DOM.qsa('.tp-variant-btn', colorWrap).forEach((b) => {
            const active = b === btn;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', String(active));
          });
          syncVariantUI(true);
        };
      }

      if (storageWrap && product.storageOptions) {
        storageWrap.innerHTML = product.storageOptions.map((s, idx) => {
          const hasRamInLabel = String(s.label).includes('/');
          const subRam = (!hasRamInLabel && s.ram && s.label !== 'Tiêu chuẩn') ? ` (${TP.DOM.escapeHtml(s.ram)})` : '';
          return `
            <button type="button" class="tp-variant-btn ${idx === 0 ? 'is-active' : ''}" data-storage-label="${TP.DOM.escapeHtml(s.label)}" aria-pressed="${idx === 0}">
              <span>${TP.DOM.escapeHtml(s.label)}${subRam}</span>
            </button>
          `;
        }).join('');

        storageWrap.onclick = (e) => {
          const btn = e.target.closest('[data-storage-label]');
          if (!btn) return;
          selectedStorage = btn.getAttribute('data-storage-label');
          TP.DOM.qsa('.tp-variant-btn', storageWrap).forEach((b) => {
            const active = b === btn;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', String(active));
          });
          syncVariantUI(false);
        };
      }

      const decBtn = TP.DOM.qs('#tp-detail-qty-dec');
      const incBtn = TP.DOM.qs('#tp-detail-qty-inc');
      if (decBtn && incBtn && qtyInput) {
        decBtn.onclick = () => {
          quantity = Math.max(1, quantity - 1);
          qtyInput.value = String(quantity);
        };
        incBtn.onclick = () => {
          quantity = Math.min(10, quantity + 1);
          qtyInput.value = String(quantity);
        };
        qtyInput.onchange = () => {
          quantity = Math.max(1, Math.min(10, parseInt(qtyInput.value, 10) || 1));
          qtyInput.value = String(quantity);
        };
      }

      const handleAdd = (redirectCheckout = false) => {
        const matchedVar = TP.ProductService.findMatchingVariant(product, selectedColor, selectedStorage);
        if (redirectCheckout) {
          const bnRes = TP.CartService.startBuyNowCheckout(product.id, {
            color: selectedColor,
            storage: selectedStorage,
            sku: matchedVar ? matchedVar.sku : undefined,
            quantity
          });
          if (bnRes && bnRes.ok && bnRes.redirectUrl) {
            window.location.href = bnRes.redirectUrl;
          }
          return;
        }
        const added = TP.CartService.addItem(product.id, {
          color: selectedColor,
          storage: selectedStorage,
          sku: matchedVar ? matchedVar.sku : undefined,
          quantity
        });
        if (!added) return;
        const currentGalleryImg = (galleryStage && galleryStage.querySelector('[data-gallery-main]'))
          ? galleryStage.querySelector('[data-gallery-main]').getAttribute('src')
          : product.thumbnail;
        if (addCartBtn && TP.CartMotion && typeof TP.CartMotion.flyToCart === 'function') {
          TP.CartMotion.flyToCart(addCartBtn, currentGalleryImg || product.thumbnail);
        }
        const varLabel = (selectedStorage && selectedStorage !== 'Tiêu chuẩn') ? `${selectedColor}, ${selectedStorage}` : selectedColor;
        TP.Toast.show(`Đã thêm ${quantity} × ${product.name} (${varLabel}) vào giỏ!`, 'success');
      };

      if (addCartBtn) addCartBtn.onclick = () => handleAdd(false);
      if (stickyAddBtn) stickyAddBtn.onclick = () => handleAdd(false);
      if (buyNowBtn) buyNowBtn.onclick = () => handleAdd(true);
      if (stickyBuyBtn) stickyBuyBtn.onclick = () => handleAdd(true);
      if (stickyInstallmentBtn) stickyInstallmentBtn.onclick = () => handleAdd(true);

      const relatedGrid = TP.DOM.qs('#tp-detail-related-grid');
      if (relatedGrid) {
        const related = TP.ProductService.getRelated(product.id, 4);
        relatedGrid.innerHTML = related.map((p) => TP.ProductCard.render(p)).join('');
        TP.MotionManager.refreshDynamic(relatedGrid);
      }

      const stickyBar = TP.DOM.qs('#tp-sticky-purchase-bar');
      if (stickyBar && addCartBtn) {
        window.addEventListener('scroll', () => {
          const rect = addCartBtn.getBoundingClientRect();
          stickyBar.classList.toggle('is-visible', rect.bottom < 0);
        }, { passive: true });
      }

      // =========================================================================
      // Requirement 1A: 4 Product Review Videos & Contact Hotline Copy Handler
      // =========================================================================
      const videoStageEl = TP.DOM.qs('#tp-detail-video-stage');
      const videoListEl = TP.DOM.qs('#tp-detail-video-list');
      const copyHotlineBtn = TP.DOM.qs('#tp-copy-hotline-btn');

      if (copyHotlineBtn) {
        copyHotlineBtn.onclick = () => {
          const phone = copyHotlineBtn.getAttribute('data-copy-phone') || '0941054053';
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(phone).catch(() => { });
          }
          TP.Toast.show('Đã sao chép Hotline tư vấn AURIX MOBILE: ' + phone, 'success');
        };
      }

      const galleryPool = (Array.isArray(product.images) && product.images.length ? product.images : [product.thumbnail]).filter(Boolean);
      const pickImg = (i) => galleryPool[i % galleryPool.length] || product.thumbnail;
      const countBadgeEl = TP.DOM.qs('#tp-video-count-badge');

      const curatedEntries = (TP.PRODUCT_VIDEO_REVIEWS && Array.isArray(TP.PRODUCT_VIDEO_REVIEWS[product.id]))
        ? TP.PRODUCT_VIDEO_REVIEWS[product.id]
        : [];

      const reviewVideos = (curatedEntries.length ? curatedEntries : [
        {
          type: 'youtube',
          title: `Đánh giá chi tiết ${product.name} chính hãng Việt Nam`,
          source: 'Vật Vờ Studio',
          url: 'https://www.youtube.com/watch?v=fuExiBxzDUE',
          ytId: 'fuExiBxzDUE'
        },
        {
          type: 'youtube',
          title: `Trải nghiệm thực tế ${product.name}: Camera, Hiệu năng & Pin`,
          source: 'Duy Thẩm',
          url: 'https://www.youtube.com/watch?v=hw5MPxb51cU',
          ytId: 'hw5MPxb51cU'
        },
        {
          type: 'article',
          title: `Đánh giá chuyên sâu ${product.name} chính hãng (CellphoneS Sforum)`,
          source: 'CellphoneS Sforum',
          url: 'https://cellphones.com.vn/sforum',
          ytId: null,
          fallbackYtId: 'fuExiBxzDUE'
        }
      ]).map((entry, idx) => {
        const isYt = entry.type === 'youtube' && Boolean(entry.ytId);
        const ytThumb = isYt ? `https://i.ytimg.com/vi/${entry.ytId}/hqdefault.jpg` : pickImg(idx);
        return {
          id: 'rev-link-' + (idx + 1),
          type: entry.type || (isYt ? 'youtube' : 'article'),
          title: entry.title,
          source: entry.source || (isYt ? 'YouTube Review Việt Nam' : 'Chuyên trang Công nghệ'),
          url: entry.url,
          ytId: entry.ytId || null,
          fallbackYtId: entry.fallbackYtId || (curatedEntries[0] && curatedEntries[0].ytId) || 'fuExiBxzDUE',
          thumb: ytThumb,
          fallbackThumb: pickImg(idx),
          isYt
        };
      });

      if (countBadgeEl) {
        const ytCount = reviewVideos.filter((v) => v.isYt).length;
        const artCount = reviewVideos.length - ytCount;
        countBadgeEl.textContent = artCount > 0
          ? `${ytCount} Video · ${artCount} Bài Review`
          : `${reviewVideos.length} Video Review`;
      }

      let activeVideoIdx = 0;
      let autoPlayTriggered = false;

      const renderVideoSection = () => {
        if (!videoStageEl || !videoListEl) return;
        const vid = reviewVideos[activeVideoIdx] || reviewVideos[0];
        const activeYtId = vid.ytId || vid.fallbackYtId;
        const embedUrl = activeYtId
          ? `https://www.youtube.com/embed/${encodeURIComponent(activeYtId)}?rel=0${autoPlayTriggered && vid.isYt ? '&autoplay=1' : ''}`
          : '';

        if (vid.isYt && embedUrl) {
          videoStageEl.innerHTML = `
            <div class="tp-video-active-player">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <span class="tp-badge tp-badge-hot" style="font-size:0.72rem;">🎬 VIDEO REVIEW · ${TP.DOM.escapeHtml(vid.source)}</span>
                <a href="${TP.DOM.escapeHtml(vid.url)}" target="_blank" rel="noopener noreferrer" class="tp-caption fw-bold" style="color:#93C5FD;font-size:0.78rem;">Mở trên YouTube ↗</a>
              </div>
              <div class="tp-video-player-screen tp-video-iframe-wrap">
                <iframe
                  src="${TP.DOM.escapeHtml(embedUrl)}"
                  title="${TP.DOM.escapeHtml(vid.title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy">
                </iframe>
              </div>
              <div class="tp-video-controls-bar" style="justify-content:space-between;gap:0.75rem;">
                <span class="tp-caption text-white fw-semibold" style="font-size:0.79rem;line-height:1.38;flex:1;min-width:0;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${TP.DOM.escapeHtml(vid.title)}</span>
                <a href="${TP.DOM.escapeHtml(vid.url)}" target="_blank" rel="noopener noreferrer" class="tp-btn tp-btn-primary tp-btn-sm" style="padding:0.28rem 0.78rem;font-size:0.74rem;flex-shrink:0;">▶ Xem trên YouTube ↗</a>
              </div>
            </div>
          `;
        } else {
          videoStageEl.innerHTML = `
            <div class="tp-video-active-player">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <span class="tp-badge tp-badge-new" style="font-size:0.72rem;background:#2563EB;color:#FFF;">📰 BÀI ĐÁNH GIÁ · ${TP.DOM.escapeHtml(vid.source)}</span>
                <a href="${TP.DOM.escapeHtml(vid.url)}" target="_blank" rel="noopener noreferrer" class="tp-caption fw-bold" style="color:#93C5FD;font-size:0.78rem;">Mở bài viết gốc ↗</a>
              </div>
              <div class="tp-video-player-screen tp-video-iframe-wrap">
                <iframe
                  src="https://www.youtube.com/embed/${encodeURIComponent(activeYtId)}?rel=0"
                  title="${TP.DOM.escapeHtml(vid.title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy">
                </iframe>
              </div>
              <div class="tp-video-controls-bar" style="justify-content:space-between;gap:0.75rem;">
                <span class="tp-caption text-white fw-semibold" style="font-size:0.79rem;line-height:1.38;flex:1;min-width:0;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${TP.DOM.escapeHtml(vid.title)}</span>
                <a href="${TP.DOM.escapeHtml(vid.url)}" target="_blank" rel="noopener noreferrer" class="tp-btn tp-btn-primary tp-btn-sm" style="padding:0.28rem 0.78rem;font-size:0.74rem;flex-shrink:0;">📖 Đọc bài đánh giá ↗</a>
              </div>
            </div>
          `;
        }

        videoListEl.innerHTML = reviewVideos.map((v, idx) => `
          <div class="tp-video-item-btn ${idx === activeVideoIdx ? 'is-active' : ''}" data-video-idx="${idx}" role="button" tabindex="0">
            <div class="tp-video-item-thumb">
              <img src="${TP.DOM.escapeHtml(v.thumb)}" alt="${TP.DOM.escapeHtml(v.title)}" class="${v.isYt ? 'tp-yt-thumb' : ''}" loading="lazy" onerror="this.onerror=null;this.className='';this.src='${TP.DOM.escapeHtml(v.fallbackThumb)}';">
              <span class="tp-video-item-play-badge">${v.isYt ? '▶' : '📰'}</span>
            </div>
            <div class="tp-video-item-info">
              <div class="tp-video-item-title">${TP.DOM.escapeHtml(v.title)}</div>
              <div class="d-flex align-items-center justify-content-between gap-2 mt-1">
                <span class="tp-video-item-sub">${v.isYt ? '🎬 Video YouTube' : '📰 Bài viết đánh giá'} · ${TP.DOM.escapeHtml(v.source)}</span>
                <a href="${TP.DOM.escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer" class="tp-video-ext-link" onclick="event.stopPropagation();">Mở link ↗</a>
              </div>
            </div>
          </div>
        `).join('');

        TP.DOM.qsa('[data-video-idx]', videoListEl).forEach((btn) => {
          btn.onclick = () => {
            const nextIdx = parseInt(btn.getAttribute('data-video-idx'), 10);
            if (!isNaN(nextIdx)) {
              activeVideoIdx = nextIdx;
              autoPlayTriggered = true;
              renderVideoSection();
              const chosen = reviewVideos[nextIdx];
              if (chosen && !chosen.isYt && chosen.url) {
                window.open(chosen.url, '_blank', 'noopener,noreferrer');
              }
            }
          };
        });
      };

      renderVideoSection();

      // =========================================================================
      // Requirement 1B: Product Reviews & Comments Section (Below Description)
      // =========================================================================
      const REVIEWS_STORAGE_KEY = 'aurix_product_reviews_v1';
      const reviewProdNameEl = TP.DOM.qs('#tp-review-product-name');
      const reviewAvgScoreEl = TP.DOM.qs('#tp-review-avg-score');
      const reviewTotalCountEl = TP.DOM.qs('#tp-review-total-count');
      const reviewForm = TP.DOM.qs('#tp-review-form');
      const reviewAuthorInp = TP.DOM.qs('#tp-review-author');
      const reviewPhoneInp = TP.DOM.qs('#tp-review-phone');
      const reviewCommentInp = TP.DOM.qs('#tp-review-comment');
      const starPickerEl = TP.DOM.qs('#tp-review-star-picker');
      const starTextEl = TP.DOM.qs('#tp-review-star-text');
      const quickTagsEl = TP.DOM.qs('#tp-review-quick-tags');
      const reviewListEl = TP.DOM.qs('#tp-review-list');

      if (reviewProdNameEl) reviewProdNameEl.textContent = product.name;

      // Pre-fill author & phone if user is logged in
      const currentSession = TP.AuthService && typeof TP.AuthService.getCurrentSession === 'function'
        ? TP.AuthService.getCurrentSession()
        : null;
      if (currentSession) {
        if (reviewAuthorInp && !reviewAuthorInp.value && currentSession.fullName) {
          reviewAuthorInp.value = currentSession.fullName;
        }
        if (reviewPhoneInp && !reviewPhoneInp.value && currentSession.phone) {
          reviewPhoneInp.value = currentSession.phone;
        }
      }

      let selectedRatingStars = 5;
      const STAR_LABELS = {
        1: 'Cần cải thiện (1/5)',
        2: 'Tạm được (2/5)',
        3: 'Bình thường (3/5)',
        4: 'Hài lòng (4/5)',
        5: 'Tuyệt vời (5/5)'
      };

      if (starPickerEl) {
        const syncStarsUI = () => {
          TP.DOM.qsa('[data-star-val]', starPickerEl).forEach((btn) => {
            const v = parseInt(btn.getAttribute('data-star-val'), 10);
            btn.classList.toggle('is-active', v <= selectedRatingStars);
          });
          if (starTextEl) starTextEl.textContent = STAR_LABELS[selectedRatingStars] || 'Tuyệt vời (5/5)';
        };
        starPickerEl.onclick = (e) => {
          const btn = e.target.closest('[data-star-val]');
          if (!btn) return;
          selectedRatingStars = parseInt(btn.getAttribute('data-star-val'), 10) || 5;
          syncStarsUI();
        };
        syncStarsUI();
      }

      if (quickTagsEl && reviewCommentInp) {
        quickTagsEl.onclick = (e) => {
          const chip = e.target.closest('[data-quick-review-tag]');
          if (!chip) return;
          const textToAdd = chip.getAttribute('data-quick-review-tag') || '';
          const cur = reviewCommentInp.value.trim();
          reviewCommentInp.value = cur ? `${cur} ${textToAdd}` : textToAdd;
          reviewCommentInp.focus();
        };
      }

      const getDefaultReviewsForProduct = () => {
        const firstColor = (product.colors && product.colors[0] && product.colors[0].name) || 'Tiêu chuẩn';
        const firstRom = (product.storageOptions && product.storageOptions[0] && product.storageOptions[0].label) || product.storage || '256GB';
        return [
          {
            id: 'seed-1',
            author: 'Nguyễn Minh Tuấn',
            rating: 5,
            date: '07/11/2026',
            variant: `${firstColor} · ${firstRom}`,
            comment: `Mình vừa nhận máy ${product.name} tại chi nhánh 12 Nguyễn Văn Bảo, TP.HCM. Máy nguyên seal chính hãng, màn hình cực kỳ sắc nét, cảm ứng mượt và pin dùng rất trâu. Nhân viên tư vấn nhiệt tình!`,
            reply: `Cảm ơn anh Minh Tuấn đã tin tưởng mua sắm ${product.name} tại AURIX MOBILE (12 Nguyễn Văn Bảo, TP.HCM). Chúc anh có trải nghiệm tuyệt vời cùng siêu phẩm mới ạ!`
          },
          {
            id: 'seed-2',
            author: 'Trần Hoàng Yến',
            rating: 5,
            date: '05/11/2026',
            variant: `${firstColor} · ${firstRom}`,
            comment: `Đặt giao nhanh 2h qua hotline 0941054053 mà chỉ tầm 1 tiếng rưỡi đã nhận được hàng. ${product.name} cầm rất đầm tay, camera chụp đêm và chân dung rõ từng chi tiết, áp mã AURIX500 được giảm thêm 500K rất hời.`,
            reply: `AURIX MOBILE cảm ơn chị Hoàng Yến rất nhiều! Gói bảo hành mở rộng AURIX Care+ của chị đã được kích hoạt tự động theo số điện thoại mua hàng ạ.`
          },
          {
            id: 'seed-3',
            author: 'Lê Quốc Khánh',
            rating: 5,
            date: '02/11/2026',
            variant: `${firstColor}`,
            comment: `Đã trải nghiệm thực tế tại cửa hàng Số 20 Đường số 53, Đà Nẵng trước khi chốt mua. Máy chạy mát, đa nhiệm nhanh, chính sách bảo hành 1 đổi 1 trong 30 ngày rất yên tâm.`,
            reply: `Cảm ơn anh Quốc Khánh đã ghé chi nhánh AURIX MOBILE Đà Nẵng. Nếu cần hỗ trợ kỹ thuật hoặc cài đặt ứng dụng, anh cứ liên hệ hotline 0941054053 bất cứ lúc nào nhé!`
          }
        ];
      };

      const getSavedReviewsMap = () => {
        const raw = TP.StorageService.get(REVIEWS_STORAGE_KEY, {});
        return (raw && typeof raw === 'object') ? raw : {};
      };

      const renderReviewsList = () => {
        if (!reviewListEl) return;
        const map = getSavedReviewsMap();
        const userReviews = Array.isArray(map[product.id]) ? map[product.id] : [];
        const allReviews = userReviews.concat(getDefaultReviewsForProduct());

        const baseCount = (typeof product.reviewCount === 'number' && product.reviewCount > 0) ? product.reviewCount : 68;
        const totalDisplayedCount = baseCount + userReviews.length;
        if (reviewTotalCountEl) reviewTotalCountEl.textContent = String(totalDisplayedCount);
        if (reviewAvgScoreEl) {
          const avg = product.rating || 4.9;
          reviewAvgScoreEl.innerHTML = `${avg}<span>/5</span>`;
        }

        reviewListEl.innerHTML = allReviews.map((r) => {
          const initials = String(r.author || 'KH')
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((w) => w.charAt(0).toUpperCase())
            .join('');
          const starsStr = '★'.repeat(Math.max(1, Math.min(5, r.rating || 5))) + '☆'.repeat(Math.max(0, 5 - (r.rating || 5)));
          return `
            <article class="tp-review-item">
              <div class="tp-review-item-head">
                <div class="d-flex align-items-center gap-2">
                  <span class="tp-review-avatar" aria-hidden="true">${TP.DOM.escapeHtml(initials || 'KH')}</span>
                  <div>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <strong class="tp-text-navy" style="font-size:0.9rem;">${TP.DOM.escapeHtml(r.author)}</strong>
                      <span class="tp-badge tp-badge-instock" style="font-size:0.7rem;padding:0.15rem 0.5rem;">✓ Đã mua tại AURIX MOBILE</span>
                    </div>
                    <div class="tp-caption">Phiên bản: <strong>${TP.DOM.escapeHtml(r.variant || selectedColor)}</strong> · ${TP.DOM.escapeHtml(r.date)}</div>
                  </div>
                </div>
                <div style="color:#F59E0B;font-size:0.95rem;letter-spacing:1px;" aria-label="${r.rating || 5} trên 5 sao">${starsStr}</div>
              </div>
              <p class="tp-text-small mb-0" style="color:var(--tp-text-main);line-height:1.6;">${TP.DOM.escapeHtml(r.comment)}</p>
              ${r.reply ? `
                <div class="tp-review-reply">
                  <strong class="tp-text-primary d-block mb-1" style="font-size:0.78rem;">🛡️ Phản hồi từ Quản trị viên AURIX MOBILE:</strong>
                  <span style="color:var(--tp-text-secondary);">${TP.DOM.escapeHtml(r.reply)}</span>
                </div>
              ` : ''}
            </article>
          `;
        }).join('');
      };

      if (reviewForm) {
        reviewForm.onsubmit = (e) => {
          e.preventDefault();
          const author = reviewAuthorInp ? reviewAuthorInp.value.trim() : '';
          const comment = reviewCommentInp ? reviewCommentInp.value.trim() : '';
          if (author.length < 2) {
            TP.Toast.show('Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự).', 'error');
            if (reviewAuthorInp) reviewAuthorInp.focus();
            return;
          }
          if (comment.length < 5) {
            TP.Toast.show('Vui lòng nhập nội dung đánh giá hoặc bình luận (tối thiểu 5 ký tự).', 'error');
            if (reviewCommentInp) reviewCommentInp.focus();
            return;
          }

          const nowStr = new Date().toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const varLabel = (selectedStorage && selectedStorage !== 'Tiêu chuẩn')
            ? `${selectedColor} · ${selectedStorage}`
            : selectedColor;

          const newEntry = {
            id: 'rev-' + Date.now(),
            author,
            rating: selectedRatingStars,
            date: `Vừa xong (${nowStr})`,
            variant: varLabel,
            comment,
            reply: `Cảm ơn bạn ${author} đã gửi đánh giá cho ${product.name}! Đội ngũ AURIX MOBILE (Hotline 0941054053) luôn sẵn sàng đồng hành và hỗ trợ bạn trong suốt quá trình sử dụng.`
          };

          const map = getSavedReviewsMap();
          const list = Array.isArray(map[product.id]) ? map[product.id] : [];
          list.unshift(newEntry);
          map[product.id] = list;
          TP.StorageService.set(REVIEWS_STORAGE_KEY, map);

          if (reviewCommentInp) reviewCommentInp.value = '';
          renderReviewsList();
          TP.Toast.show('Đã đăng đánh giá & bình luận của bạn thành công!', 'success');
        };
      }

      renderReviewsList();

      renderDescriptionForCurrentState();
      syncGalleryForColor();
      syncVariantUI(false);
      TP.Accordion.init();
    };

    renderDetail();
    TP.Events.on('products:loaded', renderDetail);
  });
})(window);
