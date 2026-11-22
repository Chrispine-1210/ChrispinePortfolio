import { readFile, readdir } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getSchema } from "@tiptap/core";
import { createStudioExtensions } from "../client/src/components/admin/studio-extensions.js";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import request from "supertest";
import type { Express } from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";
import {
  EDITORIAL_PREFIX,
  MAX_IMAGE_BYTES,
  authorResearch,
  encodeEditorial,
  hasEditorialBody,
  metadataFor,
  readEditorial,
  safeImage,
  safeLink,
  updateEditorialMetadata,
  type RichNode,
} from "../shared/editorial.js";
import { RichContent } from "../client/src/components/editorial/RichContent.js";
import { publicWritingPost, publishedImage } from "./editorial-media.js";

const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const doc: RichNode = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2, textAlign: "center" },
      content: [
        {
          type: "text",
          text: "A reproducible workflow",
          marks: [
            { type: "bold" },
            {
              type: "textStyle",
              attrs: { fontFamily: "Georgia, serif", fontSize: "24px" },
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Synthetic editorial fixture; no business or publication claim.",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: png,
        alt: "A synthetic one-pixel PNG fixture",
        width: 50,
        alignment: "right",
        caption: "Test image",
        credit: "QA fixture",
        creditUrl: "",
      },
    },
  ],
};
const content = encodeEditorial(doc, {
  kind: "research",
  authors: authorResearch.name,
  doi: "10.1234/fixture",
  publicationStatus: "working_paper",
  citation: "Synthetic citation; not a real publication.",
});

describe("safe editorial documents", () => {
  it("accepts the actual editor schema including default image geometry", () => {
    const normalized = getSchema(createStudioExtensions())
      .nodeFromJSON(doc)
      .toJSON() as RichNode;
    expect(normalized.content?.[2].attrs).toMatchObject({
      height: null,
      width: 50,
    });
    expect(readEditorial(encodeEditorial(normalized))).not.toBeNull();
  });
  it("preserves fonts, emphasis, image placement and reference metadata", () => {
    expect(readEditorial(content)?.content).toEqual(doc);
    expect(metadataFor(content)).toMatchObject({
      kind: "research",
      doi: "10.1234/fixture",
    });
    const html = renderToStaticMarkup(createElement(RichContent, { content }));
    expect(html).toContain("font-family:Georgia, serif;font-size:24px");
    expect(html).toContain("<strong>");
    expect(html).toContain("width:50%;margin-left:auto;margin-right:0");
    expect(html).toContain('alt="A synthetic one-pixel PNG fixture"');
  });
  it("keeps partial DOI edits without accepting them for publication", () => {
    const partial = updateEditorialMetadata(content, { doi: "10." });
    expect(metadataFor(partial).doi).toBe("10.");
    expect(readEditorial(partial)).toBeNull();
    const finished = updateEditorialMetadata(partial, {
      doi: "10.1234/changed",
    });
    expect(readEditorial(finished)?.content).toEqual(doc);
    expect(metadataFor(finished).citation).toBe(
      "Synthetic citation; not a real publication.",
    );
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "//evil.invalid/image.png",
    "https://user:password@evil.invalid/img",
    "/\\evil.invalid/img",
    "file:///etc/passwd",
  ])("refuses unsafe source %s", (source) => {
    expect(safeLink(source)).toBe(false);
    expect(safeImage(source)).toBe(false);
  });
  it("accepts only bounded raster data and refuses SVG payloads", () => {
    expect(safeImage(png)).toBe(true);
    expect(safeImage("/media/editorial/network.webp")).toBe(true);
    expect(safeImage("data:image/svg+xml;base64,PHN2Zy8+")).toBe(false);
    expect(
      safeImage(
        "data:image/png;base64," +
          Buffer.alloc(MAX_IMAGE_BYTES + 10).toString("base64"),
      ),
    ).toBe(false);
    expect(
      safeImage(
        "data:image/png;base64," +
          Buffer.from("<script>alert(1)</script>").toString("base64"),
      ),
    ).toBe(false);
  });
  it("refuses executable attributes, unknown nodes and unbounded nesting", () => {
    for (const malicious of [
      {
        type: "doc",
        content: [{ type: "iframe", attrs: { src: "https://evil.invalid" } }],
      },
      {
        type: "doc",
        content: [{ type: "paragraph", attrs: { onclick: "alert(1)" } }],
      },
      {
        type: "doc",
        content: [{ type: "image", attrs: { src: png, alt: "" } }],
      },
    ])
      expect(readEditorial(encodeEditorial(malicious))).toBeNull();
    let deep: RichNode = { type: "paragraph" };
    for (let i = 0; i < 30; i++) deep = { type: "blockquote", content: [deep] };
    expect(
      readEditorial(encodeEditorial({ type: "doc", content: [deep] })),
    ).toBeNull();
  });
  it("renders legacy Markdown without executing HTML or losing text", () => {
    const html = renderToStaticMarkup(
      createElement(RichContent, {
        content:
          "## Existing Markdown\n\n**Still readable** <script>alert(1)</script>\n\n[unsafe](javascript:alert(1))",
      }),
    );
    expect(html).toContain("Existing Markdown");
    expect(html).toContain("<strong>Still readable</strong>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
  });
  it("does not expose invalid rich documents as raw JSON", () => {
    const html = renderToStaticMarkup(
      createElement(RichContent, {
        content: EDITORIAL_PREFIX + '{"private":"do-not-render"}',
      }),
    );
    expect(html).toContain("could not be displayed");
    expect(html).not.toContain("do-not-render");
    expect(
      hasEditorialBody(
        encodeEditorial({ type: "doc", content: [{ type: "paragraph" }] }),
      ),
    ).toBe(false);
  });
});

const database = new PGlite();
vi.mock("./db.js", () => ({ db: drizzle(database, { schema }) }));
let app: Express, adminCookie: string, financeCookie: string;
beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("AUTH_KEY_PEPPER", "isolated-editorial-studio-fixture-pepper");
  for (const file of (await readdir("migrations"))
    .filter((n) => /^\d{4}_.*\.sql$/.test(n))
    .sort())
    await database.exec(await readFile(`migrations/${file}`, "utf8"));
  const { getDatabaseAuthRuntime } =
    await import("./security/database-auth-routes.js");
  async function cookie(role: string) {
    const {
      rows: [user],
    } = await database.query<{ id: string; security_version: number }>(
      "INSERT INTO users(email) VALUES ($1) RETURNING id,security_version",
      [`${role}@editorial.test.invalid`],
    );
    await database.query(
      "INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE key=$2",
      [user.id, role],
    );
    const session = await getDatabaseAuthRuntime().sessions.issue({
      userId: user.id,
      userSecurityVersion: user.security_version,
    });
    return `admin_session=${session.token}`;
  }
  adminCookie = await cookie("super_administrator");
  financeCookie = await cookie("finance_manager");
  ({ app } = await import("./app.js"));
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await database.close();
});
const payload = (slug: string, body = content) => ({
  title: "Synthetic research fixture",
  slug,
  excerpt: "Test-only excerpt; not a real publication.",
  content: body,
  category: "Programming",
  featuredImage: png,
});

describe("authenticated studio persistence and public image boundaries", () => {
  it("persists a full revision, publishes through the workflow and serves bounded raster bytes", async () => {
    const created = await request(app)
      .post("/api/admin/content/posts")
      .set("Cookie", adminCookie)
      .send(payload("studio-roundtrip"));
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const versions = await request(app)
      .get(`/api/admin/content/posts/${created.body.id}/versions`)
      .set("Cookie", adminCookie);
    expect(versions.body[0].version).toBe(1);
    const stored = await database.query<{ snapshot: { content: string } }>(
      "SELECT snapshot FROM content_versions WHERE post_id=$1 AND version=1",
      [created.body.id],
    );
    expect(stored.rows[0].snapshot.content).toBe(content);
    const projection = publicWritingPost(created.body);
    const cover = projection.featuredImage!;
    expect((await request(app).get(cover)).status).toBe(404);
    for (const action of ["submit_review", "approve", "publish"]) {
      const r = await request(app)
        .post(`/api/admin/content/posts/${created.body.id}/transition`)
        .set("Cookie", adminCookie)
        .send({ action });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
    }
    const list = await request(app).get("/api/blog");
    expect(list.status).toBe(200);
    const summary = list.body.find(
      (p: { slug: string }) => p.slug === "studio-roundtrip",
    );
    expect(summary.content).toBeUndefined();
    expect(summary.editorialMetadata.kind).toBe("research");
    expect(JSON.stringify(summary)).not.toContain("base64");
    const detail = await request(app).get("/api/blog/studio-roundtrip");
    expect(detail.status).toBe(200);
    expect(detail.body.content).not.toContain("base64");
    expect(readEditorial(detail.body.content)?.metadata.doi).toBe(
      "10.1234/fixture",
    );
    const image = await request(app).get(cover);
    expect(image.status).toBe(200);
    expect(image.headers["content-type"]).toContain("image/png");
    expect(image.headers["x-content-type-options"]).toBe("nosniff");
    expect(image.body).toEqual(Buffer.from(png.split(",")[1], "base64"));
    const archived = await request(app)
      .post(`/api/admin/content/posts/${created.body.id}/transition`)
      .set("Cookie", adminCookie)
      .send({
        action: "archive",
        justification: "Synthetic fixture archived after verification",
      });
    expect(archived.status).toBe(200);
    expect((await request(app).get(cover)).status).toBe(404);
  });
  it("does not disclose premium inline images through the public media route", () => {
    const fixture = {
      ...payload("premium-media"),
      id: "fixture",
      isPremium: true,
    } as schema.BlogPost;
    const projection = publicWritingPost(fixture, true);
    const nodes = readEditorial(projection.content!)!.content as RichNode;
    const inline = String(nodes.content![2].attrs!.src);
    const hash = inline.split("/").at(-1)!;
    // The same fixture source is also the cover, which remains public. A distinct
    // inline asset must not become accessible through its hash.
    const other = {
      ...fixture,
      featuredImage: "https://example.invalid/cover.webp",
    };
    expect(publishedImage(other, hash)).toBeNull();
  });
  it("allows authenticated long documents while public forms retain 10 KB", async () => {
    expect(
      (
        await request(app)
          .post("/api/admin/content/posts")
          .set("Cookie", adminCookie)
          .send(payload("studio-long", "Valid text ".repeat(1500)))
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app)
          .post("/api/contact")
          .send({ message: "x".repeat(11000) })
      ).status,
    ).toBe(413);
  });
  it("authenticates and checks permissions before parsing large editorial bodies", async () => {
    const anonymous = await request(app)
      .post("/api/admin/content/posts")
      .send(payload("anonymous-large", "x".repeat(15000)));
    expect(anonymous.status).toBe(401);
    const forbidden = await request(app)
      .post("/api/admin/content/posts")
      .set("Cookie", financeCookie)
      .send(payload("finance-large", "x".repeat(15000)));
    expect(forbidden.status).toBe(403);
    const oversized = await request(app)
      .post("/api/admin/content/posts")
      .set("Cookie", adminCookie)
      .send(payload("oversized", "x".repeat(1_300_000)));
    expect(oversized.status).toBe(413);
  });
  it("rejects invalid metadata and malicious rich payloads before writing", async () => {
    const invalid = updateEditorialMetadata(content, {
      publicationUrl: "javascript:alert(1)",
    });
    expect(
      (
        await request(app)
          .post("/api/admin/content/posts")
          .set("Cookie", adminCookie)
          .send(payload("studio-invalid", invalid))
      ).status,
    ).toBe(400);
    expect(
      (
        await database.query(
          "SELECT id FROM blog_posts WHERE slug='studio-invalid'",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await request(app)
          .post("/api/admin/content/posts")
          .set("Cookie", adminCookie)
          .send(
            payload(
              "studio-empty",
              encodeEditorial({
                type: "doc",
                content: [{ type: "paragraph" }],
              }),
            ),
          )
      ).status,
    ).toBe(400);
  });
});
