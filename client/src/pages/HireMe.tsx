import { useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Code2,
  Network,
  ChartNoAxesCombined,
  Check,
  Mail,
  Phone,
} from "lucide-react";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import { EditorialPhoto } from "@/components/EditorialPhoto";
import { ConsultationForm } from "@/components/ConsultationForm";
import { setSEO } from "@/lib/seoHelper";
const paths = [
  {
    id: "enterprise-software",
    title: "Software & platforms",
    icon: Code2,
    photo: "code" as const,
    subtitle: "Replace disconnected workflows with a system your team can use.",
    for: "Businesses and institutions planning portals, internal tools or governed operational software.",
    deliverables: [
      "Workflow, user-role and data requirements",
      "Architecture and integration options",
      "Scoped implementation and acceptance criteria",
      "Handover and support responsibilities",
    ],
    questions:
      "Which task is repeated? Where does information get lost? Who needs to approve what?",
  },
  {
    id: "network-infrastructure",
    title: "Networks & managed IT",
    icon: Network,
    photo: "network" as const,
    subtitle: "Create a dependable technical baseline for everyday work.",
    for: "Teams dealing with unreliable connectivity, recurring faults, device support or unclear IT ownership.",
    deliverables: [
      "Network, device and access baseline",
      "Fault analysis and remediation priorities",
      "Monitoring and support scope",
      "Maintenance and escalation responsibilities",
    ],
    questions:
      "What fails most often? Which people are affected? What is the current network and device setup?",
  },
  {
    id: "business-systems",
    title: "Data & operations",
    icon: ChartNoAxesCombined,
    photo: "planning" as const,
    subtitle: "Make records, reporting and responsibility work together.",
    for: "Founders, managers and programme teams improving operational visibility and decision quality.",
    deliverables: [
      "Operating process and responsibility map",
      "Reporting and data-quality requirements",
      "Automation and system options",
      "A practical, costable improvement sequence",
    ],
    questions:
      "Which decision is hard to make? What records exist? What would a useful management view show?",
  },
];
export default function HireMe() {
  const search = useSearch(),
    [, navigate] = useLocation();
  const requested =
    new URLSearchParams(search).get("service") ?? "enterprise-software";
  const selected =
    paths.find((path) => path.id === requested) ??
    (requested === "managed-it"
      ? paths[1]
      : requested === "data-analytics" || requested === "technology-advisory"
        ? paths[2]
        : paths[0]);
  const initialService = [
    "managed-it",
    "data-analytics",
    "technology-advisory",
  ].includes(requested)
    ? requested
    : selected.id;
  useEffect(
    () =>
      setSEO(
        "Work together | Chrispine Mndala",
        "Define a software, network or business-systems project with Chrispine Mndala. Start with the problem, constraints, deliverables and a practical project brief.",
        "/hire",
      ),
    [],
  );
  return (
    <EditorialPage>
      <header className="service-hero">
        <div>
          <p className="portfolio-overline">Work together</p>
          <h1>
            A real problem.
            <br />A clear scope.
            <br />
            <em>A practical next step.</em>
          </h1>
          <p className="editorial-lead">
            Let’s define what needs to change before deciding what to build. The
            right solution should make sense technically, commercially and in
            daily operation.
          </p>
          <div className="editorial-actions">
            <a href="#project-brief" className="editorial-button">
              Build your project brief
            </a>
            <Link href="/portfolio" className="editorial-button secondary">
              Explore related work
            </Link>
          </div>
        </div>
        <EditorialPhoto photo="planning" eager />
      </header>
      <section
        className="evolution-section"
        aria-labelledby="engagement-heading"
      >
        <div className="evolution-section-heading">
          <div>
            <p className="portfolio-overline">Choose a starting point</p>
            <h2 id="engagement-heading">
              What kind of work
              <br />
              <em>is in front of you?</em>
            </h2>
          </div>
          <p>
            An assessment, a defined project or ongoing support can be scoped
            around the actual environment. No engagement is confirmed by
            submitting this form.
          </p>
        </div>
        <div className="service-tabs" role="tablist" aria-label="Service paths">
          {paths.map(({ id, title, icon: Icon }) => (
            <button
              role="tab"
              key={id}
              id={`service-${id}`}
              aria-selected={selected.id === id}
              aria-controls="service-detail"
              tabIndex={selected.id === id ? 0 : -1}
              onKeyDown={(event) => {
                if (
                  ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const current = paths.findIndex((path) => path.id === id);
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? paths.length - 1
                        : (current +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            paths.length) %
                          paths.length;
                  navigate(`/hire?service=${paths[next].id}`);
                  document.getElementById(`service-${paths[next].id}`)?.focus();
                }
              }}
              onClick={() => navigate(`/hire?service=${id}`)}
            >
              <Icon size={24} />
              <strong>{title}</strong>
            </button>
          ))}
        </div>
        <div
          className="service-detail"
          role="tabpanel"
          id="service-detail"
          aria-labelledby={`service-${selected.id}`}
        >
          <div>
            <p className="portfolio-overline">{selected.title}</p>
            <h3>{selected.subtitle}</h3>
            <p>{selected.for}</p>
            <p className="service-question">{selected.questions}</p>
          </div>
          <div>
            <h4>What we can define together</h4>
            <ul>
              {selected.deliverables.map((item) => (
                <li key={item}>
                  <Check size={17} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="service-scope-note">
              Pricing, timing, support and acceptance are agreed after
              discovery.
            </p>
          </div>
        </div>
      </section>
      <section
        className="brief-section"
        id="project-brief"
        aria-labelledby="brief-heading"
      >
        <aside>
          <p className="portfolio-overline">Your project brief</p>
          <h2 id="brief-heading">
            Tell me what
            <br />
            needs to <em>change.</em>
          </h2>
          <p>
            You do not need a technical specification. A clear description of
            the problem, your current tools and the people affected is a useful
            start.
          </p>
          <ul>
            <li>What is happening today?</li>
            <li>What should happen instead?</li>
            <li>What are the budget and timing constraints?</li>
          </ul>
          <div className="brief-direct">
            <h3>Prefer a direct conversation?</h3>
            <a href="mailto:peterschrispine@gmail.com">
              <Mail size={17} />
              peterschrispine@gmail.com
            </a>
            <a href="tel:+265999431115">
              <Phone size={17} />
              +265 999 431 115
            </a>
          </div>
        </aside>
        <div className="brief-form">
          <ConsultationForm initialService={initialService} />
        </div>
      </section>
    </EditorialPage>
  );
}
