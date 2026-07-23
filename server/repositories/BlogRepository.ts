import { IStorage } from "../storage.js";
import { BlogPost, InsertBlogPost } from "../../shared/schema.js";

/**
 * BlogRepository - Data access abstraction layer
 * Implements the Repository pattern for separation of concerns
 */
export class BlogRepository {
  constructor(private storage: IStorage) {}

  async findAll(): Promise<BlogPost[]> {
    return this.storage.getAllBlogPosts();
  }

  async findPublished(): Promise<BlogPost[]> {
    return this.storage.getPublishedBlogPosts();
  }

  async findRecent(limit: number = 10): Promise<BlogPost[]> {
    return this.storage.getRecentBlogPosts(limit);
  }

  async findBySlug(slug: string): Promise<BlogPost | undefined> {
    return this.storage.getBlogPostBySlug(slug);
  }

  async findById(id: string): Promise<BlogPost | undefined> {
    const posts = await this.findAll();
    return posts.find((p) => p.id === id);
  }

  async findByCategory(category: string): Promise<BlogPost[]> {
    const posts = await this.findPublished();
    return posts.filter((p) => p.category === category);
  }

  async findByTag(tag: string): Promise<BlogPost[]> {
    const posts = await this.findPublished();
    return posts.filter((p) => (p.tags || []).includes(tag));
  }

  async create(data: InsertBlogPost): Promise<BlogPost> {
    return this.storage.createBlogPost(data);
  }

  async update(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    return this.storage.updateBlogPost(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.storage.deleteBlogPost(id);
  }

  /**
   * Count posts by category
   */
  async countByCategory(): Promise<Record<string, number>> {
    const posts = await this.findPublished();
    const counts: Record<string, number> = {};

    posts.forEach((post) => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    const posts = await this.findPublished();
    const tagSet = new Set<string>();

    posts.forEach((post) => {
      (post.tags || []).forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }
}
