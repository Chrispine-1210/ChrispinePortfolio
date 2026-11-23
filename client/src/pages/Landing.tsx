import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Code2,
  Network,
  Wrench,
  BriefcaseBusiness,
  Check,
  BookOpen,
} from "lucide-react";
import {
  EditorialPage,
  ProjectReadingCard,
} from "@/components/editorial/EditorialPage";
import { editorialPhotos, PhotoCredit } from "@/components/EditorialPhoto";
import { setSEO } from "@/lib/seoHelper";
import type { PortfolioProject } from "@shared/schema";
import portrait from "@assets/portfolio-editorial/chrispine-portrait.webp";
import "@/styles/portfolio-evolution.css";
const practices = [
  {
    title: "Software & data",
    icon: Code2,
    photo: "code" as const,
    service: "enterprise-software",
    question: "Make the workflow work.",
    text: "Portals, APIs and relational records built around the decisions your team actually makes.",
    outputs: [
      "A clear workflow and data model",
      "Roles, approvals and traceable records",
      "A scoped path from build to handover",
    ],
  },
  {
    title: "Networks & infrastructure",
    icon: Network,
    photo: "network" as const,
    service: "network-infrastructure",
    question: "Keep the operation connected.",
    text: "Understand the fault, map the environment and design a network your team can maintain.",
    outputs: [
      "Network and device baseline",
      "Prioritized fault and access controls",
      "Monitoring and support responsibilities",
    ],
  },
  {
    title: "Hardware & repair",
    icon: Wrench,
    photo: "hardware" as const,
    service: "managed-it",
    question: "Find the cause beneath the symptom.",
    text: "Practical diagnosis connects devices, connectivity and the people who depend on them.",
    outputs: [
      "Structured fault isolation",
      "Repair or replacement options",
      "Maintenance and operating guidance",
    ],
  },
  {
    title: "Business & operations",
    icon: BriefcaseBusiness,
    photo: "planning" as const,
    service: "business-systems",
    question: "Turn scattered records into control.",
    text: "Connect stock, staff, follow-up, reporting and accountability to a usable operating system.",
    outputs: [
      "Process and responsibility map",
      "Decision-ready reporting requirements",
      "A costed implementation boundary",
    ],
  },
];
export default function Landing() {
  const [practice, setPractice] = useState(0);
  const selected = practices[practice];
  const projects = useQuery<{
    data: PortfolioProject[];
    pagination: { total: number };
  }>({ queryKey: ["/api/portfolio/search?featured=true&limit=4&page=1"] });
  useEffect(() => {
    setSEO(
      "Chrispine Mndala | Engineering that moves work forward",
      "Software, networks and business systems by Chrispine Mndala in Malawi. Explore project casebooks, engineering practice and a clear path to working together.",
      "/",
    );
  }, []);
  return (
    <EditorialPage>
      <header className="evolution-hero">
        <div className="evolution-hero-copy">
          <p className="portfolio-overline">
            Chrispine Mndala · Lilongwe, Malawi
          </p>
          <h1>
            Rooted here.
            <br />
            Built to move
            <br />
            <em>work forward.</em>
          </h1>
          <p className="evolution-intro">
            Software, networks and the operating systems behind a business. I
            connect the technical detail to the people responsible for making it
            work.
          </p>
          <div className="editorial-actions">
            <Link
              className="editorial-button"
              href="/portfolio"
              data-testid="button-hero-primary"
            >
              Explore the work
            </Link>
            <Link
              className="editorial-button secondary"
              href="/hire"
              data-testid="button-hero-secondary"
            >
              Discuss your project
            </Link>
          </div>
          <div className="hero-discipline">
            <span>Computer engineering</span>
            <span>Business operations</span>
            <span>Practical problem-solving</span>
          </div>
        </div>
        <figure className="evolution-portrait">
          <div className="portrait-context">
            <span>One connected practice</span>
            <strong>
              Engineer.
              <br />
              Operator.
              <br />
              Entrepreneur.
            </strong>
          </div>
          <img
            src={portrait}
            alt="Chrispine Mndala"
            fetchPriority="high"
            decoding="async"
          />
          <figcaption>
            <span>Chrispine Mndala</span>
            <span>Made through practice.</span>
          </figcaption>
        </figure>
      </header>
      <div className="evolution-context-strip">
        <p>Built with context.</p>
        <span>Malawi-first perspective</span>
        <span>Clear technical boundaries</span>
        <span>Evidence before claims</span>
      </div>
      <section className="evolution-section" aria-labelledby="selected-work">
        <div className="evolution-section-heading">
          <div>
            <p className="portfolio-overline">Selected work</p>
            <h2 id="selected-work">
              The problem. The decisions.
              <br />
              <em>The system behind them.</em>
            </h2>
          </div>
          <div>
            <p>
              Follow the architecture, workflows and recorded evidence. A
              project casebook shows the work and its limits.
            </p>
            <Link href="/portfolio" className="editorial-text-link">
              View the full project library
            </Link>
          </div>
        </div>
        {projects.isLoading ? (
          <div className="project-loading" role="status">
            Loading published casebooks…
          </div>
        ) : projects.isError ? (
          <div className="editorial-empty" role="alert">
            <h3>The project library is temporarily unavailable.</h3>
            <button
              className="editorial-button secondary"
              onClick={() => void projects.refetch()}
            >
              Reload casebooks
            </button>
          </div>
        ) : projects.data?.data.length ? (
          <div className="editorial-project-grid evolution-project-grid">
            {projects.data.data.map((project) => (
              <ProjectReadingCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="editorial-empty">
            <h3>Casebooks will appear after publication.</h3>
            <p>
              Explore the engineering journal or discuss a problem you are
              working on.
            </p>
            <Link href="/journey" className="editorial-text-link">
              Open the journal
            </Link>
          </div>
        )}
      </section>
      <section
        className="practice-studio evolution-section"
        aria-labelledby="practice-heading"
      >
        <div className="evolution-section-heading">
          <div>
            <p className="portfolio-overline">A connected practice</p>
            <h2 id="practice-heading">
              What needs to
              <br />
              <em>work better?</em>
            </h2>
          </div>
          <p>
            Start with the operating problem. Choose an area to see the kind of
            work we can define together.
          </p>
        </div>
        <div className="practice-studio-grid">
          <div
            className="practice-selectors"
            role="tablist"
            aria-label="Areas of practice"
            aria-orientation="vertical"
          >
            {practices.map(({ title, icon: Icon }, index) => (
              <button
                key={title}
                id={`practice-tab-${index}`}
                role="tab"
                aria-selected={practice === index}
                aria-controls={`practice-panel-${index}`}
                onClick={() => setPractice(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const next =
                      (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        practices.length) %
                      practices.length;
                    setPractice(next);
                    document.getElementById(`practice-tab-${next}`)?.focus();
                  }
                }}
                tabIndex={practice === index ? 0 : -1}
              >
                <Icon size={22} />
                <span>{title}</span>
                <span className="practice-selector-state">
                  {practice === index ? "Selected" : "Explore"}
                </span>
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`practice-panel-${practice}`}
            aria-labelledby={`practice-tab-${practice}`}
            className="practice-detail"
            tabIndex={0}
          >
            <figure>
              <img
                src={editorialPhotos[selected.photo].src}
                alt={editorialPhotos[selected.photo].alt}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <PhotoCredit photo={selected.photo} />
              </figcaption>
            </figure>
            <div>
              <h3>{selected.question}</h3>
              <p>{selected.text}</p>
              <ul>
                {selected.outputs.map((output) => (
                  <li key={output}>
                    <Check size={16} />
                    {output}
                  </li>
                ))}
              </ul>
              <Link
                href={`/hire?service=${selected.service}`}
                className="editorial-text-link"
              >
                Discuss this area of work
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section
        className="evolution-story evolution-section"
        aria-labelledby="story-heading"
      >
        <div>
          <p className="portfolio-overline">The ground I build from</p>
          <h2 id="story-heading">
            The constraints
            <br />
            are part of
            <br />
            <em>the story.</em>
          </h2>
          <Link href="/about" className="editorial-text-link">
            Meet the person behind the work
          </Link>
        </div>
        <div>
          <p className="story-opening">
            Before a system is software, it is someone’s working day.
          </p>
          <p>
            Stock, dispatch, staff coordination, compliance and reporting taught
            me to look beyond a finished screen. A useful system has to serve
            the people responsible for it.
          </p>
          <p>
            Building in Malawi means taking cost, connectivity, maintenance and
            available skills seriously. Those constraints shape the decisions,
            and the work becomes stronger when the reasoning is visible.
          </p>
          <div className="story-principles">
            <span>Understand the operation.</span>
            <span>Make the decisions count.</span>
            <span>Keep the evidence.</span>
          </div>
        </div>
      </section>
      <section className="evolution-section" aria-labelledby="method-heading">
        <div className="evolution-section-heading">
          <div>
            <p className="portfolio-overline">From conversation to delivery</p>
            <h2 id="method-heading">
              A clear way
              <br />
              <em>to work together.</em>
            </h2>
          </div>
          <p>
            Scope, responsibilities and commercial terms are agreed before
            delivery. Each stage should leave the next decision clearer.
          </p>
        </div>
        <div className="evolution-method">
          {[
            {
              title: "Understand",
              text: "Map the people, problem, current tools and operating constraints.",
            },
            {
              title: "Define",
              text: "Agree the workflows, deliverables, risks and acceptance criteria.",
            },
            {
              title: "Build & verify",
              text: "Implement in controlled increments and test the real business rules.",
            },
            {
              title: "Handover & improve",
              text: "Document ownership, support needs and the next sensible improvement.",
            },
          ].map((stage) => (
            <article key={stage.title}>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="evolution-learning">
        <div>
          <BookOpen size={30} />
          <p className="portfolio-overline">The practice continues</p>
          <h2>Keep the questions open.</h2>
          <p>
            Field notes, technical writing and public source make room for the
            reasoning behind the result.
          </p>
        </div>
        <nav aria-label="Explore the thinking">
          <Link href="/journey">
            <strong>Engineering journal</strong>
            <span>Practice, experiments and lessons</span>
          </Link>
          <Link href="/blog">
            <strong>Writing & research</strong>
            <span>Technical explanations and references</span>
          </Link>
          <Link href="/github">
            <strong>Source & repositories</strong>
            <span>Look beneath the interface</span>
          </Link>
        </nav>
      </section>
      <section className="evolution-invitation">
        <p className="portfolio-overline">Start with the real problem</p>
        <h2>
          What would change
          <br />
          if your systems
          <br />
          <em>worked together?</em>
        </h2>
        <div>
          <p>
            Tell me what is slowing the work down. We can define the technical
            direction, the operating boundary and a practical next step.
          </p>
          <Link href="/hire" className="editorial-button">
            Build a project brief
          </Link>
          <Link href="/contact" className="editorial-text-link">
            Send a direct message
          </Link>
        </div>
      </section>
    </EditorialPage>
  );
}
