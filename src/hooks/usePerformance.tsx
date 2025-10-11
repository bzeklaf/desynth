import { useEffect, useCallback, useRef } from 'react';

// Performance monitoring hook
export const usePerformance = () => {
  const performanceRef = useRef<{
    navigationStart?: number;
    loadComplete?: number;
    renderStart?: number;
    renderComplete?: number;
  }>({});

  useEffect(() => {
    // Mark navigation start
    performanceRef.current.navigationStart = performance.now();
    
    // Mark when DOM content is loaded
    const handleDOMContentLoaded = () => {
      performanceRef.current.loadComplete = performance.now();
    };

    // Mark when page is fully loaded
    const handleLoad = () => {
      const loadTime = performance.now() - (performanceRef.current.navigationStart || 0);
      
      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        console.log('Page load time:', loadTime, 'ms');
      }
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production' && loadTime > 0) {
        // TODO: Send to analytics service
        logPerformanceMetric('page_load_time', loadTime);
      }
    };

    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    window.addEventListener('load', handleLoad);

    return () => {
      document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const markRenderStart = useCallback(() => {
    performanceRef.current.renderStart = performance.now();
  }, []);

  const markRenderComplete = useCallback((componentName?: string) => {
    const renderTime = performance.now() - (performanceRef.current.renderStart || 0);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName || 'Component'} render time:`, renderTime, 'ms');
    }
    
    if (process.env.NODE_ENV === 'production' && renderTime > 100) {
      logPerformanceMetric('slow_render', renderTime, { component: componentName });
    }
  }, []);

  const measureAsync = useCallback(async function<T>(
    name: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await asyncOperation();
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${name} duration:`, duration, 'ms');
      }
      
      if (duration > 1000) { // Log slow operations
        logPerformanceMetric('slow_operation', duration, { operation: name });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logPerformanceMetric('failed_operation', duration, { operation: name, error: String(error) });
      throw error;
    }
  }, []);

  return {
    markRenderStart,
    markRenderComplete,
    measureAsync
  };
};

// Performance logging utility
const logPerformanceMetric = (
  metric: string,
  value: number,
  metadata?: Record<string, any>
) => {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with analytics service (e.g., Google Analytics, Mixpanel)
    console.log('Performance metric:', { metric, value, metadata, timestamp: Date.now() });
  }
};

// Web Vitals monitoring
export const useWebVitals = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        
        if (lastEntry) {
          logPerformanceMetric('lcp', lastEntry.startTime);
        }
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Browser doesn't support LCP
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            logPerformanceMetric('fid', fid);
          }
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Browser doesn't support FID
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Browser doesn't support CLS
      }

      // Report CLS when the page is unloaded
      const reportCLS = () => {
        logPerformanceMetric('cls', clsValue);
      };

      window.addEventListener('beforeunload', reportCLS);

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        window.removeEventListener('beforeunload', reportCLS);
      };
    }
  }, []);
};