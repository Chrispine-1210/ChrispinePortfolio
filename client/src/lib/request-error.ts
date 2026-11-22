export const unconfirmedWriteMessage =
  "The change could not be confirmed. Check the record before submitting again.";

function boundedText(value: unknown, length = 200): string {
  return typeof value === "string" ? value.slice(0, length) : "";
}

export function requestFailureMessage(status: number, body: unknown, requestId: string | null, method = "GET"): string {
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const reference = boundedText(requestId ?? payload.requestId, 80);
  const fields = Array.isArray(payload.fields) ? payload.fields.slice(0, 3)
    .map(field => field && typeof field === "object" ? boundedText(field.message) : "")
    .filter(Boolean).join(". ") : "";
  const nested = payload.error && typeof payload.error === "object" ? payload.error as Record<string, unknown> : {};
  const write = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  const message = status >= 500
    ? write ? unconfirmedWriteMessage : "Service temporarily unavailable. Please retry."
    : fields || boundedText(payload.message) || boundedText(nested.message) || `Request failed (${status})`;
  return `${message}${reference ? ` Reference: ${reference}` : ""}`;
}
