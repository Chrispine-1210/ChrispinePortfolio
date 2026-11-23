import { describe, expect, it } from "vitest";
import { filterPublicPageview } from "../client/src/lib/web-analytics.js";

const origin = "https://portfolio.example";
const view = (path: string) => ({ type: "pageview" as const, url: `${origin}${path}` });

describe("public Web Analytics boundary", () => {
  it.each(["/", "/about", "/hire", "/services", "/resources", "/publications", "/contact", "/subscribe", "/newsletter", "/github", "/projects", "/portfolio", "/blog", "/journey", "/software-consulting-malawi", "/digital-transformation-africa", "/education-technology-solutions", "/custom-software-development", "/blog/", "/blog/a-public-post", "/portfolio/capital-system", "/journey/field-notes"])("retains the public page %s", (path) => {
    expect(filterPublicPageview(view(path), origin)).toEqual(view(path));
  });

  it.each(["/admin", "/admin/treasury", "/admin/users", "/admin/communications", "/analytics", "/newsletter-manage", "/external-posts", "/dashboard", "/login", "/api/auth/me", "/api/admin/treasury/evidence", "/reset-password/token", "/unlisted-private-page", "/portfolio/private/nested", "/%61dmin", "/blog/person%40example.com"])("drops private or unrecognized page %s", (path) => {
    expect(filterPublicPageview(view(`${path}?token=private`), origin)).toBeNull();
  });

  it("strips sensitive query values and fragments without mutating the original event", () => {
    const event = view("/contact?email=person%40example.com&token=private&utm_source=campaign#secret");
    expect(filterPublicPageview(event, origin)).toEqual(view("/contact"));
    expect(event.url).toContain("token=private");
  });

  it("drops custom events and their additional data", () => {
    expect(filterPublicPageview({ type: "event", url: `${origin}/contact` }, origin)).toBeNull();
  });

  it.each(["not a URL", "https://other.example/about", "javascript:alert(1)"])("drops malformed or foreign URL %s", (url) => {
    expect(filterPublicPageview({ type: "pageview", url }, origin)).toBeNull();
  });

  it("does not forward unknown event fields or URL credentials", () => {
    const event = { type: "pageview" as const, url: "https://person:private@portfolio.example/about", secret: "private" };
    expect(filterPublicPageview(event, origin)).toEqual(view("/about"));
  });
});
