/**
 * AURIX MOBILE — Image Resolver & Manifest Service (Section 3.4 & 5)
 * Resolves verified real product images from assets/data/image-manifest.json with graceful placeholder fallback.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  const DEFAULT_PLACEHOLDER = 'assets/images/placeholders/placeholder-default.svg';
  const manifestMap = new Map();

  TP.ImageResolver = {
    loadFromManifestObject(manifestDoc) {
      if (!manifestDoc || !Array.isArray(manifestDoc.entries)) return;
      manifestDoc.entries.forEach((entry) => {
        if (entry && entry.productId) {
          manifestMap.set(entry.productId, entry);
        }
      });
    },
    async init() {
      if (TP.IMAGE_MANIFEST_SNAPSHOT) {
        this.loadFromManifestObject(TP.IMAGE_MANIFEST_SNAPSHOT);
      }
      try {
        const res = await fetch(TP.CONFIG.DATA_PATHS.IMAGE_MANIFEST);
        if (res.ok) {
          const data = await res.json();
          this.loadFromManifestObject(data);
        }
      } catch (e) {
        // Offline / file:// fallback already hydrated from snapshot
      }
    },
    resolvePrimary(productId, fallbackPath) {
      if (productId === 'iphone-18-pro-max') {
        return 'assets/images/products/apple/iphone-18-pro-max/anh-dai-dien-iphone-18-pro-max-do-ruou-vang.webp';
      }
      const item = manifestMap.get(productId);
      if (item && item.primaryImage) return item.primaryImage;
      return fallbackPath || DEFAULT_PLACEHOLDER;
    },
    resolveGallery(productId, fallbackList = []) {
      const item = manifestMap.get(productId);
      if (item && Array.isArray(item.galleryImages) && item.galleryImages.length) {
        return item.galleryImages.slice();
      }
      return fallbackList.length ? fallbackList : [DEFAULT_PLACEHOLDER];
    },
    resolveAlt(productId, defaultName = 'Điện thoại AURIX MOBILE') {
      const item = manifestMap.get(productId);
      return (item && item.altText) || defaultName;
    },
    getPlaceholder() {
      return DEFAULT_PLACEHOLDER;
    }
  };

  if (TP.IMAGE_MANIFEST_SNAPSHOT) {
    TP.ImageResolver.loadFromManifestObject(TP.IMAGE_MANIFEST_SNAPSHOT);
  }
})(window);
