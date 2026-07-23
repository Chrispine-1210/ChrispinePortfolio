import { Router } from "express";
import { seedBlogPosts, seedPortfolioProjects } from "./seed-data.js";

export function setupSeedRoutes(router: Router) {
  // Get seed blog content for enriching database
  router.get("/api/content/blogs/seed", (req, res) => {
    try {
      res.json({ blogs: seedBlogPosts });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seed blogs" });
    }
  });

  // Get seed portfolio content
  router.get("/api/content/projects/seed", (req, res) => {
    try {
      res.json({ projects: seedPortfolioProjects });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seed projects" });
    }
  });
}
