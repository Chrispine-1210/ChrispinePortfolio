import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";
import type { PortfolioProject } from "@shared/schema";
export default function GitHubProfile() {
  const projects = useQuery<{ data: PortfolioProject[] }>({
    queryKey: ["/api/portfolio/search?limit=24&page=1"],
  });
  useEffect(() => {
    setSEO(
      "Source & GitHub | Chrispine Mndala",
      "Explore the public source links and technical evidence behind Chrispine Mndala’s project casebooks.",
      "/github",
    );
  }, []);
  const linked = (projects.data?.data ?? []).filter((p) => p.githubUrl);
  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">Source / Chrispine-1210</span>
          <h1>
            Look beneath
            <br />
            the <em>interface.</em>
          </h1>
          <p className="editorial-lead">
            Code is part of the record. Explore the public profile and the
            source links shared through the portfolio’s project casebooks.
          </p>
          <div className="editorial-actions">
            <a
              className="editorial-button"
              href="https://github.com/Chrispine-1210"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={17} /> Open GitHub <ArrowUpRight size={16} />
            </a>
            <Link href="/portfolio" className="editorial-button secondary">
              Read the casebooks
            </Link>
          </div>
        </div>
        <aside className="editorial-note">
          <span className="editorial-eyebrow">Read with context</span>
          <h2>A repository is one part of the story.</h2>
          <p className="editorial-copy">
            Source can establish implementation choices. Running behaviour,
            delivery readiness and business outcomes need their own evidence.
            Each casebook records the scope and limits of its review.
          </p>
        </aside>
      </header>
      <section className="editorial-section">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">
              From the published casebooks
            </span>
            <h2>Project source references.</h2>
          </div>
          <p>
            These links come from the published records. Repository visibility
            is controlled by its owner; a link does not grant access.
          </p>
        </div>
        {projects.isLoading ? (
          <p role="status">Loading source references…</p>
        ) : projects.isError ? (
          <div className="editorial-empty" role="alert">
            <p>Source references could not be loaded.</p>
            <button
              className="editorial-text-link"
              onClick={() => projects.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="editorial-capabilities">
            {linked.map((p) => (
              <article className="editorial-note" key={p.id}>
                <span className="editorial-eyebrow">{p.category}</span>
                <h2>{p.title.split(" — ")[0]}</h2>
                <p className="editorial-copy">{p.description}</p>
                <div className="editorial-actions">
                  <a
                    href={p.githubUrl!}
                    className="editorial-text-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source reference <ArrowUpRight size={16} />
                  </a>
                  <Link
                    className="editorial-text-link"
                    href={`/portfolio/${p.slug}`}
                  >
                    Casebook <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </EditorialPage>
  );
}
