import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  numeric,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts are defined in the primary schema so both Drizzle Kit's
// CommonJS loader and Vercel's native ESM runtime can load the same graph.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  isAdmin: boolean("is_admin").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  passwordHash: text("password_hash"),
  status: varchar("status", { length: 24 }).notNull().default("active"),
  emailVerifiedAt: timestamp("email_verified_at"),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  securityVersion: integer("security_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
  statusIdx: index("users_status_idx").on(table.status),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Identity, authorization, session, and accountability foundation.
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: varchar("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const userRoles = pgTable("user_roles", {
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  roleIdx: index("user_roles_role_idx").on(table.roleId),
}));

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  userSecurityVersion: integer("user_security_version").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  idleExpiresAt: timestamp("idle_expires_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("sessions_user_idx").on(table.userId),
  expiryIdx: index("sessions_expiry_idx").on(table.expiresAt),
  activeIdx: index("sessions_active_idx").on(table.userId, table.revokedAt),
}));

export const auditEvents = pgTable("audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorSessionId: varchar("actor_session_id").references(() => sessions.id, { onDelete: "set null" }),
  action: varchar("action", { length: 160 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: varchar("resource_id"),
  result: varchar("result", { length: 24 }).notNull(),
  justification: text("justification"),
  requestId: varchar("request_id", { length: 100 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  actorIdx: index("audit_events_actor_idx").on(table.actorUserId, table.createdAt),
  resourceIdx: index("audit_events_resource_idx").on(table.resourceType, table.resourceId),
  actionIdx: index("audit_events_action_idx").on(table.action, table.createdAt),
}));

export const authenticationAttempts = pgTable("authentication_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountKeyHash: varchar("account_key_hash", { length: 64 }).notNull(),
  networkKeyHash: varchar("network_key_hash", { length: 64 }).notNull(),
  successful: boolean("successful").notNull().default(false),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
}, (table) => ({
  accountTimeIdx: index("auth_attempts_account_time_idx").on(table.accountKeyHash, table.attemptedAt),
  networkTimeIdx: index("auth_attempts_network_time_idx").on(table.networkKeyHash, table.attemptedAt),
}));

export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id").references(() => sessions.id, { onDelete: "set null" }),
  type: varchar("type", { length: 120 }).notNull(),
  severity: varchar("severity", { length: 24 }).notNull(),
  requestId: varchar("request_id", { length: 100 }),
  ipHash: varchar("ip_hash", { length: 64 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  typeTimeIdx: index("security_events_type_time_idx").on(table.type, table.createdAt),
  userTimeIdx: index("security_events_user_time_idx").on(table.userId, table.createdAt),
}));

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});
export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({
  id: true,
  createdAt: true,
});

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

// Blog posts with performance indexes
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  category: text("category").notNull(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  isPremium: boolean("is_premium").default(false),
  isPublished: boolean("is_published").default(false),
  readTimeMinutes: integer("read_time_minutes").default(5),
  publishedAt: timestamp("published_at"),
  workflowStatus: varchar("workflow_status", { length: 24 }).notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  approvedAt: timestamp("approved_at"),
  authorId: varchar("author_id").references(() => users.id, { onDelete: "set null" }),
  editorId: varchar("editor_id").references(() => users.id, { onDelete: "set null" }),
  approverId: varchar("approver_id").references(() => users.id, { onDelete: "set null" }),
  seoTitle: varchar("seo_title", { length: 70 }),
  seoDescription: varchar("seo_description", { length: 170 }),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  visibility: varchar("visibility", { length: 24 }).notNull().default("public"),
  currentVersion: integer("current_version").notNull().default(1),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("blog_category_idx").on(table.category),
  publishedIdx: index("blog_published_idx").on(table.isPublished),
  publishedAtIdx: index("blog_published_at_idx").on(table.publishedAt),
  slugIdx: index("blog_slug_idx").on(table.slug),
  workflowIdx: index("blog_workflow_idx").on(table.workflowStatus, table.scheduledAt),
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const contentVersions = pgTable("content_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeSummary: varchar("change_summary", { length: 500 }),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  postVersionIdx: uniqueIndex("content_versions_post_version_idx").on(table.postId, table.version),
  postTimeIdx: index("content_versions_post_time_idx").on(table.postId, table.createdAt),
}));

export type ContentVersion = typeof contentVersions.$inferSelect;

// Portfolio projects with performance indexes
export const portfolioProjects = pgTable("portfolio_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  challenge: text("challenge"),
  solution: text("solution"),
  outcome: text("outcome"),
  category: text("category").notNull(),
  techStack: text("tech_stack").array().default(sql`ARRAY[]::text[]`),
  featuredImage: text("featured_image"),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  liveUrl: text("live_url"),
  githubUrl: text("github_url"),
  featured: boolean("featured").default(false),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("portfolio_category_idx").on(table.category),
  featuredIdx: index("portfolio_featured_idx").on(table.featured),
  slugIdx: index("portfolio_slug_idx").on(table.slug),
  orderIdx: index("portfolio_order_idx").on(table.order),
}));

export const insertPortfolioProjectSchema = createInsertSchema(portfolioProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPortfolioProject = z.infer<typeof insertPortfolioProjectSchema>;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;

// Internal project records are intentionally separated from public case studies.
// A project can exist without ever becoming public.
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectCode: varchar("project_code", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 240 }).notNull(),
  organizationName: varchar("organization_name", { length: 240 }),
  sector: varchar("sector", { length: 160 }),
  country: varchar("country", { length: 120 }),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  confidentiality: varchar("confidentiality", { length: 32 }).notNull().default("internal"),
  internalSummary: text("internal_summary"),
  commercialValue: numeric("commercial_value", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  repositoryUrl: text("repository_url"),
  deploymentUrl: text("deployment_url"),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  legacyPortfolioProjectId: varchar("legacy_portfolio_project_id").unique()
    .references(() => portfolioProjects.id, { onDelete: "set null" }),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("projects_status_idx").on(table.status, table.updatedAt),
  ownerIdx: index("projects_owner_idx").on(table.ownerId, table.status),
  confidentialityIdx: index("projects_confidentiality_idx").on(table.confidentiality),
}));

export const caseStudies = pgTable("case_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  summary: text("summary").notNull(),
  challenge: text("challenge"),
  constraints: text("constraints"),
  objectives: text("objectives"),
  solution: text("solution"),
  architecture: text("architecture"),
  technologies: text("technologies").array().notNull().default(sql`ARRAY[]::text[]`),
  securityControls: text("security_controls"),
  integrations: text("integrations"),
  roleDescription: text("role_description"),
  teamDescription: text("team_description"),
  timeline: text("timeline"),
  outcome: text("outcome"),
  lessons: text("lessons"),
  nextPhase: text("next_phase"),
  category: varchar("category", { length: 160 }).notNull(),
  featuredImage: text("featured_image"),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  liveUrl: text("live_url"),
  githubUrl: text("github_url"),
  workflowStatus: varchar("workflow_status", { length: 24 }).notNull().default("draft"),
  visibility: varchar("visibility", { length: 24 }).notNull().default("private"),
  evidenceGateStatus: varchar("evidence_gate_status", { length: 24 }).notNull().default("blocked"),
  featured: boolean("featured").notNull().default(false),
  order: integer("order").notNull().default(0),
  seoTitle: varchar("seo_title", { length: 70 }),
  seoDescription: varchar("seo_description", { length: 170 }),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  approvedAt: timestamp("approved_at"),
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex("case_studies_slug_idx").on(table.slug),
  publicationIdx: index("case_studies_publication_idx").on(
    table.workflowStatus,
    table.visibility,
    table.evidenceGateStatus,
    table.order,
  ),
  projectIdx: index("case_studies_project_idx").on(table.projectId),
}));

export const caseStudyEvidence = pgTable("case_study_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseStudyId: varchar("case_study_id").notNull()
    .references(() => caseStudies.id, { onDelete: "cascade" }),
  claim: text("claim").notNull(),
  claimType: varchar("claim_type", { length: 80 }).notNull().default("delivery"),
  sourceType: varchar("source_type", { length: 80 }).notNull(),
  sourceReference: text("source_reference").notNull(),
  measurementPeriod: varchar("measurement_period", { length: 160 }),
  calculationMethod: text("calculation_method"),
  verificationStatus: varchar("verification_status", { length: 32 }).notNull().default("unverified"),
  disclosureStatus: varchar("disclosure_status", { length: 32 }).notNull().default("private"),
  verifiedBy: varchar("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  caseStudyIdx: index("case_study_evidence_case_study_idx").on(table.caseStudyId, table.createdAt),
  verificationIdx: index("case_study_evidence_verification_idx").on(
    table.caseStudyId,
    table.verificationStatus,
    table.disclosureStatus,
  ),
  uniqueClaimIdx: uniqueIndex("case_study_evidence_unique_claim_idx").on(table.caseStudyId, table.claim),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  evidenceGateStatus: true,
  approvedAt: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCaseStudyEvidenceSchema = createInsertSchema(caseStudyEvidence).omit({
  id: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type Project = typeof projects.$inferSelect;
export type CaseStudy = typeof caseStudies.$inferSelect;
export type CaseStudyEvidence = typeof caseStudyEvidence.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type InsertCaseStudyEvidence = z.infer<typeof insertCaseStudyEvidenceSchema>;

export type PublicCaseStudyEvidence = Pick<
  CaseStudyEvidence,
  "id" | "claim" | "claimType" | "sourceType" | "verificationStatus" | "verifiedAt"
>;
export type PublicPortfolioProject = PortfolioProject & {
  evidence: PublicCaseStudyEvidence[];
};

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).pick({
  email: true,
  name: true,
});

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Contact requests
export const contactRequests = pgTable("contact_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: varchar("email").notNull(),
  projectType: text("project_type"), // Consultation, Development, MEL Implementation, Training
  message: text("message").notNull(),
  preferredContact: text("preferred_contact"), // Email, Phone, WhatsApp
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactRequestId: varchar("contact_request_id").unique().references(() => contactRequests.id, { onDelete: "set null" }),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 80 }),
  organization: varchar("organization", { length: 220 }),
  country: varchar("country", { length: 120 }),
  industry: varchar("industry", { length: 160 }),
  leadType: varchar("lead_type", { length: 80 }).notNull().default("contact_enquiry"),
  serviceInterest: varchar("service_interest", { length: 180 }),
  budgetRange: varchar("budget_range", { length: 120 }),
  expectedTimeline: varchar("expected_timeline", { length: 120 }),
  source: varchar("source", { length: 120 }).notNull().default("contact_form"),
  campaign: varchar("campaign", { length: 180 }),
  landingPage: text("landing_page"),
  message: text("message"),
  assignedOwnerId: varchar("assigned_owner_id").references(() => users.id, { onDelete: "set null" }),
  priority: varchar("priority", { length: 24 }).notNull().default("normal"),
  qualificationScore: integer("qualification_score").notNull().default(0),
  stage: varchar("stage", { length: 32 }).notNull().default("new"),
  estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  probability: integer("probability").notNull().default(10),
  nextAction: text("next_action"),
  followUpAt: timestamp("follow_up_at"),
  lostReason: text("lost_reason"),
  consentStatus: varchar("consent_status", { length: 32 }).notNull().default("unknown"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
}, (table) => ({
  stageIdx: index("leads_stage_idx").on(table.stage, table.updatedAt),
  followUpIdx: index("leads_follow_up_idx").on(table.followUpAt, table.stage),
  ownerIdx: index("leads_owner_idx").on(table.assignedOwnerId, table.stage),
  emailIdx: index("leads_email_idx").on(table.email),
}));

export const leadActivities = pgTable("lead_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 48 }).notNull(),
  body: text("body"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadTimeIdx: index("lead_activities_lead_time_idx").on(table.leadId, table.createdAt),
}));

export const leadAttributionTouches = pgTable("lead_attribution_touches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  touchType: varchar("touch_type", { length: 16 }).notNull(),
  channel: varchar("channel", { length: 48 }).notNull(),
  source: varchar("source", { length: 160 }).notNull(),
  medium: varchar("medium", { length: 120 }),
  campaign: varchar("campaign", { length: 180 }),
  term: varchar("term", { length: 240 }),
  content: varchar("content", { length: 240 }),
  referrer: text("referrer"),
  landingPage: text("landing_page").notNull(),
  capturedAt: timestamp("captured_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadTouchIdx: uniqueIndex("lead_attribution_touches_lead_touch_idx").on(table.leadId, table.touchType),
  channelTimeIdx: index("lead_attribution_touches_channel_time_idx").on(table.channel, table.capturedAt),
  sourceTimeIdx: index("lead_attribution_touches_source_time_idx").on(table.source, table.capturedAt),
  campaignTimeIdx: index("lead_attribution_touches_campaign_time_idx").on(table.campaign, table.capturedAt),
}));

export type Lead = typeof leads.$inferSelect;
export type LeadActivity = typeof leadActivities.$inferSelect;
export const acquisitionSpendEntries = pgTable("acquisition_spend_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: varchar("channel", { length: 48 }).notNull(),
  source: varchar("source", { length: 160 }).notNull(),
  campaign: varchar("campaign", { length: 180 }),
  serviceInterest: varchar("service_interest", { length: 180 }),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  channelTimeIdx: index("acquisition_spend_channel_time_idx").on(table.channel, table.occurredAt),
  sourceTimeIdx: index("acquisition_spend_source_time_idx").on(table.source, table.occurredAt),
  campaignTimeIdx: index("acquisition_spend_campaign_time_idx").on(table.campaign, table.occurredAt),
  channelServiceTimeIdx: index("acquisition_spend_channel_service_time_idx").on(
    table.channel,
    table.serviceInterest,
    table.occurredAt,
  ),
  activeTimeIdx: index("acquisition_spend_active_time_idx").on(table.voidedAt, table.occurredAt),
}));

export const recurringRevenueAgreements = pgTable("recurring_revenue_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  monthlyRecurringRevenue: numeric("monthly_recurring_revenue", { precision: 14, scale: 2 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { length: 24 }).notNull().default("active"),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadTimeIdx: index("recurring_revenue_agreements_lead_idx").on(table.leadId, table.startedAt),
  activeServiceIdx: index("recurring_revenue_agreements_active_service_idx").on(
    table.voidedAt,
    table.status,
    table.serviceInterest,
    table.currency,
    table.startedAt,
  ),
}));

export const revenueEvents = pgTable("revenue_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  revenueKind: varchar("revenue_kind", { length: 24 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadTimeIdx: index("revenue_events_lead_time_idx").on(table.leadId, table.occurredAt),
  serviceTimeIdx: index("revenue_events_service_time_idx").on(table.serviceInterest, table.currency, table.occurredAt),
  activeTimeIdx: index("revenue_events_active_time_idx").on(table.voidedAt, table.occurredAt),
}));

export const directCostEntries = pgTable("direct_cost_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  costScope: varchar("cost_scope", { length: 24 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadTimeIdx: index("direct_cost_entries_lead_time_idx").on(table.leadId, table.occurredAt),
  serviceTimeIdx: index("direct_cost_entries_service_time_idx").on(table.serviceInterest, table.currency, table.occurredAt),
  activeTimeIdx: index("direct_cost_entries_active_time_idx").on(table.voidedAt, table.occurredAt),
}));

export const costEvidenceAttestations = pgTable("cost_evidence_attestations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  throughAt: timestamp("through_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadCurrencyIdx: index("cost_evidence_attestations_lead_currency_idx").on(
    table.leadId,
    table.currency,
    table.throughAt,
  ),
  activeIdx: index("cost_evidence_attestations_active_idx").on(table.voidedAt, table.throughAt),
}));

export type LeadAttributionTouch = typeof leadAttributionTouches.$inferSelect;
export type AcquisitionSpendEntry = typeof acquisitionSpendEntries.$inferSelect;
export type RecurringRevenueAgreement = typeof recurringRevenueAgreements.$inferSelect;
export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type DirectCostEntry = typeof directCostEntries.$inferSelect;
export type CostEvidenceAttestation = typeof costEvidenceAttestations.$inferSelect;

export const commercialInvoices = pgTable("commercial_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  revenueEventId: varchar("revenue_event_id").references(() => revenueEvents.id, { onDelete: "set null" }),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 120 }).notNull().unique(),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at").notNull(),
  dueAt: timestamp("due_at").notNull(),
  status: varchar("status", { length: 24 }).notNull().default("issued"),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leadTimeIdx: index("commercial_invoices_lead_time_idx").on(table.leadId, table.issuedAt),
  dueStatusIdx: index("commercial_invoices_due_status_idx").on(table.voidedAt, table.status, table.dueAt),
}));

export const cashCollections = pgTable("cash_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => commercialInvoices.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  receivedAt: timestamp("received_at").notNull(),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  invoiceTimeIdx: index("cash_collections_invoice_time_idx").on(table.invoiceId, table.receivedAt),
  activeTimeIdx: index("cash_collections_active_time_idx").on(table.voidedAt, table.receivedAt),
}));

export const recurringRevenueMovements = pgTable("recurring_revenue_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agreementId: varchar("agreement_id").notNull().references(() => recurringRevenueAgreements.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  movementType: varchar("movement_type", { length: 24 }).notNull(),
  mrrDelta: numeric("mrr_delta", { precision: 14, scale: 2 }).notNull(),
  effectiveAt: timestamp("effective_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  agreementTimeIdx: index("recurring_revenue_movements_agreement_time_idx").on(table.agreementId, table.effectiveAt),
  serviceTimeIdx: index("recurring_revenue_movements_service_time_idx").on(table.serviceInterest, table.currency, table.effectiveAt),
  activeTimeIdx: index("recurring_revenue_movements_active_time_idx").on(table.voidedAt, table.effectiveAt),
}));

export const deliveryCapacityRecords = pgTable("delivery_capacity_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  capacityScope: varchar("capacity_scope", { length: 180 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  availableHours: numeric("available_hours", { precision: 10, scale: 2 }).notNull(),
  deliveryHours: numeric("delivery_hours", { precision: 10, scale: 2 }).notNull(),
  billableHours: numeric("billable_hours", { precision: 10, scale: 2 }).notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  servicePeriodIdx: index("delivery_capacity_service_period_idx").on(
    table.serviceInterest,
    table.capacityScope,
    table.periodStart,
    table.periodEnd,
  ),
  activePeriodIdx: index("delivery_capacity_active_period_idx").on(
    table.voidedAt,
    table.periodStart,
    table.periodEnd,
  ),
}));

export const capitalBudgetCycles = pgTable("capital_budget_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  envelopeAmount: numeric("envelope_amount", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  periodCurrencyIdx: uniqueIndex("capital_budget_period_currency_idx").on(
    table.periodStart,
    table.periodEnd,
    table.currency,
  ),
  statusPeriodIdx: index("capital_budget_status_period_idx").on(
    table.status,
    table.periodStart,
    table.periodEnd,
  ),
}));

export const capitalBudgetAllocations = pgTable("capital_budget_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull().references(() => capitalBudgetCycles.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 48 }).notNull(),
  serviceInterest: varchar("service_interest", { length: 180 }).notNull(),
  recommendationDecision: varchar("recommendation_decision", { length: 24 }).notNull(),
  recommendationConfidence: varchar("recommendation_confidence", { length: 16 }).notNull(),
  recommendedAmount: numeric("recommended_amount", { precision: 14, scale: 2 }).notNull(),
  approvedAmount: numeric("approved_amount", { precision: 14, scale: 2 }).notNull(),
  sourceWindow: varchar("source_window", { length: 16 }).notNull(),
  recommendationSnapshot: jsonb("recommendation_snapshot").notNull().default(sql`'{}'::jsonb`),
  rationale: text("rationale").notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  segmentIdx: uniqueIndex("capital_budget_allocation_segment_idx").on(
    table.budgetId,
    table.channel,
    table.serviceInterest,
  ),
}));

export type CommercialInvoice = typeof commercialInvoices.$inferSelect;
export type CashCollection = typeof cashCollections.$inferSelect;
export type RecurringRevenueMovement = typeof recurringRevenueMovements.$inferSelect;
export type DeliveryCapacityRecord = typeof deliveryCapacityRecords.$inferSelect;
export type CapitalBudgetCycle = typeof capitalBudgetCycles.$inferSelect;
export type CapitalBudgetAllocation = typeof capitalBudgetAllocations.$inferSelect;

export const treasuryAccounts = pgTable("treasury_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 180 }).notNull(),
  institution: varchar("institution", { length: 180 }),
  accountType: varchar("account_type", { length: 32 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("active"),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
}, (table) => ({
  nameCurrencyIdx: uniqueIndex("treasury_accounts_name_currency_idx")
    .on(table.name, table.currency),
}));

export const treasuryBalanceSnapshots = pgTable("treasury_balance_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => treasuryAccounts.id, { onDelete: "cascade" }),
  currency: varchar("currency", { length: 3 }).notNull(),
  ledgerBalance: numeric("ledger_balance", { precision: 14, scale: 2 }).notNull(),
  availableBalance: numeric("available_balance", { precision: 14, scale: 2 }).notNull(),
  restrictedBalance: numeric("restricted_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  capturedAt: timestamp("captured_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  accountTimeIdx: index("treasury_balance_account_time_idx").on(table.accountId, table.capturedAt),
  activeTimeIdx: index("treasury_balance_active_time_idx").on(table.voidedAt, table.capturedAt),
}));

export const treasuryCashDisbursements = pgTable("treasury_cash_disbursements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").references(() => treasuryAccounts.id, { onDelete: "set null" }),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  cashUseType: varchar("cash_use_type", { length: 24 }).notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  serviceInterest: varchar("service_interest", { length: 180 }),
  occurredAt: timestamp("occurred_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  currencyTimeIdx: index("treasury_cash_disbursement_time_idx").on(table.currency, table.occurredAt),
  typeTimeIdx: index("treasury_cash_disbursement_type_time_idx").on(
    table.cashUseType,
    table.currency,
    table.occurredAt,
  ),
  activeTimeIdx: index("treasury_cash_disbursement_active_time_idx").on(table.voidedAt, table.occurredAt),
}));

export const operatingExpenseEntries = pgTable("operating_expense_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  serviceInterest: varchar("service_interest", { length: 180 }),
  occurredAt: timestamp("occurred_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  currencyTimeIdx: index("operating_expense_currency_time_idx").on(table.currency, table.occurredAt),
  activeTimeIdx: index("operating_expense_active_time_idx").on(table.voidedAt, table.occurredAt),
}));

export const operatingTaxProvisions = pgTable("operating_tax_provisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  recognizedAt: timestamp("recognized_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  currencyPeriodIdx: index("operating_tax_currency_period_idx").on(
    table.currency,
    table.periodStart,
    table.periodEnd,
  ),
  activeIdx: index("operating_tax_active_idx").on(table.voidedAt, table.recognizedAt),
}));

export const investedCapitalSnapshots = pgTable("invested_capital_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: varchar("currency", { length: 3 }).notNull(),
  operatingAssets: numeric("operating_assets", { precision: 14, scale: 2 }).notNull(),
  operatingLiabilities: numeric("operating_liabilities", { precision: 14, scale: 2 }).notNull(),
  capturedAt: timestamp("captured_at").notNull(),
  components: jsonb("components").notNull().default(sql`'{}'::jsonb`),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  currencyTimeIdx: index("invested_capital_currency_time_idx").on(table.currency, table.capturedAt),
  activeTimeIdx: index("invested_capital_active_time_idx").on(table.voidedAt, table.capturedAt),
}));

export const capitalDeploymentEntries = pgTable("capital_deployment_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetAllocationId: varchar("budget_allocation_id").references(() => capitalBudgetAllocations.id, { onDelete: "set null" }),
  currency: varchar("currency", { length: 3 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  serviceInterest: varchar("service_interest", { length: 180 }),
  occurredAt: timestamp("occurred_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  approvalReference: text("approval_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  currencyTimeIdx: index("capital_deployment_currency_time_idx").on(table.currency, table.occurredAt),
  categoryTimeIdx: index("capital_deployment_category_time_idx").on(
    table.category,
    table.currency,
    table.occurredAt,
  ),
  activeTimeIdx: index("capital_deployment_active_time_idx").on(table.voidedAt, table.occurredAt),
}));

export type TreasuryAccount = typeof treasuryAccounts.$inferSelect;
export type TreasuryBalanceSnapshot = typeof treasuryBalanceSnapshots.$inferSelect;
export type TreasuryCashDisbursement = typeof treasuryCashDisbursements.$inferSelect;
export type OperatingExpenseEntry = typeof operatingExpenseEntries.$inferSelect;
export type OperatingTaxProvision = typeof operatingTaxProvisions.$inferSelect;
export type InvestedCapitalSnapshot = typeof investedCapitalSnapshots.$inferSelect;
export const financialEvidenceAttestations = pgTable("financial_evidence_attestations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: varchar("currency", { length: 3 }).notNull(),
  evidenceType: varchar("evidence_type", { length: 40 }).notNull(),
  throughAt: timestamp("through_at").notNull(),
  sourceReference: text("source_reference").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by").references(() => users.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  typeTimeIdx: index("financial_evidence_attestation_type_time_idx").on(
    table.evidenceType,
    table.currency,
    table.throughAt,
  ),
  activeIdx: index("financial_evidence_attestation_active_idx").on(table.voidedAt, table.throughAt),
}));

export const capitalHurdlePolicies = pgTable("capital_hurdle_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: varchar("currency", { length: 3 }).notNull(),
  annualHurdleRatePct: numeric("annual_hurdle_rate_pct", { precision: 7, scale: 3 }).notNull(),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  rationale: text("rationale").notNull(),
  approvedBy: varchar("approved_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  approvedAt: timestamp("approved_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  currencyPeriodIdx: index("capital_hurdle_currency_period_idx").on(
    table.currency,
    table.effectiveFrom,
    table.effectiveTo,
  ),
}));

export type CapitalDeploymentEntry = typeof capitalDeploymentEntries.$inferSelect;
export type FinancialEvidenceAttestation = typeof financialEvidenceAttestations.$inferSelect;
export type CapitalHurdlePolicy = typeof capitalHurdlePolicies.$inferSelect;

// Blog Likes
export const blogLikes = pgTable("blog_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blogPostId: varchar("blog_post_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogLikeSchema = createInsertSchema(blogLikes).omit({
  id: true,
  createdAt: true,
});

export type BlogLike = typeof blogLikes.$inferSelect;

// Blog Comments
export const blogComments = pgTable("blog_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blogPostId: varchar("blog_post_id").notNull(),
  userId: varchar("user_id").notNull(),
  parentId: varchar("parent_id"), // For replies
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BlogComment = typeof blogComments.$inferSelect;

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateImage: text("template_image"),
  marketingTips: text("marketing_tips"),
  category: text("category"), // weekly, monthly, promotional
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Durable email delivery. Request handlers enqueue immutable messages; a
// separate worker claims and delivers them through a configured provider.
export const emailOutbox = pgTable("email_outbox", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
  messageType: varchar("message_type", { length: 24 }).notNull().default("transactional"),
  toEmail: varchar("to_email", { length: 320 }).notNull(),
  fromEmail: varchar("from_email", { length: 320 }).notNull(),
  fromName: varchar("from_name", { length: 160 }),
  replyTo: varchar("reply_to", { length: 320 }),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  provider: varchar("provider", { length: 80 }),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  availableAt: timestamp("available_at").notNull().defaultNow(),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by", { length: 120 }),
  lastError: text("last_error"),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  dispatchIdx: index("email_outbox_dispatch_idx").on(table.status, table.availableAt),
  recipientIdx: index("email_outbox_recipient_idx").on(table.toEmail, table.createdAt),
  providerMessageIdx: index("email_outbox_provider_message_idx").on(table.provider, table.providerMessageId),
}));

export const emailDeliveryEvents = pgTable("email_delivery_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  outboxId: varchar("outbox_id").notNull().references(() => emailOutbox.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 40 }).notNull(),
  provider: varchar("provider", { length: 80 }),
  providerEventId: varchar("provider_event_id", { length: 255 }).unique(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  outboxTimeIdx: index("email_delivery_events_outbox_time_idx").on(table.outboxId, table.occurredAt),
  eventTimeIdx: index("email_delivery_events_type_time_idx").on(table.eventType, table.occurredAt),
}));

export const emailSuppressions = pgTable("email_suppressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 320 }).notNull().unique(),
  reason: varchar("reason", { length: 80 }).notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  notes: text("notes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("email_suppressions_active_idx").on(table.email, table.expiresAt),
}));

export type EmailOutboxMessage = typeof emailOutbox.$inferSelect;
export type EmailDeliveryEvent = typeof emailDeliveryEvents.$inferSelect;
export type EmailSuppression = typeof emailSuppressions.$inferSelect;

export const notificationCampaigns = pgTable("notification_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 180 }).notNull(),
  subject: text("subject"),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  channels: text("channels").array().notNull().default(sql`ARRAY['email']::text[]`),
  audience: jsonb("audience").notNull().default(sql`'{}'::jsonb`),
  status: varchar("status", { length: 24 }).notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  scheduleIdx: index("notification_campaigns_schedule_idx").on(table.status, table.scheduledAt),
}));

export const notificationInbox = pgTable("notification_inbox", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 80 }).notNull().default("system"),
  title: varchar("title", { length: 240 }).notNull(),
  body: text("body").notNull(),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  readAt: timestamp("read_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  unreadIdx: index("notification_inbox_unread_idx").on(table.userId, table.readAt, table.createdAt),
}));

export const notificationActionTokens = pgTable("notification_action_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  purpose: varchar("purpose", { length: 48 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subscriberId: varchar("subscriber_id").references(() => newsletterSubscribers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  lookupIdx: index("notification_action_tokens_lookup_idx").on(table.tokenHash, table.purpose),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("push_subscriptions_user_idx").on(table.userId, table.revokedAt),
}));

export const channelOutbox = pgTable("channel_outbox", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: varchar("channel", { length: 24 }).notNull(),
  recipient: text("recipient").notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  provider: varchar("provider", { length: 80 }),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  availableAt: timestamp("available_at").notNull().defaultNow(),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by", { length: 120 }),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  dispatchIdx: index("channel_outbox_dispatch_idx").on(table.channel, table.status, table.availableAt),
}));

export type NotificationCampaign = typeof notificationCampaigns.$inferSelect;
export type InboxNotification = typeof notificationInbox.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// External Posts (for embedding external content)
export const externalPosts = pgTable("external_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  source: text("source").notNull(), // LinkedIn, Medium, Dev.to, etc
  url: text("url").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  publishedAt: timestamp("published_at"),
  category: text("category"), // MEL, Programming, Career
  embedCode: text("embed_code"), // For embedded widgets
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExternalPostSchema = createInsertSchema(externalPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalPost = z.infer<typeof insertExternalPostSchema>;
export type ExternalPost = typeof externalPosts.$inferSelect;
