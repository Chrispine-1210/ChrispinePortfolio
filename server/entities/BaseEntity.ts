/**
 * Base Entity class implementing DDD (Domain-Driven Design) patterns
 * Provides common properties and validation for all domain entities
 */
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Mark entity as modified
   */
  markAsModified(): void {
    this.updatedAt = new Date();
  }

  /**
   * Get entity age in seconds
   */
  getAge(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
  }

  /**
   * Check if entity is stale (older than threshold in seconds)
   */
  isStale(thresholdSeconds: number = 3600): boolean {
    return this.getAge() > thresholdSeconds;
  }
}
