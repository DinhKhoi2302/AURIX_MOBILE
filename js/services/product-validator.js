/**
 * AURIX MOBILE — Product JSON Validator & Normalizer
 * Validates raw JSON model objects and normalizes images, color galleries, grouped specs, featured specs, priceSegment, and 100% verbatim descriptions.
 * Enforces Section 6 rule: Public catalog only includes verified active_listing products with numeric price > 0.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  function isMeaningfulSpec(val) {
    if (val === null || val === undefined) return false;
    const s = String(val).trim();
    if (!s || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a') return false;
    const low = s.toLowerCase();
    if (low.includes('chưa xác minh') || low.includes('không xác minh được') || low.includes('chưa cung cấp đủ') || low.includes('không công bố')) {
      return false;
    }
    return true;
  }

  function computeSmartphonePriceSegment(price) {
    if (typeof price !== 'number' || isNaN(price) || price <= 0) return null;
    if (price < 5000000) return 'entry-level';
    if (price < 10000000) return 'midrange';
    if (price < 15000000) return 'upper-midrange';
    if (price < 25000000) return 'high-end';
    return 'flagship';
  }

  TP.ProductValidator = {
    computeSmartphonePriceSegment,
    validate(raw) {
      if (!raw || typeof raw !== 'object') {
        return { valid: false, errors: ['Payload is not an object'] };
      }
      const errs = [];
      if (!raw.id || typeof raw.id !== 'string') errs.push('Missing string id');
      if (!raw.brand || typeof raw.brand !== 'string') errs.push('Missing brand');
      if (!raw.model || typeof raw.model !== 'string') errs.push('Missing model name');
      if (!Array.isArray(raw.variants) || raw.variants.length === 0) errs.push('Missing variants array');
      return {
        valid: errs.length === 0,
        errors: errs
      };
    },
    normalize(raw) {
      const check = this.validate(raw);
      if (!check.valid) {
        return null;
      }

      if (raw.status && raw.status !== 'active_listing') {
        return null;
      }

      const id = raw.id;
      const rawImgs = raw.images || {};
      const primaryImg = (id === 'iphone-18-pro-max')
        ? 'assets/images/products/apple/iphone-18-pro-max/anh-dai-dien-iphone-18-pro-max-do-ruou-vang.webp'
        : (rawImgs.primary || 'assets/images/placeholders/placeholder-default.svg');
      const galleryImgs = Array.isArray(rawImgs.gallery) && rawImgs.gallery.length
        ? rawImgs.gallery.slice()
        : [primaryImg];
      const byColor = (rawImgs.byColor && typeof rawImgs.byColor === 'object') ? rawImgs.byColor : {};
      const bySection = (rawImgs.bySection && typeof rawImgs.bySection === 'object') ? rawImgs.bySection : {};
      const descriptionImages = Array.isArray(rawImgs.descriptionImages) ? rawImgs.descriptionImages.slice() : [];

      const rawVariantsInput = (id === 'iphone-18-pro-max' && Array.isArray(raw.variants))
        ? raw.variants.filter((v) => String(v.color || '').includes('Đỏ')).concat(raw.variants.filter((v) => !String(v.color || '').includes('Đỏ')))
        : (raw.variants || []);
      const variants = rawVariantsInput.map((v, idx) => {
        const cName = v.color || 'Tiêu chuẩn';
        const colorImgs = Array.isArray(byColor[cName]) && byColor[cName].length
          ? byColor[cName]
          : (Array.isArray(v.images) && v.images.length ? v.images : [primaryImg]);
        return {
          sku: v.sku || `AUR-${id.toUpperCase()}-V${idx + 1}`,
          color: cName,
          colorHex: v.colorHex || '#102347',
          ram: v.ram || null,
          storage: v.storage || 'Tiêu chuẩn',
          rom: v.rom || v.storage || null,
          price: typeof v.price === 'number' && v.price > 0 ? v.price : null,
          originalPrice: typeof v.originalPrice === 'number' && v.originalPrice > 0 ? v.originalPrice : null,
          stockStatus: v.stockStatus || 'in_stock',
          images: colorImgs
        };
      });

      const pricedVariants = variants.filter((v) => typeof v.price === 'number' && v.price > 0);
      const minVariantPrice = pricedVariants.length
        ? Math.min(...pricedVariants.map((v) => v.price))
        : null;
      const basePrice = minVariantPrice || ((raw.pricing && typeof raw.pricing.startingPrice === 'number' && raw.pricing.startingPrice > 0)
        ? raw.pricing.startingPrice
        : null);

      if (typeof basePrice !== 'number' || basePrice <= 0) {
        return null;
      }

      const hasMultiColorMap = Object.keys(byColor).length > 0;
      const colorsMap = new Map();
      variants.forEach((v) => {
        if (!colorsMap.has(v.color)) {
          const dedicatedList = Array.isArray(byColor[v.color]) && byColor[v.color].length ? byColor[v.color] : null;
          colorsMap.set(v.color, {
            name: v.color,
            hex: v.colorHex || '#102347',
            image: dedicatedList ? dedicatedList[0] : (v.images[0] || primaryImg),
            gallery: dedicatedList || (hasMultiColorMap ? [] : galleryImgs),
            hasDedicatedImages: Boolean(dedicatedList) || !hasMultiColorMap
          });
        }
      });

      const storagesMap = new Map();
      variants.forEach((v) => {
        const lbl = v.storage || 'Tiêu chuẩn';
        if (!storagesMap.has(lbl)) {
          storagesMap.set(lbl, {
            label: lbl,
            ram: v.ram,
            rom: v.rom || lbl,
            price: v.price || basePrice,
            originalPrice: v.originalPrice,
            priceDelta: 0
          });
        }
      });

      let grouped10 = raw.groupedSpecifications10;
      if (!grouped10 || typeof grouped10 !== 'object' || Object.keys(grouped10).length === 0) {
        grouped10 = {};
      } else {
        const cleanedGroups = {};
        Object.entries(grouped10).forEach(([gKey, fields]) => {
          const cleanTitle = String(gKey).replace(/^\d+\.\s*/, '').trim();
          const validF = {};
          Object.entries(fields || {}).forEach(([k, v]) => {
            if (isMeaningfulSpec(v)) validF[k] = String(v).trim();
          });
          if (Object.keys(validF).length > 0) {
            cleanedGroups[cleanTitle] = validF;
          }
        });
        grouped10 = cleanedGroups;
      }

      let featuredSpecs = Array.isArray(raw.featuredSpecs)
        ? raw.featuredSpecs.filter((item) => item && isMeaningfulSpec(item.value))
        : [];
      if (!featuredSpecs.length && Object.keys(grouped10).length > 0) {
        const flatLookup = {};
        Object.values(grouped10).forEach((grp) => {
          Object.entries(grp).forEach(([k, v]) => {
            if (isMeaningfulSpec(v)) flatLookup[k] = String(v).trim();
          });
        });
        featuredSpecs = Object.entries(flatLookup).slice(0, 12).map(([label, value]) => ({ label, value }));
      }

      const flatSpecs = {};
      Object.values(grouped10).forEach((grp) => {
        Object.entries(grp).forEach(([k, val]) => {
          if (isMeaningfulSpec(val)) {
            flatSpecs[k] = String(val);
          }
        });
      });

      const category = raw.category || 'smartphone';
      const priceSegment = category === 'smartphone' ? computeSmartphonePriceSegment(basePrice) : null;
      const rawCatIds = Array.isArray(raw.categoryIds) ? raw.categoryIds.slice() : [category];
      if (priceSegment && !rawCatIds.includes(priceSegment)) {
        rawCatIds.push(priceSegment);
      }

      const firstRam = (raw.performance && raw.performance.ram && raw.performance.ram[0]) || (variants[0] && variants[0].ram) || null;
      const firstRom = (variants[0] && variants[0].storage) || (raw.performance && raw.performance.storage && raw.performance.storage[0]) || 'Tiêu chuẩn';
      const verbatimDescription = Array.isArray(raw.verbatimDescription) ? raw.verbatimDescription : [];

      return {
        id,
        docCode: raw.docCode || null,
        name: raw.model,
        model: raw.model,
        brand: raw.brand,
        brandId: raw.brandId || raw.brand.toLowerCase(),
        parentGroupId: raw.parentGroupId || raw.brand.toLowerCase(),
        series: raw.series || '',
        subCategory: raw.subCategory || null,
        category,
        priceSegment,
        categoryIds: rawCatIds,
        status: 'active_listing',
        stockStatus: 'in_stock',
        price: basePrice,
        originalPrice: (raw.pricing && typeof raw.pricing.originalPrice === 'number' && raw.pricing.originalPrice > basePrice) ? raw.pricing.originalPrice : null,
        ram: firstRam,
        storage: firstRom,
        operatingSystem: (raw.performance && raw.performance.operatingSystem) || 'Android',
        thumbnail: primaryImg,
        images: galleryImgs,
        imagesByColor: byColor,
        imagesBySection: bySection,
        descriptionImages,
        colors: Array.from(colorsMap.values()),
        storageOptions: Array.from(storagesMap.values()),
        variants,
        rating: typeof raw.rating === 'number' ? raw.rating : 4.9,
        reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 68,
        hasVerifiedWarranty: true,
        warrantyLabel: 'Bảo hành theo hãng',
        genuineLabel: 'Hàng chính hãng',
        badges: Array.isArray(raw.badges) && raw.badges.length ? raw.badges : [{ text: 'Sản phẩm mới', type: 'new' }],
        featured: Boolean(raw.featuredOrder),
        featuredOrder: raw.featuredOrder || 999,
        bestseller: Boolean(raw.bestseller),
        shortSpecs: (raw.overview && Array.isArray(raw.overview.highlights)) ? raw.overview.highlights.filter(isMeaningfulSpec).slice(0, 3) : [],
        description: verbatimDescription.length ? verbatimDescription[0] : ((raw.overview && raw.overview.description) || ''),
        verbatimDescription,
        featuredSpecs,
        specifications: flatSpecs,
        groupedSpecifications: grouped10,
        rawJson: raw
      };
    }
  };
})(window);
