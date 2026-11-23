import { z } from "zod";

export const EDITORIAL_PREFIX = "<!-- editorial-document:v1 -->\n";
export const MAX_IMAGE_BYTES = 160_000;
export const MAX_EDITORIAL_LENGTH = 900_000;
export const writingKinds = [
  "article",
  "research",
  "tutorial",
  "note",
  "publication",
] as const;
export const writingLabels = {
  article: "Articles",
  research: "Research",
  tutorial: "Tutorials",
  note: "Notes",
  publication: "Publications",
};
export const fonts = [
  "Inter, sans-serif",
  "Georgia, serif",
  "Arial, sans-serif",
  "Verdana, sans-serif",
  "monospace",
];
export const fontSizes = [
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "40px",
];

export function safeLink(value: string): boolean {
  if (value.length > 2000 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (/^\/(?!\/)/.test(value)) return true;
  if (/^(?:\.\.?\/|[?#])/.test(value)) return true;
  if (value && !/^[^/?#]*:/.test(value) && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function safeImage(value: string): boolean {
  if (safeLink(value)) return true;
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (
    !match ||
    match[2].length % 4 ||
    (match[2].length * 3) / 4 > MAX_IMAGE_BYTES + 2
  )
    return false;
  try {
    const header = atob(match[2].slice(0, 24));
    return match[1] === "png"
      ? header.startsWith("\x89PNG\r\n\x1a\n")
      : match[1] === "jpeg"
        ? header.startsWith("\xff\xd8\xff")
        : header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
  } catch {
    return false;
  }
}

export const imageSource = z
  .string()
  .max(220_000)
  .refine(
    safeImage,
    "Choose an HTTPS image, a site asset or an optimized JPEG, PNG or WebP image (maximum 160 KB).",
  );
const metadataFields = z
  .object({
    kind: z.enum(writingKinds).default("article"),
    coverAlt: z.string().max(400).optional(),
    authors: z.string().max(500).optional(),
    doi: z.string().max(300).optional(),
    publicationUrl: z.string().max(2000).optional(),
    venue: z.string().max(250).optional(),
    publicationStatus: z
      .enum(["working_paper", "preprint", "published", "peer_reviewed"])
      .default("working_paper"),
    citation: z.string().max(4000).optional(),
  })
  .strict();
export const editorialMetadata = metadataFields.superRefine(
  (value, context) => {
    if (value.doi && !/^10\.\d{4,9}\/\S+$/i.test(value.doi))
      context.addIssue({
        code: "custom",
        path: ["doi"],
        message: "Enter a DOI such as 10.1234/example, without the URL prefix.",
      });
    if (
      value.publicationUrl &&
      (!safeLink(value.publicationUrl) ||
        !value.publicationUrl.startsWith("https:"))
    )
      context.addIssue({
        code: "custom",
        path: ["publicationUrl"],
        message: "Use an HTTPS publication URL.",
      });
  },
);
export type EditorialMetadata = z.infer<typeof editorialMetadata>;
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: RichNode[];
};
export type EditorialDocument = {
  version: 1;
  format: "richtext" | "markdown";
  content: RichNode | string;
  metadata: EditorialMetadata;
};

const nodeNames = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
  "codeBlock",
  "image",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
]);
const markNames = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "textStyle",
]);
const attributes: Record<string, string[]> = {
  paragraph: ["textAlign"],
  heading: ["level", "textAlign"],
  orderedList: ["start", "type"],
  codeBlock: ["language"],
  image: [
    "src",
    "alt",
    "title",
    "width",
    "height",
    "alignment",
    "caption",
    "credit",
    "creditUrl",
  ],
  tableCell: ["colspan", "rowspan", "colwidth"],
  tableHeader: ["colspan", "rowspan", "colwidth"],
  link: ["href", "target", "rel", "class", "title"],
  textStyle: ["fontFamily", "fontSize"],
};
function validAttributes(type: string, attrs: Record<string, unknown> = {}) {
  if (
    !attrs ||
    typeof attrs !== "object" ||
    Array.isArray(attrs) ||
    Object.keys(attrs).some((k) => !(attributes[type] ?? []).includes(k))
  )
    return false;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    if (key === "src") {
      if (typeof value !== "string" || !safeImage(value)) return false;
    } else if (key === "href" || key === "creditUrl") {
      if (value !== "" && (typeof value !== "string" || !safeLink(value)))
        return false;
    } else if (key === "fontFamily") {
      if (!fonts.includes(String(value))) return false;
    } else if (key === "fontSize") {
      if (!fontSizes.includes(String(value))) return false;
    } else if (key === "textAlign" || key === "alignment") {
      if (!["left", "center", "right", "justify"].includes(String(value)))
        return false;
    } else if (key === "width") {
      if (![33, 50, 75, 100].includes(Number(value))) return false;
    } else if (key === "level") {
      if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 6)
        return false;
    } else if (["start", "colspan", "rowspan", "height"].includes(key)) {
      if (
        !Number.isInteger(value) ||
        Number(value) < 1 ||
        Number(value) > 10000
      )
        return false;
    } else if (key === "colwidth") {
      if (
        !Array.isArray(value) ||
        value.length > 30 ||
        !value.every((v) => Number.isInteger(v) && v >= 25 && v <= 2000)
      )
        return false;
    } else if (typeof value !== "string" || value.length > 1000) return false;
  }
  return (
    type !== "image" ||
    (typeof attrs.src === "string" &&
      safeImage(attrs.src) &&
      typeof attrs.alt === "string" &&
      attrs.alt.trim().length > 0)
  );
}
function validTree(root: unknown): root is RichNode {
  let count = 0;
  function visit(value: unknown, depth: number): boolean {
    if (
      ++count > 15_000 ||
      depth > 24 ||
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    )
      return false;
    const n = value as RichNode;
    if (
      !nodeNames.has(n.type) ||
      Object.keys(n).some(
        (k) => !["type", "text", "attrs", "marks", "content"].includes(k),
      ) ||
      !validAttributes(n.type, n.attrs)
    )
      return false;
    if (n.type === "text" && (typeof n.text !== "string" || !n.text.length))
      return false;
    if (
      n.text !== undefined &&
      (n.type !== "text" || typeof n.text !== "string")
    )
      return false;
    if (
      n.content !== undefined &&
      (!Array.isArray(n.content) ||
        !n.content.every((c) => visit(c, depth + 1)))
    )
      return false;
    if (
      n.marks !== undefined &&
      (!Array.isArray(n.marks) ||
        n.marks.length > 8 ||
        !n.marks.every(
          (m) =>
            m &&
            markNames.has(m.type) &&
            Object.keys(m).every((k) => ["type", "attrs"].includes(k)) &&
            validAttributes(m.type, m.attrs),
        ))
    )
      return false;
    return true;
  }
  return visit(root, 0) && (root as RichNode).type === "doc";
}

export function readEditorial(
  content: string,
  draft = false,
): EditorialDocument | null {
  if (
    !content.startsWith(EDITORIAL_PREFIX) ||
    content.length > MAX_EDITORIAL_LENGTH
  )
    return null;
  try {
    const data = JSON.parse(content.slice(EDITORIAL_PREFIX.length));
    if (
      !data ||
      Object.keys(data).some(
        (k) => !["version", "format", "content", "metadata"].includes(k),
      ) ||
      data.version !== 1 ||
      !["richtext", "markdown"].includes(data.format)
    )
      return null;
    if (
      data.format === "richtext"
        ? !validTree(data.content)
        : typeof data.content !== "string"
    )
      return null;
    const metadata = (draft ? metadataFields : editorialMetadata).safeParse(
      data.metadata,
    );
    return metadata.success ? { ...data, metadata: metadata.data } : null;
  } catch {
    return null;
  }
}
export function encodeEditorial(
  content: RichNode | string,
  metadata: Partial<EditorialMetadata> = {},
) {
  return (
    EDITORIAL_PREFIX +
    JSON.stringify({
      version: 1,
      format: typeof content === "string" ? "markdown" : "richtext",
      content,
      metadata: metadataFields.parse(metadata),
    })
  );
}
export function metadataFor(content: string): EditorialMetadata {
  // Metadata must survive temporary body-size/formatting errors during editing.
  try {
    if (content.startsWith(EDITORIAL_PREFIX)) {
      const value = JSON.parse(content.slice(EDITORIAL_PREFIX.length));
      if (
        value.version === 1 &&
        ["richtext", "markdown"].includes(value.format)
      ) {
        const metadata = metadataFields.safeParse(value.metadata);
        if (metadata.success) return metadata.data;
      }
    }
  } catch {
    /* Preserve an unreadable source; do not reinterpret it as Markdown. */
  }
  return metadataFields.parse({});
}
export function updateEditorialMetadata(
  content: string,
  patch: Partial<EditorialMetadata>,
) {
  const parsed = readEditorial(content, true);
  if (content.startsWith(EDITORIAL_PREFIX) && !parsed) return content;
  return encodeEditorial(parsed?.content ?? content, {
    ...metadataFor(content),
    ...patch,
  });
}
export const editorialContent = z
  .string()
  .min(1)
  .max(1_000_000)
  .refine(
    (value) =>
      !value.startsWith(EDITORIAL_PREFIX) || Boolean(readEditorial(value)),
    "The document contains invalid formatting, metadata or image content.",
  );
export const editorialFragment = z
  .string()
  .max(1_000_000)
  .refine(
    (value) =>
      value.startsWith(EDITORIAL_PREFIX)
        ? Boolean(readEditorial(value))
        : value.length <= 100_000,
    "The document is too large or contains invalid formatting, metadata or image content.",
  );
export function hasEditorialBody(value: string): boolean {
  const doc = readEditorial(value, true);
  if (!doc) return !value.startsWith(EDITORIAL_PREFIX) && Boolean(value.trim());
  if (typeof doc.content === "string") return Boolean(doc.content.trim());
  const visit = (n: RichNode): boolean =>
    Boolean(n.text?.trim()) ||
    n.type === "image" ||
    Boolean(n.content?.some(visit));
  return visit(doc.content);
}
export const authorResearch = {
  name: "Chrispine Mndala",
  orcid: "0009-0004-8345-2949",
  orcidUrl: "https://orcid.org/0009-0004-8345-2949",
  github: "https://github.com/Chrispine-1210",
};

export function editorialPlainText(value: string): string {
  const doc = readEditorial(value, true);
  if (!doc) return value;
  if (typeof doc.content === "string") return doc.content;
  const visit = (n: RichNode): string =>
    n.text ?? n.content?.map(visit).join(" ") ?? "";
  return visit(doc.content);
}
