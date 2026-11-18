import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@shared/schema";
import {
  EditorialPage,
  ProjectReadingCard,
} from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";

type Results = {
  data: PortfolioProject[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};
export default function PortfolioAdvanced() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [featured, setFeatured] = useState(false);
  const [page, setPage] = useState(1);
  const categories = useQuery<{ categories: string[] }>({
    queryKey: ["/api/categories/portfolio"],
  });
  const results = useQuery<Results>({
    queryKey: ["/api/portfolio/search", { search, category, featured, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: search,
        category,
        featured: String(featured),
        page: String(page),
        limit: "12",
      });
      const response = await fetch(`/api/portfolio/search?${params}`);
      if (!response.ok)
        throw new Error("Case studies are temporarily unavailable");
      return response.json();
    },
  });
  useEffect(() => {
    setSEO(
      "Work & project case studies | Chrispine Mndala",
      "Software and operating systems built in Malawi. Explore project objectives, architecture, technology decisions, recorded interfaces and delivery evidence.",
      "/portfolio",
    );
  }, []);
  const reset = () => {
    setSearch("");
    setCategory("All");
    setFeatured(false);
    setPage(1);
  };
  const filtered = !!(search || category !== "All" || featured);
  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">
            Work / Software, systems & operations
          </span>
          <h1>
            Practical systems.
            <br />
            <em>Visible decisions.</em>
          </h1>
          <p className="editorial-lead">
            A collection of platforms, prototypes and operating tools. Each case
            follows the problem, the development choices and what the available
            evidence actually shows.
          </p>
          <div className="editorial-actions">
            <a href="#project-library" className="editorial-button">
              Explore the work <ArrowRight size={17} />
            </a>
            <Link href="/about" className="editorial-button secondary">
              Meet the engineer
            </Link>
          </div>
        </div>
        <aside className="editorial-note">
          <span className="editorial-eyebrow">Beyond the finished screen</span>
          <h2>Understand how it was built.</h2>
          <ul>
            <li>
              <span>01</span>The problem, users and Malawi context
            </li>
            <li>
              <span>02</span>Architecture, data and technology choices
            </li>
            <li>
              <span>03</span>Business workflows and financial handling
            </li>
            <li>
              <span>04</span>Interface evidence, limits and next steps
            </li>
          </ul>
          <p className="editorial-copy" style={{ fontSize: 12, marginTop: 14 }}>
            A recorded interface shows what was visible at capture. Operational
            and commercial results require their own evidence.
          </p>
        </aside>
      </header>
      <section id="project-library" aria-labelledby="library-heading">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">The project library</span>
            <h2 id="library-heading">Explore the casebooks.</h2>
          </div>
          <p>
            Education, enterprise operations, commerce, healthcare and practical
            engineering tools.
          </p>
        </div>
        <div className="editorial-toolbar">
          <label className="editorial-field search">
            Search projects
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Project, problem, sector or technology…"
              data-testid="input-portfolio-search"
            />
          </label>
          <label className="editorial-field">
            Sector
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All sectors</option>
              {(categories.data?.categories ?? []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            className={`editorial-button ${featured ? "" : "secondary"}`}
            aria-pressed={featured}
            onClick={() => {
              setFeatured(!featured);
              setPage(1);
            }}
            data-testid="button-filter-featured"
          >
            Featured only
          </button>
        </div>
        <div className="editorial-count">
          <span role="status">
            {results.isLoading
              ? "Loading project casebooks…"
              : results.isError
                ? "Project library unavailable"
                : `${results.data?.data.length ?? 0} of ${results.data?.pagination.total ?? 0} ${filtered ? "matching " : ""}case studies`}
          </span>
          {filtered && (
            <button className="editorial-text-link" onClick={reset}>
              Clear filters
            </button>
          )}
          <span>Source · Architecture · Interface evidence</span>
        </div>
        {results.isLoading ? (
          <div className="editorial-empty" aria-busy="true">
            <p className="editorial-copy">Preparing the project library…</p>
          </div>
        ) : results.isError ? (
          <div className="editorial-empty" role="alert">
            <h3>The casebooks could not be loaded.</h3>
            <p className="editorial-copy">
              Please retry to retrieve the published project evidence.
            </p>
            <button
              className="editorial-button secondary"
              style={{ marginTop: 18 }}
              onClick={() => results.refetch()}
            >
              Try again
            </button>
          </div>
        ) : results.data?.data.length ? (
          <>
            <div className="editorial-project-grid">
              {results.data.data.map((project, i) => (
                <ProjectReadingCard
                  key={project.id}
                  project={project}
                  index={(page - 1) * 12 + i}
                />
              ))}
            </div>
            {results.data.pagination.totalPages > 1 && (
              <nav
                className="editorial-pagination"
                aria-label="Case study pages"
              >
                <button
                  className="editorial-button secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {results.data.pagination.totalPages}
                </span>
                <button
                  className="editorial-button secondary"
                  disabled={!results.data.pagination.hasNextPage}
                  onClick={() => setPage(page + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="editorial-empty">
            <h3>No case studies match this view.</h3>
            <p className="editorial-copy">
              Try another sector or a broader search.
            </p>
            <button
              className="editorial-text-link"
              onClick={reset}
              style={{ marginTop: 18 }}
            >
              Reset the project library <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      <section className="editorial-bridge">
        <div>
          <h2>The work continues between releases.</h2>
          <p>
            Follow the engineering journal for experiments, troubleshooting,
            development reflections and the lessons behind the next system.
          </p>
        </div>
        <Link href="/journey" className="editorial-button">
          Follow the journey <ArrowUpRight size={17} />
        </Link>
      </section>
    </EditorialPage>
  );
}
