import { Request, Response, NextFunction } from "express";

export interface AnalyticsEvent {
  eventType: string;
  route: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 1000;

  recordEvent(event: AnalyticsEvent) {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getEvents(filter?: { type?: string; hours?: number }): AnalyticsEvent[] {
    let filtered = [...this.events];

    if (filter?.type) {
      filtered = filtered.filter(e => e.eventType === filter.type);
    }

    if (filter?.hours) {
      const cutoff = new Date(Date.now() - filter.hours * 60 * 60 * 1000);
      filtered = filtered.filter(e => e.timestamp > cutoff);
    }

    return filtered;
  }

  getStats() {
    const recentEvents = this.getEvents({ hours: 24 });
    const errorCount = recentEvents.filter(e => e.error).length;
    const totalRequests = recentEvents.length;
    const avgResponseTime = recentEvents.length > 0
      ? recentEvents.reduce((sum, e) => sum + e.duration, 0) / recentEvents.length
      : 0;

    return {
      totalRequests,
      errorCount,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) + '%' : '0%',
      lastUpdated: new Date(),
    };
  }

  reset() {
    this.events = [];
  }
}

export const analytics = new Analytics();

// Middleware to record analytics
export function analyticsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    analytics.recordEvent({
      eventType: req.path.startsWith('/api') ? 'API_REQUEST' : 'PAGE_VIEW',
      route: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      userId: (req as any).user?.id,
      error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
    });
  });

  next();
}
