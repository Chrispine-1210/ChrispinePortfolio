import type { EmailProvider, EmailProviderResult, QueuedEmail } from "./types.js";

export class DisabledEmailProvider implements EmailProvider {
  readonly name = "disabled";

  async send(_message: QueuedEmail): Promise<EmailProviderResult> {
    throw new Error("Outbound email provider is not configured");
  }
}
