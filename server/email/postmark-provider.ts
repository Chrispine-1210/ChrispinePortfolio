import { ServerClient } from "postmark";
import type { EmailProvider, EmailProviderResult, QueuedEmail } from "./types.js";

export class PostmarkEmailProvider implements EmailProvider {
  readonly name = "postmark";
  private readonly client: ServerClient;

  constructor(
    serverToken: string,
    private readonly transactionalStream = "outbound",
    private readonly broadcastStream = "broadcasts",
  ) {
    if (!serverToken) throw new Error("POSTMARK_SERVER_TOKEN is required");
    this.client = new ServerClient(serverToken);
  }

  async send(message: QueuedEmail): Promise<EmailProviderResult> {
    const from = message.fromName
      ? `${message.fromName.replace(/[<>]/g, "")} <${message.fromEmail}>`
      : message.fromEmail;
    const response = await this.client.sendEmail({
      From: from,
      To: message.toEmail,
      Subject: message.subject,
      HtmlBody: message.htmlBody,
      TextBody: message.textBody ?? undefined,
      ReplyTo: message.replyTo ?? undefined,
      MessageStream: message.messageType === "marketing"
        ? this.broadcastStream
        : this.transactionalStream,
      Metadata: {
        outbox_id: message.id,
      },
    });
    if (response.ErrorCode !== 0 || !response.MessageID) {
      throw new Error(response.Message || "Postmark rejected the email");
    }
    return { provider: this.name, messageId: response.MessageID };
  }
}
