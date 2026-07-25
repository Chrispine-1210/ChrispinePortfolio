import { createHash, timingSafeEqual } from "node:crypto";

function secureEqual(actual: string, expected: string): boolean {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function verifyPostmarkBasicAuthorization(
  authorization: string | undefined,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  if (!authorization?.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    return secureEqual(decoded.slice(0, separator), expectedUsername) &&
      secureEqual(decoded.slice(separator + 1), expectedPassword);
  } catch {
    return false;
  }
}
