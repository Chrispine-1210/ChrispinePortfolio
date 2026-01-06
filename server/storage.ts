import { Pool } from "@neondatabase/serverless";
import {
  users,
  blogPosts,
  portfolioProjects,
  newsletterSubscribers,
  contactRequests,
  blogLikes,
  blogComments,
  type User,
  type BlogPost,
  type PortfolioProject,
  type NewsletterSubscriber,
  type ContactRequest,
  type InsertUser,
  type InsertBlogPost,
  type InsertPortfolioProject,
  type InsertNewsletterSubscriber,
  type InsertContactRequest,
  type BlogLike,
  type BlogComment,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, desc, and, or, like } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByReplitSub(sub: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPremiumStatus(id: string, isPremium: boolean, stripeSubscriptionId?: string): Promise<User | undefined>;

  // Blog Posts
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getRecentBlogPosts(limit?: number): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(data: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<void>;

  // Portfolio Projects
  getAllProjects(): Promise<PortfolioProject[]>;
  getFeaturedProjects(): Promise<PortfolioProject[]>;
  getProjectBySlug(slug: string): Promise<PortfolioProject | undefined>;
  createProject(data: InsertPortfolioProject): Promise<PortfolioProject>;
  updateProject(id: string, data: Partial<InsertPortfolioProject>): Promise<PortfolioProject | undefined>;
  deleteProject(id: string): Promise<void>;

  // Newsletter
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  updateNewsletterSubscriberStatus(email: string, isActive: boolean): Promise<NewsletterSubscriber | undefined>;

  // Contact Requests
  getAllContactRequests(): Promise<ContactRequest[]>;
  getContactRequest(id: string): Promise<ContactRequest | undefined>;
  createContactRequest(data: InsertContactRequest): Promise<ContactRequest>;
  updateContactRequestStatus(id: string, isRead: boolean): Promise<ContactRequest | undefined>;

  // Blog Engagement
  getBlogLikes(blogPostId: string): Promise<number>;
  getUserBlogLike(blogPostId: string, userId: string): Promise<BlogLike | undefined>;
  toggleBlogLike(blogPostId: string, userId: string): Promise<void>;
  getBlogComments(blogPostId: string): Promise<(BlogComment & { user: User })[]>;
  createBlogComment(data: any): Promise<BlogComment>;
  deleteBlogComment(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByReplitSub(sub: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.replitSub, sub)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...data,
      isAdmin: data.email === "chrispinemndala@gmail.com" // Set initial admin
    }).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserPremiumStatus(id: string, isPremium: boolean, stripeSubscriptionId?: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isPremium, stripeSubscriptionId })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Blog Posts
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getRecentBlogPosts(limit: number = 6): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return result[0];
  }

  async createBlogPost(data: any): Promise<BlogPost> {
    const result = await db.insert(blogPosts).values(data).returning();
    return result[0];
  }

  async updateBlogPost(id: string, data: any): Promise<BlogPost | undefined> {
    const result = await db.update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
    return result[0];
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // Portfolio Projects
  async getAllProjects(): Promise<PortfolioProject[]> {
    return await db.select().from(portfolioProjects).orderBy(desc(portfolioProjects.featured), desc(portfolioProjects.id));
  }

  async getFeaturedProjects(): Promise<PortfolioProject[]> {
    return await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.featured, true))
      .orderBy(desc(portfolioProjects.id));
  }

  async getProjectBySlug(slug: string): Promise<PortfolioProject | undefined> {
    const result = await db.select().from(portfolioProjects).where(eq(portfolioProjects.slug, slug)).limit(1);
    return result[0];
  }

  async createProject(data: InsertPortfolioProject): Promise<PortfolioProject> {
    const result = await db.insert(portfolioProjects).values(data).returning();
    return result[0];
  }

  async updateProject(id: string, data: Partial<InsertPortfolioProject>): Promise<PortfolioProject | undefined> {
    const result = await db.update(portfolioProjects).set(data).where(eq(portfolioProjects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(portfolioProjects).where(eq(portfolioProjects.id, id));
  }

  // Newsletter
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const result = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
    return result[0];
  }

  async createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const result = await db.insert(newsletterSubscribers).values(data).returning();
    return result[0];
  }

  async updateNewsletterSubscriberStatus(email: string, isActive: boolean): Promise<NewsletterSubscriber | undefined> {
    const result = await db
      .update(newsletterSubscribers)
      .set({ isActive })
      .where(eq(newsletterSubscribers.email, email))
      .returning();
    return result[0];
  }

  // Contact Requests
  async getAllContactRequests(): Promise<ContactRequest[]> {
    return await db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt));
  }

  async getContactRequest(id: string): Promise<ContactRequest | undefined> {
    const result = await db.select().from(contactRequests).where(eq(contactRequests.id, id)).limit(1);
    return result[0];
  }

  async createContactRequest(data: InsertContactRequest): Promise<ContactRequest> {
    const result = await db.insert(contactRequests).values(data).returning();
    return result[0];
  }

  async updateContactRequestStatus(id: string, isRead: boolean): Promise<ContactRequest | undefined> {
    const result = await db.update(contactRequests).set({ isRead }).where(eq(contactRequests.id, id)).returning();
    return result[0];
  }

  // Blog Engagement Implementation
  async getBlogLikes(blogPostId: string): Promise<number> {
    const result = await db.select().from(blogLikes).where(eq(blogLikes.blogPostId, blogPostId));
    return result.length;
  }

  async getUserBlogLike(blogPostId: string, userId: string): Promise<BlogLike | undefined> {
    const [like] = await db
      .select()
      .from(blogLikes)
      .where(and(eq(blogLikes.blogPostId, blogPostId), eq(blogLikes.userId, userId)))
      .limit(1);
    return like;
  }

  async toggleBlogLike(blogPostId: string, userId: string): Promise<void> {
    const existing = await this.getUserBlogLike(blogPostId, userId);
    if (existing) {
      await db.delete(blogLikes).where(eq(blogLikes.id, existing.id));
    } else {
      await db.insert(blogLikes).values({ blogPostId, userId });
    }
  }

  async getBlogComments(blogPostId: string): Promise<(BlogComment & { user: User })[]> {
    const comments = await db
      .select({
        comment: blogComments,
        user: users,
      })
      .from(blogComments)
      .innerJoin(users, eq(blogComments.userId, users.id))
      .where(eq(blogComments.blogPostId, blogPostId))
      .orderBy(desc(blogComments.createdAt));

    return comments.map(c => ({
      ...c.comment,
      user: c.user,
    }));
  }

  async createBlogComment(data: any): Promise<BlogComment> {
    const [comment] = await db.insert(blogComments).values(data).returning();
    return comment;
  }

  async deleteBlogComment(id: string, userId: string): Promise<void> {
    await db.delete(blogComments).where(and(eq(blogComments.id, id), eq(blogComments.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
