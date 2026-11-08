/**
 * AURIX MOBILE — Product Catalog & Multi-Criteria Filter Service
 * Implements:
 * - Automatic 5-tier Smartphone Price Segment classification (<5M, 5M-<10M, 10M-<15M, 15M-<25M, >=25M)
 * - Multi-brand OR selection + Cross-group AND combination
 * - Special Feature filters (5G-ready, Foldable) independent of price segment
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const PROMO_QUERIES = ['giảm', 'giam', 'khuyến mãi', 'khuyen mai', 'khuyen-mai', 'promo', 'sale', 'ưu đãi', 'uu dai'];

  const PRICE_SEGMENT_DEFS = {
    'entry-level': { id: 'entry-level', label: 'Phổ thông (Dưới 5 triệu)', shortLabel: 'Phổ thông (< 5tr)', min: 0, max: 5000000 },
    'midrange': { id: 'midrange', label: 'Tầm trung (5 – dưới 10 triệu)', shortLabel: 'Tầm trung (5 - 10tr)', min: 5000000, max: 10000000 },
    'upper-midrange': { id: 'upper-midrange', label: 'Cận cao cấp (10 – dưới 15 triệu)', shortLabel: 'Cận cao cấp (10 - 15tr)', min: 10000000, max: 15000000 },
    'high-end': { id: 'high-end', label: 'Cao cấp (15 – dưới 25 triệu)', shortLabel: 'Cao cấp (15 - 25tr)', min: 15000000, max: 25000000 },
    'flagship': { id: 'flagship', label: 'Flagship (Từ 25 triệu trở lên)', shortLabel: 'Flagship (≥ 25tr)', min: 25000000, max: Infinity }
  };

  TP.ProductService = {
    PRICE_SEGMENT_DEFS,
    getProductPrice(product) {
      if (!product) return 0;
      if (Array.isArray(product.variants) && product.variants.length) {
        const prices = product.variants
          .map((v) => v && typeof v.price === 'number' && v.price > 0 ? v.price : null)
          .filter(Boolean);
        if (prices.length) return Math.min(...prices);
      }
      return typeof product.price === 'number' && product.price > 0 ? product.price : 0;
    },
    getProductPriceSegment(product) {
      if (!product || product.category !== 'smartphone') return null;
      const p = this.getProductPrice(product);
      if (p <= 0) return null;
      if (p < 5000000) return 'entry-level';
      if (p < 10000000) return 'midrange';
      if (p < 15000000) return 'upper-midrange';
      if (p < 25000000) return 'high-end';
      return 'flagship';
    },
    isFoldableProduct(product) {
      if (!product) return false;
      if ((product.categoryIds || []).includes('foldable')) return true;
      const nameLow = String(product.name || '').toLowerCase();
      return nameLow.includes('fold') || nameLow.includes('flip') || nameLow.includes('razr') || nameLow.includes('magic v') || nameLow.includes('find n') || nameLow.includes('duo');
    },
    is5GProduct(product) {
      if (!product) return false;
      if ((product.categoryIds || []).includes('5g-ready')) return true;
      const nameLow = String(product.name || '').toLowerCase();
      if (nameLow.includes('5g')) return true;
      const specsStr = JSON.stringify(product.specifications || {}).toLowerCase();
      return specsStr.includes('5g');
    },
    getAll() {
      return TP.ProductRepository.getAll().filter(
        (p) => p && p.status === 'active_listing' && typeof p.price === 'number' && p.price > 0
      );
    },
    getById(id) {
      return TP.ProductRepository.getById(id);
    },
    getFeatured(category = 'smartphone', limit = 12) {
      const all = this.getAll();
      const HIGH_END_PRIORITY_IDS = [
        'iphone-18-pro-max',
        'galaxy-s26-ultra-5g',
        'iphone-duo',
        'galaxy-z-fold8-ultra',
        'xiaomi-18-fold',
        'oppo-find-x9-ultra',
        'vivo-x300-ultra',
        'honor-magic-v5',
        'iphone-18-pro',
        'galaxy-z-fold8',
        'xiaomi-17-ultra-5g',
        'iphone-17-pro-max',
        'galaxy-z-fold7-5g',
        'iphone-16-pro-max',
        'xiaomi-18-pro-max',
        'galaxy-s26-plus-5g'
      ];
      if (!category || category === 'smartphone' || category === 'all') {
        const phones = all.filter((p) => p.category === 'smartphone');
        const byId = new Map(phones.map((p) => [p.id, p]));
        const combined = [];
        HIGH_END_PRIORITY_IDS.forEach((id) => {
          if (byId.has(id) && !combined.includes(byId.get(id))) {
            combined.push(byId.get(id));
          }
        });
        const highEndRest = phones
          .slice()
          .sort((a, b) => (this.getProductPrice(b) || 0) - (this.getProductPrice(a) || 0));
        highEndRest.forEach((p) => {
          if (!combined.includes(p)) combined.push(p);
        });
        return combined.slice(0, limit);
      }
      if (category === 'tablet' || category === 'accessory') {
        return all
          .filter((p) => p.category === category || (p.categoryIds || []).includes(category))
          .sort((a, b) => (this.getProductPrice(b) || 0) - (this.getProductPrice(a) || 0))
          .slice(0, limit);
      }
      return all
        .filter((p) => (p.categoryIds || []).includes(category) || p.category === category)
        .sort((a, b) => (this.getProductPrice(b) || 0) - (this.getProductPrice(a) || 0))
        .slice(0, limit);
    },
    getBestsellers(limit = 12) {
      const phones = this.getAll().filter((p) => p.category === 'smartphone');
      const byId = new Map(phones.map((p) => [p.id, p]));

      // Requirement 4: First 4 products MUST be Apple, followed by 4 Android products
      const PREFERRED_APPLE_IDS = [
        'iphone-18-pro-max',
        'iphone-18-pro',
        'iphone-17-pro-max',
        'iphone-16-pro-max',
        'iphone-17-pro',
        'iphone-16-pro'
      ];
      const PREFERRED_ANDROID_IDS = [
        'galaxy-s26-ultra-5g',
        'galaxy-z-fold7-5g',
        'xiaomi-18-pro-max',
        'oppo-find-x9-ultra',
        'vivo-x300-ultra',
        'honor-magic-v5',
        'galaxy-z-fold8-ultra',
        'xiaomi-18-fold',
        'galaxy-s25-ultra-5g',
        'xiaomi-17-ultra-5g'
      ];

      const appleList = [];
      PREFERRED_APPLE_IDS.forEach((id) => {
        if (byId.has(id) && appleList.length < 4) appleList.push(byId.get(id));
      });
      if (appleList.length < 4) {
        phones
          .filter((p) => p.brandId === 'apple' && !appleList.includes(p))
          .sort((a, b) => (this.getProductPrice(b) || 0) - (this.getProductPrice(a) || 0))
          .forEach((p) => {
            if (appleList.length < 4) appleList.push(p);
          });
      }

      const androidCount = Math.max(0, limit - appleList.length);
      const androidList = [];
      PREFERRED_ANDROID_IDS.forEach((id) => {
        if (byId.has(id) && androidList.length < androidCount) androidList.push(byId.get(id));
      });
      if (androidList.length < androidCount) {
        phones
          .filter((p) => p.brandId !== 'apple' && !androidList.includes(p))
          .sort((a, b) => (this.getProductPrice(b) || 0) - (this.getProductPrice(a) || 0))
          .forEach((p) => {
            if (androidList.length < androidCount) androidList.push(p);
          });
      }

      return appleList.concat(androidList).slice(0, limit);
    },
    getRelated(productId, limit = 4) {
      const current = this.getById(productId);
      const all = this.getAll().filter((p) => p.id !== productId);
      if (!current) return all.slice(0, limit);
      const sameCategory = all.filter((p) => p.category === current.category);
      const sameBrand = sameCategory.filter((p) => p.brandId === current.brandId);
      const otherBrand = sameCategory.filter((p) => p.brandId !== current.brandId);
      return sameBrand.concat(otherBrand).slice(0, limit);
    },
    getBrandsList(category = 'all') {
      const counts = {};
      this.getAll().forEach((p) => {
        if (category && category !== 'all' && p.category !== category && !(p.categoryIds || []).includes(category)) return;
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      });
      return Object.keys(counts);
    },
    filterAndSort(filters = {}) {
      let items = this.getAll();

      // Normalize legacy category values passed via URL (e.g. ?category=flagship or ?category=foldable)
      let cat = filters.category || 'smartphone';
      let priceSegment = filters.priceSegment || 'all';
      let feature = filters.feature || 'all';

      if (PRICE_SEGMENT_DEFS[cat]) {
        priceSegment = cat;
        cat = 'smartphone';
      } else if (cat === 'foldable' || cat === '5g-ready') {
        feature = cat;
        cat = 'smartphone';
      }

      // 1. Category filter (smartphone / tablet / accessory / all)
      if (cat === 'smartphone') {
        items = items.filter((p) => p.category === 'smartphone');
      } else if (cat === 'tablet' || cat === 'accessory' || cat === 'smartwatch') {
        items = items.filter((p) => p.category === cat || (p.categoryIds || []).includes(cat));
      } else if (cat === 'all') {
        // When 'all' is selected and no search query is active, if not explicitly viewing all categories, show all or smartphone
        if (!filters.includeAllCategories && (!filters.q || !String(filters.q).trim())) {
          items = items.filter((p) => p.category === 'smartphone');
        }
      } else {
        items = items.filter(
          (p) => (p.categoryIds || []).includes(cat) || p.category === cat || p.subCategory === cat
        );
      }

      // 2. Price Segment filter (only applies when category is smartphone; supports single string or array of segments)
      const activeSegments = Array.isArray( filters.priceSegments ) && filters.priceSegments.length
        ? filters.priceSegments
        : (priceSegment && priceSegment !== 'all' ? [priceSegment] : []);

      if (activeSegments.length > 0 && (cat === 'smartphone' || cat === 'all')) {
        const segSet = new Set(activeSegments.map((s) => String(s).toLowerCase()));
        items = items.filter((p) => {
          if (p.category !== 'smartphone') return false;
          const pSeg = this.getProductPriceSegment(p);
          return pSeg && segSet.has(pSeg);
        });
      }

      // 3. Special Feature filter (foldable / 5g-ready — supports single or array)
      const activeFeatures = Array.isArray(filters.features) && filters.features.length
        ? filters.features
        : (feature && feature !== 'all' ? [feature] : []);

      if (activeFeatures.length > 0) {
        items = items.filter((p) => {
          return activeFeatures.every((f) => {
            if (f === 'foldable') return this.isFoldableProduct(p);
            if (f === '5g-ready') return this.is5GProduct(p);
            return (p.categoryIds || []).includes(f);
          });
        });
      }

      // 4. SubCategory filter (for accessories: keyboard, cap-sac, cu-sac, pin-sac-du-phong, tai-nghe)
      if (filters.subcat && filters.subcat !== 'all') {
        const subLow = String(filters.subcat).toLowerCase();
        items = items.filter(
          (p) => (p.subCategory || '').toLowerCase() === subLow || (p.categoryIds || []).some((cid) => cid.toLowerCase() === subLow)
        );
      }

      // 5. Series filter (for 3-level mega menu series links)
      if (filters.series && filters.series !== 'all') {
        const sLow = String(filters.series).toLowerCase();
        items = items.filter(
          (p) => (p.series || '').toLowerCase() === sLow || (p.series || '').toLowerCase().includes(sLow) || p.name.toLowerCase().includes(sLow)
        );
      }

      // 6. Multi-Brand filter (OR logic across selected brands, strict separation of Xiaomi, Redmi, POCO)
      let selectedBrands = [];
      if (Array.isArray(filters.brands) && filters.brands.length > 0) {
        selectedBrands = filters.brands
          .map((b) => String(b || '').trim().toLowerCase())
          .filter((b) => b && b !== 'all');
      } else if (filters.brand && filters.brand !== 'all') {
        selectedBrands = String(filters.brand)
          .split(',')
          .map((b) => b.trim().toLowerCase())
          .filter((b) => b && b !== 'all');
      }

      if (selectedBrands.length > 0) {
        const brandSet = new Set(selectedBrands);
        items = items.filter(
          (p) => brandSet.has(String(p.brand || '').toLowerCase()) || brandSet.has(String(p.brandId || '').toLowerCase())
        );
      }

      // 7. Keyword search or Promotion filter (Strict word-token matching so "18 pro" never matches "A18 Pro" on iPhone 16 Pro)
      if (filters.q && String(filters.q).trim()) {
        const q = String(filters.q).trim().toLowerCase();
        if (PROMO_QUERIES.includes(q)) {
          items = items.filter(
            (p) => typeof p.originalPrice === 'number' && typeof p.price === 'number' && p.price > 0 && p.originalPrice > p.price
          );
        } else {
          const normStr = (s) => String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd');

          const qNorm = normStr(q);
          const qTokens = qNorm.split(/[^a-z0-9]+/).filter(Boolean);

          const matchTokensInWords = (words) => {
            if (!qTokens.length) return true;
            return qTokens.every((tk) => {
              if (/^\d+$/.test(tk)) {
                return words.some((w) => w === tk || w === tk + 'g' || w === tk + 't' || w === tk + 's' || w === tk + 'e' || w === tk + 'c' || w === tk + 'x');
              }
              return words.some((w) => w === tk || w.startsWith(tk));
            });
          };

          const titleMatched = items.filter((p) => {
            const titleBlob = normStr([p.name, p.model, p.brand, p.series, (p.id || '').replace(/-/g, ' ')].join(' '));
            const titleWords = titleBlob.split(/[^a-z0-9]+/).filter(Boolean);
            return matchTokensInWords(titleWords);
          });

          if (titleMatched.length > 0) {
            items = titleMatched;
          } else {
            items = items.filter((p) => {
              const specBlob = normStr([p.name, p.brand, p.series, (p.shortSpecs || []).join(' ')].join(' '));
              const specWords = specBlob.split(/[^a-z0-9]+/).filter(Boolean);
              return matchTokensInWords(specWords);
            });
          }
        }
      }

      // 8. Operating System filter
      if (filters.os && filters.os !== 'all') {
        const osLow = String(filters.os).toLowerCase();
        items = items.filter((p) => {
          if (osLow === 'ios') return p.brandId === 'apple' || (p.operatingSystem || '').toLowerCase().includes('ios') || (p.operatingSystem || '').toLowerCase().includes('ipados');
          if (osLow === 'android') return p.brandId !== 'apple';
          return true;
        });
      }

      // 9. Explicit Price Range filter (if used alongside or instead of priceSegment)
      if (filters.priceRange && filters.priceRange !== 'all') {
        items = items.filter((p) => {
          const price = this.getProductPrice(p);
          if (price <= 0) return false;
          if (filters.priceRange === 'under-5m') return price < 5000000;
          if (filters.priceRange === '5m-10m') return price >= 5000000 && price < 10000000;
          if (filters.priceRange === '10m-15m') return price >= 10000000 && price < 15000000;
          if (filters.priceRange === '15m-25m') return price >= 15000000 && price < 25000000;
          if (filters.priceRange === 'above-25m') return price >= 25000000;
          if (filters.priceRange === 'under-10m') return price < 10000000;
          if (filters.priceRange === '10m-20m') return price >= 10000000 && price <= 20000000;
          if (filters.priceRange === '20m-30m') return price > 20000000 && price <= 30000000;
          if (filters.priceRange === 'above-30m') return price > 30000000;
          return true;
        });
      }

      // 10. Storage (ROM) filter
      if (filters.storage && filters.storage !== 'all') {
        const stUp = String(filters.storage).toUpperCase();
        items = items.filter((p) =>
          p.storage === filters.storage ||
          (p.storageOptions || []).some((opt) => opt.label === filters.storage || opt.rom === stUp || String(opt.label).toUpperCase().endsWith('/' + stUp)) ||
          (p.variants || []).some((v) => v.storage === filters.storage || v.rom === stUp || String(v.storage).toUpperCase().endsWith('/' + stUp))
        );
      }

      // 11. RAM filter
      if (filters.ram && filters.ram !== 'all') {
        const ramUp = String(filters.ram).toUpperCase();
        items = items.filter((p) =>
          p.ram === ramUp ||
          (p.variants || []).some((v) => v.ram === ramUp || String(v.storage).toUpperCase().startsWith(ramUp + '/'))
        );
      }

      // 12. Stock / Status filter
      if (filters.stock && filters.stock !== 'all') {
        if (filters.stock === 'in_stock' || filters.stock === 'active_listing') {
          items = items.filter((p) => p.status === 'active_listing' && typeof p.price === 'number' && p.price > 0);
        } else {
          items = items.filter((p) => p.status === filters.stock);
        }
      }

      // 13. Sorting
      const sort = filters.sort || 'featured';
      if (sort === 'price-asc') {
        items.sort((a, b) => (this.getProductPrice(a) || 999999999) - (this.getProductPrice(b) || 999999999));
      } else if (sort === 'price-desc') {
        items.sort((a, b) => (this.getProductPrice(b) || 0) - (this.getProductPrice(a) || 0));
      } else if (sort === 'rating-desc') {
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
      } else if (sort === 'name-asc') {
        items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      } else if (sort === 'newest') {
        items.sort((a, b) => {
          const ya = parseInt((a.rawJson && a.rawJson.overview && a.rawJson.overview.releaseDate) || '0', 10);
          const yb = parseInt((b.rawJson && b.rawJson.overview && b.rawJson.overview.releaseDate) || '0', 10);
          return yb - ya || (a.featuredOrder || 999) - (b.featuredOrder || 999);
        });
      } else {
        const PRIORITY_SMARTPHONE_ORDER = {
          'iphone-18-pro-max': 1,
          'iphone-18-pro': 2,
          'iphone-duo': 3,
          'iphone-17-pro-max': 4,
          'iphone-17-pro': 5,
          'iphone-17': 6,
          'iphone-air': 7,
          'iphone-17e': 8,
          'iphone-16-pro-max': 9,
          'iphone-16-pro': 10,
          'galaxy-s26-ultra-5g': 11,
          'galaxy-s26-plus-5g': 12,
          'galaxy-s26-5g': 13,
          'galaxy-z-fold8-ultra': 14,
          'galaxy-z-fold8': 15,
          'galaxy-z-fold7-5g': 16,
          'xiaomi-18-pro-max': 17,
          'xiaomi-18-pro': 18,
          'xiaomi-18-fold': 19,
          'oppo-find-x9-ultra': 20,
          'vivo-x300-ultra': 21,
          'honor-magic-v5': 22
        };
        items.sort((a, b) => {
          const pa = PRIORITY_SMARTPHONE_ORDER[a.id] || 999;
          const pb = PRIORITY_SMARTPHONE_ORDER[b.id] || 999;
          if (pa !== pb) return pa - pb;
          const isIp18A = String(a.series || a.name || '').toLowerCase().includes('iphone 18') ? 0 : 1;
          const isIp18B = String(b.series || b.name || '').toLowerCase().includes('iphone 18') ? 0 : 1;
          if (isIp18A !== isIp18B) return isIp18A - isIp18B;
          const ma = (a.images && a.images.length > 1) ? 0 : 1;
          const mb = (b.images && b.images.length > 1) ? 0 : 1;
          const fa = a.featuredOrder || 999;
          const fb = b.featuredOrder || 999;
          if (fa !== fb && (fa < 100 || fb < 100)) return fa - fb;
          if (ma !== mb) return ma - mb;
          return a.name.localeCompare(b.name, 'vi');
        });
      }

      return items;
    },
    findMatchingVariant(product, colorName, storageLabel) {
      if (!product || !Array.isArray(product.variants) || !product.variants.length) return null;
      const exact = product.variants.find(
        (v) => (!colorName || v.color === colorName) && (!storageLabel || v.storage === storageLabel)
      );
      if (exact) return exact;
      const byStorage = product.variants.find((v) => storageLabel && v.storage === storageLabel);
      if (byStorage) return byStorage;
      const byColor = product.variants.find((v) => colorName && v.color === colorName);
      return byColor || product.variants[0];
    },
    calculateVariantPrice(product, storageLabel, colorName) {
      if (!product) return 0;
      const matched = this.findMatchingVariant(product, colorName, storageLabel);
      if (matched && typeof matched.price === 'number' && matched.price > 0) {
        return matched.price;
      }
      return typeof product.price === 'number' && product.price > 0 ? product.price : 0;
    },
    getGalleryForColor(product, colorName) {
      if (!product) return [];
      if (colorName && product.imagesByColor && Array.isArray(product.imagesByColor[colorName]) && product.imagesByColor[colorName].length) {
        return product.imagesByColor[colorName].slice();
      }
      const colorObj = (product.colors || []).find((c) => c.name === colorName);
      if (colorObj && Array.isArray(colorObj.gallery) && colorObj.gallery.length) {
        return colorObj.gallery.slice();
      }
      return Array.isArray(product.images) && product.images.length ? product.images.slice() : [product.thumbnail];
    }
  };
})(window);
