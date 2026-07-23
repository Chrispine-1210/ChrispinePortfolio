import { Router, Request, Response } from "express";
import { storage } from "./storage.js";

export function setupFilteringRoutes(router: Router) {
  // Advanced blog search with pagination
  router.get("/api/blog/search", async (req: Request, res: Response) => {
    try {
      const {
        q = "",
        category = "",
        page = "1",
        limit = "12",
        sort = "newest",
      } = req.query;

      let posts = await storage.getPublishedBlogPosts();

      // Filter by search query
      if (q && typeof q === "string") {
        const searchLower = q.toLowerCase();
        posts = posts.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.excerpt.toLowerCase().includes(searchLower) ||
            (p.tags || []).some((tag) =>
              tag.toLowerCase().includes(searchLower)
            )
        );
      }

      // Filter by category
      if (category && typeof category === "string" && category !== "All") {
        posts = posts.filter((p) => p.category === category);
      }

      // Sort
      if (sort === "oldest") {
        posts.sort(
          (a, b) =>
            new Date(a.publishedAt || 0).getTime() -
            new Date(b.publishedAt || 0).getTime()
        );
      } else {
        posts.sort(
          (a, b) =>
            new Date(b.publishedAt || 0).getTime() -
            new Date(a.publishedAt || 0).getTime()
        );
      }

      // Paginate
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
      const startIdx = (pageNum - 1) * limitNum;
      const paginatedPosts = posts.slice(startIdx, startIdx + limitNum);

      res.json({
        data: paginatedPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limitNum),
          hasNextPage: startIdx + limitNum < posts.length,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Advanced portfolio search with pagination
  router.get("/api/portfolio/search", async (req: Request, res: Response) => {
    try {
      const {
        q = "",
        category = "",
        page = "1",
        limit = "12",
        featured = "",
      } = req.query;

      let projects = await storage.getAllProjects();

      // Filter by search query
      if (q && typeof q === "string") {
        const searchLower = q.toLowerCase();
        projects = projects.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            (p.techStack || []).some((tech) =>
              tech.toLowerCase().includes(searchLower)
            )
        );
      }

      // Filter by category
      if (category && typeof category === "string" && category !== "All") {
        projects = projects.filter((p) => p.category === category);
      }

      // Filter by featured
      if (featured === "true") {
        projects = projects.filter((p) => p.featured);
      }

      // Sort by order
      projects.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Paginate
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
      const startIdx = (pageNum - 1) * limitNum;
      const paginatedProjects = projects.slice(startIdx, startIdx + limitNum);

      res.json({
        data: paginatedProjects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: projects.length,
          totalPages: Math.ceil(projects.length / limitNum),
          hasNextPage: startIdx + limitNum < projects.length,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get all categories
  router.get("/api/categories/blog", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      const categories = Array.from(
        new Set(posts.map((p) => p.category))
      ).sort();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all portfolio categories
  router.get(
    "/api/categories/portfolio",
    async (req: Request, res: Response) => {
      try {
        const projects = await storage.getAllProjects();
        const categories = Array.from(
          new Set(projects.map((p) => p.category))
        ).sort();
        res.json({ categories });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch categories" });
      }
    }
  );
}
