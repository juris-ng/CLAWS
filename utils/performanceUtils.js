import { InteractionManager } from 'react-native';

export const PerformanceUtils = {
  // Defer non-critical tasks until after animations
  runAfterInteractions: (callback) => {
    return InteractionManager.runAfterInteractions(callback);
  },

  // Debounce function (useful for search inputs)
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function (useful for scroll events)
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Batch state updates
  batchUpdates: (updates) => {
    // React Native batches updates automatically in event handlers
    // But this can be useful for manual batching
    return Promise.all(updates);
  },

  // Measure component render time
  measureRender: (componentName) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`[${componentName}] Render time: ${endTime - startTime}ms`);
    };
  },

  // Lazy load images
  preloadImages: async (imageUrls) => {
    const promises = imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
    });
    return Promise.all(promises);
  },
};
