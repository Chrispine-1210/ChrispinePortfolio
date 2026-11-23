import { createElement, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  EDITORIAL_PREFIX,
  fonts,
  fontSizes,
  readEditorial,
  safeImage,
  safeLink,
  type RichNode,
} from "@shared/editorial";
import "@/styles/content-studio.css";

function renderNode(n: RichNode, key: number): ReactNode {
  const attrs = n.attrs ?? {};
  const children = n.content?.map(renderNode);
  if (n.type === "text") {
    let text: ReactNode = n.text;
    for (const [i, m] of (n.marks ?? []).entries()) {
      const a = m.attrs ?? {};
      if (m.type === "link")
        text = safeLink(String(a.href ?? "")) ? (
          <a
            key={i}
            href={String(a.href)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {text}
          </a>
        ) : (
          text
        );
      else if (m.type === "textStyle")
        text = (
          <span
            key={i}
            style={{
              fontFamily: fonts.includes(String(a.fontFamily))
                ? String(a.fontFamily)
                : undefined,
              fontSize: fontSizes.includes(String(a.fontSize))
                ? String(a.fontSize)
                : undefined,
            }}
          >
            {text}
          </span>
        );
      else
        text = createElement(
          (
            {
              bold: "strong",
              italic: "em",
              underline: "u",
              strike: "s",
              code: "code",
            } as Record<string, string>
          )[m.type] ?? "span",
          { key: i },
          text,
        );
    }
    return <span key={key}>{text}</span>;
  }
  if (n.type === "image") {
    const width = Number(attrs.width ?? 100),
      align = String(attrs.alignment ?? "center");
    return (
      <figure
        key={key}
        className="rich-image"
        style={{
          width: `${[33, 50, 75, 100].includes(width) ? width : 100}%`,
          marginLeft: align === "left" ? 0 : "auto",
          marginRight: align === "right" ? 0 : "auto",
        }}
      >
        <img
          src={String(attrs.src)}
          alt={String(attrs.alt)}
          title={typeof attrs.title === "string" ? attrs.title : undefined}
          loading="lazy"
          decoding="async"
        />
        {Boolean(attrs.caption || attrs.credit) && (
          <figcaption>
            {String(attrs.caption ?? "")}
            {Boolean(attrs.credit) && (
              <>
                {" "}
                {attrs.creditUrl && safeLink(String(attrs.creditUrl)) ? (
                  <a
                    href={String(attrs.creditUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {String(attrs.credit)}
                  </a>
                ) : (
                  String(attrs.credit)
                )}
              </>
            )}
          </figcaption>
        )}
      </figure>
    );
  }
  if (n.type === "doc") return <div key={key}>{children}</div>;
  if (n.type === "hardBreak") return <br key={key} />;
  if (n.type === "horizontalRule") return <hr key={key} />;
  if (n.type === "codeBlock")
    return (
      <pre key={key}>
        <code>{children}</code>
      </pre>
    );
  if (n.type === "table")
    return (
      <div className="rich-table-scroll" key={key}>
        <table>
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  const tags: Record<string, string> = {
    paragraph: "p",
    bulletList: "ul",
    orderedList: "ol",
    listItem: "li",
    blockquote: "blockquote",
    tableRow: "tr",
    tableCell: "td",
    tableHeader: "th",
  };
  const tag =
    n.type === "heading" ? `h${attrs.level ?? 2}` : (tags[n.type] ?? "div");
  const props: Record<string, unknown> = {
    key,
    style: { textAlign: attrs.textAlign ?? undefined } as CSSProperties,
  };
  if (tag === "ol") props.start = attrs.start ?? 1;
  if (tag === "td" || tag === "th") {
    props.colSpan = attrs.colspan ?? 1;
    props.rowSpan = attrs.rowspan ?? 1;
  }
  return createElement(tag, props, children);
}

export function RichContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const parsed = readEditorial(content);
  if (content.startsWith(EDITORIAL_PREFIX) && !parsed)
    return (
      <p role="alert">
        This document could not be displayed. Please contact the publisher.
      </p>
    );
  return (
    <div className={`rich-content ${className}`}>
      {parsed?.format === "richtext" ? (
        renderNode(parsed.content as RichNode, 0)
      ) : (
        <ReactMarkdown
          skipHtml
          components={{
            a: ({ href, children }) =>
              href && safeLink(href) ? (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ) : (
                <span>{children}</span>
              ),
            img: ({ src, alt }) =>
              src && safeImage(src) ? (
                <img
                  src={src}
                  alt={alt ?? "Editorial image"}
                  loading="lazy"
                  decoding="async"
                />
              ) : null,
          }}
        >
          {typeof parsed?.content === "string" ? parsed.content : content}
        </ReactMarkdown>
      )}
    </div>
  );
}
