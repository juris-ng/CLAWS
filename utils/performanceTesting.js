
export const PerformanceTesting = {
  // Measure app startup time
  measureStartupTime: () => {
    const startTime = Date.now();
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[Performance] App startup time: ${duration}ms`);
      if (duration > 3000) {
        console.warn('⚠️ App startup is slow (>3s)');
      }
      return duration;
    };
  },

  // Measure screen render time
  measureScreenRender: (screenName) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Performance] ${screenName} render time: ${duration.toFixed(2)}ms`);
      if (duration > 500) {
        console.warn(`⚠️ ${screenName} render is slow (>500ms)`);
      }
      return duration;
    };
  },

  // Measure API call time
  measureApiCall: async (apiFunction, apiName) => {
    const startTime = performance.now();
    try {
      const result = await apiFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Performance] ${apiName} API call: ${duration.toFixed(2)}ms`);
      if (duration > 2000) {
        console.warn(`⚠️ ${apiName} API call is slow (>2s)`);
      }
      return { result, duration };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`[Performance] ${apiName} API call failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },

  // Check memory usage (React Native)
  checkMemoryUsage: () => {
    if (__DEV__) {
      console.log('[Performance] Memory usage check - use React DevTools Profiler');
    }
  },

  // Measure FPS (basic)
  measureFPS: () => {
    let lastTime = performance.now();
    let frames = 0;
    let fps = 60;

    const measure = () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        console.log(`[Performance] FPS: ${fps}`);
        if (fps < 50) {
          console.warn('⚠️ Low FPS detected (<50)');
        }
        frames = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  },

  // Network speed test
  testNetworkSpeed: async () => {
    const startTime = performance.now();
    try {
      const response = await fetch('https://httpbin.org/bytes/1024', { method: 'GET' });
      await response.arrayBuffer();
      const endTime = performance.now();
      const duration = endTime - startTime;
      const speedKbps = (1024 / duration) * 1000;
      console.log(`[Performance] Network speed: ${speedKbps.toFixed(2)} KB/s`);
      return speedKbps;
    } catch (error) {
      console.error('[Performance] Network speed test failed', error);
      return 0;
    }
  },

  // Generate performance report
  generateReport: async () => {
    console.log('\n============================================');
    console.log('📊 PERFORMANCE REPORT');
    console.log('============================================\n');

    // Test network
    const networkSpeed = await PerformanceTesting.testNetworkSpeed();
    console.log(`Network Speed: ${networkSpeed.toFixed(2)} KB/s`);

    console.log('\n============================================\n');
  },
};
