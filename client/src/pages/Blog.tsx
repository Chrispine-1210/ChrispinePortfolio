import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { setSEO } from "@/lib/seoHelper";
import {
  EditorialPage,
  ProjectReadingCard,
} from "@/components/editorial/EditorialPage";
import {
  articlePhoto,
  editorialPhotoSource,
  PhotoCredit,
} from "@/components/EditorialPhoto";
import type { BlogPost, PortfolioProject } from "@shared/schema";

const topics = [
  "Programming",
  "Networking",
  "Hardware Engineering",
  "Infrastructure",
  "AI & Data",
  "MEL",
  "Career",
  "Leadership",
];

export default function Blog() {
  const search = useSearch();
  const category = new URLSearchParams(search).get("category") || "All";
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const posts = useQuery<BlogPost[]>({ queryKey: ["/api/blog"] });
  const casebooks = useQuery<{ data: PortfolioProject[] }>({
    queryKey: ["/api/portfolio/search?featured=true&limit=2&page=1"],
  });
  const articles = useMemo(
    () =>
      [...(posts.data ?? [])].sort(
        (a, b) =>
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime(),
      ),
    [posts.data],
  );
  const categories = Array.from(
    new Set([...topics, ...articles.map((p) => p.category)]),
  );
  const filtered = articles.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      [p.title, p.excerpt, p.category, ...(p.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const changeCategory = (value: string) =>
    navigate(
      value === "All"
        ? "/blog"
        : `/blog?${new URLSearchParams({ category: value })}`,
    );
  useEffect(() => {
    setSEO(
      "Writing & technical notes | Chrispine Mndala",
      "Practical writing on software, networks and operating systems, connected to project case studies and an engineering journal from Malawi.",
      "/blog",
    );
  }, []);

  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">Writing / Chrispine Mndala</span>
          <h1>
            Notes from
            <br />
            the <em>work.</em>
          </h1>
          <p className="editorial-lead">
            The reasoning behind the code. Practical lessons in software,
            networks and the systems that keep a business moving.
          </p>
          <div className="editorial-actions">
            <a className="editorial-button" href="#articles">
              Explore the writing <ArrowRight size={16} />
            </a>
            <Link className="editorial-button secondary" href="/journey">
              Engineering journal
            </Link>
          </div>
          <p className="editorial-copy" style={{ marginTop: 24 }}>
            Built in Malawi. Written to make the next decision clearer.
          </p>
        </div>
        <aside className="editorial-feature">
          <Link
            href="/portfolio/network-operations-training"
            aria-label="Read the NetOps Command case study"
          >
            <img
              src="/project-evidence/2026-11-18/network-ops-2026-11-18.jpg"
              alt="Recorded NetOps Command troubleshooting workspace"
            />
          </Link>
          <div className="editorial-feature-copy">
            <div className="editorial-eyebrow">
              Inside the work · Project case study
            </div>
            <h2>Learning by diagnosing.</h2>
            <p className="editorial-copy">
              A network troubleshooting workspace that connects incidents,
              command evidence and deliberate practice.
            </p>
            <Link
              href="/portfolio/network-operations-training"
              className="editorial-text-link"
            >
              Explore NetOps Command <ArrowUpRight size={16} />
            </Link>
          </div>
        </aside>
      </header>

      <section
        className="editorial-section"
        id="articles"
        aria-labelledby="articles-heading"
      >
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">
              01 / Articles & perspectives
            </span>
            <h2 id="articles-heading">A space for considered thinking.</h2>
          </div>
          <p>
            Longer explanations live here. Experiments, lab observations and
            progress notes belong in the journal.
          </p>
        </div>
        <div className="editorial-toolbar">
          <label className="editorial-field search">
            Search the writing
            <input
              type="search"
              placeholder="A topic, question or technology…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="editorial-field">
            Topic
            <select
              value={category}
              onChange={(e) => changeCategory(e.target.value)}
            >
              <option value="All">All topics</option>
              {!categories.includes(category) && category !== "All" && (
                <option>{category}</option>
              )}
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="editorial-count" role="status">
          {posts.isLoading
            ? "Loading published articles…"
            : posts.isError
              ? "Article collection unavailable"
              : `${filtered.length} published ${filtered.length === 1 ? "article" : "articles"}${category !== "All" ? ` · ${category}` : ""}`}
          {(query || category !== "All") && (
            <button
              className="editorial-text-link"
              onClick={() => {
                setQuery("");
                changeCategory("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        {posts.isError ? (
          <div className="editorial-empty" role="alert">
            <h3>The writing could not be loaded.</h3>
            <p className="editorial-copy">
              Please try again. The project casebooks below are another way into
              the work.
            </p>
            <button
              className="editorial-button secondary"
              style={{ marginTop: 18 }}
              onClick={() => posts.refetch()}
            >
              Try again
            </button>
          </div>
        ) : !posts.isLoading && filtered.length === 0 ? (
          <div className="editorial-empty">
            <BookOpen size={23} color="#355d4c" />
            <h3 style={{ marginTop: 14 }}>
              {articles.length
                ? "No articles match this view."
                : "The first essays are taking shape."}
            </h3>
            <p className="editorial-copy">
              {articles.length
                ? "Try another topic or clear your search to see the published collection."
                : "There are no published blog articles yet. In the meantime, the casebooks document real projects, their development decisions and the evidence available to review."}
            </p>
            <div className="editorial-actions">
              <Link className="editorial-text-link" href="/portfolio">
                Read the project casebooks <ArrowRight size={16} />
              </Link>
              <Link className="editorial-text-link" href="/journey">
                Visit the field journal <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="editorial-project-grid">
            {filtered.map((post) => {
              const fallback = articlePhoto(post.category);
              return (
                <article key={post.id} className="editorial-project">
                  <Link
                    className="editorial-project-image"
                    href={`/blog/${post.slug}`}
                  >
                    <img
                      src={post.featuredImage || editorialPhotoSource(fallback)}
                      alt={post.title}
                      loading="lazy"
                      style={{ objectFit: "cover", padding: 0 }}
                    />
                  </Link>
                  <div className="editorial-project-copy">
                    <div className="editorial-eyebrow">
                      {post.category} · {post.readTimeMinutes ?? 5} min read
                      {post.isPremium ? " · Premium" : ""}
                    </div>
                    <h3>
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                        <ArrowUpRight size={20} />
                      </Link>
                    </h3>
                    <p className="editorial-copy">{post.excerpt}</p>
                    {post.publishedAt && (
                      <time
                        className="editorial-copy"
                        dateTime={new Date(post.publishedAt).toISOString()}
                      >
                        {new Date(post.publishedAt).toLocaleDateString(
                          "en-GB",
                          {
                            timeZone: "Africa/Blantyre",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </time>
                    )}
                    {!post.featuredImage && (
                      <p className="editorial-copy" style={{ fontSize: 11 }}>
                        <PhotoCredit photo={fallback} />
                      </p>
                    )}
                    <Link
                      className="editorial-text-link"
                      href={`/blog/${post.slug}`}
                    >
                      Read article <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {casebooks.data?.data.length ? (
        <section
          className="editorial-section"
          aria-labelledby="casebook-heading"
        >
          <div className="editorial-section-heading">
            <div>
              <span className="editorial-eyebrow">02 / From the casebooks</span>
              <h2 id="casebook-heading">Start with a real system.</h2>
            </div>
            <Link className="editorial-text-link" href="/portfolio">
              All project case studies <ArrowRight size={16} />
            </Link>
          </div>
          <div className="editorial-project-grid">
            {casebooks.data.data.map((p) => (
              <ProjectReadingCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="editorial-bridge">
        <div>
          <h2>Follow the engineering journey.</h2>
          <p>
            Networks, programming, repairs, servers and security practice. A
            place for reviewed field notes, lessons and linked media as the work
            develops.
          </p>
        </div>
        <Link className="editorial-button" href="/journey">
          Open the journal <ArrowUpRight size={17} />
        </Link>
      </section>
    </EditorialPage>
  );
}
