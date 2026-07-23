import { BaseEntity } from "./BaseEntity";
import { BlogPost } from "../../shared/schema";

/**
 * BlogPost Domain Entity
 * Rich entity with business logic and validation
 */
export class BlogPostEntity extends BaseEntity {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  isPublished: boolean;
  readTimeMinutes: number;
  publishedAt?: Date;

  constructor(data: BlogPost) {
    super(data.id, data.createdAt, data.updatedAt);
    this.title = data.title;
    this.slug = data.slug;
    this.excerpt = data.excerpt;
    this.content = data.content;
    this.category = data.category;
    this.tags = data.tags || [];
    this.isPremium = data.isPremium;
    this.isPublished = data.isPublished;
    this.readTimeMinutes = data.readTimeMinutes;
    this.publishedAt = data.publishedAt;
  }

  /**
   * Check if post is accessible to user
   */
  isAccessibleTo(isPremiumUser: boolean): boolean {
    if (!this.isPublished) return false;
    if (this.isPremium && !isPremiumUser) return false;
    return true;
  }

  /**
   * Publish the post
   */
  publish(): void {
    if (this.isPublished) {
      throw new Error("Post is already published");
    }
    this.isPublished = true;
    this.publishedAt = new Date();
    this.markAsModified();
  }

  /**
   * Unpublish the post
   */
  unpublish(): void {
    if (!this.isPublished) {
      throw new Error("Post is already unpublished");
    }
    this.isPublished = false;
    this.markAsModified();
  }

  /**
   * Validate post content
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.length < 3) {
      errors.push("Title must be at least 3 characters");
    }

    if (!this.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.slug)) {
      errors.push("Invalid slug format");
    }

    if (!this.excerpt || this.excerpt.length < 10) {
      errors.push("Excerpt must be at least 10 characters");
    }

    if (!this.content || this.content.length < 50) {
      errors.push("Content must be at least 50 characters");
    }

    if (!this.category) {
      errors.push("Category is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
