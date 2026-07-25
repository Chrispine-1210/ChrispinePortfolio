import { env } from "../env.js";
import { DisabledEmailProvider } from "./disabled-provider.js";
import { PostmarkEmailProvider } from "./postmark-provider.js";

export function createEmailProvider() {
  if (env.EMAIL_PROVIDER === "postmark" && env.POSTMARK_SERVER_TOKEN) {
    return new PostmarkEmailProvider(env.POSTMARK_SERVER_TOKEN, env.POSTMARK_TRANSACTIONAL_STREAM, env.POSTMARK_BROADCAST_STREAM);
  }
  return new DisabledEmailProvider();
}
