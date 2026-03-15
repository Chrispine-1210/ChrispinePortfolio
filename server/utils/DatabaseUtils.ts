import { Pool } from "@neondatabase/serverless";

/**
 * DatabaseUtils - Connection pooling and database utility functions
 */

export class DatabaseUtils {
  /**
   * Create optimized connection pool
   */
  static createConnectionPool(connectionString: string, options?: any): Pool {
    return new Pool({
      connectionString,
      max: options?.maxConnections || 20,
      idleTimeoutMillis: options?.idleTimeout || 30000,
      connectionTimeoutMillis: options?.connectionTimeout || 2000,
      ...options,
    });
  }

  /**
   * Get database stats - useful for monitoring
   */
  static async getPoolStats(pool: Pool): Promise<{
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
  }> {
    // Note: Neon serverless doesn't expose pool stats
    // This is a placeholder for future implementation
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
    };
  }

  /**
   * Execute query with retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}
