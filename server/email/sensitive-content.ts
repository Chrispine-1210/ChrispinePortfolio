import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "../env.js";
import { DeliveryRejectedError, type QueuedEmail } from "./types.js";
const payload = z
  .object({ iv: z.string(), tag: z.string(), ciphertext: z.string() })
  .strict();
const content = z
  .object({
    htmlBody: z.string().max(20000),
    textBody: z.string().max(20000),
    expiresAt: z.string().datetime(),
  })
  .strict();
const key = () => {
  if (!env.RECOVERY_EMAIL_ENCRYPTION_KEY)
    throw Error("Recovery content encryption is unavailable");
  return Buffer.from(env.RECOVERY_EMAIL_ENCRYPTION_KEY, "hex");
};
export function protectRecoveryContent(
  id: string,
  toEmail: string,
  htmlBody: string,
  textBody: string,
  expiresAt: Date,
) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`${id}:${toEmail}`));
  const ciphertext = Buffer.concat([
    cipher.update(
      JSON.stringify({
        htmlBody,
        textBody,
        expiresAt: expiresAt.toISOString(),
      }),
      "utf8",
    ),
    cipher.final(),
  ]);
  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}
export function hydrateSensitiveEmail(message: QueuedEmail): QueuedEmail {
  const metadata = message.metadata as { protectedRecovery?: unknown } | null;
  if (!metadata?.protectedRecovery) return message;
  try {
    const encrypted = payload.parse(metadata.protectedRecovery),
      decipher = createDecipheriv(
        "aes-256-gcm",
        key(),
        Buffer.from(encrypted.iv, "base64"),
      );
    decipher.setAAD(Buffer.from(`${message.id}:${message.toEmail}`));
    decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
    const clear = content.parse(
      JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
          decipher.final(),
        ]).toString("utf8"),
      ),
    );
    if (new Date(clear.expiresAt) <= new Date())
      throw new DeliveryRejectedError(
        "Recovery message expired before sending",
      );
    return { ...message, htmlBody: clear.htmlBody, textBody: clear.textBody };
  } catch (error) {
    if (error instanceof DeliveryRejectedError) throw error;
    throw new DeliveryRejectedError(
      "Protected recovery message could not be opened",
    );
  }
}
