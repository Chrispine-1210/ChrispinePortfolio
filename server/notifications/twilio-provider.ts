import Twilio from "twilio";

export class TwilioMessagingProvider {
  private readonly client: ReturnType<typeof Twilio>;
  constructor(accountSid: string, authToken: string, private readonly smsFrom?: string, private readonly whatsappFrom?: string) {
    this.client = Twilio(accountSid, authToken);
  }
  async send(channel: "sms" | "whatsapp", recipient: string, body: string) {
    const configuredFrom = channel === "whatsapp" ? this.whatsappFrom : this.smsFrom;
    if (!configuredFrom) throw new Error(`${channel.toUpperCase()} sender is not configured`);
    const normalize = (value: string) => channel === "whatsapp" && !value.startsWith("whatsapp:") ? `whatsapp:${value}` : value;
    const message = await this.client.messages.create({ from: normalize(configuredFrom), to: normalize(recipient), body });
    return { provider: "twilio", messageId: message.sid, status: message.status };
  }
}
