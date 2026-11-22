import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { RichContent } from "@/components/editorial/RichContent";
import { PublicationReference } from "@/components/editorial/PublicationReference";
import { metadataFor, type EditorialMetadata } from "@shared/editorial";
import { ArrowLeft, ArrowUpRight, Share2 } from "lucide-react";
import type { BlogPost as Article } from "@shared/schema";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import {
  articlePhoto,
  editorialPhotoSource,
  PhotoCredit,
  PhotoCreditForSource,
} from "@/components/EditorialPhoto";
import { setSEO } from "@/lib/seoHelper";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const [shareStatus, setShareStatus] = useState("");
  const post = useQuery<Article>({
    queryKey: ["/api/blog", params?.slug],
    enabled: !!params?.slug,
  });
  useEffect(() => {
    if (post.data)
      setSEO(
        `${post.data.title} | Chrispine Mndala`,
        post.data.excerpt,
        `/blog/${post.data.slug}`,
      );
  }, [post.data]);
  useEffect(() => {
    setShareStatus("");
  }, [params?.slug]);
  async function share() {
    if (!post.data) return;
    const url = new URL(`/blog/${post.data.slug}`, window.location.origin).href;
    try {
      if (navigator.share)
        await navigator.share({ title: post.data.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Article link copied.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setShareStatus(
          "The link could not be shared. You can copy the address from your browser.",
        );
    }
  }
  const article = post.data;
  return (
    <EditorialPage>
      <article className="editorial-reading">
        <Link href="/blog" className="editorial-text-link">
          <ArrowLeft size={16} /> All writing
        </Link>
        {post.isLoading ? (
          <p className="editorial-copy" role="status" style={{ marginTop: 35 }}>
            Loading the article…
          </p>
        ) : !article ? (
          <div
            className="editorial-empty"
            role="alert"
            style={{ marginTop: 35 }}
          >
            <h1 style={{ fontSize: 32 }}>This article is unavailable.</h1>
            <p className="editorial-copy">
              It may be unpublished, or the connection may have failed.
            </p>
            <button
              className="editorial-button secondary"
              style={{ marginTop: 20 }}
              onClick={() => post.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <header style={{ paddingTop: 30 }}>
              <span className="editorial-kicker">
                {article.category}
                {article.isPremium ? " · Premium" : ""}
              </span>
              <h1 style={{ fontSize: "clamp(38px, 5vw, 62px)" }}>
                {article.title}
              </h1>
              <p className="editorial-lead">{article.excerpt}</p>
              <div className="editorial-count">
                <span>
                  Chrispine Mndala · {article.readTimeMinutes ?? 5} min read
                  {article.publishedAt && (
                    <>
                      {" "}
                      ·{" "}
                      <time
                        dateTime={new Date(article.publishedAt).toISOString()}
                      >
                        {new Date(article.publishedAt).toLocaleDateString(
                          "en-GB",
                          {
                            timeZone: "Africa/Blantyre",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </time>
                    </>
                  )}
                </span>
                <button
                  className="editorial-text-link"
                  onClick={share}
                  data-testid="button-share-post"
                >
                  <Share2 size={15} /> Share article
                </button>
              </div>
              <p role="status" className="editorial-copy">
                {shareStatus}
              </p>
            </header>
            <figure className="editorial-article-image">
              <img
                src={
                  article.featuredImage ||
                  editorialPhotoSource(articlePhoto(article.category))
                }
                alt={
                  (
                    article as Article & {
                      editorialMetadata?: EditorialMetadata;
                    }
                  ).editorialMetadata?.coverAlt || article.title
                }
              />
              {article.featuredImage && (
                <figcaption>
                  <PhotoCreditForSource src={article.featuredImage} />
                </figcaption>
              )}
              {!article.featuredImage && (
                <figcaption>
                  <PhotoCredit photo={articlePhoto(article.category)} />
                </figcaption>
              )}
            </figure>
            <PublicationReference
              metadata={
                (article as Article & { editorialMetadata?: EditorialMetadata })
                  .editorialMetadata ?? metadataFor(article.content ?? "")
              }
            />
            {article.content ? (
              <RichContent
                className="editorial-prose"
                content={article.content}
              />
            ) : (
              <div className="editorial-empty">
                <h2>
                  {article.isPremium
                    ? "This is a premium article."
                    : "The article content is unavailable."}
                </h2>
                <p className="editorial-copy">
                  {article.isPremium
                    ? "The public preview includes the summary. Membership access is required for the full article."
                    : "Please check back for the complete article."}
                </p>
                {article.isPremium && (
                  <Link
                    href="/subscribe"
                    className="editorial-text-link"
                    style={{ marginTop: 18 }}
                  >
                    View membership information <ArrowUpRight size={16} />
                  </Link>
                )}
              </div>
            )}
            <ul
              className="editorial-tags"
              aria-label="Article tags"
              style={{ marginTop: 35 }}
            >
              {(article.tags ?? []).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <section className="editorial-bridge">
              <div>
                <h2>Go from the explanation to the system.</h2>
                <p>
                  Explore the project casebooks for architecture, development
                  decisions and recorded interface evidence.
                </p>
              </div>
              <Link href="/portfolio" className="editorial-button">
                Explore the work <ArrowUpRight size={16} />
              </Link>
            </section>
          </>
        )}
      </article>
    </EditorialPage>
  );
}
