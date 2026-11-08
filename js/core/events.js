/**
 * TechPhone — Central Pub/Sub Event Bus
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  const listeners = {};

  TP.Events = {
    on(eventName, handler) {
      if (!listeners[eventName]) listeners[eventName] = new Set();
      listeners[eventName].add(handler);
      return () => this.off(eventName, handler);
    },
    off(eventName, handler) {
      if (listeners[eventName]) {
        listeners[eventName].delete(handler);
      }
    },
    emit(eventName, payload) {
      if (listeners[eventName]) {
        listeners[eventName].forEach((fn) => {
          try {
            fn(payload);
          } catch (err) {
            console.error('[TechPhone Event Error]', eventName, err);
          }
        });
      }
    }
  };

})(window);
