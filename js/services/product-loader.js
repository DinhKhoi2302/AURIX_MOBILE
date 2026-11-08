/**
 * AURIX MOBILE — Asynchronous JSON Product Loader (Section 5.1)
 * 1. Hydrates immediately from snapshot so initial synchronous render has 0 layout shift.
 * 2. Fetches assets/data/catalog.json and individual model JSON files over HTTP (VS Code Live Server) to verify live JSON files.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.ProductLoader = {
    isLoaded: false,
    loadPromise: null,

    hydrateFromSnapshot() {
      if (TP.ProductRepository.count() > 0) return;
      const snapModels = TP.JSON_MODELS_SNAPSHOT || {};
      Object.values(snapModels).forEach((rawObj) => {
        const norm = TP.ProductValidator.normalize(rawObj);
        if (norm) TP.ProductRepository.upsert(norm);
      });
      TP.ProductRepository.rebuildIndex();
    },

    async loadCatalogAndModels() {
      if (this.loadPromise) return this.loadPromise;

      this.hydrateFromSnapshot();

      this.loadPromise = (async () => {
        try {
          await TP.ImageResolver.init();
          const catRes = await fetch(TP.CONFIG.DATA_PATHS.CATALOG);
          if (!catRes.ok) throw new Error('HTTP ' + catRes.status);
          const catalogJson = await catRes.json();
          const entries = Array.isArray(catalogJson.models) ? catalogJson.models : [];

          // Fetch individual JSON files in controlled parallel batches when running on HTTP server
          const batchSize = 32;
          for (let i = 0; i < entries.length; i += batchSize) {
            const slice = entries.slice(i, i + batchSize);
            await Promise.all(
              slice.map(async (item) => {
                if (!item || !item.jsonPath) return;
                try {
                  const r = await fetch(item.jsonPath);
                  if (r.ok) {
                    const modelRaw = await r.json();
                    const norm = TP.ProductValidator.normalize(modelRaw);
                    if (norm) TP.ProductRepository.upsert(norm);
                  }
                } catch (innerErr) {
                  // Keep snapshot version for this model if single fetch fails
                }
              })
            );
          }

          TP.ProductRepository.rebuildIndex();
          this.isLoaded = true;
          TP.Events.emit('products:loaded', { total: TP.ProductRepository.count() });
        } catch (err) {
          // Running via file:// or offline: snapshot already hydrated 160 models
          this.isLoaded = true;
          TP.Events.emit('products:loaded', { total: TP.ProductRepository.count(), mode: 'snapshot_fallback' });
        }
        return TP.ProductRepository.getAll();
      })();

      return this.loadPromise;
    }
  };

  // Perform immediate synchronous hydration from snapshot so all synchronous callers work out-of-the-box
  TP.ProductLoader.hydrateFromSnapshot();
})(window);
