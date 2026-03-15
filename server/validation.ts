import { z } from "zod";

// Input sanitization & validation utilities
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, "").slice(0, 1000);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100;
};

// Zod validation schemas with performance constraints
export const createBlogSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(50).max(50000),
  category: z.enum(["MEL", "Programming", "Career", "Networking", "AI & Data", "Leadership", "Hardware Engineering", "Infrastructure"]),
  tags: z.array(z.string().max(50)).max(10),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isPremium: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  featuredImage: z.string().url().optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.string().max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isFeatured: z.boolean().default(false),
  technologies: z.array(z.string()).max(20),
  image: z.string().url().optional(),
});

export const createNewsletterSchema = z.object({
  email: z.string().email().max(254),
  firstName: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export const createContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
});
