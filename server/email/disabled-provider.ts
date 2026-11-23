import type { EmailProvider, EmailProviderResult, QueuedEmail } from "./types.js";
import { DeliveryRejectedError } from "./types.js";

export class DisabledEmailProvider implements EmailProvider {
  readonly name = "disabled";

  async send(_message: QueuedEmail): Promise<EmailProviderResult> {
    throw new DeliveryRejectedError("Outbound email provider is not configured");
  }
}
