/**
 * AURIX MOBILE — Safe LocalStorage & SessionStorage Service
 * - Uses localStorage for persistent accounts, user avatars, user-scoped carts (including item selection state), and orders.
 * - Uses sessionStorage (plus navigation handoff fallback for file://) for active login session, returnUrl, and checkout intent.
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});
  const localMemFallback = new Map();
  const sessionMemFallback = new Map();

  function safeGetLocal(key, defaultValue = null) {
    try {
      const raw = global.localStorage.getItem(key);
      if (raw !== null && raw !== undefined) {
        return JSON.parse(raw);
      }
    } catch (e) {
      // Fallback to in-memory map if localStorage is restricted
    }
    return localMemFallback.has(key) ? localMemFallback.get(key) : defaultValue;
  }

  function safeSetLocal(key, value) {
    localMemFallback.set(key, value);
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeRemoveLocal(key) {
    localMemFallback.delete(key);
    try {
      global.localStorage.removeItem(key);
    } catch (e) {}
  }

  function safeGetSession(key, defaultValue = null) {
    try {
      const raw = global.sessionStorage.getItem(key);
      if (raw !== null && raw !== undefined) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return sessionMemFallback.has(key) ? sessionMemFallback.get(key) : defaultValue;
  }

  function safeSetSession(key, value) {
    sessionMemFallback.set(key, value);
    try {
      global.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeRemoveSession(key) {
    sessionMemFallback.delete(key);
    try {
      global.sessionStorage.removeItem(key);
    } catch (e) {}
  }

  TP.StorageService = {
    get: safeGetLocal,
    set: safeSetLocal,
    remove: safeRemoveLocal,
    getSession: safeGetSession,
    setSession: safeSetSession,
    removeSession: safeRemoveSession,
    clearAurixData() {
      const lKeys = Object.values((TP.CONFIG && TP.CONFIG.STORAGE_KEYS) || {});
      lKeys.forEach((k) => safeRemoveLocal(k));
      const sKeys = Object.values((TP.CONFIG && TP.CONFIG.SESSION_STORAGE_KEYS) || {});
      sKeys.forEach((k) => safeRemoveSession(k));
      if (TP.Events && typeof TP.Events.emit === 'function') {
        TP.Events.emit('storage:cleared', {});
      }
    },
    clearTechPhoneData() {
      this.clearAurixData();
    }
  };
})(window);
