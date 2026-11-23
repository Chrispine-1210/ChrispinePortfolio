import { useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Network,
  BarChart3,
  Briefcase,
  Download,
} from "lucide-react";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";
import publicCvUrl from "@assets/Chrispine-Mndala-CV-2026.pdf?url";
import { editorialPhotos, PhotoCredit } from "@/components/EditorialPhoto";
import "@/styles/content-studio.css";
import portrait from "@assets/portfolio_photos/chrispine-about-campus.png";

const capabilities = [
  {
    icon: Code2,
    photo: "code" as const,
    title: "Software that supports the work",
    body: "Web interfaces, APIs and database-backed workflows. My applied stack includes React, TypeScript, Node.js, PostgreSQL and Drizzle.",
  },
  {
    icon: Network,
    photo: "network" as const,
    title: "Connected systems",
    body: "A foundation in TCP/IP, routing, DNS and device troubleshooting, with continued practical work in servers, networks and recovery.",
  },
  {
    icon: BarChart3,
    photo: "library" as const,
    title: "Data with a purpose",
    body: "Collection, analysis and reporting that help people understand operations. Excel, dashboards and monitoring and evaluation inform the approach.",
  },
  {
    icon: Briefcase,
    photo: "planning" as const,
    title: "An operator’s perspective",
    body: "Commercial operations, stock controls, compliance and staff coordination shape how I approach software requirements and delivery.",
  },
];
const experience = [
  {
    period: "2026 — Present",
    company: "Aöthothe Technologies",
    role: "Founder & Systems Lead",
    text: "Developing enterprise software and delivery foundations, including operational controls, product architecture and evidence standards.",
    href: "/portfolio/aothothe-enterprise-os-commercial-foundation",
  },
  {
    period: "2020 — Present",
    company: "Freelance / Contract · Malawi",
    role: "Technical Consultant",
    text: "Web platforms, dashboards and digital workflows, from requirements and interface development to data structures, documentation and release support.",
    href: "/portfolio/mtendere-education-platform",
  },
  {
    period: "2025",
    company: "Farm Produce Marketing Association",
    role: "Marketing & Sales Compliance Officer",
    text: "Auction-floor compliance, farmer consultations, sales information and market-performance reporting.",
  },
  {
    period: "2022 — Present",
    company: "CHL Investments",
    role: "Operations & Marketing Manager",
    text: "Operating processes, staff and vendor coordination, recruitment support, marketing and performance reporting for a family business.",
  },
  {
    period: "2020 — 2021",
    company: "SBOF Ltd",
    role: "Assistant Sales & Depot Manager",
    text: "Depot operations, stock controls, dispatch coordination, team supervision and operational briefs.",
  },
];
const credentials = [
  {
    year: "2018 — 2022",
    qualification: "Bachelor of Business Administration",
    institution: "Jubilee University · Malawi",
  },
  {
    year: "2024 · Distinction",
    qualification: "Advanced Diploma in Computer Networks & Internet Protocols",
    institution: "Alison",
  },
  {
    year: "2023 · Distinction",
    qualification: "Diploma in Project Management",
    institution: "Alison",
  },
  {
    year: "2024",
    qualification: "Monitoring & Evaluation Certificate",
    institution: "Green Cedar Consult",
  },
];

export default function About() {
  useEffect(() => {
    setSEO(
      "About Chrispine Mndala | Software, networks & operations",
      "Meet Chrispine Mndala, a Malawi-based software and systems professional connecting practical engineering with business operations, data and delivery.",
      "/about",
    );
  }, []);
  return (
    <EditorialPage>
      <header className="editorial-hero">
        <div>
          <span className="editorial-kicker">
            About / Based in Lilongwe, Malawi
          </span>
          <h1 data-testid="text-page-title">
            Engineering with
            <br />
            an <em>operator’s eye.</em>
          </h1>
          <p className="editorial-lead" data-testid="text-intro-1">
            I’m Chrispine Mndala. I build software and connected workflows with
            an interest in what happens after the screen: the people, decisions
            and daily operations behind a system.
          </p>
          <p
            className="editorial-copy"
            style={{ marginTop: 19 }}
            data-testid="text-intro-2"
          >
            My background brings together programming, computer networks, data
            analysis and commercial operations. That combination keeps the work
            grounded in the problem a team actually needs to solve.
          </p>
          <div className="editorial-actions">
            <Link href="/portfolio" className="editorial-button">
              Explore my work <ArrowRight size={16} />
            </Link>
            <a
              href={publicCvUrl}
              download="Chrispine-Mndala-CV-2026.pdf"
              className="editorial-button secondary"
              data-testid="button-download-cv"
            >
              <Download size={16} /> Download CV
            </a>
          </div>
        </div>
        <figure className="editorial-portrait">
          <img
            src={portrait}
            alt="Chrispine Mndala outdoors on a campus"
            fetchPriority="high"
            decoding="async"
            data-testid="img-about"
          />
          <figcaption>
            <span>Chrispine Mndala</span>
            <span>Software · Systems · Operations</span>
          </figcaption>
        </figure>
      </header>
      <section
        className="editorial-section editorial-about-grid"
        aria-labelledby="approach-heading"
      >
        <div>
          <span className="editorial-eyebrow">01 / Perspective</span>
          <h2 id="approach-heading">
            Start with the work.
            <br />
            Then build the system.
          </h2>
        </div>
        <div>
          <p className="editorial-lead">
            A useful platform needs more than a good interface. It needs clear
            ownership, dependable records and a process people can follow.
          </p>
          <p className="editorial-copy" style={{ marginTop: 19 }}>
            My work in stock handling, staff coordination, compliance and
            reporting has made those details difficult to ignore. I bring that
            operational perspective into requirements, data models, access
            controls and release decisions.
          </p>
          <p className="editorial-copy" style={{ marginTop: 19 }}>
            Building in Malawi also means asking practical questions: Can the
            team afford to run it? Will it remain usable on an ordinary
            connection? Who maintains it, and how is information recovered when
            something fails?
          </p>
          <Link
            href="/blog"
            className="editorial-text-link"
            style={{ marginTop: 22 }}
          >
            Read my writing <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section
        className="editorial-section editorial-about-grid"
        aria-labelledby="practice-heading"
      >
        <div>
          <span className="editorial-eyebrow">02 / Areas of practice</span>
          <h2 id="practice-heading">
            Across code,
            <br />
            infrastructure and business.
          </h2>
        </div>
        <div className="editorial-capabilities">
          {capabilities.map(({ icon: Icon, title, body, photo }) => (
            <div key={title}>
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
              <Icon size={24} strokeWidth={1.5} />
              <h3>{title}</h3>
              <p className="editorial-copy">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        className="editorial-section editorial-about-grid"
        aria-labelledby="experience-heading"
      >
        <div>
          <span className="editorial-eyebrow">03 / Professional journey</span>
          <h2 id="experience-heading">
            Experience that
            <br />
            shapes the approach.
          </h2>
          <p className="editorial-copy" style={{ marginTop: 17 }}>
            Roles and dates follow the public CV. Project casebooks provide the
            technical scope and current evidence separately.
          </p>
        </div>
        <ol className="editorial-timeline">
          {experience.map((item) => (
            <li key={item.company}>
              <div className="editorial-eyebrow">{item.period}</div>
              <h3>{item.role}</h3>
              <p style={{ fontSize: 14, color: "var(--leaf)" }}>
                {item.company}
              </p>
              <p className="editorial-copy">{item.text}</p>
              {item.href && (
                <Link
                  href={item.href}
                  className="editorial-text-link"
                  style={{ marginTop: 12 }}
                >
                  Related project casebook <ArrowUpRight size={15} />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>
      <section
        className="editorial-section editorial-about-grid"
        aria-labelledby="education-heading"
      >
        <div>
          <span className="editorial-eyebrow">
            04 / Education & continued learning
          </span>
          <h2 id="education-heading">
            A foundation
            <br />
            to keep building on.
          </h2>
        </div>
        <div>
          <ul className="editorial-timeline">
            {credentials.map((c) => (
              <li key={c.qualification}>
                <div className="editorial-eyebrow">{c.year}</div>
                <h3>{c.qualification}</h3>
                <p className="editorial-copy">{c.institution}</p>
              </li>
            ))}
          </ul>
          <p className="editorial-copy" style={{ marginTop: 24 }}>
            Current learning interests include cybersecurity, network
            troubleshooting, repair, server operations and embedded systems. The
            journal records practice and lessons as they develop.
          </p>
          <Link
            href="/journey"
            className="editorial-text-link"
            style={{ marginTop: 18 }}
          >
            Follow the learning journey <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="editorial-section" aria-labelledby="ventures-heading">
        <div className="editorial-section-heading">
          <div>
            <span className="editorial-eyebrow">05 / Connected work</span>
            <h2 id="ventures-heading">The wider operating picture.</h2>
          </div>
          <p>
            Explore the technical and institutional work through its public
            casebooks.
          </p>
        </div>
        <div className="editorial-capabilities">
          <Link
            href="/portfolio/aothothe-enterprise-os-commercial-foundation"
            className="editorial-note"
          >
            <span className="editorial-eyebrow">
              Aöthothe Technologies <ArrowUpRight size={17} />
            </span>
            <h2>Governed company operations.</h2>
            <p className="editorial-copy">
              Commercial intake, decisions, delivery and an evidence-led
              approach to building an operating company.
            </p>
          </Link>
          <Link
            href="/portfolio/sudern-institutional-operations"
            className="editorial-note"
          >
            <span className="editorial-eyebrow">
              SUDERN <ArrowUpRight size={17} />
            </span>
            <h2>Institutional systems.</h2>
            <p className="editorial-copy">
              Protected access, accountability and the release evidence behind
              an institutional operations platform.
            </p>
          </Link>
        </div>
      </section>
      <section className="editorial-bridge">
        <div>
          <h2>Have an operating problem worth solving?</h2>
          <p>
            Let’s discuss the people, process and technical constraints, then
            define a practical next step.
          </p>
        </div>
        <Link
          href="/hire"
          className="editorial-button"
          data-testid="button-hire-about"
        >
          Discuss a project <ArrowUpRight size={17} />
        </Link>
      </section>
    </EditorialPage>
  );
}
