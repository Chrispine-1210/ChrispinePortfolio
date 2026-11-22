import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { RichContent } from "@/components/editorial/RichContent";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Github,
  ShieldCheck,
} from "lucide-react";
import { setSEO } from "@/lib/seoHelper";
import { Button } from "@/components/ui/button";
import { CaseStudyCover } from "@/components/CaseStudyCover";
import type { PublicPortfolioProject } from "@shared/schema";

function Editorial({ text }: { text: string }) { return <RichContent content={text} className="editorial-prose"/>; }

export default function PortfolioDetail() {
  const { slug } = useParams();
  const {
    data: project,
    isLoading,
    error,
  } = useQuery<PublicPortfolioProject>({ queryKey: ["/api/portfolio", slug] });
  useEffect(() => {
    if (project)
      setSEO(
        `${project.title} | Chrispine Mndala`,
        project.description,
        `/portfolio/${project.slug}`,
      );
  }, [project]);
  if (isLoading)
    return (
      <div className="min-h-[65vh] pt-40 text-center" role="status">
        Loading case study…
      </div>
    );
  if (!project)
    return (
      <div className="min-h-[65vh] px-6 pt-40 text-center">
        <h1 className="text-3xl font-semibold">
          {error ? "Case study unavailable" : "Case study not found"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {error
            ? "Please try again. Only published, approved records are available."
            : "This record may be private or under review."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/portfolio">Back to portfolio</Link>
        </Button>
      </div>
    );
  const d = project.dossier;
  const sections = [
    {
      id: "problem",
      title: "The problem & why it matters",
      text: project.challenge,
    },
    {
      id: "objectives",
      title: "Objectives & acceptance criteria",
      text: d?.objectives,
    },
    {
      id: "context",
      title: "Malawi context & constraints",
      text: d?.constraints,
    },
    {
      id: "delivery",
      title: "Features, decisions & business operations",
      text: project.solution,
    },
    {
      id: "architecture",
      title: "Architecture, data & algorithms",
      text: d?.architecture,
    },
    {
      id: "integrations",
      title: "Integrations & communications",
      text: d?.integrations,
    },
    {
      id: "security",
      title: "Security & data responsibility",
      text: d?.securityControls,
    },
    {
      id: "process",
      title: "Development process & challenges",
      text: d?.timeline,
    },
    {
      id: "role",
      title: "My contribution & collaboration",
      text: [d?.roleDescription, d?.teamDescription]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      id: "results",
      title: "Results, financial value & evidence",
      text: project.outcome,
    },
    { id: "lessons", title: "Lessons & trade-offs", text: d?.lessons },
    { id: "next", title: "Open questions & next phase", text: d?.nextPhase },
  ].filter((section) => Boolean(section.text));
  return (
    <article className="min-h-screen bg-background pb-24 pt-28 text-foreground">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          data-testid="button-back-to-portfolio"
        >
          <ArrowLeft className="h-4 w-4" /> All case studies
        </Link>
        <header className="mb-10 mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.22em] text-primary">
              {project.category} / Development case study
            </p>
            <h1
              className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"
              data-testid="text-project-title"
            >
              {project.title}
            </h1>
            <p
              className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground"
              data-testid="text-project-description"
            >
              {project.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {project.liveUrl && (
                <Button asChild data-testid="button-view-live">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open public surface{" "}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button
                  asChild
                  variant="outline"
                  data-testid="button-view-github"
                >
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" /> Source repository
                  </a>
                </Button>
              )}
            </div>
          </div>
          <aside className="self-start rounded-2xl border border-border bg-accent p-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
              Implementation stack
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {(project.techStack ?? []).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              A public page, source implementation and production operation are
              different evidence states. Read the results and limitations below.
            </p>
          </aside>
        </header>
        <CaseStudyCover
          project={project}
          className="mb-8 rounded-2xl border border-border"
        />
        {(project.images ?? []).length > 0 && (
          <section
            aria-labelledby="screenshots-title"
            className="mb-14 rounded-2xl border border-border p-5 sm:p-7"
          >
            <h2
              id="screenshots-title"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Camera className="h-5 w-5 text-primary" /> Interface evidence
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Actual browser captures, dated in each filename. Click to inspect
              the original. Sample data and release limitations remain described
              in the study.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {project.images?.map((src, i) => (
                <figure key={src}>
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
                  >
                    <img
                      src={src}
                      alt={`${project.title} — interface capture ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover object-top transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </a>
                  <figcaption className="mt-2 break-words text-xs text-muted-foreground">
                    {decodeURIComponent(
                      src.split("/").pop() ?? `Interface ${i + 1}`,
                    )
                      .replace(/\.jpg$/i, "")
                      .replaceAll("-", " ")}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        <div className="grid items-start gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
          <nav aria-label="Case study contents" className="lg:sticky lg:top-24">
            <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
              Inside this case study
            </p>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground hover:text-primary"
                  >
                    <span className="text-xs text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
            <a
              href="#evidence"
              className="mt-5 inline-flex items-center gap-2 text-sm text-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" /> Verification record
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-6 block text-xs text-muted-foreground underline underline-offset-4 print:hidden"
            >
              Print / save case study as PDF
            </button>
          </nav>
          <div className="min-w-0 space-y-12">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-24 border-t border-border pt-8"
              >
                <p className="mb-3 text-xs text-primary">
                  {String(i + 1).padStart(2, "0")} / THE DEVELOPMENT RECORD
                </p>
                <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {s.title}
                </h2>
                <Editorial text={s.text!} />
              </section>
            ))}
            <section
              id="evidence"
              className="scroll-mt-24 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.035] p-6 sm:p-8"
            >
              <h2 className="flex items-center gap-3 text-2xl font-semibold">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />{" "}
                Verification record
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Claims below passed the portfolio’s disclosure gate. Internal
                review establishes the stated scope; it does not certify client
                adoption, financial returns or regulatory compliance.
              </p>
              <div className="mt-6 space-y-4">
                {project.evidence.map((item) => (
                  <div key={item.id} className="border-t border-border pt-4">
                    <p className="text-xs uppercase tracking-wider text-emerald-700">
                      {item.verificationStatus === "externally_verified"
                        ? "Externally verified"
                        : "Internally reviewed"}{" "}
                      · {item.sourceType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.claim}
                    </p>
                    {item.verifiedAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reviewed{" "}
                        {new Date(item.verifiedAt).toLocaleDateString("en-GB", {
                          timeZone: "Africa/Blantyre",
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <div className="rounded-2xl border border-border p-7 print:hidden">
              <h2 className="text-xl font-semibold">
                Have a similar operational problem?
              </h2>
              <p className="mb-5 mt-2 text-sm text-muted-foreground">
                Start with the workflow, the commercial constraint and the
                evidence needed for a useful result.
              </p>
              <Button asChild>
                <Link href="/hire">
                  Discuss your project <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
