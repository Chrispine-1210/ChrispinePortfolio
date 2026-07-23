import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/Logger.js";

/**
 * RequestProfiler - Middleware for tracking request performance
 * Measures request duration, memory usage, and logs detailed metrics
 */

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  memoryDelta: number;
  timestamp: Date;
}

export class RequestProfiler {
  private static metrics: RequestMetrics[] = [];
  private static maxMetrics: number = 1000;

  static middleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    const requestId = (req as any).requestId;

    // Capture response
    const originalJson = res.json;
    res.json = function (body: any) {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;

      const metrics: RequestMetrics = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        memoryDelta,
        timestamp: new Date(),
      };

      RequestProfiler.addMetrics(metrics);

      // Log slow requests (>1000ms)
      if (duration > 1000) {
        logger.warn(`Slow request detected: ${req.method} ${req.path}`, {
          requestId,
          duration,
          statusCode: res.statusCode,
        });
      }

      return originalJson.call(this, body);
    };

    next();
  };

  static addMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  static getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  static getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  static getMetricsByPath(): Record<string, { count: number; avgDuration: number }> {
    const pathMetrics: Record<string, { count: number; totalDuration: number }> = {};

    this.metrics.forEach((m) => {
      if (!pathMetrics[m.path]) {
        pathMetrics[m.path] = { count: 0, totalDuration: 0 };
      }
      pathMetrics[m.path].count++;
      pathMetrics[m.path].totalDuration += m.duration;
    });

    const result: Record<string, { count: number; avgDuration: number }> = {};
    Object.entries(pathMetrics).forEach(([path, data]) => {
      result[path] = {
        count: data.count,
        avgDuration: Math.round(data.totalDuration / data.count),
      };
    });

    return result;
  }

  static reset(): void {
    this.metrics = [];
  }
}
