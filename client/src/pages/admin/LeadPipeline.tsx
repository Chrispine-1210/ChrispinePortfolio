import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Mail,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";

const stages = ["new", "reviewing", "qualified", "discovery", "proposal", "negotiation", "won", "lost"] as const;
type Stage = typeof stages[number];
type CohortWindow = "30d" | "90d" | "365d" | "all";

interface LeadRecord {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  serviceInterest: string | null;
  priority: string;
  qualificationScore: number;
  stage: Stage;
  estimatedValue: string | null;
  currency: string;
  probability: number;
  nextAction: string | null;
  followUpAt: string | null;
  message: string | null;
  lostReason: string | null;
  updatedAt: string;
}
interface ActivityRecord { id: string; type: string; body: string | null; createdAt: string }
interface FunnelRow {
  key: string;
  enquiries: number;
  qualified: number;
  proposals: number;
  won: number;
  lost: number;
  qualificationRate: number;
  proposalRate: number;
  proposalWinRate: number;
  closeRate: number;
}
interface CurrencyTotals {
  currency: string;
  openValue: number;
  weightedOpenValue: number;
  wonValue: number;
  lostValue: number;
}
interface FunnelResponse {
  window: CohortWindow;
  cohortStart: string | null;
  overall: FunnelRow;
  byService: FunnelRow[];
  bySource: FunnelRow[];
  financialByCurrency: CurrencyTotals[];
}
interface IntelligenceRow extends FunnelRow {
  wonRevenueByCurrency: Array<{
    currency: string;
    revenue: number;
    averageWonValue: number;
  }>;
}
interface AcquisitionIntelligence {
  window: CohortWindow;
  attributionCoverage: {
    leads: number;
    firstTouchCaptured: number;
    lastTouchCaptured: number;
    firstTouchRate: number;
    lastTouchRate: number;
  };
  byLastTouchChannel: IntelligenceRow[];
  byService: IntelligenceRow[];
  velocityDays: {
    enquiryToQualified: number | null;
    enquiryToProposal: number | null;
    enquiryToWon: number | null;
    samples: { qualified: number; proposal: number; won: number };
  };
  lossReasons: Array<{
    reason: string;
    count: number;
    valueByCurrency: Array<{ currency: string; value: number }>;
  }>;
  spendEconomics: {
    status: "not_configured";
    cac: null;
    paybackDays: null;
    note: string;
  };
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

function pct(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export default function LeadPipeline() {
  const [search, setSearch] = useState("");
  const [cohortWindow, setCohortWindow] = useState<CohortWindow>("90d");
  const [selected, setSelected] = useState<LeadRecord | null>(null);
  const [draft, setDraft] = useState({
    stage: "new" as Stage,
    priority: "normal",
    qualificationScore: 0,
    estimatedValue: "",
    currency: "MWK",
    probability: 10,
    nextAction: "",
    followUpAt: "",
    lostReason: "",
  });
  const [note, setNote] = useState("");

  const leadsEndpoint = `/api/admin/leads?search=${encodeURIComponent(search)}`;
  const funnelEndpoint = `/api/admin/pipeline/funnel?window=${cohortWindow}`;
  const intelligenceEndpoint = `/api/admin/acquisition/intelligence?window=${cohortWindow}`;
  const leads = useQuery<LeadRecord[]>({ queryKey: [leadsEndpoint] });
  const funnel = useQuery<FunnelResponse>({ queryKey: [funnelEndpoint] });
  const intelligence = useQuery<AcquisitionIntelligence>({ queryKey: [intelligenceEndpoint] });
  const activities = useQuery<ActivityRecord[]>({
    queryKey: [`/api/admin/leads/${selected?.id ?? "none"}/activities`],
    enabled: Boolean(selected),
  });

  useEffect(() => {
    if (!selected) return;
    setDraft({
      stage: selected.stage,
      priority: selected.priority,
      qualificationScore: selected.qualificationScore,
      estimatedValue: selected.estimatedValue ?? "",
      currency: selected.currency,
      probability: selected.probability,
      nextAction: selected.nextAction ?? "",
      followUpAt: selected.followUpAt ? new Date(selected.followUpAt).toISOString().slice(0, 16) : "",
      lostReason: selected.lostReason ?? "",
    });
  }, [selected]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [leadsEndpoint] });
    queryClient.invalidateQueries({ queryKey: [funnelEndpoint] });
    queryClient.invalidateQueries({ queryKey: [intelligenceEndpoint] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/pipeline/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
  };

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/admin/leads/${id}`, payload),
    onSuccess: async (response) => {
      const record = await response.json() as LeadRecord;
      setSelected(record);
      refresh();
      queryClient.invalidateQueries({ queryKey: [`/api/admin/leads/${record.id}/activities`] });
    },
  });

  const addNote = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/admin/leads/${selected!.id}/activities`, { type: "note", body: note }),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: [`/api/admin/leads/${selected!.id}/activities`] });
    },
  });

  const overall = funnel.data?.overall;
  const cohortLabel = funnel.data?.cohortStart
    ? `Leads created since ${new Date(funnel.data.cohortStart).toLocaleDateString()}`
    : "All recorded leads";

  return (
    <AdminShell
      title="Acquisition & opportunity pipeline"
      description="Measure service demand, funnel conversion, commercial value and follow-up from enquiry through won/lost"
    >
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Acquisition cohort</p>
            <p className="mt-1 text-xs text-white/30">{cohortLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["30d", "90d", "365d", "all"] as CohortWindow[]).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={cohortWindow === item ? "default" : "outline"}
                onClick={() => setCohortWindow(item)}
              >
                {item === "all" ? "All time" : item}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="flex items-center gap-4 p-5">
              <Target className="h-6 w-6 text-primary" />
              <div>
                <p className="text-2xl font-black">{overall?.enquiries ?? 0}</p>
                <p className="text-xs text-white/35">Enquiries</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="flex items-center gap-4 p-5">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-2xl font-black">{pct(overall?.qualificationRate ?? 0)}</p>
                <p className="text-xs text-white/35">Enquiry → qualified</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="flex items-center gap-4 p-5">
              <BarChart3 className="h-6 w-6 text-violet-400" />
              <div>
                <p className="text-2xl font-black">{overall?.proposals ?? 0}</p>
                <p className="text-xs text-white/35">Reached proposal</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="flex items-center gap-4 p-5">
              <CircleDollarSign className="h-6 w-6 text-amber-400" />
              <div>
                <p className="text-2xl font-black">{overall?.won ?? 0} / {overall?.lost ?? 0}</p>
                <p className="text-xs text-white/35">Won / lost · close {pct(overall?.closeRate ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {Boolean(funnel.data?.financialByCurrency.length) && (
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Commercial value by currency</h2>
              <p className="mt-1 text-xs text-white/30">Currencies remain separated; no blended revenue total is presented.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {funnel.data?.financialByCurrency.map((row) => (
                <Card key={row.currency} className="border-white/[0.07] bg-white/[0.025]">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-black">{row.currency}</p>
                      <Badge variant="outline">{money(row.openValue, row.currency)} open</Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-xs">
                      <div><dt className="text-white/30">Weighted open</dt><dd className="mt-1 font-semibold">{money(row.weightedOpenValue, row.currency)}</dd></div>
                      <div><dt className="text-white/30">Won value</dt><dd className="mt-1 font-semibold text-emerald-400">{money(row.wonValue, row.currency)}</dd></div>
                      <div><dt className="text-white/30">Lost value</dt><dd className="mt-1 font-semibold text-red-300">{money(row.lostValue, row.currency)}</dd></div>
                      <div><dt className="text-white/30">Open face value</dt><dd className="mt-1 font-semibold">{money(row.openValue, row.currency)}</dd></div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-0">
              <div className="border-b border-white/[0.07] p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider">Last-touch channel economics</h2>
                <p className="mt-1 text-xs text-white/30">
                  Conversion and closed revenue by the final attributable marketing touch before enquiry.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-white/35">
                    <tr>
                      <th className="px-5 py-3">Channel</th>
                      <th className="px-3 py-3">Enquiries</th>
                      <th className="px-3 py-3">Qualified</th>
                      <th className="px-3 py-3">Proposal</th>
                      <th className="px-3 py-3">Won</th>
                      <th className="px-3 py-3">P→W</th>
                      <th className="px-3 py-3">Won revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.data?.byLastTouchChannel.map((row) => (
                      <tr key={row.key} className="border-b border-white/[0.05] last:border-0">
                        <td className="px-5 py-3 font-medium">{row.key.replace(/_/g, " ")}</td>
                        <td className="px-3 py-3">{row.enquiries}</td>
                        <td className="px-3 py-3">{row.qualified}</td>
                        <td className="px-3 py-3">{row.proposals}</td>
                        <td className="px-3 py-3 text-emerald-400">{row.won}</td>
                        <td className="px-3 py-3">{pct(row.proposalWinRate)}</td>
                        <td className="px-3 py-3">
                          {row.wonRevenueByCurrency.length
                            ? row.wonRevenueByCurrency.map((item) => money(item.revenue, item.currency)).join(" · ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    {!intelligence.data?.byLastTouchChannel.length && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-white/25">No attributed conversions in this cohort.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-white/[0.07] bg-white/[0.018]">
              <CardContent className="p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider">Funnel velocity</h2>
                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between gap-4"><dt className="text-white/35">Enquiry → qualified</dt><dd className="font-semibold">{intelligence.data?.velocityDays.enquiryToQualified ?? "—"} days</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/35">Enquiry → proposal</dt><dd className="font-semibold">{intelligence.data?.velocityDays.enquiryToProposal ?? "—"} days</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/35">Enquiry → won</dt><dd className="font-semibold">{intelligence.data?.velocityDays.enquiryToWon ?? "—"} days</dd></div>
                </dl>
              </CardContent>
            </Card>
            <Card className="border-white/[0.07] bg-white/[0.018]">
              <CardContent className="p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider">Attribution coverage</h2>
                <p className="mt-3 text-3xl font-black">{pct(intelligence.data?.attributionCoverage.lastTouchRate ?? 0)}</p>
                <p className="mt-1 text-xs text-white/35">leads with last-touch evidence</p>
                <p className="mt-4 text-[10px] leading-5 text-white/30">
                  CAC/payback remains disabled until campaign spend is ingested. No spend assumption is being fabricated.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-0">
              <div className="border-b border-white/[0.07] p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider">Revenue by service</h2>
                <p className="mt-1 text-xs text-white/30">Closed-won value stays currency-separated.</p>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {intelligence.data?.byService.map((row) => (
                  <div key={row.key} className="grid gap-3 p-4 sm:grid-cols-[1.4fr_.7fr_.7fr] sm:items-center">
                    <div>
                      <p className="text-xs font-semibold">{row.key.replace(/-/g, " ")}</p>
                      <p className="mt-1 text-[10px] text-white/30">
                        {row.enquiries} enquiries · {row.proposals} proposals · {row.won} won
                      </p>
                    </div>
                    <div className="text-xs">
                      <span className="text-white/30">P→W </span>{pct(row.proposalWinRate)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-400">
                      {row.wonRevenueByCurrency.length
                        ? row.wonRevenueByCurrency.map((item) => money(item.revenue, item.currency)).join(" · ")
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider">Loss reasons</h2>
              <div className="mt-4 space-y-3">
                {intelligence.data?.lossReasons.slice(0, 8).map((row) => (
                  <div key={row.reason} className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <div className="flex justify-between gap-3">
                      <p className="text-xs font-medium">{row.reason}</p>
                      <Badge variant="outline">{row.count}</Badge>
                    </div>
                    {row.valueByCurrency.length > 0 && (
                      <p className="mt-2 text-[10px] text-white/35">
                        {row.valueByCurrency.map((item) => money(item.value, item.currency)).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
                {!intelligence.data?.lossReasons.length && <p className="text-xs text-white/25">No recorded losses in this cohort.</p>}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-0">
              <div className="border-b border-white/[0.07] p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider">Conversion by service interest</h2>
                <p className="mt-1 text-xs text-white/30">Where demand enters and how far each service progresses.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-white/35">
                    <tr>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-3 py-3">Enquiries</th>
                      <th className="px-3 py-3">Qualified</th>
                      <th className="px-3 py-3">Proposal</th>
                      <th className="px-3 py-3">Won</th>
                      <th className="px-3 py-3">Lost</th>
                      <th className="px-3 py-3">E→Q</th>
                      <th className="px-3 py-3">Q→P</th>
                      <th className="px-3 py-3">P→W</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.data?.byService.map((row) => (
                      <tr key={row.key} className="border-b border-white/[0.05] last:border-0">
                        <td className="px-5 py-3 font-medium">{row.key.replace(/-/g, " ")}</td>
                        <td className="px-3 py-3">{row.enquiries}</td>
                        <td className="px-3 py-3">{row.qualified}</td>
                        <td className="px-3 py-3">{row.proposals}</td>
                        <td className="px-3 py-3 text-emerald-400">{row.won}</td>
                        <td className="px-3 py-3 text-red-300">{row.lost}</td>
                        <td className="px-3 py-3">{pct(row.qualificationRate)}</td>
                        <td className="px-3 py-3">{pct(row.proposalRate)}</td>
                        <td className="px-3 py-3">{pct(row.proposalWinRate)}</td>
                      </tr>
                    ))}
                    {!funnel.data?.byService.length && (
                      <tr><td colSpan={9} className="px-5 py-8 text-center text-white/25">No acquisition data in this cohort.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider">Acquisition sources</h2>
              <p className="mt-1 text-xs text-white/30">Current captured source attribution.</p>
              <div className="mt-4 space-y-3">
                {funnel.data?.bySource.map((row) => (
                  <div key={row.key} className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-semibold">{row.key.replace(/_/g, " ")}</p>
                      <Badge variant="outline">{row.enquiries}</Badge>
                    </div>
                    <p className="mt-2 text-[10px] text-white/35">
                      Qualified {pct(row.qualificationRate)} · Proposal {pct(row.proposalRate)} · Close {pct(row.closeRate)}
                    </p>
                  </div>
                ))}
                {!funnel.data?.bySource.length && <p className="text-xs text-white/25">No source data yet.</p>}
              </div>
            </CardContent>
          </Card>
        </section>

        <form className="relative" onSubmit={(event) => event.preventDefault()}>
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/25" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search lead, company, or service"
          />
        </form>

        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1900px] grid-cols-8 gap-3">
            {stages.map((stage) => {
              const stageLeads = leads.data?.filter((lead) => lead.stage === stage) ?? [];
              return (
                <section key={stage} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">{stage}</h2>
                    <Badge variant="outline">{stageLeads.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelected(lead)}
                        className="w-full rounded-lg border border-white/[0.07] bg-[#0d101a] p-3 text-left transition hover:border-primary/30 hover:bg-primary/[0.03]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-semibold">{lead.name}</p>
                          <span className={`mt-1 h-2 w-2 rounded-full ${lead.priority === "urgent" ? "bg-red-400" : lead.priority === "high" ? "bg-amber-400" : "bg-white/15"}`} />
                        </div>
                        <p className="mt-1 truncate text-[10px] text-white/30">{lead.organization || lead.serviceInterest || lead.email}</p>
                        {lead.estimatedValue && (
                          <p className="mt-3 text-xs font-bold text-emerald-400">
                            {money(Number(lead.estimatedValue), lead.currency)}
                            <span className="font-normal text-white/25"> · {lead.probability}%</span>
                          </p>
                        )}
                        {lead.followUpAt && (
                          <p className="mt-2 flex items-center gap-1 text-[9px] text-white/30">
                            <CalendarClock className="h-3 w-3" />
                            {new Date(lead.followUpAt).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    ))}
                    {!stageLeads.length && <div className="rounded-lg border border-dashed border-white/[0.06] py-8 text-center text-[10px] text-white/20">Empty</div>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
          <SheetContent className="w-full overflow-y-auto border-white/[0.07] bg-[#0b0e18] sm:max-w-xl">
            <SheetHeader><SheetTitle>{selected?.name}</SheetTitle></SheetHeader>
            {selected && (
              <div className="mt-6 space-y-6">
                <div>
                  <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-2 text-sm text-primary">
                    <Mail className="h-4 w-4" />{selected.email}
                  </a>
                  <p className="mt-3 text-sm leading-6 text-white/50">{selected.message}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-white/40">
                    Stage
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white"
                      value={draft.stage}
                      onChange={(event) => setDraft({ ...draft, stage: event.target.value as Stage })}
                    >
                      {stages.map((stage) => <option key={stage}>{stage}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs text-white/40">
                    Priority
                    <select
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white"
                      value={draft.priority}
                      onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
                    >
                      {["low", "normal", "high", "urgent"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs text-white/40">
                    Estimated value
                    <Input type="number" min="0" value={draft.estimatedValue} onChange={(event) => setDraft({ ...draft, estimatedValue: event.target.value })} />
                  </label>
                  <label className="space-y-1 text-xs text-white/40">
                    Currency
                    <Input maxLength={3} value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value.toUpperCase() })} />
                  </label>
                  <label className="space-y-1 text-xs text-white/40">
                    Probability %
                    <Input type="number" min="0" max="100" value={draft.probability} onChange={(event) => setDraft({ ...draft, probability: Number(event.target.value) })} />
                  </label>
                  <label className="space-y-1 text-xs text-white/40">
                    Qualification score
                    <Input type="number" min="0" max="100" value={draft.qualificationScore} onChange={(event) => setDraft({ ...draft, qualificationScore: Number(event.target.value) })} />
                  </label>
                  <label className="space-y-1 text-xs text-white/40">
                    Follow-up
                    <Input type="datetime-local" value={draft.followUpAt} onChange={(event) => setDraft({ ...draft, followUpAt: event.target.value })} />
                  </label>
                </div>
                <label className="space-y-1 text-xs text-white/40">
                  Next action
                  <Textarea value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} />
                </label>
                {draft.stage === "lost" && (
                  <label className="space-y-1 text-xs text-white/40">
                    Lost reason
                    <Textarea value={draft.lostReason} onChange={(event) => setDraft({ ...draft, lostReason: event.target.value })} />
                  </label>
                )}
                <Button
                  className="w-full"
                  disabled={update.isPending || (draft.stage === "lost" && !draft.lostReason)}
                  onClick={() => update.mutate({
                    id: selected.id,
                    payload: {
                      ...draft,
                      estimatedValue: draft.estimatedValue ? Number(draft.estimatedValue) : null,
                      followUpAt: draft.followUpAt ? new Date(draft.followUpAt).toISOString() : null,
                      lostReason: draft.lostReason || null,
                    },
                  })}
                >
                  Save opportunity
                </Button>
                {update.error && <p className="text-xs text-destructive">{update.error.message}</p>}

                <div className="border-t border-white/[0.07] pt-5">
                  <h3 className="text-sm font-semibold">Activity</h3>
                  <div className="mt-3 flex gap-2">
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note" rows={2} />
                    <Button disabled={!note || addNote.isPending} onClick={() => addNote.mutate()}>Add</Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activities.data?.map((activity) => (
                      <div key={activity.id} className="border-l border-primary/30 pl-3">
                        <p className="text-xs font-medium capitalize">{activity.type.replace("_", " ")}</p>
                        <p className="mt-1 text-xs text-white/40">{activity.body}</p>
                        <p className="mt-1 text-[9px] text-white/20">{new Date(activity.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminShell>
  );
}
