import { Router, Request, Response } from "express";
import { storage } from "./storage.js";
import { seedBlogPosts, seedPortfolioProjects } from "./seed-data.js";
import { logger } from "./logger.js";
import { adminMiddleware } from "./custom-auth.js";

export function setupSeedTriggerRoutes(router: Router) {
  // Admin-only endpoint to seed database with rich content
  router.post("/api/admin/seed-database", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const results = {
        blogsAdded: 0,
        projectsAdded: 0,
        errors: [] as string[],
      };

      // Seed blog posts
      for (const blog of seedBlogPosts) {
        try {
          // Check if already exists
          const existing = await storage.getBlogPostBySlug(blog.slug);
          if (!existing) {
            await storage.createBlogPost({
              ...blog,
              publishedAt: new Date(),
              isPublished: true,
              isPremium: false,
            });
            results.blogsAdded++;
            logger.info(`Seeded blog: ${blog.slug}`);
          }
        } catch (error) {
          results.errors.push(`Blog ${blog.slug}: ${error}`);
          logger.error(`Failed to seed blog ${blog.slug}:`, error);
        }
      }

      // Seed portfolio projects
      for (const project of seedPortfolioProjects) {
        try {
          // Check if already exists
          const existing = await storage.getProjectBySlug(project.slug);
          if (!existing) {
            await storage.createProject(project);
            results.projectsAdded++;
            logger.info(`Seeded project: ${project.slug}`);
          }
        } catch (error) {
          results.errors.push(`Project ${project.slug}: ${error}`);
          logger.error(`Failed to seed project ${project.slug}:`, error);
        }
      }

      res.json({
        message: "Database seeding completed",
        ...results,
      });
    } catch (error) {
      logger.error("Database seeding failed:", error);
      res.status(500).json({ message: "Seeding failed", error });
    }
  });

  // Check seed status
  router.get("/api/admin/seed-status", async (req: Request, res: Response) => {
    try {
      const blogs = await storage.getPublishedBlogPosts();
      const projects = await storage.getAllProjects();

      const seedBlogs = seedBlogPosts.map((b) => b.slug);
      const seedProjects = seedPortfolioProjects.map((p) => p.slug);

      const seededBlogs = blogs.filter((b) => seedBlogs.includes(b.slug));
      const seededProjects = projects.filter((p) => seedProjects.includes(p.slug));

      res.json({
        totalBlogsSeeded: seededBlogs.length,
        totalProjectsSeeded: seededProjects.length,
        expectedBlogs: seedBlogPosts.length,
        expectedProjects: seedPortfolioProjects.length,
        blogSlugs: seededBlogs.map((b) => b.slug),
        projectSlugs: seededProjects.map((p) => p.slug),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check seed status" });
    }
  });
}
