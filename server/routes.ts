import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "./storage.js";
import { requireAdminPermission } from "./custom-auth.js";

const createContent = requireAdminPermission("content.create");
const updateContent = requireAdminPermission("content.update");
const readContent = requireAdminPermission("content.read");
const readAnalytics = requireAdminPermission("analytics.read");
import {
  insertNewsletterSubscriberSchema,
  insertContactRequestSchema,
  insertBlogCommentSchema,
  insertEmailTemplateSchema,
  insertExternalPostSchema,
  type BlogPost,
} from "../shared/schema.js";
import Stripe from "stripe";
import { seedBlogPosts } from "./seed-data.js";
import {
  enqueueContactAutomation,
  enqueueNewsletterWelcome,
} from "./email/automations.js";
import { createLeadFromContact } from "./crm/lead-service.js";
import { getPublicCaseStudyBySlug, listPublicCaseStudies } from "./portfolio/public-case-study-service.js";

const fallbackBlogPosts: BlogPost[] = seedBlogPosts.map((post, index) => ({
  ...post,
  id: `seed-blog-${index + 1}`,
  featuredImage: null,
  isPremium: false,
  isPublished: true,
  workflowStatus: "published",
  scheduledAt: null,
  approvedAt: new Date(),
  authorId: null,
  editorId: null,
  approverId: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  ogImage: null,
  visibility: "public",
  currentVersion: 1,
  archivedAt: null,
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

// Note: Middleware utilities created but router uses standard patterns for now
// const { sendResponse, sendError, ApiError, asyncHandler, requirePremium } from "./middleware.js";
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
      posts = posts.filter((p) => p.category === category);
    }

    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.excerpt.toLowerCase().includes(searchLower) ||
          (p.tags || []).some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    if (premium === "true") {
      posts = posts.filter((p) => p.isPremium);
    } else if (premium === "false") {
      posts = posts.filter((p) => !p.isPremium);
    }

    // For premium posts in collection, omit content entirely (use excerpt for preview)
    const user = (req as any).user;
    if (!user?.claims?.sub) {
      posts = posts.map((post) => {
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
      posts = posts.map((post) => {
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
  res
    .status(410)
    .json({ message: "This endpoint has moved to /api/admin/content/posts" });
});

router.put(
  "/api/blog/:id",
  updateContent,
  async (req: Request, res: Response) => {
    res
      .status(410)
      .json({
        message: "This endpoint has moved to /api/admin/content/posts/:id",
      });
  },
);

router.delete(
  "/api/blog/:id",
  requireAdminPermission("content.delete"),
  async (req: Request, res: Response) => {
    res.status(410).json({ message: "Permanent deletion is disabled; archive the post through the content workflow" });
  },
);

// Public case-study routes. Only published, evidence-approved case studies are returned.
router.get("/api/portfolio", async (req: Request, res: Response) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=300");
    let projects = await listPublicCaseStudies();
    const { category, search, featured } = req.query;
    if (category && typeof category === "string") {
      projects = projects.filter((project) => project.category === category);
    }
    if (search && typeof search === "string") {
      const query = search.toLowerCase();
      projects = projects.filter((project) =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        (project.techStack || []).some((technology) => technology.toLowerCase().includes(query))
      );
    }
    if (featured === "true") projects = projects.filter((project) => project.featured);
    if (featured === "false") projects = projects.filter((project) => !project.featured);
    res.json(projects);
  } catch (error) {
    console.error("Error fetching public case studies:", error);
    res.status(500).json({ message: "Failed to fetch case studies" });
  }
});

router.get("/api/portfolio/featured", async (_req: Request, res: Response) => {
  try {
    const projects = (await listPublicCaseStudies()).filter((project) => project.featured);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(projects);
  } catch (error) {
    console.error("Error fetching featured case studies:", error);
    res.status(500).json({ message: "Failed to fetch featured case studies" });
  }
});

router.get("/api/portfolio/:slug", async (req: Request, res: Response) => {
  try {
    const project = await getPublicCaseStudyBySlug(req.params.slug);
    if (!project) return res.status(404).json({ message: "Case study not found" });
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(project);
  } catch (error) {
    console.error("Error fetching case study:", error);
    res.status(500).json({ message: "Failed to fetch case study" });
  }
});

// Legacy portfolio mutations are disabled. Internal projects and public case
// studies now have separate governed administrative endpoints.
router.post("/api/portfolio", requireAdminPermission("portfolio.manage"), (_req, res) => {
  res.status(410).json({ message: "Use /api/admin/projects or /api/admin/case-studies" });
});
router.put("/api/portfolio/:id", requireAdminPermission("portfolio.manage"), (_req, res) => {
  res.status(410).json({ message: "Use /api/admin/projects/:id or /api/admin/case-studies/:id" });
});
router.delete("/api/portfolio/:id", requireAdminPermission("portfolio.manage"), (_req, res) => {
  res.status(410).json({ message: "Permanent deletion is disabled; archive governed records instead" });
});

// Newsletter routes
router.post(
  "/api/newsletter/subscribe",
  async (req: Request, res: Response) => {
    try {
      const data = insertNewsletterSubscriberSchema.parse(req.body);

      // Check if already subscribed
      const existing = await storage.getNewsletterSubscriberByEmail(data.email);
      if (existing) {
        if (!existing.isActive) {
          // Resubscribe
          await storage.updateNewsletterSubscriberStatus(data.email, true);
          await enqueueNewsletterWelcome(existing).catch((error) =>
            console.error(
              "Failed to enqueue newsletter welcome automation",
              error,
            ),
          );
          return res.json({ message: "Resubscribed successfully" });
        }
        return res.status(400).json({ message: "Already subscribed" });
      }

      const subscriber = await storage.createNewsletterSubscriber(data);
      await enqueueNewsletterWelcome(subscriber).catch((error) =>
        console.error("Failed to enqueue newsletter welcome automation", error),
      );
      res.json(subscriber);
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to subscribe" });
    }
  },
);

// Contact routes
router.post("/api/contact", async (req: Request, res: Response) => {
  try {
    const data = insertContactRequestSchema.parse(req.body);
    const request = await storage.createContactRequest(data);
    await createLeadFromContact(
      request,
      req.get("referer") || "/contact",
    ).catch((error) =>
      console.error("Failed to create CRM lead from contact request", error),
    );
    await enqueueContactAutomation(request).catch((error) =>
      console.error("Failed to enqueue contact automation", error),
    );
    res.json(request);
  } catch (error: any) {
    console.error("Error creating contact request:", error);
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: error.errors });
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

router.post(
  "/api/create-payment-intent",
  async (req: Request, res: Response) => {
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
  },
);

// Email Templates routes
router.get(
  "/api/email-templates",
  readContent,
  async (req: Request, res: Response) => {
    try {
      const templates = await storage.getActiveEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  },
);

router.post(
  "/api/email-templates",
  createContent,
  async (req: Request, res: Response) => {
    try {
      const data = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(data);
      res.json(template);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  },
);

// External Posts routes (returns mock data until table exists)
router.get("/api/external-posts", async (req: Request, res: Response) => {
  try {
    const mockPosts = [
      {
        id: "1",
        title: "Building Scalable MEL Systems",
        source: "LinkedIn",
        url: "https://linkedin.com",
        excerpt:
          "Insights on designing robust monitoring and evaluation frameworks.",
        featuredImage:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
        publishedAt: new Date(),
        category: "MEL",
        embedCode: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
      process.env.STRIPE_WEBHOOK_SECRET || "",
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
