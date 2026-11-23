import { createHash } from "node:crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { billingCheckoutRequests, billingEventReceipts, billingSubscriptions, users } from "../shared/schema.js";
import { financialRequestKeyPattern } from "../shared/financial-requests.js";
import { db } from "./db.js";
import { env } from "./env.js";
import { ApiError, asyncHandler } from "./middleware.js";
import { optionalPrincipal, publicIdentity } from "./security/identity.js";

export function billingEnabled() {
  return env.BILLING_MODE === "sandbox" && Boolean(env.STRIPE_SECRET_KEY?.startsWith("sk_test_") &&
    env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_ID?.startsWith("price_") && env.APP_BASE_URL);
}
export async function premiumEntitlement(userId: string) {
  if (!billingEnabled()) return false;
  const [row] = await db.select({ id: billingSubscriptions.id }).from(billingSubscriptions).where(and(
    eq(billingSubscriptions.userId, userId), eq(billingSubscriptions.priceId, env.STRIPE_PRICE_ID!),
    eq(billingSubscriptions.status, "active"), eq(billingSubscriptions.livemode, false),
    gt(billingSubscriptions.entitledUntil, new Date()),
  )).limit(1);
  return Boolean(row);
}
export interface BillingGateway {
  verify(payload: Buffer, signature: string): Stripe.Event;
  subscription(id: string): Promise<Stripe.Subscription>;
  checkout(parameters: Stripe.Checkout.SessionCreateParams, key: string): Promise<{ id: string; url: string | null }>;
  portal(customer: string, returnUrl: string): Promise<{ url: string }>;
}
function gateway(): BillingGateway {
  if (!billingEnabled()) throw new ApiError(503, "Billing is not enabled");
  const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { timeout: 8000, maxNetworkRetries: 0 });
  return {
    verify: (payload, signature) => stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET!),
    subscription: id => stripe.subscriptions.retrieve(id, { expand: ["latest_invoice"] }),
    checkout: (parameters, key) => stripe.checkout.sessions.create(parameters, { idempotencyKey: key }),
    portal: (customer, returnUrl) => stripe.billingPortal.sessions.create({ customer, return_url: returnUrl }),
  };
}
const validCheckoutUrl = (url: string | null) => {
  if (!url) return false;
  try { const parsed = new URL(url); return parsed.protocol === "https:" && parsed.hostname === "checkout.stripe.com"; } catch { return false; }
};
export function createBillingRouter(factory: () => BillingGateway = gateway) {
  const router = Router();
  router.use(["/api/billing", "/api/auth/user"], (_request, response, next) => { response.setHeader("Cache-Control", "no-store"); next(); });
  router.get("/api/billing/status", (_request, response) => response.json({ enabled: billingEnabled(), mode: env.BILLING_MODE }));
  router.get("/api/auth/user", asyncHandler(async (request, response) => {
    const principal = await optionalPrincipal(request);
    if (!principal) return response.status(401).json({ message: "Unauthorized" });
    const [profile] = await db.select({ firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl, createdAt: users.createdAt })
      .from(users).where(eq(users.id, principal.userId)).limit(1);
    response.json({ ...publicIdentity(principal), ...profile, isPremium: await premiumEntitlement(principal.userId) });
  }));
  router.get("/api/billing/requests/:key", asyncHandler(async (request, response) => {
    const principal = await optionalPrincipal(request); if (!principal) return response.status(401).json({ message: "Unauthorized" });
    if (!financialRequestKeyPattern.test(request.params.key)) return response.status(400).json({ message: "Invalid billing reference" });
    const [record] = await db.select({ status: billingCheckoutRequests.status, url: billingCheckoutRequests.checkoutUrl }).from(billingCheckoutRequests)
      .where(and(eq(billingCheckoutRequests.userId, principal.userId), eq(billingCheckoutRequests.requestKey, request.params.key))).limit(1);
    response.json(record ?? { status: "unconfirmed", message: "Keep this reference. Absence is not permission to create a new request." });
  }));
  router.post("/api/billing/checkout", asyncHandler(async (request, response) => {
    const principal = await optionalPrincipal(request); if (!principal) return response.status(401).json({ message: "Unauthorized" });
    if (request.get("X-Billing-Actor") && request.get("X-Billing-Actor") !== principal.userId) throw new ApiError(409,"The signed-in account changed. Inspect the saved reference after signing in.");
    if (!billingEnabled()) throw new ApiError(503, "Paid membership is not enabled");
    if (await premiumEntitlement(principal.userId)) throw new ApiError(409, "An active membership already exists. Use your billing account to manage it.");
    const { requestKey } = z.object({ requestKey: z.string().regex(financialRequestKeyPattern) }).strict().parse(request.body);
    const [created] = await db.insert(billingCheckoutRequests).values({ userId: principal.userId, requestKey, priceId: env.STRIPE_PRICE_ID! })
      .onConflictDoNothing().returning();
    if (!created) {
      const [previous] = await db.select().from(billingCheckoutRequests).where(and(eq(billingCheckoutRequests.userId, principal.userId), eq(billingCheckoutRequests.requestKey, requestKey))).limit(1);
      if (!previous) throw new ApiError(409, "An unresolved checkout already exists for this account. Reconcile it before creating another request.");
      if (previous.priceId !== env.STRIPE_PRICE_ID) throw new ApiError(409, "The original billing reference uses another price. Reconcile it first.");
      return response.status(previous?.status === "created" ? 200 : 202).json({ status: previous?.status ?? "unconfirmed", url: previous?.checkoutUrl, requestKey });
    }
    try {
      const base = new URL(env.APP_BASE_URL!).origin;
      const session = await factory().checkout({ mode: "subscription", line_items: [{ price: env.STRIPE_PRICE_ID!, quantity: 1 }],
        client_reference_id: principal.userId, customer_email: principal.email,
        metadata: { userId: principal.userId, checkoutRequestId: created.id },
        subscription_data: { metadata: { userId: principal.userId, checkoutRequestId: created.id } },
        success_url: `${base}/dashboard?checkout=returned`, cancel_url: `${base}/subscribe?checkout=cancelled`,
      }, `portfolio-checkout:${created.id}`);
      if (!validCheckoutUrl(session.url)) throw Error("Provider checkout result could not be confirmed");
      await db.update(billingCheckoutRequests).set({ status: "created", sessionId: session.id, checkoutUrl: session.url, updatedAt: new Date() }).where(eq(billingCheckoutRequests.id, created.id));
      response.status(201).json({ status: "created", url: session.url, requestKey });
    } catch (error) {
      await db.update(billingCheckoutRequests).set({ status: "uncertain", updatedAt: new Date() }).where(and(eq(billingCheckoutRequests.id, created.id), eq(billingCheckoutRequests.status, "creating")));
      throw new ApiError(503, "Checkout could not be confirmed. Keep the saved reference and inspect it before another request.", "BILLING_OUTCOME_UNKNOWN");
    }
  }));
  router.post("/api/billing/portal", asyncHandler(async (request, response) => {
    const principal = await optionalPrincipal(request); if (!principal) return response.status(401).json({ message: "Unauthorized" });
    if (request.get("X-Billing-Actor") && request.get("X-Billing-Actor") !== principal.userId) throw new ApiError(409,"The signed-in account changed. Sign in again before opening billing.");
    if (!billingEnabled()) throw new ApiError(503, "Billing is not enabled");
    const [subscription] = await db.select({ customer: billingSubscriptions.customerId }).from(billingSubscriptions)
      .where(and(eq(billingSubscriptions.userId, principal.userId), eq(billingSubscriptions.livemode, false))).orderBy(desc(billingSubscriptions.observedAt)).limit(1);
    if (!subscription) return response.status(404).json({ message: "No billing account is recorded for this user" });
    const result = await factory().portal(subscription.customer, `${new URL(env.APP_BASE_URL!).origin}/dashboard`);
    const url = new URL(result.url); if (url.protocol !== "https:" || url.hostname !== "billing.stripe.com") throw Error("Invalid provider portal result");
    response.json({ url: result.url });
  }));
  router.post("/api/stripe-webhook", asyncHandler(async (request, response) => {
    if (!billingEnabled()) return response.status(503).json({ message: "Billing is not enabled" });
    const provider = factory(); let event: Stripe.Event;
    try {
      if (!Buffer.isBuffer(request.body) || !request.get("stripe-signature")) throw Error("Missing signed payload");
      event = provider.verify(request.body, request.get("stripe-signature")!);
    } catch { return response.status(400).json({ message: "Invalid webhook signature or payload" }); }
    if (event.livemode) return response.status(409).json({ message: "Live billing is not enabled" });
    const fingerprint = createHash("sha256").update(request.body).digest("hex");
    const subscriptionEvent = ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type);
    const invoiceEvent = ["invoice.paid", "invoice.payment_failed", "invoice.voided", "invoice.marked_uncollectible"].includes(event.type);
    const invoiceSubscription = invoiceEvent ? (event.data.object as Stripe.Invoice).parent?.subscription_details?.subscription : null;
    const subscriptionId = subscriptionEvent ? String((event.data.object as { id: string }).id) :
      typeof invoiceSubscription === "string" ? invoiceSubscription : invoiceSubscription?.id ?? null;
    const result = await db.transaction(async transaction => {
      await transaction.execute(sql`SET LOCAL statement_timeout='12000ms'`);
      await transaction.execute(sql`SET LOCAL lock_timeout='5000ms'`);
      await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${subscriptionId ?? event.id}, 319))`);
      const [previous] = await transaction.select().from(billingEventReceipts).where(eq(billingEventReceipts.id, event.id)).limit(1);
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new ApiError(409, "Provider event identity conflicts with its recorded payload");
        return { duplicate: true };
      }
      if (subscriptionId) {
        // Events can arrive out of order: reconcile current provider state while
        // holding the subscription lock; never grant from an old event snapshot.
        const current = await provider.subscription(subscriptionId);
        if (current.id !== subscriptionId || current.livemode) throw new ApiError(409, "Unexpected provider subscription");
        const actor = current.metadata.userId, reference = current.metadata.checkoutRequestId;
        const [checkout] = reference ? await transaction.select().from(billingCheckoutRequests)
          .where(and(eq(billingCheckoutRequests.id, reference), eq(billingCheckoutRequests.userId, actor ?? ""))).limit(1) : [];
        const item = current.items.data.length === 1 ? current.items.data[0] : undefined;
        if (!checkout || !item || item.price.id !== checkout.priceId || item.price.id !== env.STRIPE_PRICE_ID || item.quantity !== 1)
          throw new ApiError(409, "Subscription cannot be bound to an approved checkout");
        const customer = typeof current.customer === "string" ? current.customer : current.customer.id;
        const [existing] = await transaction.select().from(billingSubscriptions).where(eq(billingSubscriptions.id, subscriptionId)).limit(1);
        if (existing && (existing.userId !== actor || existing.customerId !== customer)) throw new ApiError(409, "Subscription ownership cannot change");
        const periodEnd = item.current_period_end;
        const invoice = typeof current.latest_invoice === "object" ? current.latest_invoice : null;
        const invoiceCustomer = invoice && (typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id);
        const invoiceBinding = invoice?.parent?.subscription_details?.subscription;
        const invoiceSubscriptionId = typeof invoiceBinding === "string" ? invoiceBinding : invoiceBinding?.id;
        const paid = invoice?.status === "paid" && !invoice.livemode && invoiceCustomer === customer && invoiceSubscriptionId === subscriptionId;
        const entitledUntil = current.status === "active" && paid && Number.isSafeInteger(periodEnd) ? new Date(periodEnd * 1000) : null;
        const values = { userId: actor, customerId: customer, priceId: item.price.id, status: current.status,
          entitledUntil, observedAt: new Date(), livemode: false };
        await transaction.insert(billingSubscriptions).values({ id: subscriptionId, ...values }).onConflictDoUpdate({ target: billingSubscriptions.id, set: values });
        await transaction.update(billingCheckoutRequests).set({ status: "completed", updatedAt: new Date() }).where(eq(billingCheckoutRequests.id, checkout.id));
      }
      await transaction.insert(billingEventReceipts).values({ id: event.id, eventType: event.type, fingerprint, subscriptionId });
      return { duplicate: false };
    });
    response.json({ received: true, ...result });
  }));
  return router;
}
