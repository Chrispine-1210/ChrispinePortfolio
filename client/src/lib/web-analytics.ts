import type { BeforeSendEvent } from "@vercel/analytics";

// Explicit public routes keep new private surfaces excluded by default.
const publicPaths = new Set([
  "/", "/portfolio", "/projects", "/blog", "/journey", "/about",
  "/hire", "/services", "/resources", "/publications", "/contact",
  "/subscribe", "/newsletter", "/github", "/software-consulting-malawi",
  "/digital-transformation-africa", "/education-technology-solutions",
  "/custom-software-development",
]);

export function filterPublicPageview(
  event: BeforeSendEvent,
  origin: string,
): BeforeSendEvent | null {
  // This integration collects page views only, without custom-event payloads.
  if (event.type !== "pageview") return null;

  try {
    const url = new URL(event.url);
    if (url.origin !== origin) return null;

    const path = url.pathname.replace(/\/$/, "") || "/";
    const publicDetail = /^\/(portfolio|blog|journey)\/[a-z0-9-]+$/i.test(path);
    if (!publicPaths.has(path) && !publicDetail) return null;

    // Never send query values, fragments, or URL credentials to Web Analytics.
    return { type: "pageview", url: `${url.origin}${url.pathname}` };
  } catch {
    return null;
  }
}
