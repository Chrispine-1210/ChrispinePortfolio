import { Router, type Request, type Response } from "express";
import { storage } from "./storage.js";
import { requireAdminPermission } from "./custom-auth.js";

const createContent = requireAdminPermission("content.create");
const updateContent = requireAdminPermission("content.update");
const deleteContent = requireAdminPermission("content.delete");
const managePortfolio = requireAdminPermission("portfolio.manage");
const readContent = requireAdminPermission("content.read");
const readAnalytics = requireAdminPermission("analytics.read");
import {
  insertBlogPostSchema,
  insertPortfolioProjectSchema,
  insertNewsletterSubscriberSchema,
  insertContactRequestSchema,
  insertBlogCommentSchema,
  insertEmailTemplateSchema,
  insertExternalPostSchema,
} from "../shared/schema.js";
import Stripe from "stripe";
import { seedBlogPosts, seedPortfolioProjects } from "./seed-data.js";

const fallbackBlogPosts = seedBlogPosts.map((post, index) => ({
  ...post,
  id: `seed-blog-${index + 1}`,
  featuredImage: null,
  isPremium: false,
  isPublished: true,
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const fallbackPortfolioProjects = seedPortfolioProjects.map((project, index) => ({
  ...project,
  id: `seed-project-${index + 1}`,
  challenge: project.challenge ?? null,
  solution: project.solution ?? null,
  outcome: project.outcome ?? null,
  techStack: project.techStack ?? [],
  featuredImage: null,
  images: project.images ?? [],
  liveUrl: project.liveUrl ?? null,
  githubUrl: null,
  featured: project.featured ?? false,
  order: project.order ?? index,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

// Note: Middleware utilities created but router uses standard patterns for now
// const { sendResponse, sendError, ApiError, asyncHandler, requirePremium } from "./middleware";
// These will be integrated in next phase

const router = Router();

// Blog routes - with caching headers
router.get("/api/blog", async (req: Request, res: Response) => {
  try {
    // Set cache headers for better performance
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 min cache
    let posts = hasDatabase()
      ? await storage.getPublishedBlogPosts()
      : fallbackBlogPosts;
    
    // Apply filters
    const { category, search, premium } = req.query;
    
    if (category && typeof category === "string") {
      posts = posts.filter(p => p.category === category);
    }
    
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower) ||
        (p.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (premium === "true") {
      posts = posts.filter(p => p.isPremium);
    } else if (premium === "false") {
      posts = posts.filter(p => !p.isPremium);
    }
    
    // For premium posts in collection, omit content entirely (use excerpt for preview)
    const user = (req as any).user;
    if (!user?.claims?.sub) {
      posts = posts.map(post => {
        if (post.isPremium) {
          const { content, ...postWithoutContent } = post;
          return postWithoutContent as any; // Omit full content, excerpt is preview
        }
        return post;
      });
    }
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

router.get("/api/blog/recent", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
    let posts = hasDatabase()
      ? await storage.getRecentBlogPosts(limit)
      : fallbackBlogPosts.slice(0, limit);
    
    // For premium posts, omit content entirely (use excerpt for preview)
    const user = (req as any).user;
    if (!user?.claims?.sub) {
      posts = posts.map(post => {
        if (post.isPremium) {
          const { content, ...postWithoutContent } = post;
          return postWithoutContent as any; // Omit full content, excerpt is preview
        }
        return post;
      });
    }
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    res.status(500).json({ message: "Failed to fetch recent posts" });
  }
});

router.get("/api/blog/:slug", async (req: Request, res: Response) => {
  try {
    const post = hasDatabase()
      ? await storage.getPublishedBlogPostBySlug(req.params.slug)
      : fallbackBlogPosts.find((item) => item.slug === req.params.slug);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Enforce premium content access control
    const user = (req as any).user;
    if (post.isPremium && !user?.claims?.sub) {
      return res.status(403).json({ 
        message: "Premium subscription required to access this content",
        isPremium: true,
        excerpt: post.excerpt,
      });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ message: "Failed to fetch blog post" });
  }
});

router.post("/api/blog", createContent, async (req: Request, res: Response) => {
  try {
    const data = insertBlogPostSchema.parse(req.body);
    const post = await storage.createBlogPost(data);
    res.json(post);
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create blog post" });
  }
});

router.put("/api/blog/:id", updateContent, async (req: Request, res: Response) => {
  try {
    const data = insertBlogPostSchema.partial().parse(req.body);
    const post = await storage.updateBlogPost(req.params.id, data);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update blog post" });
  }
});

router.delete("/api/blog/:id", deleteContent, async (req: Request, res: Response) => {
  try {
    await storage.deleteBlogPost(req.params.id);
    res.json({ message: "Blog post deleted" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ message: "Failed to delete blog post" });
  }
});

// Portfolio routes
router.get("/api/portfolio", async (req: Request, res: Response) => {
  try {
    // Set cache headers for portfolio
    res.setHeader("Cache-Control", "public, max-age=300");
    let projects = hasDatabase()
      ? await storage.getAllProjects()
      : fallbackPortfolioProjects;
    
    // Apply filters
    const { category, search, featured } = req.query;
    
    if (category && typeof category === "string") {
      projects = projects.filter(p => p.category === category);
    }
    
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        (p.techStack || []).some(tech => tech.toLowerCase().includes(searchLower))
      );
    }
    
    if (featured === "true") {
      projects = projects.filter(p => p.featured);
    } else if (featured === "false") {
      projects = projects.filter(p => !p.featured);
    }
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.get("/api/portfolio/featured", async (req: Request, res: Response) => {
  try {
    const projects = hasDatabase()
      ? await storage.getFeaturedProjects()
      : fallbackPortfolioProjects.filter((project) => project.featured);
    res.json(projects);
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    res.status(500).json({ message: "Failed to fetch featured projects" });
  }
});

router.get("/api/portfolio/:slug", async (req: Request, res: Response) => {
  try {
    const project = hasDatabase()
      ? await storage.getProjectBySlug(req.params.slug)
      : fallbackPortfolioProjects.find((item) => item.slug === req.params.slug);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

router.post("/api/portfolio", managePortfolio, async (req: Request, res: Response) => {
  try {
    const data = insertPortfolioProjectSchema.parse(req.body);
    const project = await storage.createProject(data);
    res.json(project);
  } catch (error: any) {
    console.error("Error creating project:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create project" });
  }
});

router.put("/api/portfolio/:id", managePortfolio, async (req: Request, res: Response) => {
  try {
    const data = insertPortfolioProjectSchema.partial().parse(req.body);
    const project = await storage.updateProject(req.params.id, data);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error: any) {
    console.error("Error updating project:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update project" });
  }
});

router.delete("/api/portfolio/:id", managePortfolio, async (req: Request, res: Response) => {
  try {
    await storage.deleteProject(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

// Newsletter routes
router.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
  try {
    const data = insertNewsletterSubscriberSchema.parse(req.body);

    // Check if already subscribed
    const existing = await storage.getNewsletterSubscriberByEmail(data.email);
    if (existing) {
      if (!existing.isActive) {
        // Resubscribe
        await storage.updateNewsletterSubscriberStatus(data.email, true);
        return res.json({ message: "Resubscribed successfully" });
      }
      return res.status(400).json({ message: "Already subscribed" });
    }

    const subscriber = await storage.createNewsletterSubscriber(data);
    res.json(subscriber);
  } catch (error: any) {
    console.error("Error subscribing to newsletter:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

// Contact routes
router.post("/api/contact", async (req: Request, res: Response) => {
  try {
    const data = insertContactRequestSchema.parse(req.body);
    const request = await storage.createContactRequest(data);
    res.json(request);
  } catch (error: any) {
    console.error("Error creating contact request:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to submit contact request" });
  }
});

// Blog Engagement Routes
router.get("/api/blog/:id/likes", async (req, res) => {
  const count = await storage.getBlogLikes(req.params.id);
  const user = (req as any).user;
  let isLiked = false;
  // Likes remain readable without requiring a platform-specific identity provider.
  res.json({ count, isLiked });
});

router.get("/api/blog/:id/comments", async (req, res) => {
  const comments = await storage.getBlogComments(req.params.id);
  res.json(comments);
});

// Admin Routes
router.get("/api/admin/stats", readAnalytics, async (_req, res) => {
  const posts = await storage.getAllBlogPosts();
  const subscribers = await storage.getNewsletterSubscribers();
  const contacts = await storage.getAllContactRequests();

  res.json({
    totalPosts: posts.length,
    totalSubscribers: subscribers.length,
    totalContacts: contacts.length,
  });
});

router.post("/api/create-payment-intent", async (req: Request, res: Response) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Server-side pricing - don't trust client
    const amount = 9; // $9/month

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
});

// Email Templates routes
router.get("/api/email-templates", readContent, async (req: Request, res: Response) => {
  try {
    const templates = await storage.getActiveEmailTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

router.post("/api/email-templates", createContent, async (req: Request, res: Response) => {
  try {
    const data = insertEmailTemplateSchema.parse(req.body);
    const template = await storage.createEmailTemplate(data);
    res.json(template);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create template" });
  }
});

// External Posts routes (returns mock data until table exists)
router.get("/api/external-posts", async (req: Request, res: Response) => {
  try {
    const mockPosts = [
      {
        id: "1",
        title: "Building Scalable MEL Systems",
        source: "LinkedIn",
        url: "https://linkedin.com",
        excerpt: "Insights on designing robust monitoring and evaluation frameworks.",
        featuredImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
        publishedAt: new Date(),
        category: "MEL",
        embedCode: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    res.json(mockPosts);
  } catch (error) {
    console.error("Error fetching external posts:", error);
    res.json([]);
  }
});

// Webhook to handle successful payments (raw body required)
router.post("/api/stripe-webhook", async (req: Request, res: Response) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing signature");
    }

    const event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;

      // Upgrade user to premium
      await storage.updateUserPremiumStatus(userId, true);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Webhook error");
  }
});

export default router;
