import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  History,
  Layers3,
  ListChecks,
  Loader2,
  Network,
  Plus,
  Presentation,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  contexts,
  recordKinds,
  type EngineeringContext,
  type EngineeringRecord,
  type RecordKind,
  type Publication,
} from "@shared/engineering";
import {
  RecordEditor,
  kindLabels,
  fieldsByKind,
} from "@/components/engineering/RecordEditor";
import { PublishNote } from "@/components/engineering/PublishNote";
import { PresentationStage } from "@/components/engineering/PresentationStage";

type Brief = {
  context: string;
  workDate: string;
  complete: boolean;
  method: string;
  topActions: {
    id: string;
    title: string;
    priority: number;
    reason: string;
    score: number;
  }[];
  metrics: {
    openTasks: number;
    blocked: number;
    highRisks: number;
    loggedMinutes: number;
    untriagedEvents: number;
    assets: number;
  };
  recent: Pick<
    EngineeringRecord,
    "id" | "title" | "kind" | "status" | "workDate"
  >[];
  dailyEffort: { date: string; minutes: number }[];
};
type Connection = {
  name: string;
  context: string;
  url: string;
  access: string;
  integration: string;
  verifiedAt: string;
};
type OwnedPublication = Publication & {
  recordId: string;
  recordVersion: number;
  currentVersion: number;
};
const icons: Record<RecordKind, typeof BookOpen> = {
  diary: BookOpen,
  task: ListChecks,
  work_log: Clock3,
  risk: TriangleAlert,
  decision: Target,
  meeting: CalendarDays,
  presentation: Presentation,
  content: FileText,
  ai_review: Sparkles,
  asset: Network,
  security_event: ShieldAlert,
  practice: Wrench,
};
const descriptions: Record<RecordKind, string> = {
  diary:
    "Record the question, investigation, result and lesson. A private engineering notebook with a deliberate public-review path.",
  task: "Name the owner, prerequisites and acceptance criteria. Close work with a recorded result.",
  work_log:
    "Account for your time and concrete outputs. This is the operations ledger; financial balances stay in Treasury & ROIC.",
  risk: "Assess likelihood and impact, name the response trigger and keep mitigation under review.",
  decision:
    "Compare real options, record your reasoning and return to the result on a review date.",
  meeting:
    "Prepare the agenda, record decisions and link follow-up tasks. Calendar export does not send invitations.",
  presentation:
    "Organize the message, audience, outline and run of show. Rehearse with keyboard controls and optional speaker notes.",
  content:
    "Prepare practical teaching for the website and social platforms. Public notes are reviewed snapshots, with privacy-aware media loading.",
  ai_review:
    "Track the purpose, model, reported cost and human verification of AI-assisted work. No model provider is connected here.",
  asset:
    "Register assets you own or may monitor, their operational criticality and recovery plan. No collector or firewall control is connected.",
  security_event:
    "Record observed facts and triage decisions against an authorized asset. An unfamiliar connection is a finding to investigate, not automatic proof of attack.",
  practice:
    "Build skill through deliberate exercises, documented mistakes and repeatable lessons. Confidence is your self-assessment, not certification.",
};
const sectionClass = "rounded-2xl border border-[#dce1d8] bg-white p-5 sm:p-6";
async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!r.ok) {
    const d = await r.json().catch(() => null);
    throw new Error(d?.message ?? "Workspace data could not be loaded");
  }
  return r.json();
}
function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function calendarFile(entry: EngineeringRecord) {
  const d = entry.details as {
    startsAt: string;
    endsAt: string;
    agenda: string;
  };
  const text = (s: string) =>
    s
      .replaceAll("\\", "\\\\")
      .replaceAll("\n", "\\n")
      .replaceAll(";", "\\;")
      .replaceAll(",", "\\,")
      .replace(/\r/g, "");
  const utc = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chrispine//Engineering workspace//EN",
    "BEGIN:VEVENT",
    `UID:${entry.id}@engineering-workspace`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(d.startsAt)}`,
    `DTEND:${utc(d.endsAt)}`,
    `SUMMARY:${text(entry.title)}`,
    `DESCRIPTION:${text(d.agenda)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${value === "done" ? "bg-emerald-50 text-emerald-800" : value === "blocked" ? "bg-red-50 text-red-800" : value === "review" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-600"}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export default function EngineeringWorkspace() {
  const { user } = useCustomAuth();
  const canManage = user?.permissions?.includes("engineering.manage") ?? false,
    canPublish = user?.permissions?.includes("engineering.publish") ?? false;
  const [context, setContext] = useState<EngineeringContext>("personal"),
    [view, setView] = useState<"overview" | "connections" | RecordKind>(
      "overview",
    ),
    [search, setSearch] = useState(""),
    [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<{
      kind: RecordKind;
      entry: EngineeringRecord | null;
    } | null>(null),
    [publishing, setPublishing] = useState<EngineeringRecord | null>(null),
    [presenting, setPresenting] = useState<EngineeringRecord | null>(null),
    [history, setHistory] = useState<EngineeringRecord | null>(null);
  const [withdraw, setWithdraw] = useState<OwnedPublication | null>(null),
    [withdrawReason, setWithdrawReason] = useState(""),
    [withdrawError, setWithdrawError] = useState(""),
    [withdrawing, setWithdrawing] = useState(false);
  const options = { staleTime: 0, gcTime: 0 };
  const brief = useQuery<Brief>({
    queryKey: ["engineering", "brief", context],
    queryFn: () => get(`/api/admin/engineering/brief?context=${context}`),
    ...options,
  });
  const list = useQuery<{
    data: EngineeringRecord[];
    hasMore: boolean;
    offset: number;
  }>({
    queryKey: ["engineering", "records", context, view, search, offset],
    queryFn: () =>
      get(
        `/api/admin/engineering/records?context=${context}&limit=40&offset=${offset}${view !== "overview" && view !== "connections" ? `&kind=${view}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`,
      ),
    enabled: view !== "overview" && view !== "connections",
    ...options,
  });
  const supporting = useQuery<{ data: EngineeringRecord[]; hasMore: boolean }>({
    queryKey: ["engineering", "supporting", context],
    queryFn: () =>
      get(`/api/admin/engineering/records?context=${context}&limit=100`),
    enabled: !!editor,
    ...options,
  });
  const connections = useQuery<{
    connections: Connection[];
    capabilities: Record<string, string>;
  }>({
    queryKey: ["engineering", "connections"],
    queryFn: () => get("/api/admin/engineering/connections"),
    ...options,
  });
  const versions = useQuery<
    { version: number; createdAt: string; snapshot: EngineeringRecord }[]
  >({
    queryKey: ["engineering", "history", history?.id],
    queryFn: () => get(`/api/admin/engineering/records/${history!.id}/history`),
    enabled: !!history,
    ...options,
  });
  const publications = useQuery<{ data: OwnedPublication[] }>({
    queryKey: ["engineering", "publications", context],
    queryFn: () =>
      get(`/api/admin/engineering/publications?context=${context}`),
    enabled: view === "content" || view === "diary",
    ...options,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["engineering"] });
  const navigate = (next: typeof view) => {
    setView(next);
    setOffset(0);
    setSearch("");
  };
  const open = (kind: RecordKind, entry: EngineeringRecord | null = null) =>
    setEditor({ kind, entry });
  const rows = list.data?.data ?? [],
    b = brief.data;
  const error =
    brief.error ??
    connections.error ??
    (view !== "overview" && view !== "connections" ? list.error : null);
  const exportRows = () =>
    download(
      `${context}-${view}-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(
        {
          context,
          scope: "Current visible page only",
          exportedAt: new Date().toISOString(),
          records: rows,
        },
        null,
        2,
      ),
      "application/json",
    );
  const withdrawNote = async () => {
    if (!withdraw) return;
    setWithdrawing(true);
    setWithdrawError("");
    try {
      await apiRequest(
        "POST",
        `/api/admin/engineering/publications/${withdraw.id}/withdraw`,
        {
          expectedVersion: withdraw.currentVersion,
          requestKey: crypto.randomUUID(),
          justification: withdrawReason,
        },
      );
      setWithdraw(null);
      setWithdrawReason("");
      refresh();
    } catch (e) {
      setWithdrawError((e as Error).message);
    } finally {
      setWithdrawing(false);
    }
  };
  return (
    <AdminShell
      title="Engineering workspace"
      description="A private operating record for learning, delivery and accountable decisions"
    >
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#f1f3ed] text-[#182c28]">
        <header className="border-b border-[#dce1d8] bg-[#f9faf5] p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#69826e]">
                Chrispine / Engineering & operating practice
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Give the work a clear direction.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                A question, an accountable action, a result and a lesson. Keep
                personal practice connected to delivery without blending
                organizational responsibilities.
              </p>
            </div>
            <Link
              href="/journey"
              className="inline-flex items-center gap-2 rounded-full border border-[#bdcbbc] bg-white px-4 py-2.5 text-xs font-semibold"
            >
              Public engineering journal
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div
              role="group"
              aria-label="Operating context"
              className="flex rounded-full border border-[#d2dbcf] bg-[#e9eee3] p-1"
            >
              {contexts.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setContext(c);
                    setOffset(0);
                    setSearch("");
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-colors ${context === c ? "bg-[#214738] text-white shadow-sm" : "text-[#64786a] hover:text-[#214738]"}`}
                >
                  {c === "personal"
                    ? "My practice"
                    : c === "aothothe"
                      ? "Aöthothe"
                      : "SUDERN"}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {b?.workDate ?? "Today"} · Africa/Blantyre · Private records
            </span>
          </div>
        </header>
        <div className="grid lg:grid-cols-[190px_minmax(0,1fr)]">
          <nav
            aria-label="Engineering workspace views"
            className="border-b border-[#dce1d8] bg-[#edf1e8] p-3 lg:border-b-0 lg:border-r"
          >
            <select
              aria-label="Workspace view"
              className="h-11 w-full rounded-xl border border-[#ccd7c7] bg-white px-3 text-sm lg:hidden"
              value={view}
              onChange={(e) => navigate(e.target.value as typeof view)}
            >
              <option value="overview">Daily direction</option>
              {recordKinds.map((k) => (
                <option key={k} value={k}>
                  {kindLabels[k]}
                </option>
              ))}
              <option value="connections">Workspace connections</option>
            </select>
            <div className="hidden space-y-1 lg:block">
              <button
                onClick={() => navigate("overview")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold ${view === "overview" ? "bg-white text-[#214738] shadow-sm" : "text-[#697f6d] hover:bg-white/60"}`}
              >
                <Layers3 className="h-4 w-4" />
                Daily direction
              </button>
              {recordKinds.map((k) => {
                const Icon = icons[k];
                return (
                  <button
                    key={k}
                    onClick={() => navigate(k)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-medium ${view === k ? "bg-white text-[#214738] shadow-sm" : "text-[#697f6d] hover:bg-white/60"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {kindLabels[k]}
                  </button>
                );
              })}
              <button
                onClick={() => navigate("connections")}
                className={`mt-4 flex w-full items-center gap-3 rounded-xl border-t border-[#ccd7c7] px-3 py-4 text-left text-xs font-medium ${view === "connections" ? "bg-white text-[#214738]" : "text-[#697f6d]"}`}
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Connections
              </button>
            </div>
          </nav>
          <div className="min-w-0 space-y-6 p-4 sm:p-6">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"
              >
                <strong>Workspace unavailable</strong>
                <p className="mt-2">{error.message}</p>
                <p className="mt-2 text-xs">
                  Saved records have not been replaced with sample data.
                </p>
                <button
                  className="mt-3 font-semibold underline"
                  onClick={() => refresh()}
                >
                  Retry
                </button>
              </div>
            )}
            {view === "overview" ? (
              <>
                <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                  <div className="rounded-2xl bg-[#213e35] p-6 text-white">
                    <p className="text-[10px] uppercase tracking-[.2em] text-[#c4c49e]">
                      The daily engineering loop
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold leading-tight">
                      Choose the question.
                      <br />
                      Finish with evidence.
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-[#bfd0c4]">
                      Start with one concrete objective. Record what you did,
                      what changed and what you will test next.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {canManage && (
                        <button
                          onClick={() => open("diary")}
                          className="inline-flex items-center gap-2 rounded-full bg-[#e8c975] px-4 py-2.5 text-xs font-semibold text-[#243e2f]"
                        >
                          <Plus className="h-4 w-4" />
                          Start today’s entry
                        </button>
                      )}
                      <button
                        onClick={() => navigate("work_log")}
                        className="rounded-full border border-white/25 px-4 py-2.5 text-xs"
                      >
                        Open work ledger
                      </button>
                    </div>
                  </div>
                  <div className={sectionClass}>
                    <p className="text-[10px] uppercase tracking-[.18em] text-slate-500">
                      Operating principles
                    </p>
                    <ul className="mt-5 space-y-4 text-sm leading-relaxed">
                      {[
                        "Ship a defined outcome before adding another feature.",
                        "Separate expected value from collected cash and measured results.",
                        "Make responsibility, evidence and the next decision visible.",
                        "Review your reasoning; record the mistake and improve the method.",
                      ].map((t) => (
                        <li key={t} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#76945e]" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "Open delivery tasks",
                      value: b?.metrics.openTasks,
                      icon: ListChecks,
                    },
                    {
                      label: "Minutes logged today",
                      value: b?.metrics.loggedMinutes,
                      icon: Clock3,
                    },
                    {
                      label: "High-priority risks",
                      value: b?.metrics.highRisks,
                      icon: TriangleAlert,
                    },
                    {
                      label: "Recorded blockers",
                      value: b?.metrics.blocked,
                      icon: ShieldAlert,
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-2xl border border-[#dce1d8] bg-white p-5"
                    >
                      <m.icon className="mb-4 h-4 w-4 text-[#7d926e]" />
                      <p className="text-3xl font-semibold tracking-tight">
                        {m.value === undefined ? "—" : m.value}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>
                <section className={sectionClass}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[.18em] text-slate-500">
                        Focus the next move
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">
                        Three priorities from your recorded work
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate("task")}
                      aria-label="Open delivery tasks"
                      className="rounded-full border border-[#cbd7c5] p-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {brief.isLoading ? (
                    <p role="status" className="mt-5 text-sm text-slate-500">
                      Reading your task queue…
                    </p>
                  ) : b?.topActions.length ? (
                    <ol className="mt-5 divide-y divide-[#e2e6de]">
                      {b.topActions.map((t, i) => (
                        <li key={t.id} className="flex items-start gap-4 py-5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2e9] font-mono text-xs text-[#648054]">
                            0{i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold">{t.title}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              {t.reason}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate("task")}
                            className="text-xs text-[#3d674b]"
                          >
                            Review
                          </button>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-[#cbd7c5] p-5">
                      <p className="text-sm text-slate-500">
                        No open task has been recorded in this context.
                      </p>
                      {canManage && (
                        <button
                          onClick={() => open("task")}
                          className="mt-3 text-sm font-semibold text-[#345e42]"
                        >
                          Define the first deliverable
                          <ArrowRight className="ml-2 inline h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    Priorities use your task priority, due dates and blocker
                    state. This is an explainable rule, not an AI forecast or a
                    return estimate.
                  </p>
                </section>
                <div className="grid gap-5 xl:grid-cols-2">
                  <section className={sectionClass}>
                    <h3 className="text-lg font-semibold">
                      Latest operating records
                    </h3>
                    <div className="mt-5 divide-y divide-[#e2e6de]">
                      {b?.recent.length ? (
                        b.recent.map((r) => (
                          <button
                            key={r.id}
                            className="flex w-full items-center gap-3 py-4 text-left"
                            onClick={() => navigate(r.kind)}
                          >
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#9bad83]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {r.title}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {kindLabels[r.kind]} · {r.workDate}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </button>
                        ))
                      ) : (
                        <p className="py-5 text-sm leading-relaxed text-slate-500">
                          Your actual diary entries, decisions and delivery
                          records will form this timeline.
                        </p>
                      )}
                    </div>
                  </section>
                  <section className={sectionClass}>
                    <h3 className="text-lg font-semibold">
                      Effort across recorded days
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Last seven recorded days · work-log minutes only
                    </p>
                    <div className="mt-6 space-y-4">
                      {b?.dailyEffort.length ? (
                        b.dailyEffort.map((r) => (
                          <div key={r.date}>
                            <div className="mb-2 flex justify-between text-xs">
                              <span>{r.date}</span>
                              <span>{r.minutes} min</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#edf1e7]">
                              <div
                                className="h-2 rounded-full bg-[#8ea76c]"
                                style={{
                                  width: `${(r.minutes / Math.max(...b.dailyEffort.map((x) => x.minutes))) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-500">
                          Log concrete work and time to see the pattern.
                          Unrecorded effort is not treated as zero performance.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
                <section className="rounded-2xl border border-[#d9ddc9] bg-[#e9eddf] p-6">
                  <div className="flex gap-4">
                    <Network className="mt-1 h-6 w-6 shrink-0 text-[#6d7f4d]" />
                    <div>
                      <h3 className="font-semibold">
                        Visibility starts with a known asset.
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Register your devices, applications and cloud services,
                        then record the source of each observation. No
                        collector, live traffic feed or network-blocking control
                        is connected to this workspace.
                      </p>
                      <button
                        onClick={() => navigate("asset")}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
                      >
                        Open asset register
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </section>
              </>
            ) : view === "connections" ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#69826e]">
                    The workspace map
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                    Connected by responsibility.
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-500">
                    These launch links preserve each application’s existing
                    access controls. They do not synchronize records, confer
                    organization authority or expose private data on the public
                    portfolio.
                  </p>
                </div>
                <div className="space-y-4">
                  {connections.data?.connections.map((c) => (
                    <a
                      key={c.name}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        sectionClass +
                        " flex items-start justify-between gap-5 transition-colors hover:border-[#9cae91]"
                      }
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#69826e]">
                          {c.context} · {c.access}
                        </p>
                        <h4 className="mt-3 text-xl font-semibold">{c.name}</h4>
                        <p className="mt-3 text-sm leading-relaxed text-slate-500">
                          {c.integration}
                        </p>
                        <p className="mt-3 text-[10px] text-slate-400">
                          Link/access metadata reviewed {c.verifiedAt}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-2 h-5 w-5 shrink-0" />
                    </a>
                  ))}
                </div>
                <section className={sectionClass}>
                  <h4 className="text-lg font-semibold">Integration state</h4>
                  <dl className="mt-4 divide-y divide-[#e2e6de]">
                    {Object.entries(connections.data?.capabilities ?? {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between gap-4 py-3 text-sm"
                        >
                          <dt className="capitalize text-slate-500">
                            {key.replace(/([A-Z])/g, " $1")}
                          </dt>
                          <dd className="font-medium text-amber-800">
                            {value}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </section>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/admin/communications"
                    className={sectionClass + " text-sm font-semibold"}
                  >
                    Communications workspace
                    <ArrowUpRight className="float-right h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin/treasury"
                    className={sectionClass + " text-sm font-semibold"}
                  >
                    Treasury & financial records
                    <ArrowUpRight className="float-right h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-[10px] uppercase tracking-[.2em] text-[#69826e]">
                      {context} / Operating record
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                      {kindLabels[view]}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">
                      {descriptions[view]}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => open(view)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#214738] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#315e46]"
                    >
                      <Plus className="h-4 w-4" />
                      New record
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Input
                    aria-label="Search operating records"
                    placeholder="Search the title or summary…"
                    className="max-w-sm rounded-xl border-[#cbd7c5] bg-white text-slate-950 placeholder:text-slate-400"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setOffset(0);
                    }}
                  />
                  <button
                    disabled={!rows.length}
                    onClick={exportRows}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#cbd7c5] bg-white px-4 text-xs disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    Export current page
                  </button>
                </div>
                {list.isLoading ? (
                  <div
                    role="status"
                    className={
                      sectionClass +
                      " flex items-center gap-3 text-sm text-slate-500"
                    }
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading your records…
                  </div>
                ) : rows.length ? (
                  <div className="space-y-4">
                    {rows.map((r) => {
                      const d = r.details as Record<string, unknown>;
                      return (
                        <article key={r.id} className={sectionClass}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                {r.workDate} · {r.accountable} · Revision{" "}
                                {r.version}
                              </p>
                              <h4 className="mt-3 text-xl font-semibold leading-snug">
                                {r.title}
                              </h4>
                            </div>
                            <Status value={r.status} />
                          </div>
                          {r.summary && (
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
                              {r.summary}
                            </p>
                          )}
                          {r.kind === "work_log" && (
                            <div className="mt-4 rounded-xl bg-[#edf2e8] p-4 text-sm">
                              <strong>{String(d.minutes)} minutes</strong>
                              <span className="ml-3 text-slate-500">
                                {String(d.category)}
                              </span>
                              <p className="mt-2 leading-relaxed">
                                {String(d.result)}
                              </p>
                            </div>
                          )}
                          {r.kind === "risk" && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                              <span
                                className={`rounded-full px-3 py-1.5 ${Number(d.likelihood) * Number(d.impact) >= 12 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}
                              >
                                Risk score{" "}
                                {Number(d.likelihood) * Number(d.impact)} / 25
                              </span>
                              <span className="text-slate-500">
                                Review {String(d.reviewDate)}
                              </span>
                              <p className="w-full leading-relaxed text-slate-600">
                                {String(d.mitigation)}
                              </p>
                            </div>
                          )}
                          {r.kind === "asset" && (
                            <div className="mt-4 flex flex-wrap gap-3 text-xs">
                              <Status value={String(d.monitoring)} />
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                {String(d.layer)} · {String(d.criticality)}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 ${d.authorized ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
                              >
                                {d.authorized
                                  ? "Authorization recorded"
                                  : "Authorization not recorded"}
                              </span>
                            </div>
                          )}
                          {r.kind === "security_event" && (
                            <p className="mt-4 text-sm text-slate-600">
                              {String(d.severity)} · {String(d.disposition)} ·{" "}
                              {String(d.finding)}
                            </p>
                          )}
                          {r.kind === "ai_review" && (
                            <p className="mt-4 text-xs text-slate-500">
                              {String(d.provider) || "Provider not recorded"} ·{" "}
                              {String(d.verdict)} ·{" "}
                              {d.reportedCostMwk === null
                                ? "Cost unknown"
                                : `Reported MWK ${Number(d.reportedCostMwk).toLocaleString()}`}
                            </p>
                          )}
                          <div className="mt-5 flex flex-wrap gap-3 border-t border-[#e2e6de] pt-4">
                            {canManage && (
                              <button
                                onClick={() => open(r.kind, r)}
                                className="rounded-full border border-[#cbd7c5] px-4 py-2 text-xs font-semibold"
                              >
                                Open / revise
                              </button>
                            )}
                            <button
                              onClick={() => setHistory(r)}
                              className="inline-flex items-center gap-2 px-2 py-2 text-xs text-slate-500"
                            >
                              <History className="h-3.5 w-3.5" />
                              History
                            </button>
                            {canPublish &&
                              ["diary", "content", "practice"].includes(
                                r.kind,
                              ) &&
                              ["review", "done"].includes(r.status) && (
                                <button
                                  onClick={() => setPublishing(r)}
                                  className="rounded-full bg-[#e8eddf] px-4 py-2 text-xs font-semibold text-[#3f6137]"
                                >
                                  Review public copy
                                </button>
                              )}
                            {r.kind === "meeting" && (
                              <button
                                onClick={() =>
                                  download(
                                    `meeting-${r.id}.ics`,
                                    calendarFile(r),
                                    "text/calendar",
                                  )
                                }
                                className="inline-flex items-center gap-2 px-2 text-xs text-slate-500"
                              >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Export calendar file
                              </button>
                            )}
                            {r.kind === "presentation" && (
                              <button
                                onClick={() => setPresenting(r)}
                                className="inline-flex items-center gap-2 rounded-full bg-[#e8eddf] px-4 py-2 text-xs font-semibold"
                              >
                                <Presentation className="h-3.5 w-3.5" />
                                Rehearse
                              </button>
                            )}
                            {r.evidence.length > 0 && (
                              <span className="ml-auto self-center text-[10px] text-slate-400">
                                {r.evidence.length} evidence link
                                {r.evidence.length === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : !list.isError ? (
                  <div className="rounded-2xl border border-dashed border-[#bcccb4] bg-[#e9eee2] p-8">
                    <h4 className="text-xl font-semibold">
                      Begin with one real record.
                    </h4>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                      Nothing has been recorded in this view yet. Start with the
                      actual objective, owner and evidence you have today.
                    </p>
                    {canManage && (
                      <button
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#345e42]"
                        onClick={() => open(view)}
                      >
                        Create the first record
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span>{rows.length} records on this page</span>
                  <div className="flex gap-3">
                    <button
                      className="rounded-full border border-[#cbd7c5] px-4 py-2 disabled:opacity-30"
                      disabled={!offset}
                      onClick={() => setOffset((v) => Math.max(0, v - 40))}
                    >
                      Previous
                    </button>
                    <button
                      className="rounded-full border border-[#cbd7c5] px-4 py-2 disabled:opacity-30"
                      disabled={!list.data?.hasMore}
                      onClick={() => setOffset((v) => v + 40)}
                    >
                      Next
                    </button>
                  </div>
                </div>
                {(view === "content" || view === "diary") && (
                  <section className={sectionClass}>
                    <h4 className="text-lg font-semibold">
                      Published journal snapshots
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Public snapshots remain fixed when you revise the private
                      record. Withdraw a snapshot when disclosure or evidence
                      changes.
                    </p>
                    {publications.data?.data.length ? (
                      <div className="mt-4 divide-y divide-[#e2e6de]">
                        {publications.data.data.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-start justify-between gap-5 py-4"
                          >
                            <div>
                              <Link
                                className="text-sm font-semibold text-[#345e42]"
                                href={`/journey/${n.slug}`}
                              >
                                {n.title}
                                <ArrowUpRight className="ml-1 inline h-3 w-3" />
                              </Link>
                              <p className="mt-2 text-[10px] text-slate-400">
                                Published revision {n.recordVersion}
                              </p>
                            </div>
                            {canPublish && (
                              <button
                                onClick={() => {
                                  setWithdraw(n);
                                  setWithdrawReason("");
                                  setWithdrawError("");
                                }}
                                className="text-xs text-red-700"
                              >
                                Withdraw
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-slate-500">
                        No public note in this context.
                      </p>
                    )}
                    {publications.error && (
                      <p className="mt-4 text-sm text-red-700">
                        {publications.error.message}
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {editor && (
        <RecordEditor
          key={editor.entry?.id ?? `new-${editor.kind}`}
          context={context}
          kind={editor.kind}
          entry={editor.entry}
          records={supporting.data?.data ?? rows}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
      {publishing && (
        <PublishNote
          entry={publishing}
          onClose={() => setPublishing(null)}
          onPublished={refresh}
        />
      )}
      {presenting && (
        <PresentationStage
          entry={presenting}
          onClose={() => setPresenting(null)}
        />
      )}
      <Sheet
        open={!!history}
        onOpenChange={(open) => {
          if (!open) setHistory(null);
        }}
      >
        <SheetContent className="overflow-y-auto border-slate-200 bg-[#f7f7f2] text-slate-950 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>History — {history?.title}</SheetTitle>
          </SheetHeader>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Immutable private revisions. No current record is overwritten when
            you inspect the past.
          </p>
          <div className="mt-6 space-y-4">
            {versions.data?.map((v) => (
              <div key={v.version} className={sectionClass}>
                <p className="text-xs font-semibold text-[#3f6137]">
                  Revision {v.version} ·{" "}
                  {new Date(v.createdAt).toLocaleString("en-GB", {
                    timeZone: "Africa/Blantyre",
                  })}
                </p>
                <h3 className="mt-3 font-semibold">{v.snapshot.title}</h3>
                <p className="my-3 text-xs text-slate-500">
                  {v.snapshot.workDate} · {v.snapshot.status}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {v.snapshot.summary}
                </p>
                <details className="mt-4 border-t border-[#e2e6de] pt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-[#345e42]">
                    Inspect recorded fields
                  </summary>
                  <dl className="mt-4 space-y-4">
                    {Object.entries(v.snapshot.details).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {fieldsByKind[v.snapshot.kind].find(
                            (f) => f.key === key,
                          )?.label ?? key}
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                          {value === null
                            ? "Not recorded"
                            : typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : Array.isArray(value)
                                ? value.join("\n")
                                : String(value) || "Not recorded"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </div>
            ))}
            {versions.error && (
              <p role="alert" className="text-sm text-red-700">
                {versions.error.message}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet
        open={!!withdraw}
        onOpenChange={(open) => {
          if (!open && !withdrawing) setWithdraw(null);
        }}
      >
        <SheetContent className="border-slate-200 bg-[#f7f7f2] text-slate-950">
          <SheetHeader>
            <SheetTitle>Withdraw public note</SheetTitle>
          </SheetHeader>
          <p className="mt-5 text-sm leading-relaxed text-slate-500">
            The public note will stop being served. Its private history and
            withdrawal record remain auditable.
          </p>
          <label className="mt-6 block space-y-2 text-sm">
            Reason
            <Input
              className="border-slate-300 bg-white text-slate-950"
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
            />
          </label>
          {withdrawError && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {withdrawError}
            </p>
          )}
          <Button
            className="mt-6 bg-red-800 text-white"
            disabled={withdrawing || withdrawReason.trim().length < 8}
            onClick={withdrawNote}
          >
            {withdrawing ? "Withdrawing…" : "Withdraw snapshot"}
          </Button>
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
