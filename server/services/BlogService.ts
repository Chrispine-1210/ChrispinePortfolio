import { IStorage } from "../storage";
import { InsertBlogPost, BlogPost } from "../../shared/schema";
import { BlogPostEntity } from "../entities/BlogPostEntity";
import { ValidationError, NotFoundError } from "../errors/AppError";

/**
 * BlogService - Business logic layer for blog operations
 * Implements the Service pattern and domain-driven design
 */
export class BlogService {
  constructor(private storage: IStorage) {}

  /**
   * Create a new blog post with validation
   */
  async createPost(data: InsertBlogPost): Promise<BlogPost> {
    // Validate input
    const entity = new BlogPostEntity({
      id: "",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BlogPost);

    const validation = entity.validate();
    if (!validation.isValid) {
      throw new ValidationError("Invalid blog post data", validation.errors);
    }

    // Check for duplicate slug
    const existing = await this.storage.getBlogPostBySlug(data.slug);
    if (existing) {
      throw new ValidationError("Slug already exists", { slug: data.slug });
    }

    return this.storage.createBlogPost(data);
  }

  /**
   * Get post by slug with access control
   */
  async getPostBySlug(slug: string, isPremiumUser: boolean = false): Promise<BlogPost> {
    const post = await this.storage.getBlogPostBySlug(slug);
    if (!post) {
      throw new NotFoundError("BlogPost", slug);
    }

    const entity = new BlogPostEntity(post);
    if (!entity.isAccessibleTo(isPremiumUser)) {
      throw new ValidationError("This post requires premium access");
    }

    return post;
  }

  /**
   * Get all published posts with caching consideration
   */
  async getPublishedPosts(limit?: number): Promise<BlogPost[]> {
    return this.storage.getRecentBlogPosts(limit);
  }

  /**
   * Publish a post
   */
  async publishPost(id: string): Promise<BlogPost> {
    const posts = await this.storage.getAllBlogPosts();
    const post = posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundError("BlogPost", id);
    }

    const entity = new BlogPostEntity(post);
    entity.publish();

    return this.storage.updateBlogPost(id, {
      isPublished: true,
      publishedAt: entity.publishedAt,
    });
  }

  /**
   * Unpublish a post
   */
  async unpublishPost(id: string): Promise<BlogPost> {
    const posts = await this.storage.getAllBlogPosts();
    const post = posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundError("BlogPost", id);
    }

    const entity = new BlogPostEntity(post);
    entity.unpublish();

    return this.storage.updateBlogPost(id, { isPublished: false });
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    const posts = await this.storage.getAllBlogPosts();
    const post = posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundError("BlogPost", id);
    }

    await this.storage.deleteBlogPost(id);
  }
}
