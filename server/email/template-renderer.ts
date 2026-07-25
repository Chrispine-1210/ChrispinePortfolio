const PLACEHOLDER = /{{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*}}/g;

function lookup(values: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[segment];
  }, values);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderValue(template: string, values: Record<string, unknown>, html: boolean): string {
  const missing = new Set<string>();
  const rendered = template.replace(PLACEHOLDER, (_match, key: string) => {
    const value = lookup(values, key);
    if (value === undefined || value === null) {
      missing.add(key);
      return "";
    }
    const stringValue = String(value);
    return html ? escapeHtml(stringValue) : stringValue;
  });
  if (missing.size) throw new Error(`Missing email template variables: ${[...missing].join(", ")}`);
  return rendered;
}

export interface RenderedEmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string | null;
}

export function renderEmailTemplate(
  template: { subject: string; htmlContent: string; textContent?: string | null },
  values: Record<string, unknown>,
): RenderedEmailTemplate {
  return {
    subject: renderValue(template.subject, values, false),
    htmlBody: renderValue(template.htmlContent, values, true),
    textBody: template.textContent ? renderValue(template.textContent, values, false) : null,
  };
}
