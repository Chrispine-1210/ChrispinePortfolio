import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  accountRecoveryTokens,
  auditEvents,
  emailOutbox,
  sessions,
  users,
} from "../../shared/schema.js";
import { protectRecoveryContent } from "../email/sensitive-content.js";
import { db } from "../db.js";
import { env } from "../env.js";
import { ApiError, asyncHandler } from "../middleware.js";
import { hashPasswordArgon2id } from "./passwords.js";
import { requestNetwork, withinPublicLimit } from "./public-request-limits.js";

const generic = {
  message:
    "If this address is eligible, a recovery link will be sent. Check your inbox and keep any existing link private.",
};
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function recoveryEnabled() {
  if (
    env.ACCOUNT_RECOVERY_MODE !== "email" ||
    env.ADMIN_AUTH_MODE !== "database" ||
    env.EMAIL_PROVIDER !== "postmark" ||
    !env.POSTMARK_FROM_EMAIL ||
    !env.RECOVERY_EMAIL_ENCRYPTION_KEY ||
    !env.APP_BASE_URL
  )
    return false;
  try {
    return new URL(env.APP_BASE_URL).protocol === "https:";
  } catch {
    return false;
  }
}
export function createAccountRecoveryRouter() {
  const router = Router();
  router.get("/api/auth/capabilities", (_req, res) =>
    res.json({
      recoveryEnabled: recoveryEnabled(),
      registrationEnabled: false,
    }),
  );
  router.post(
    "/api/auth/recovery/request",
    asyncHandler(async (req, res) => {
      const started = Date.now(),
        minimum = 500 + randomInt(80);
      const respond = async () => {
        await pause(Math.max(0, minimum - (Date.now() - started)));
        return res.json(generic);
      };
      try {
        const { email } = z
          .object({
            email: z
              .string()
              .trim()
              .email()
              .max(320)
              .transform((value) => value.toLowerCase()),
          })
          .strict()
          .parse(req.body);
        if (!recoveryEnabled()) return await respond();
        const networkAllowed = await withinPublicLimit(
          "recovery-network",
          requestNetwork(req),
          10,
          60 * 60000,
        );
        const accountAllowed = await withinPublicLimit(
          "recovery-address",
          email,
          3,
          60 * 60000,
        );
        if (!networkAllowed || !accountAllowed) return await respond();
        await db.transaction(async (transaction) => {
          await transaction.execute(sql`SET LOCAL lock_timeout='3000ms'`);
          const [user] = await transaction
            .select({
              id: users.id,
              status: users.status,
              version: users.securityVersion,
              email: users.email,
              emailVerifiedAt: users.emailVerifiedAt,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            .for("update");
          // Recovery does not silently promote an unverified contact address into
          // account authority. Owner provisioning must establish the address first.
          if (!user || user.status !== "active" || !user.emailVerifiedAt)
            return;
          const now = new Date();
          const [open] = await transaction
            .select({ id: accountRecoveryTokens.id })
            .from(accountRecoveryTokens)
            .where(
              and(
                eq(accountRecoveryTokens.userId, user.id),
                eq(accountRecoveryTokens.userSecurityVersion, user.version),
                isNull(accountRecoveryTokens.consumedAt),
                gt(accountRecoveryTokens.expiresAt, now),
              ),
            )
            .limit(1);
          if (open) return;
          const token = randomBytes(32).toString("base64url"),
            url = new URL("/reset-password", env.APP_BASE_URL!);
          url.hash = new URLSearchParams({ token }).toString();
          const [record] = await transaction
            .insert(accountRecoveryTokens)
            .values({
              userId: user.id,
              tokenHash: hash(token),
              userSecurityVersion: user.version,
              expiresAt: new Date(now.getTime() + 15 * 60000),
            })
            .returning({ id: accountRecoveryTokens.id });
          const outboxId = randomUUID();
          const htmlBody = `<p>A password reset was requested for your account.</p><p><a href="${url.href.replaceAll("&", "&amp;")}">Choose a new password</a></p><p>This private link expires in 15 minutes and can be used once. If you did not request it, ignore this message.</p>`;
          const textBody = `Choose a new password: ${url.href}\nThis link expires in 15 minutes and can be used once. If you did not request it, ignore this message.`;
          await transaction
            .insert(emailOutbox)
            .values({
              id: outboxId,
              toEmail: email,
              fromEmail: env.POSTMARK_FROM_EMAIL!,
              fromName: env.POSTMARK_FROM_NAME,
              subject: "Reset your portfolio account password",
              messageType: "transactional",
              htmlBody: "Protected account recovery message",
              textBody: "Protected account recovery message",
              metadata: {
                protectedRecovery: protectRecoveryContent(
                  outboxId,
                  email,
                  htmlBody,
                  textBody,
                  new Date(now.getTime() + 15 * 60000),
                ),
              },
              idempotencyKey: `recovery:${record.id}`,
            });
          await transaction
            .insert(auditEvents)
            .values({
              actorUserId: user.id,
              action: "identity.recovery.requested",
              resourceType: "account",
              resourceId: user.id,
              result: "success",
              requestId: req.requestId,
            });
        });
        return await respond();
      } finally {
        await pause(Math.max(0, minimum - (Date.now() - started)));
      }
    }),
  );
  router.post(
    "/api/auth/recovery/complete",
    asyncHandler(async (req, res) => {
      if (!recoveryEnabled())
        throw new ApiError(409, "Account recovery is not enabled");
      const input = z
        .object({
          token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          password: z.string().min(12).max(1024),
          confirmation: z.string().min(12).max(1024),
        })
        .strict()
        .refine((value) => value.password === value.confirmation, {
          message: "Passwords must match",
          path: ["confirmation"],
        })
        .parse(req.body);
      if (
        !(await withinPublicLimit(
          "recovery-complete",
          requestNetwork(req),
          10,
          15 * 60000,
        ))
      )
        throw new ApiError(
          429,
          "Too many recovery attempts. Wait before trying again.",
        );
      const digest = hash(input.token);
      const [candidate] = await db
        .select({
          id: accountRecoveryTokens.id,
          userId: accountRecoveryTokens.userId,
        })
        .from(accountRecoveryTokens)
        .where(
          and(
            eq(accountRecoveryTokens.tokenHash, digest),
            isNull(accountRecoveryTokens.consumedAt),
            gt(accountRecoveryTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (!candidate)
        throw new ApiError(400, "The recovery link is invalid or expired");
      const passwordHash = await hashPasswordArgon2id(input.password);
      const changed = await db.transaction(async (transaction) => {
        await transaction.execute(sql`SET LOCAL lock_timeout='3000ms'`);
        // All recovery request/completion paths lock the account before tokens.
        const [user] = await transaction
          .select()
          .from(users)
          .where(eq(users.id, candidate.userId))
          .limit(1)
          .for("update");
        const [token] = await transaction
          .select()
          .from(accountRecoveryTokens)
          .where(eq(accountRecoveryTokens.id, candidate.id))
          .limit(1)
          .for("update");
        if (
          !user ||
          user.status !== "active" ||
          !user.emailVerifiedAt ||
          !token ||
          token.consumedAt ||
          token.expiresAt <= new Date() ||
          token.userSecurityVersion !== user.securityVersion
        )
          return false;
        const now = new Date();
        await transaction
          .update(users)
          .set({
            passwordHash,
            securityVersion: sql`${users.securityVersion}+1`,
            failedLoginAttempts: 0,
            lockedUntil: null,
            updatedAt: now,
          })
          .where(eq(users.id, user.id));
        await transaction
          .update(accountRecoveryTokens)
          .set({ consumedAt: now })
          .where(
            and(
              eq(accountRecoveryTokens.userId, user.id),
              isNull(accountRecoveryTokens.consumedAt),
            ),
          );
        await transaction
          .update(sessions)
          .set({ revokedAt: now, revokedReason: "password_recovery" })
          .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)));
        await transaction
          .insert(emailOutbox)
          .values({
            toEmail: user.email!,
            fromEmail: env.POSTMARK_FROM_EMAIL!,
            fromName: env.POSTMARK_FROM_NAME,
            subject: "Your portfolio account password changed",
            messageType: "transactional",
            htmlBody:
              "<p>Your password changed. All existing sessions and recovery links have been invalidated. If you did not make this change, contact the account owner through your established channel.</p>",
            textBody:
              "Your password changed. All existing sessions and recovery links have been invalidated. If you did not make this change, contact the account owner through your established channel.",
            idempotencyKey: `recovery-confirmed:${token.id}`,
          });
        await transaction
          .insert(auditEvents)
          .values({
            actorUserId: user.id,
            action: "identity.recovery.completed",
            resourceType: "account",
            resourceId: user.id,
            result: "success",
            requestId: req.requestId,
          });
        return true;
      });
      if (!changed)
        throw new ApiError(400, "The recovery link is invalid or expired");
      res.clearCookie("admin_session", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      res.json({
        changed: true,
        message:
          "Password changed. Sign in again. Existing sessions and recovery links have been invalidated.",
      });
    }),
  );
  return router;
}
