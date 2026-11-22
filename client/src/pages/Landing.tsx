import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Network,
  Wrench,
  Briefcase,
} from "lucide-react";
import {
  EditorialPage,
  ProjectReadingCard,
} from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";
import type { PortfolioProject } from "@shared/schema";
import { editorialPhotos, PhotoCredit } from "@/components/EditorialPhoto";
import "@/styles/content-studio.css";
import portrait from "@assets/portfolio-editorial/chrispine-portrait.webp";

const practice = [
  {
    icon: Code2,
    photo: "code" as const,
    title: "Software & data",
    text: "Interfaces, APIs, relational records and the rules that turn a workflow into a working system.",
  },
  {
    icon: Network,
    photo: "network" as const,
    title: "Networks & infrastructure",
    text: "Connectivity, troubleshooting, servers and the discipline of keeping connected systems dependable.",
  },
  {
    icon: Wrench,
    photo: "hardware" as const,
    title: "Hardware & repair",
    text: "Fault isolation, practical maintenance and learning what happens beneath the software.",
  },
  {
    icon: Briefcase,
    photo: "planning" as const,
    title: "Business & operations",
    text: "The people, stock, money, communication and accountability a technical solution has to serve.",
  },
];
export default function Landing() {
  const projects = useQuery<{
    data: PortfolioProject[];
    pagination: { total: number };
  }>({ queryKey: ["/api/portfolio/search?featured=true&limit=4&page=1"] });
  useEffect(() => {
    setSEO(
      "Chrispine Mndala | An engineering journey from Malawi",
      "Software, networks, hardware and business systems. Explore Chrispine Mndala’s work, engineering journal and practical journey building in Malawi.",
      "/",
    );
  }, []);
  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">
            Chrispine Mndala / Lilongwe, Malawi
          </span>
          <h1>
            Rooted here.
            <br />
            Building <em>further.</em>
          </h1>
          <p className="editorial-lead">
            Engineer. Operator. Entrepreneur. My work connects software,
            networks and the everyday systems people depend on.
          </p>
          <p className="editorial-copy" style={{ marginTop: 20 }}>
            This is my working universe: the projects I build, the problems I
            investigate, the decisions I own and the lessons I carry into the
            next attempt.
          </p>
          <div className="editorial-actions">
            <Link
              className="editorial-button"
              href="/portfolio"
              data-testid="button-hero-primary"
            >
              Explore my work <ArrowRight size={17} />
            </Link>
            <Link
              className="editorial-button secondary"
              href="/journey"
              data-testid="button-hero-secondary"
            >
              Follow the journey
            </Link>
          </div>
          <p className="editorial-copy" style={{ marginTop: 25, fontSize: 13 }}>
            Software · Networks · Hardware · Business systems
          </p>
        </div>
        <figure className="editorial-portrait">
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
      <section className="editorial-section" aria-labelledby="story-heading">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">
              01 / The ground I build from
            </span>
            <h2 id="story-heading">The constraints are part of the story.</h2>
          </div>
          <Link href="/about" className="editorial-text-link">
            Meet the person behind the work <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="universe-principles">
          <article>
            <img
              className="principle-photo"
              src={editorialPhotos.planning.src}
              alt={editorialPhotos.planning.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="editorial-eyebrow">Hands-on beginnings</span>
            <h3>Learn the operation.</h3>
            <p className="editorial-copy">
              Stock controls, dispatch, staff coordination, compliance and
              reporting taught me to look beyond a finished screen. A system has
              to work for the people responsible for it.
            </p>
          </article>
          <article>
            <img
              className="principle-photo"
              src={editorialPhotos.network.src}
              alt={editorialPhotos.network.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="editorial-eyebrow">Building with constraints</span>
            <h3>Make the decisions count.</h3>
            <p className="editorial-copy">
              Working in Malawi means taking cost, connectivity, maintenance and
              the available skills seriously. The useful question is what can be
              built, sustained and improved here.
            </p>
          </article>
          <article>
            <img
              className="principle-photo"
              src={editorialPhotos.writing.src}
              alt={editorialPhotos.writing.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="editorial-eyebrow">Pride in the process</span>
            <h3>Keep the evidence.</h3>
            <p className="editorial-copy">
              Progress includes attempts, corrections and unfinished questions.
              I document the choices behind the work so each project becomes a
              foundation for the next.
            </p>
          </article>
        </div>
      </section>
      <section className="editorial-section" aria-labelledby="work-heading">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">02 / Selected work</span>
            <h2 id="work-heading">The ideas, made tangible.</h2>
          </div>
          <Link href="/portfolio" className="editorial-text-link">
            Browse the project library <ArrowRight size={16} />
          </Link>
        </div>
        {projects.isLoading ? (
          <p role="status" className="editorial-copy">
            Loading published casebooks…
          </p>
        ) : projects.isError ? (
          <div className="editorial-empty" role="alert">
            <p className="editorial-copy">
              The casebook collection could not be loaded.
            </p>
            <button
              className="editorial-text-link"
              onClick={() => projects.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="editorial-project-grid">
            {projects.data?.data.map((p, i) => (
              <ProjectReadingCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </section>
      <section
        className="editorial-section editorial-about-grid"
        aria-labelledby="universe-heading"
      >
        <div>
          <span className="editorial-eyebrow">03 / One connected practice</span>
          <h2 id="universe-heading">
            Code does not exist
            <br />
            on its own.
          </h2>
          <p className="editorial-copy" style={{ marginTop: 20 }}>
            I work across the connections between technology and operations.
            Security and embedded systems are expanding learning paths,
            documented through authorized practice and experiments.
          </p>
        </div>
        <div className="editorial-capabilities">
          {practice.map(({ icon: Icon, title, text, photo }) => (
            <article key={title}>
              <figure className="practice-photo">
                <img
                  src={editorialPhotos[photo].src}
                  alt={editorialPhotos[photo].alt}
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="375"
                />
                <figcaption>
                  <PhotoCredit photo={photo} />
                </figcaption>
              </figure>
              <Icon size={25} strokeWidth={1.5} />
              <h3>{title}</h3>
              <p className="editorial-copy">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="editorial-section" aria-labelledby="paths-heading">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">
              04 / The work between releases
            </span>
            <h2 id="paths-heading">A record that keeps moving.</h2>
          </div>
          <p>
            Different windows into the same journey, from the first question to
            the system and the lessons after delivery.
          </p>
        </div>
        <div className="universe-path">
          <Link href="/journey">
            <img
              className="path-photo"
              src={editorialPhotos.writing.src}
              alt={editorialPhotos.writing.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="editorial-eyebrow">
              Field journal <ArrowUpRight size={17} />
            </span>
            <h3>Observe. Test. Learn.</h3>
            <p className="editorial-copy">
              Reviewed field notes, troubleshooting, lab practice and linked
              media as the journey develops.
            </p>
          </Link>
          <Link href="/blog">
            <img
              className="path-photo"
              src={editorialPhotos.reading.src}
              alt={editorialPhotos.reading.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="editorial-eyebrow">
              Writing <ArrowUpRight size={17} />
            </span>
            <h3>Explain the reasoning.</h3>
            <p className="editorial-copy">
              A place for considered technical explanations, development
              reflections and practical perspectives.
            </p>
          </Link>
          <Link href="/github">
            <img
              className="path-photo"
              src={editorialPhotos.code.src}
              alt={editorialPhotos.code.alt}
              loading="lazy"
              decoding="async"
            />
            <span className="editorial-eyebrow">
              Source & resources <ArrowUpRight size={17} />
            </span>
            <h3>Look beneath the surface.</h3>
            <p className="editorial-copy">
              Find the public source links and project evidence behind the work.
            </p>
          </Link>
        </div>
        <p className="editorial-copy" style={{ marginTop: 20, fontSize: 14 }}>
          Editorial photographs illustrate the areas of practice. Photo credits:{" "}
          <PhotoCredit photo="writing" />; <PhotoCredit photo="reading" />;{" "}
          <PhotoCredit photo="code" />.
        </p>
      </section>
      <section className="editorial-bridge">
        <div>
          <h2>Bring a real problem.</h2>
          <p>
            We can start with the people, the workflow and what needs to change.
            Then define a technical direction that makes sense to operate.
          </p>
        </div>
        <Link href="/hire" className="editorial-button">
          Discuss a project <ArrowUpRight size={17} />
        </Link>
      </section>
    </EditorialPage>
  );
}
