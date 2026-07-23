import { IStorage } from "../storage";
import { InsertNewsletterSubscriber, NewsletterSubscriber } from "../../shared/schema";
import { ValidationError, ConflictError, NotFoundError } from "../errors/AppError";

/**
 * NewsletterService - Business logic for newsletter subscriptions
 */
export class NewsletterService {
  constructor(private storage: IStorage) {}

  /**
   * Subscribe to newsletter with validation
   */
  async subscribe(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError("Invalid email address");
    }

    // Check if already subscribed
    const existing = await this.storage.getNewsletterSubscriberByEmail(data.email);
    if (existing) {
      if (existing.isActive) {
        throw new ConflictError("Email is already subscribed");
      }
      // Reactivate subscription
      const updated = await this.storage.updateNewsletterSubscriberStatus(data.email, true);
      if (!updated) throw new NotFoundError("NewsletterSubscriber", data.email);
      return updated;
    }

    return this.storage.createNewsletterSubscriber(data);
  }

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribe(email: string): Promise<NewsletterSubscriber | undefined> {
    return this.storage.updateNewsletterSubscriberStatus(email, false);
  }

  /**
   * Get all active subscribers
   */
  async getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
    const subscribers = await this.storage.getNewsletterSubscribers();
    return subscribers.filter((s) => s.isActive);
  }

  /**
   * Get subscriber by email
   */
  async getSubscriber(email: string): Promise<NewsletterSubscriber | undefined> {
    return this.storage.getNewsletterSubscriberByEmail(email);
  }

  /**
   * Get subscription statistics
   */
  async getStats(): Promise<{ total: number; active: number; inactive: number }> {
    const subscribers = await this.storage.getNewsletterSubscribers();
    const active = subscribers.filter((s) => s.isActive).length;

    return {
      total: subscribers.length,
      active,
      inactive: subscribers.length - active,
    };
  }
}
