/**
 * EventEmitter - Simple event-driven pattern for decoupled event handling
 * Implements Observer pattern for analytics and logging
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;

export class EventEmitter {
  private static listeners: Map<string, EventHandler[]> = new Map();

  /**
   * Register event listener
   */
  static on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const handlers = this.listeners.get(event)!;
    handlers.push(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Register one-time event listener
   */
  static once<T = any>(event: string, handler: EventHandler<T>): () => void {
    const wrappedHandler = async (data: T) => {
      await handler(data);
      unsubscribe();
    };

    const unsubscribe = this.on(event, wrappedHandler);
    return unsubscribe;
  }

  /**
   * Emit event
   */
  static async emit<T = any>(event: string, data: T): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    await Promise.all(handlers.map((handler) => handler(data)));
  }

  /**
   * Remove all listeners for an event
   */
  static removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count
   */
  static listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
}

// Event types for type safety
export const AppEvents = {
  BLOG_CREATED: "blog:created",
  BLOG_PUBLISHED: "blog:published",
  BLOG_DELETED: "blog:deleted",
  PROJECT_CREATED: "project:created",
  PROJECT_DELETED: "project:deleted",
  USER_CREATED: "user:created",
  USER_PREMIUM_UPDATED: "user:premium:updated",
} as const;
