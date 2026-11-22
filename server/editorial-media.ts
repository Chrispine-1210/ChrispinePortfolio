import { createHash } from "node:crypto";
import type { BlogPost } from "../shared/schema.js";
import {
  encodeEditorial,
  metadataFor,
  readEditorial,
  safeImage,
  type RichNode,
} from "../shared/editorial.js";

function digest(src: string) {
  return createHash("sha256").update(src).digest("hex");
}
function imageUrl(post: BlogPost, src: string) {
  return src.startsWith("data:")
    ? `/api/writing-media/${encodeURIComponent(post.slug)}/${digest(src)}`
    : src;
}
function publicNode(post: BlogPost, node: RichNode): RichNode {
  return {
    ...node,
    ...(node.type === "image"
      ? {
          attrs: {
            ...node.attrs,
            src: imageUrl(post, String(node.attrs?.src ?? "")),
          },
        }
      : {}),
    ...(node.content
      ? { content: node.content.map((n) => publicNode(post, n)) }
      : {}),
  };
}
export function publicWritingPost(post: BlogPost, includeContent = false) {
  const { content, ...summary } = post;
  const parsed = readEditorial(content);
  return {
    ...summary,
    featuredImage: post.featuredImage
      ? imageUrl(post, post.featuredImage)
      : null,
    editorialMetadata: metadataFor(content),
    ...(includeContent
      ? {
          content:
            parsed?.format === "richtext"
              ? encodeEditorial(
                  publicNode(post, parsed.content as RichNode),
                  parsed.metadata,
                )
              : content,
        }
      : {}),
  };
}
export function publishedImage(
  post: BlogPost,
  hash: string,
  premiumAccess = false,
) {
  const candidates: string[] = [post.featuredImage ?? ""];
  const parsed = readEditorial(post.content);
  if ((!post.isPremium || premiumAccess) && parsed?.format === "richtext") {
    const visit = (n: RichNode) => {
      if (n.type === "image") candidates.push(String(n.attrs?.src ?? ""));
      n.content?.forEach(visit);
    };
    visit(parsed.content as RichNode);
  }
  const source = candidates.find(
    (src) => src.startsWith("data:") && safeImage(src) && digest(src) === hash,
  );
  if (!source) return null;
  const [header, base64] = source.split(",");
  return {
    type: header.slice(5).split(";")[0],
    bytes: Buffer.from(base64, "base64"),
  };
}
