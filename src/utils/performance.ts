interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly MAX_METRICS_PER_NAME = 100;

  startTimer(name: string): string {
    const id = `${name}_${Date.now()}_${Math.random()}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const nameMetrics = this.metrics.get(name)!;
    nameMetrics.push(metric);

    // Keep only recent metrics
    if (nameMetrics.length > this.MAX_METRICS_PER_NAME) {
      nameMetrics.shift();
    }

    return id;
  }

  endTimer(id: string): number {
    const [name] = id.split('_').slice(0, -2);
    const nameMetrics = this.metrics.get(name);
    
    if (!nameMetrics) {
      throw new Error(`No metrics found for ${name}`);
    }

    const metric = nameMetrics.find(m => `${m.name}_${m.startTime}` === id.slice(0, -17));
    if (!metric) {
      throw new Error(`Metric not found: ${id}`);
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    return metric.duration;
  }

  getAverageTime(name: string): number {
    const metrics = this.metrics.get(name) || [];
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return 0;
    }

    const total = completedMetrics.reduce((sum, m) => sum + m.duration!, 0);
    return total / completedMetrics.length;
  }

  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return null;
}