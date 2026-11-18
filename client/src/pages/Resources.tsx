import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";
import cv from "@assets/Chrispine-Mndala-CV-2026.pdf?url";
export default function Resources() {
  useEffect(() => {
    setSEO(
      "Resources & reading paths | Chrispine Mndala",
      "Find the public CV, project casebooks, source links and engineering journal.",
      "/resources",
    );
  }, []);
  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">
            Resources / Start with what exists
          </span>
          <h1>
            A way into
            <br />
            the <em>work.</em>
          </h1>
          <p className="editorial-lead">
            Professional background, practical project records and places to
            follow the engineering journey.
          </p>
        </div>
        <aside className="editorial-note">
          <span className="editorial-eyebrow">Professional profile</span>
          <h2>The public CV.</h2>
          <p className="editorial-copy">
            Experience, education and applied capabilities in one document.
          </p>
          <a
            href={cv}
            download="Chrispine-Mndala-CV-2026.pdf"
            className="editorial-text-link"
            style={{ marginTop: 20 }}
          >
            <Download size={16} /> Download CV
          </a>
        </aside>
      </header>
      <section className="editorial-section">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">Reading paths</span>
            <h2>Choose the depth you need.</h2>
          </div>
        </div>
        <div className="universe-path">
          {[
            {
              title: "Project casebooks",
              href: "/portfolio",
              text: "Objectives, architecture, technology choices, operating workflows and recorded interface evidence.",
            },
            {
              title: "Engineering journal",
              href: "/journey",
              text: "A space for reviewed experiments, field observations and learning notes.",
            },
            {
              title: "Technical writing",
              href: "/blog",
              text: "Published articles as they become available, connected to the systems behind them.",
            },
          ].map((x) => (
            <Link key={x.href} href={x.href}>
              <span className="editorial-eyebrow">
                Explore <ArrowUpRight size={17} />
              </span>
              <h3>{x.title}</h3>
              <p className="editorial-copy">{x.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="editorial-bridge">
        <div>
          <h2>Looking for the source?</h2>
          <p>
            The source hub connects the public GitHub profile with repository
            links disclosed in the project casebooks.
          </p>
        </div>
        <Link href="/github" className="editorial-button">
          Open the source hub <ArrowRight size={17} />
        </Link>
      </section>
    </EditorialPage>
  );
}
