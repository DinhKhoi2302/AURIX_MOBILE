/**
 * AURIX MOBILE — 3-Level Dynamic Mega Menu Component (Section 9)
 * Features:
 * - Level 1: "Danh mục sản phẩm" button (hover on desktop with smooth intent bridge + click toggle + touch support)
 * - Level 2: Main groups ("Điện thoại", "Máy tính bảng", "Phụ kiện") and complete list of brands/subcategories
 *   (including all 13 smartphone brands with separate Xiaomi, Redmi, POCO; tablet brands; and accessory categories/brands)
 * - Level 3: Actual product series & featured models for the hovered/selected Level 2 brand or subcategory,
 *   dynamically derived from the verified catalog so zero links lead to empty pages.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const LEVEL1_GROUPS = [
    { id: 'smartphone', label: 'Điện thoại thông minh', icon: '📱', href: 'sanpham.html?category=smartphone' },
    { id: 'tablet', label: 'Máy tính bảng (Tablet)', icon: '📟', href: 'sanpham.html?category=tablet' },
    { id: 'accessory', label: 'Phụ kiện chính hãng', icon: '🎧', href: 'sanpham.html?category=accessory' }
  ];

  const SMARTPHONE_BRAND_ORDER = [
    'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'POCO', 'OPPO', 'vivo',
    'realme', 'HONOR', 'Motorola', 'TECNO', 'nubia', 'Nothing'
  ];

  const TABLET_BRAND_ORDER = [
    'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'OPPO', 'Lenovo', 'HONOR'
  ];

  const ACCESSORY_SUBCATS = [
    { id: 'keyboard', label: 'Bàn phím & Bao da iPad/Tablet', icon: '⌨️' },
    { id: 'tai-nghe', label: 'Tai nghe Bluetooth & Chụp tai', icon: '🎧' },
    { id: 'pin-sac-du-phong', label: 'Pin sạc dự phòng Qi2 / PD', icon: '🔋' },
    { id: 'cu-sac', label: 'Củ sạc nhanh GaN', icon: '🔌' },
    { id: 'cap-sac', label: 'Cáp sạc & Truyền dữ liệu', icon: '⚡' }
  ];

  TP.MegaMenu = {
    activeGroup: 'smartphone',
    activeItemKey: 'Apple',
    closeTimer: null,

    buildTreeData() {
      const all = TP.ProductService.getAll();
      const tree = {
        smartphone: [],
        tablet: [],
        accessory: []
      };

      // 1. Smartphones by 13 Brands -> Series + Models
      SMARTPHONE_BRAND_ORDER.forEach((bName) => {
        const models = all.filter((p) => p.category === 'smartphone' && p.brand.toLowerCase() === bName.toLowerCase());
        if (!models.length) return;
        const seriesMap = new Map();
        models.forEach((m) => {
          const sName = m.series || `${bName} Series`;
          if (!seriesMap.has(sName)) seriesMap.set(sName, []);
          seriesMap.get(sName).push(m);
        });
        tree.smartphone.push({
          key: bName,
          label: bName,
          count: models.length,
          href: `sanpham.html?category=smartphone&brand=${encodeURIComponent(bName)}`,
          seriesList: Array.from(seriesMap.entries()).map(([sTitle, sModels]) => ({
            title: sTitle,
            count: sModels.length,
            href: `sanpham.html?category=smartphone&brand=${encodeURIComponent(bName)}&series=${encodeURIComponent(sTitle)}`,
            models: sModels.slice(0, 4)
          }))
        });
      });

      // 2. Tablets by Brand -> Series + Models
      TABLET_BRAND_ORDER.forEach((bName) => {
        const models = all.filter((p) => p.category === 'tablet' && p.brand.toLowerCase() === bName.toLowerCase());
        if (!models.length) return;
        const seriesMap = new Map();
        models.forEach((m) => {
          const sName = m.series || `Máy tính bảng ${bName}`;
          if (!seriesMap.has(sName)) seriesMap.set(sName, []);
          seriesMap.get(sName).push(m);
        });
        tree.tablet.push({
          key: bName,
          label: bName === 'Apple' ? 'iPad (Apple)' : `Máy tính bảng ${bName}`,
          count: models.length,
          href: `sanpham.html?category=tablet&brand=${encodeURIComponent(bName)}`,
          seriesList: Array.from(seriesMap.entries()).map(([sTitle, sModels]) => ({
            title: sTitle,
            count: sModels.length,
            href: `sanpham.html?category=tablet&brand=${encodeURIComponent(bName)}&series=${encodeURIComponent(sTitle)}`,
            models: sModels.slice(0, 4)
          }))
        });
      });

      // 3. Accessories by Subcategory -> Brands + Models
      ACCESSORY_SUBCATS.forEach((sub) => {
        const models = all.filter(
          (p) => p.category === 'accessory' && (p.subCategory === sub.id || (p.categoryIds || []).includes(sub.id))
        );
        if (!models.length) return;
        const brandMap = new Map();
        models.forEach((m) => {
          const bName = m.brand;
          if (!brandMap.has(bName)) brandMap.set(bName, []);
          brandMap.get(bName).push(m);
        });
        tree.accessory.push({
          key: sub.id,
          label: `${sub.icon} ${sub.label}`,
          count: models.length,
          href: `sanpham.html?category=accessory&subcat=${encodeURIComponent(sub.id)}`,
          seriesList: Array.from(brandMap.entries()).map(([bTitle, bModels]) => ({
            title: `Thương hiệu ${bTitle}`,
            count: bModels.length,
            href: `sanpham.html?category=accessory&subcat=${encodeURIComponent(sub.id)}&brand=${encodeURIComponent(bTitle)}`,
            models: bModels.slice(0, 4)
          }))
        });
      });

      return tree;
    },

    renderMenuDOM(menu) {
      const tree = this.buildTreeData();
      if (!tree[this.activeGroup] || !tree[this.activeGroup].length) {
        this.activeGroup = 'smartphone';
      }
      const l2Items = tree[this.activeGroup] || [];
      if (!l2Items.some((item) => item.key === this.activeItemKey)) {
        this.activeItemKey = l2Items[0] ? l2Items[0].key : '';
      }
      const activeL2Obj = l2Items.find((item) => item.key === this.activeItemKey) || l2Items[0];

      const groupsHtml = LEVEL1_GROUPS.map((g) => {
        const isAct = g.id === this.activeGroup;
        const totalInGroup = (tree[g.id] || []).reduce((acc, x) => acc + x.count, 0);
        return `
          <a href="${g.href}" class="tp-mega-group-tab ${isAct ? 'is-active' : ''}" data-mega-group="${g.id}" role="tab" aria-selected="${isAct}">
            <span class="tp-mega-group-icon">${g.icon}</span>
            <span class="tp-mega-group-label">${TP.DOM.escapeHtml(g.label)}</span>
            <span class="tp-mega-group-count">${totalInGroup}</span>
          </a>
        `;
      }).join('');

      const level2Html = l2Items.map((item) => {
        const isAct = item.key === this.activeItemKey;
        return `
          <li role="presentation">
            <a href="${item.href}" class="tp-mega-l2-item ${isAct ? 'is-active' : ''}" data-mega-l2="${TP.DOM.escapeHtml(item.key)}" role="menuitem">
              <span class="tp-mega-l2-name">${TP.DOM.escapeHtml(item.label)}</span>
              <span class="tp-mega-l2-meta">
                <span class="tp-mega-l2-badge">${item.count}</span>
                <span aria-hidden="true">›</span>
              </span>
            </a>
          </li>
        `;
      }).join('');

      let level3Html = '';
      if (activeL2Obj) {
        level3Html = `
          <div class="tp-mega-l3-header">
            <div>
              <span class="tp-badge tp-badge-new mb-1">DÒNG SẢN PHẨM CHÍNH HÃNG</span>
              <h4 class="tp-mega-l3-title mb-0">${TP.DOM.escapeHtml(activeL2Obj.label)} (${activeL2Obj.count} sản phẩm)</h4>
            </div>
            <a href="${activeL2Obj.href}" class="tp-btn tp-btn-secondary tp-btn-sm">Xem tất cả ${TP.DOM.escapeHtml(activeL2Obj.label)} →</a>
          </div>
          <div class="tp-mega-l3-series-grid">
            ${activeL2Obj.seriesList.map((s) => `
              <div class="tp-mega-series-box">
                <a href="${s.href}" class="tp-mega-series-link">
                  <strong>${TP.DOM.escapeHtml(s.title)}</strong>
                  <span class="tp-mega-series-count">${s.count} mẫu ›</span>
                </a>
                <ul class="tp-mega-series-models">
                  ${s.models.map((m) => `
                    <li>
                      <a href="chitietsanpham.html?id=${encodeURIComponent(m.id)}" class="tp-mega-model-link">
                        <img src="${TP.DOM.escapeHtml(m.thumbnail)}" alt="" width="28" height="28" loading="lazy">
                        <span class="tp-mega-model-name">${TP.DOM.escapeHtml(m.name)}</span>
                        <span class="tp-mega-model-price">${TP.DOM.formatPrice(m.price)}</span>
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        `;
      }

      menu.innerHTML = `
        <div class="tp-mega-3level-shell">
          <!-- Top / Left Group Switcher (Điện thoại / Máy tính bảng / Phụ kiện) -->
          <div class="tp-mega-group-bar" role="tablist" aria-label="Nhóm danh mục chính">
            ${groupsHtml}
          </div>
          <div class="tp-mega-body-split">
            <!-- Level 2: Brands / Subcategories -->
            <div class="tp-mega-l2-col">
              <div class="tp-mega-col-caption">Thương hiệu / Nhóm hàng</div>
              <ul class="tp-mega-l2-list" role="menu">
                ${level2Html}
              </ul>
            </div>
            <!-- Level 3: Product Series & Featured Models -->
            <div class="tp-mega-l3-col" role="region" aria-label="Dòng sản phẩm chi tiết">
              ${level3Html}
            </div>
          </div>
        </div>
      `;
    },

    init() {
      const trigger = TP.DOM.qs('[data-mega-trigger]');
      const menu = TP.DOM.qs('#tp-mega-menu');
      if (!trigger || !menu || trigger.dataset.bound) return;
      trigger.dataset.bound = 'true';

      const backdrop = document.createElement('div');
      backdrop.className = 'tp-mega-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
      let pinned = false;

      this.renderMenuDOM(menu);
      TP.Events.on('products:loaded', () => this.renderMenuDOM(menu));

      const openMenu = () => {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = null;
        }
        menu.classList.add('is-open');
        document.body.classList.add('tp-mega-open');
        trigger.setAttribute('aria-expanded', 'true');
      };

      const closeMenuImmediate = () => {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = null;
        }
        pinned = false;
        menu.classList.remove('is-open');
        document.body.classList.remove('tp-mega-open');
        trigger.setAttribute('aria-expanded', 'false');
      };

      const scheduleClose = () => {
        if (pinned) return;
        if (this.closeTimer) clearTimeout(this.closeTimer);
        this.closeTimer = setTimeout(() => {
          closeMenuImmediate();
        }, 220);
      };

      const isDesktopHover = () => window.matchMedia('(min-width: 992px) and (hover: hover)').matches;

      // Desktop hover on trigger & menu with smooth hover bridge
      trigger.addEventListener('mouseenter', () => {
        if (isDesktopHover()) openMenu();
      });
      trigger.addEventListener('mouseleave', () => {
        if (isDesktopHover()) scheduleClose();
      });
      menu.addEventListener('mouseenter', () => {
        if (isDesktopHover()) openMenu();
      });
      menu.addEventListener('mouseleave', () => {
        if (isDesktopHover()) scheduleClose();
      });

      // Click toggle on trigger (works on both desktop and mobile/touch)
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pinned) {
          closeMenuImmediate();
        } else {
          pinned = true;
          openMenu();
        }
      });

      // Hover & focus delegation inside menu for Level 1 groups and Level 2 brands
      menu.addEventListener('mouseover', (e) => {
        if (!isDesktopHover()) return;
        const grpBtn = e.target.closest('[data-mega-group]');
        if (grpBtn) {
          const nextGrp = grpBtn.getAttribute('data-mega-group');
          if (nextGrp && nextGrp !== this.activeGroup) {
            this.activeGroup = nextGrp;
            this.activeItemKey = '';
            this.renderMenuDOM(menu);
          }
          return;
        }
        const l2Btn = e.target.closest('[data-mega-l2]');
        if (l2Btn) {
          const nextKey = l2Btn.getAttribute('data-mega-l2');
          if (nextKey && nextKey !== this.activeItemKey) {
            this.activeItemKey = nextKey;
            this.renderMenuDOM(menu);
          }
        }
      });

      menu.addEventListener('focusin', (e) => {
        const grpBtn = e.target.closest('[data-mega-group]');
        if (grpBtn) {
          const nextGrp = grpBtn.getAttribute('data-mega-group');
          if (nextGrp && nextGrp !== this.activeGroup) {
            this.activeGroup = nextGrp;
            this.activeItemKey = '';
            this.renderMenuDOM(menu);
          }
          return;
        }
        const l2Btn = e.target.closest('[data-mega-l2]');
        if (l2Btn) {
          const nextKey = l2Btn.getAttribute('data-mega-l2');
          if (nextKey && nextKey !== this.activeItemKey) {
            this.activeItemKey = nextKey;
            this.renderMenuDOM(menu);
          }
        }
      });

      // Touch / mobile tap handling: first tap on a non-active group/brand switches the panel, second tap navigates
      menu.addEventListener('click', (e) => {
        const isTouchView = !isDesktopHover();
        const grpBtn = e.target.closest('[data-mega-group]');
        if (grpBtn && isTouchView) {
          const nextGrp = grpBtn.getAttribute('data-mega-group');
          if (nextGrp && nextGrp !== this.activeGroup) {
            e.preventDefault();
            this.activeGroup = nextGrp;
            this.activeItemKey = '';
            this.renderMenuDOM(menu);
            return;
          }
        }
        const l2Btn = e.target.closest('[data-mega-l2]');
        if (l2Btn && isTouchView) {
          const nextKey = l2Btn.getAttribute('data-mega-l2');
          if (nextKey && nextKey !== this.activeItemKey) {
            e.preventDefault();
            this.activeItemKey = nextKey;
            this.renderMenuDOM(menu);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
          closeMenuImmediate();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
          closeMenuImmediate();
          trigger.focus();
        }
      });
    }
  };
})(window);
