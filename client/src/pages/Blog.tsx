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
  editorialPhotos,
  articlePhoto,
  editorialPhotoSource,
  PhotoCredit,
  PhotoCreditForSource,
} from "@/components/EditorialPhoto";
import type { BlogPost, PortfolioProject } from "@shared/schema";
import {
  authorResearch,
  metadataFor,
  writingKinds,
  writingLabels,
  type EditorialMetadata,
} from "@shared/editorial";
import "@/styles/content-studio.css";
type WritingPost = BlogPost & { editorialMetadata?: EditorialMetadata };
const collections = [
  {
    kind: "research",
    photo: "library",
    description: "Research questions, methods and working papers.",
  },
  {
    kind: "tutorial",
    photo: "code",
    description: "Practical guides with steps you can follow.",
  },
  {
    kind: "note",
    photo: "writing",
    description: "Observations, experiments and technical field notes.",
  },
  {
    kind: "publication",
    photo: "reading",
    description: "Referenced work with citations and source links.",
  },
] as const;

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
  const kind = new URLSearchParams(search).get("kind") || "all";
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const posts = useQuery<WritingPost[]>({ queryKey: ["/api/blog"] });
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
      (kind === "all" ||
        (p.editorialMetadata ?? metadataFor(p.content ?? "")).kind === kind) &&
      [p.title, p.excerpt, p.category, ...(p.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function changeFilter(key: string, value: string) {
    const params = new URLSearchParams(search);
    if (value === "All" || value === "all") params.delete(key);
    else params.set(key, value);
    navigate(params.size ? `/blog?${params}` : "/blog");
  }
  const changeCategory = (value: string) => changeFilter("category", value);
  useEffect(() => {
    setSEO(
      "Research, tutorials & publications | Chrispine Mndala",
      "Research, practical tutorials, technical notes and referenced publications by Chrispine Mndala, with ORCID and links to open research resources.",
      "/blog",
    );
  }, []);

  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">Writing / Chrispine Mndala</span>
          <h1>
            Ideas tested.
            <br />
            Knowledge <em>shared.</em>
          </h1>
          <p className="editorial-lead">
            Research, tutorials, field notes and publications. The questions,
            methods and practical lessons behind software, networks and business
            systems.
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
          <img
            src={editorialPhotos.reading.src}
            alt={editorialPhotos.reading.alt}
            fetchPriority="high"
            decoding="async"
            style={{ objectFit: "cover" }}
          />
          <div className="editorial-feature-copy">
            <div className="editorial-eyebrow">
              Research & practical knowledge
            </div>
            <h2>From a question to something useful.</h2>
            <p className="editorial-copy">
              Follow the reasoning, reproduce the method, and return to the
              original source.
            </p>
            <a href="#research-identity" className="editorial-text-link">
              Research identity & resources
            </a>
            <p
              className="editorial-copy"
              style={{ fontSize: 14, marginTop: 16 }}
            >
              <PhotoCredit photo="reading" />
            </p>
          </div>
        </aside>
      </header>

      <section
        className="editorial-section"
        aria-label="Explore writing collections"
      >
        <div className="writing-kinds">
          {collections.map((item) => (
            <button
              key={item.kind}
              type="button"
              className="writing-kind"
              aria-pressed={kind === item.kind}
              onClick={() =>
                changeFilter("kind", kind === item.kind ? "all" : item.kind)
              }
            >
              <img
                src={editorialPhotos[item.photo].src}
                alt={editorialPhotos[item.photo].alt}
                loading="lazy"
                decoding="async"
              />
              <span className="writing-kind-copy">
                <strong>{writingLabels[item.kind]}</strong>
                <span>{item.description}</span>
                <span>
                  {
                    articles.filter(
                      (p) =>
                        (p.editorialMetadata ?? metadataFor(p.content ?? ""))
                          .kind === item.kind,
                    ).length
                  }{" "}
                  published
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="editorial-copy" style={{ fontSize: 14 }}>
          Editorial photography: <PhotoCredit photo="library" />;{" "}
          <PhotoCredit photo="code" />; <PhotoCredit photo="writing" />;{" "}
          <PhotoCredit photo="reading" />.
        </p>
      </section>
      <section
        className="editorial-section"
        id="articles"
        aria-labelledby="articles-heading"
      >
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">Writing library</span>
            <h2 id="articles-heading">Read, apply, investigate.</h2>
          </div>
          <p>
            Browse by format and topic. Research and publication references
            include their source and status; field observations also connect to
            the journal.
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
            Format
            <select
              value={kind}
              onChange={(e) => changeFilter("kind", e.target.value)}
            >
              <option value="all">All formats</option>
              {!writingKinds.includes(kind as (typeof writingKinds)[number]) &&
                kind !== "all" && <option value={kind}>{kind}</option>}
              {writingKinds.map((k) => (
                <option key={k} value={k}>
                  {writingLabels[k]}
                </option>
              ))}
            </select>
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
              : `${filtered.length} published ${filtered.length === 1 ? "entry" : "entries"}${category !== "All" ? ` · ${category}` : ""}`}
          {(query || category !== "All" || kind !== "all") && (
            <button
              className="editorial-text-link"
              onClick={() => {
                setQuery("");
                navigate("/blog");
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
                : "No writing is published in this collection yet."}
            </h3>
            <p className="editorial-copy">
              {articles.length
                ? "Try another topic or clear your search to see the published collection."
                : "There are no published entries in this view yet. In the meantime, the casebooks document real projects, their development decisions and the evidence available to review."}
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
                      {
                        writingLabels[
                          (
                            post.editorialMetadata ??
                            metadataFor(post.content ?? "")
                          ).kind
                        ]
                      }{" "}
                      · {post.category} · {post.readTimeMinutes ?? 5} min read
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
                    {post.featuredImage && (
                      <p className="editorial-copy" style={{ fontSize: 14 }}>
                        <PhotoCreditForSource src={post.featuredImage} />
                      </p>
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
                      Read entry <ArrowRight size={16} />
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
      <section
        id="research-identity"
        className="editorial-section research-profiles"
        aria-labelledby="research-identity-heading"
      >
        <div>
          <span className="editorial-eyebrow">
            Research identity & open resources
          </span>
          <h2 id="research-identity-heading">Trace the work to its source.</h2>
          <p className="editorial-copy" style={{ marginTop: 18 }}>
            My ORCID iD provides a persistent research identity. Publication
            entries link to the original work and its DOI when one has been
            assigned.
          </p>
          <div className="research-profile-links">
            <a
              href={authorResearch.orcidUrl}
              target="_blank"
              rel="me noopener noreferrer"
            >
              ORCID · {authorResearch.orcid}
            </a>
            <a
              href={authorResearch.github}
              target="_blank"
              rel="me noopener noreferrer"
            >
              My GitHub
            </a>
          </div>
          <h3 style={{ marginTop: 28, fontSize: 20 }}>
            Open research resources
          </h3>
          <p className="editorial-copy" style={{ marginTop: 10 }}>
            Explore repositories and discovery tools for papers, datasets,
            reproducible research and software releases.
          </p>
          <div className="research-profile-links">
            <a
              href="https://zenodo.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Zenodo
            </a>
            <a
              href="https://scholar.google.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Search Google Scholar
            </a>
          </div>
          <p className="editorial-copy" style={{ fontSize: 14, marginTop: 16 }}>
            These are research resources, not a claim of personal publications
            or profiles on every service.
          </p>
        </div>
        <figure>
          <img
            src={editorialPhotos.library.src}
            alt={editorialPhotos.library.alt}
            loading="lazy"
            decoding="async"
          />
          <figcaption
            className="editorial-copy"
            style={{ fontSize: 14, marginTop: 12 }}
          >
            <PhotoCredit photo="library" />
          </figcaption>
        </figure>
      </section>
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
