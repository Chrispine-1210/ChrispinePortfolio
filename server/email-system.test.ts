import { describe, expect, it } from "vitest";
import { EmailDispatcher } from "./email/dispatcher.js";
import { renderEmailTemplate } from "./email/template-renderer.js";
import { verifyPostmarkBasicAuthorization } from "./email/postmark-webhook-auth.js";
import {
  createNotificationActionToken,
  hashNotificationActionToken,
} from "./notifications/action-token.js";
import type {
  EmailOutboxRepository,
  EmailProvider,
  EmailProviderResult,
  QueuedEmail,
} from "./email/types.js";

class MemoryOutbox implements EmailOutboxRepository {
  sent: string[] = [];
  suppressedMessages: string[] = [];
  failures: Array<{ id: string; nextAttemptAt: Date | null; error: string }> = [];
  suppressedRecipients = new Set<string>();

  constructor(public messages: QueuedEmail[]) {}
  async claimBatch(_workerId: string, limit: number) { return this.messages.slice(0, limit); }
  async isSuppressed(email: string) { return this.suppressedRecipients.has(email); }
  async markSent(id: string) { this.sent.push(id); }
  async markSuppressed(id: string) { this.suppressedMessages.push(id); }
  async markFailed(id: string, error: string, nextAttemptAt: Date | null) {
    this.failures.push({ id, error, nextAttemptAt });
  }
}

class StubProvider implements EmailProvider {
  readonly name = "stub";
  constructor(private readonly failure?: Error) {}
  async send(message: QueuedEmail): Promise<EmailProviderResult> {
    if (this.failure) throw this.failure;
    return { provider: this.name, messageId: `provider-${message.id}` };
  }
}

function message(overrides: Partial<QueuedEmail> = {}): QueuedEmail {
  return {
    id: "email-1",
    toEmail: "person@example.com",
    fromEmail: "sender@example.com",
    fromName: "Portfolio",
    replyTo: null,
    subject: "Hello",
    htmlBody: "<p>Hello</p>",
    textBody: "Hello",
    messageType: "transactional",
    attemptCount: 0,
    maxAttempts: 5,
    metadata: null,
    ...overrides,
  };
}

describe("email template rendering", () => {
  it("renders nested values and escapes substitutions in HTML", () => {
    const rendered = renderEmailTemplate({
      subject: "Hello {{ user.name }}",
      htmlContent: "<p>{{user.name}}</p>",
      textContent: "Hello {{user.name}}",
    }, { user: { name: "<Chrispine & team>" } });

    expect(rendered.subject).toBe("Hello <Chrispine & team>");
    expect(rendered.htmlBody).toBe("<p>&lt;Chrispine &amp; team&gt;</p>");
    expect(rendered.textBody).toBe("Hello <Chrispine & team>");
  });

  it("fails closed when required template values are absent", () => {
    expect(() => renderEmailTemplate({
      subject: "Hello {{name}}",
      htmlContent: "<p>{{missing}}</p>",
    }, { name: "Chrispine" })).toThrow("missing");
  });
});

describe("email outbox dispatcher", () => {
  it("delivers claimed messages through the provider", async () => {
    const repository = new MemoryOutbox([message()]);
    const summary = await new EmailDispatcher(repository, new StubProvider())
      .processBatch("worker-1", 25, new Date("2026-07-23T18:00:00Z"));

    expect(summary).toEqual({ claimed: 1, sent: 1, suppressed: 0, retried: 0, failed: 0 });
    expect(repository.sent).toEqual(["email-1"]);
  });

  it("never calls the provider for a suppressed recipient", async () => {
    const repository = new MemoryOutbox([message()]);
    repository.suppressedRecipients.add("person@example.com");
    const summary = await new EmailDispatcher(repository, new StubProvider())
      .processBatch("worker-1");

    expect(summary.suppressed).toBe(1);
    expect(repository.suppressedMessages).toEqual(["email-1"]);
  });

  it("schedules exponential retries and terminates at the attempt limit", async () => {
    const now = new Date("2026-07-23T18:00:00Z");
    const retryRepository = new MemoryOutbox([message({ attemptCount: 1 })]);
    await new EmailDispatcher(retryRepository, new StubProvider(new Error("provider unavailable")))
      .processBatch("worker-1", 25, now);
    expect(retryRepository.failures[0]).toMatchObject({
      error: "provider unavailable",
      nextAttemptAt: new Date("2026-07-23T18:02:00Z"),
    });

    const terminalRepository = new MemoryOutbox([message({ attemptCount: 4, maxAttempts: 5 })]);
    const terminalSummary = await new EmailDispatcher(
      terminalRepository,
      new StubProvider(new Error("permanent failure")),
    ).processBatch("worker-1", 25, now);
    expect(terminalSummary.failed).toBe(1);
    expect(terminalRepository.failures[0]?.nextAttemptAt).toBeNull();
  });
});

describe("Postmark webhook authentication", () => {
  it("accepts only the exact configured HTTP Basic credentials", () => {
    const authorization = `Basic ${Buffer.from("postmark-hook:long-random-webhook-password").toString("base64")}`;
    expect(verifyPostmarkBasicAuthorization(
      authorization,
      "postmark-hook",
      "long-random-webhook-password",
    )).toBe(true);
    expect(verifyPostmarkBasicAuthorization(
      authorization,
      "postmark-hook",
      "different-random-webhook-password",
    )).toBe(false);
    expect(verifyPostmarkBasicAuthorization(undefined, "postmark-hook", "password"))
      .toBe(false);
  });
});

describe("notification action tokens", () => {
  it("creates opaque tokens and stores only a deterministic hash", () => {
    const first = createNotificationActionToken();
    const second = createNotificationActionToken();
    expect(first.token).not.toBe(second.token);
    expect(first.token).not.toContain(first.tokenHash);
    expect(hashNotificationActionToken(first.token)).toBe(first.tokenHash);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
