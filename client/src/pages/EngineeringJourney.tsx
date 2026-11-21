import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircuitBoard,
  Code2,
  FlaskConical,
  Network,
  Server,
  Shield,
  Wrench,
} from "lucide-react";
import { topics, type Publication } from "@shared/engineering";
import { SocialMedia } from "@/components/engineering/SocialMedia";
import { setSEO } from "@/lib/seoHelper";
const netOpsCapture = "/project-evidence/2026-11-18/network-ops-2026-11-18.jpg";
const areas = [
  {
    id: "networking",
    label: "Networks",
    icon: Network,
    description: "TCP/IP, routing, DNS and the discipline of diagnosis.",
  },
  {
    id: "programming",
    label: "Programming",
    icon: Code2,
    description: "Algorithms, software craft and reproducible experiments.",
  },
  {
    id: "hardware",
    label: "Repair & hardware",
    icon: Wrench,
    description: "Fault isolation, safe repair and practical documentation.",
  },
  {
    id: "servers",
    label: "Servers & cloud",
    icon: Server,
    description: "Deployment, backups, observability and reliable operation.",
  },
  {
    id: "cybersecurity",
    label: "Security",
    icon: Shield,
    description: "Defensive engineering and authorized lab practice.",
  },
  {
    id: "embedded",
    label: "Embedded systems",
    icon: CircuitBoard,
    description: "A learning path into devices, chips and machine interfaces.",
  },
];
async function fetchPublic<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: "omit", cache: "no-store" });
  if (!r.ok)
    throw new Error("The engineering journal is temporarily unavailable");
  return r.json();
}
export default function EngineeringJourney() {
  const { slug } = useParams();
  const [topic, setTopic] = useState("");
  const [offset, setOffset] = useState(0);
  const notes = useQuery<{ data: Publication[]; hasMore: boolean }>({
    queryKey: ["journey", topic, offset],
    enabled: !slug,
    queryFn: () =>
      fetchPublic(
        `/api/journey?limit=9&offset=${offset}${topic ? `&topic=${topic}` : ""}`,
      ),
  });
  const note = useQuery<Publication>({
    queryKey: ["journey-note", slug],
    enabled: !!slug,
    queryFn: () => fetchPublic(`/api/journey/${slug}`),
  });
  useEffect(() => {
    setSEO(
      note.data
        ? `${note.data.title} | Engineering journal`
        : "Engineering journal | Chrispine Mndala",
      "A practical engineering journey through networks, code, repairs, servers and systems built in Malawi.",
      slug ? `/journey/${slug}` : "/journey",
    );
  }, [slug, note.data]);
  if (slug)
    return (
      <div className="min-h-screen bg-[#f4f2eb] px-5 pb-24 pt-28 text-[#172524]">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/journey"
            className="mb-10 inline-flex items-center gap-2 text-sm text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            All field notes
          </Link>
          {note.isLoading ? (
            <p role="status">Loading field note…</p>
          ) : note.isError ? (
            <div
              role="alert"
              className="rounded-2xl border border-amber-300 bg-white p-8"
            >
              <h1 className="text-2xl font-semibold">
                This field note is unavailable
              </h1>
              <p className="mt-3">
                It may be private, withdrawn or still being prepared.
              </p>
            </div>
          ) : note.data ? (
            <>
              <p className="text-xs uppercase tracking-[.2em] text-[#567165]">
                {note.data.topic} ·{" "}
                {new Date(note.data.publishedAt).toLocaleDateString("en-GB", {
                  timeZone: "Africa/Blantyre",
                })}
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                {note.data.title}
              </h1>
              <p className="my-7 max-w-3xl text-xl leading-relaxed text-slate-600">
                {note.data.summary}
              </p>
              {note.data.imageUrl && (
                <figure className="mb-9">
                  <img
                    src={note.data.imageUrl}
                    alt={note.data.imageAlt ?? "Engineering field note"}
                    className="max-h-[560px] w-full rounded-2xl border border-slate-300 object-contain bg-white"
                  />
                </figure>
              )}
              {note.data.mediaUrl && (
                <div className="mb-10">
                  <SocialMedia
                    key={note.data.mediaUrl}
                    url={note.data.mediaUrl}
                    title={note.data.title}
                  />
                </div>
              )}
              <div className="prose prose-slate max-w-none prose-headings:tracking-tight prose-img:rounded-2xl prose-pre:whitespace-pre-wrap">
                <ReactMarkdown
                  skipHtml
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {note.data.body}
                </ReactMarkdown>
              </div>
              <section className="mt-10 rounded-2xl border border-[#bed0c3] bg-[#e9eee5] p-7">
                <h2 className="text-xl font-semibold">What I learned</h2>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed">
                  {note.data.learning}
                </p>
              </section>
              <section className="mt-7 border-t border-slate-300 pt-7">
                <h2 className="text-lg font-semibold">Evidence and limits</h2>
                <p className="my-3 text-xs uppercase tracking-wider text-slate-500">
                  {note.data.evidenceLevel.replaceAll("_", " ")}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                  {note.data.limitations}
                </p>
                <ul className="mt-5 space-y-3">
                  {note.data.evidenceUrls.map((url, i) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-800 underline underline-offset-4"
                      >
                        Supporting evidence {i + 1}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-[#f4f2eb] pb-20 pt-16 text-[#172524]">
      <section className="border-b border-[#d7d9cd] bg-[#f8f7f1]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[.2em] text-[#567165]">
              <span className="h-2 w-2 rounded-full bg-[#9e7b39]" /> Chrispine
              Mndala / Malawi
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-7xl">
              An engineer’s work,
              <br />
              <span className="font-serif font-normal italic text-[#607564]">
                in the open.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-600">
              Questions from the lab. Lessons from a repair. Decisions behind a
              working system. This is where I record the practice, evidence and
              thinking behind my engineering journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#field-notes"
                className="inline-flex items-center gap-4 rounded-full bg-[#1c3931] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#2c5146]"
              >
                Read the field notes
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-3 rounded-full border border-[#b6c1b6] px-6 py-3.5 text-sm font-semibold"
              >
                Explore delivered work
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-9 text-xs leading-relaxed text-slate-500">
              Learn deliberately. Build carefully. Test the claim. Share the
              lesson.
            </p>
          </div>
          <figure className="relative overflow-hidden rounded-[28px] border border-[#b9c2b9] bg-[#0b1726] p-4 shadow-[0_25px_70px_-35px_rgba(19,43,35,.45)]">
            <div className="flex justify-between px-2 pb-4 pt-1 text-[10px] uppercase tracking-[.2em] text-slate-400">
              <span>From the workbench</span>
              <span>Network operations</span>
            </div>
            <img
              src={netOpsCapture}
              alt="The NetOps troubleshooting practice workspace, showing a DNS incident and evidence-led practice priorities"
              className="aspect-[4/3] w-full rounded-2xl object-cover object-left-top"
              fetchPriority="high"
            />
            <figcaption className="flex items-start justify-between gap-5 px-2 pb-1 pt-5 text-xs leading-relaxed text-slate-300">
              <span>
                Actual project interface.
                <br />
                <span className="text-slate-500">
                  A practice workspace, not live network telemetry.
                </span>
              </span>
              <Link
                href="/portfolio/network-operations-training"
                className="shrink-0 text-amber-200"
              >
                Read the case
                <ArrowUpRight className="ml-1 inline h-3 w-3" />
              </Link>
            </figcaption>
          </figure>
        </div>
      </section>
      <section
        aria-label="Engineering disciplines"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8"
      >
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-[#607564]">
              A practice across systems
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Follow the discipline.
            </h2>
          </div>
          <BookOpen className="h-7 w-7 text-[#9e7b39]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setTopic(a.id);
                setOffset(0);
                document
                  .getElementById("field-notes")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group rounded-2xl border border-[#d4d9ce] bg-[#fafaf6] p-6 text-left transition-colors hover:border-[#869c87] hover:bg-white"
            >
              <a.icon className="mb-5 h-6 w-6 text-[#547360]" />
              <h3 className="text-lg font-semibold">
                {a.label}
                <ArrowUpRight className="float-right h-4 w-4 text-slate-400 group-hover:text-[#547360]" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {a.description}
              </p>
            </button>
          ))}
        </div>
      </section>
      <section
        id="field-notes"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-16 sm:px-8"
      >
        <div className="mb-7 border-t border-[#ccd4c8] pt-10">
          <p className="text-xs uppercase tracking-[.18em] text-[#607564]">
            Field notes & practical walkthroughs
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            The work, and what it taught me.
          </h2>
        </div>
        <div className="mb-7 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTopic("");
              setOffset(0);
            }}
            className={`rounded-full border px-4 py-2 text-sm ${!topic ? "border-[#1c3931] bg-[#1c3931] text-white" : "border-[#ccd4c8]"}`}
          >
            All notes
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTopic(t);
                setOffset(0);
              }}
              className={`rounded-full border px-4 py-2 text-sm ${topic === t ? "border-[#1c3931] bg-[#1c3931] text-white" : "border-[#ccd4c8]"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {notes.isLoading ? (
          <p role="status" className="rounded-2xl border border-[#d4d9ce] p-8">
            Loading the journal…
          </p>
        ) : notes.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-300 bg-white p-8"
          >
            <p>Field notes are temporarily unavailable.</p>
            <button
              onClick={() => notes.refetch()}
              className="mt-4 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : notes.data?.data.length ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.data.data.map((n) => (
                <article
                  key={n.id}
                  className="overflow-hidden rounded-2xl border border-[#d4d9ce] bg-[#fafaf6]"
                >
                  {n.imageUrl ? (
                    <img
                      src={n.imageUrl}
                      alt={n.imageAlt ?? n.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-[#e5eadd]">
                      <FlaskConical className="h-12 w-12 text-[#839779]" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-wider text-[#607564]">
                      {n.topic} ·{" "}
                      {new Date(n.publishedAt).toLocaleDateString("en-GB", {
                        timeZone: "Africa/Blantyre",
                      })}
                    </p>
                    <h3 className="mt-4 text-xl font-semibold leading-tight">
                      <Link href={`/journey/${n.slug}`}>{n.title}</Link>
                    </h3>
                    <p className="mb-6 mt-3 text-sm leading-relaxed text-slate-500">
                      {n.summary}
                    </p>
                    <Link
                      href={`/journey/${n.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#274c3d]"
                    >
                      Read the note
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex gap-4">
              <button
                disabled={!offset}
                onClick={() => setOffset((n) => Math.max(0, n - 9))}
                className="rounded-full border border-[#b6c1b6] px-5 py-2 text-sm disabled:opacity-35"
              >
                Previous
              </button>
              <button
                disabled={!notes.data.hasMore}
                onClick={() => setOffset((n) => n + 9)}
                className="rounded-full border border-[#b6c1b6] px-5 py-2 text-sm disabled:opacity-35"
              >
                Next notes
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b7c5b2] bg-[#eaeee4] p-8 sm:p-12">
            <p className="text-xs uppercase tracking-widest text-[#607564]">
              A considered beginning
            </p>
            <h3 className="mt-3 text-2xl font-semibold">
              Field notes are being prepared.
            </h3>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
              Practical videos and written notes will appear here after review.
              You can already inspect the systems, architecture and evidence in
              my project case studies.
            </p>
            <Link
              href="/portfolio"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#274c3d]"
            >
              Explore the current case studies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
      <section className="bg-[#19372f] px-5 py-16 text-[#f4f2eb] sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[.2em] text-[#c3bf98]">
            From personal practice to institutional delivery
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            One engineering journey.
            <br />
            Distinct responsibilities.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Link
              href="/portfolio/aothothe-enterprise-os-commercial-foundation"
              className="rounded-2xl border border-white/20 p-7 hover:bg-white/5"
            >
              <span className="text-xs uppercase tracking-widest text-[#cfb768]">
                Aöthothe Technologies
              </span>
              <h3 className="mt-4 text-2xl font-semibold">
                Engineering for dependable operations.
              </h3>
              <p className="mb-6 mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                Explore the commercial, governance and delivery systems being
                built around accountable work and measurable evidence.
              </p>
              <span className="inline-flex items-center gap-2 text-sm">
                Read the operating-system case
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/portfolio/sudern-institutional-operations"
              className="rounded-2xl border border-white/20 p-7 hover:bg-white/5"
            >
              <span className="text-xs uppercase tracking-widest text-[#b5c8aa]">
                SUDERN
              </span>
              <h3 className="mt-4 text-2xl font-semibold">
                Institutional systems with clear boundaries.
              </h3>
              <p className="mb-6 mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                Review the nonprofit operations project, its engineering scope
                and its documented release status. Software work and programme
                outcomes remain distinct.
              </p>
              <span className="inline-flex items-center gap-2 text-sm">
                Review the project evidence
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
