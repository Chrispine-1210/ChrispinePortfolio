import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Gauge,
  LineChart,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";

type WindowValue = "30d" | "90d" | "365d" | "all";
type Decision = "scale" | "maintain" | "cut" | "insufficient_data";

interface LeadRecord {
  id: string;
  name: string;
  organization: string | null;
  serviceInterest: string | null;
  stage: string;
  currency: string;
}

interface Recommendation {
  key: string;
  channel: string;
  service: string;
  currency: string;
  decision: Decision;
  confidence: "low" | "medium" | "high";
  reasons: string[];
  blockers: string[];
  metrics: {
    enquiries: number;
    proposals: number;
    wins: number;
    proposalWinRate: number;
    stalledShare: number;
    spend: number;
    recognizedRevenue: number;
    directCost: number | null;
    grossProfit: number | null;
    grossMarginPct: number | null;
    grossProfitRoas: number | null;
    mrr: number;
    arr: number;
    paybackDays: number | null;
    revenueCoveragePct: number;
    costCoveragePct: number;
    observedRevenueLtv: number | null;
    observedGrossProfitLtv: number | null;
  };
}

interface Intelligence {
  window: WindowValue;
  cohortStart: string | null;
  basis: "acquisition_cohort";
  policy: Record<string, string | number>;
  evidenceQuality: {
    leads: number;
    wonLeads: number;
    winsWithRevenueEvidence: number;
    winsWithDirectCostEvidence: number;
    unallocatedSpendRecords: number;
  };
  recurringRevenue: {
    activeMrrByCurrency: Array<{ currency: string; mrr: number; arr: number }>;
    activeAgreements: number;
    endedAgreements: number;
    observedAverageEndedLifetimeMonths: number | null;
    projectedLtvStatus: string;
    note: string;
  };
  proposalVelocityDays: {
    proposalToWon: number | null;
    proposalToLost: number | null;
    openProposalAge: number | null;
    samples: { won: number; lost: number; open: number };
  };
  pipelineAging: {
    buckets: Array<{
      key: string;
      count: number;
      valueByCurrency: Array<{ currency: string; value: number }>;
    }>;
    stalled: Array<{
      id: string;
      stage: string;
      service: string;
      ageDays: number;
      estimatedValue: number | null;
      currency: string;
    }>;
    stageThresholdDays: Record<string, number>;
  };
  cohorts: Array<{
    cohort: string;
    enquiries: number;
    proposals: number;
    won: number;
    lost: number;
    proposalRate: number;
    proposalWinRate: number;
    recognizedRevenueByCurrency: Array<{ currency: string; revenue: number }>;
    grossProfitByCurrency: Array<{ currency: string; grossProfit: number }>;
    grossProfitStatus: string;
  }>;
  allocationRecommendations: Recommendation[];
}

interface EvidenceRecord {
  id: string;
  leadId: string;
  serviceInterest: string;
  currency: string;
  amount?: string;
  monthlyRecurringRevenue?: string;
  occurredAt?: string;
  startedAt?: string;
  status?: string;
  revenueKind?: string;
  category?: string;
  sourceReference: string;
  voidedAt: string | null;
}

const serviceOptions = [
  "network-infrastructure",
  "managed-it",
  "enterprise-software",
  "business-systems",
  "data-analytics",
  "technology-advisory",
];

function money(value: number | null, currency: string) {
  if (value === null || !Number.isFinite(value)) return "—";
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

function pct(value: number | null) {
  return value === null ? "—" : `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function days(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}d`;
}

function decisionClass(decision: Decision) {
  if (decision === "scale") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (decision === "cut") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (decision === "maintain") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-white/10 bg-white/[0.03] text-white/45";
}

export default function RevenueIntelligence() {
  const [windowValue, setWindowValue] = useState<WindowValue>("90d");
  const [mode, setMode] = useState<"agreement" | "revenue" | "cost">("revenue");
  const [leadId, setLeadId] = useState("");
  const [currency, setCurrency] = useState("MWK");
  const [amount, setAmount] = useState("");
  const [sourceReference, setSourceReference] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [revenueKind, setRevenueKind] = useState<"one_time" | "recurring">("one_time");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [category, setCategory] = useState("delivery_labour");
  const [notes, setNotes] = useState("");

  const intelligenceEndpoint = `/api/admin/revenue/intelligence?window=${windowValue}`;
  const intelligence = useQuery<Intelligence>({ queryKey: [intelligenceEndpoint] });
  const leads = useQuery<LeadRecord[]>({ queryKey: ["/api/admin/leads?search="] });
  const agreements = useQuery<EvidenceRecord[]>({ queryKey: ["/api/admin/revenue/agreements"] });
  const revenueEvents = useQuery<EvidenceRecord[]>({ queryKey: ["/api/admin/revenue/events"] });
  const costs = useQuery<EvidenceRecord[]>({ queryKey: ["/api/admin/revenue/costs"] });

  const wonLeads = useMemo(
    () => (leads.data ?? []).filter((lead) => lead.stage === "won"),
    [leads.data],
  );
  const selectedLead = wonLeads.find((lead) => lead.id === leadId);
  const serviceInterest = selectedLead?.serviceInterest ?? "";

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [intelligenceEndpoint] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue/agreements"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue/events"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue/costs"] });
  };

  const submitEvidence = useMutation({
    mutationFn: async () => {
      if (!selectedLead || !serviceInterest) throw new Error("Select a won opportunity with a classified service.");
      const base = {
        leadId: selectedLead.id,
        serviceInterest,
        currency,
        sourceReference,
        notes: notes || null,
      };
      if (mode === "agreement") {
        return apiRequest("POST", "/api/admin/revenue/agreements", {
          ...base,
          monthlyRecurringRevenue: Number(amount),
          startedAt: new Date(occurredAt).toISOString(),
        });
      }
      if (mode === "cost") {
        return apiRequest("POST", "/api/admin/revenue/costs", {
          ...base,
          category,
          amount: Number(amount),
          occurredAt: new Date(occurredAt).toISOString(),
        });
      }
      return apiRequest("POST", "/api/admin/revenue/events", {
        ...base,
        revenueKind,
        amount: Number(amount),
        occurredAt: new Date(occurredAt).toISOString(),
        periodStart: revenueKind === "recurring" && periodStart ? new Date(periodStart).toISOString() : null,
        periodEnd: revenueKind === "recurring" && periodEnd ? new Date(periodEnd).toISOString() : null,
      });
    },
    onSuccess: () => {
      setAmount("");
      setSourceReference("");
      setNotes("");
      setPeriodStart("");
      setPeriodEnd("");
      refresh();
    },
  });

  const scaleCount = intelligence.data?.allocationRecommendations.filter((item) => item.decision === "scale").length ?? 0;
  const maintainCount = intelligence.data?.allocationRecommendations.filter((item) => item.decision === "maintain").length ?? 0;
  const cutCount = intelligence.data?.allocationRecommendations.filter((item) => item.decision === "cut").length ?? 0;
  const insufficientCount = intelligence.data?.allocationRecommendations.filter((item) => item.decision === "insufficient_data").length ?? 0;
  const totalMrr = intelligence.data?.recurringRevenue.activeMrrByCurrency ?? [];

  return (
    <AdminShell
      title="Revenue intelligence & capital allocation"
      description="Observed unit economics, recurring revenue, pipeline velocity and evidence-gated allocation decisions"
    >
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Acquisition cohort basis</p>
            <p className="mt-1 text-xs text-white/30">
              Revenue and direct costs follow leads acquired in the selected window. Currencies are never blended.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["30d", "90d", "365d", "all"] as WindowValue[]).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={windowValue === item ? "default" : "outline"}
                onClick={() => setWindowValue(item)}
              >
                {item === "all" ? "All time" : item}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <WalletCards className="h-5 w-5 text-primary" />
                <Badge variant="outline">{intelligence.data?.recurringRevenue.activeAgreements ?? 0} active</Badge>
              </div>
              <div className="mt-4 space-y-1">
                {totalMrr.length ? totalMrr.map((row) => (
                  <p key={row.currency} className="text-xl font-black">{money(row.mrr, row.currency)} <span className="text-xs font-normal text-white/35">MRR</span></p>
                )) : <p className="text-xl font-black">—</p>}
              </div>
              <p className="mt-2 text-xs text-white/35">Current contracted recurring run rate</p>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-violet-400" />
                <span className="text-xs text-white/30">{intelligence.data?.proposalVelocityDays.samples.won ?? 0} samples</span>
              </div>
              <p className="mt-4 text-2xl font-black">{days(intelligence.data?.proposalVelocityDays.proposalToWon ?? null)}</p>
              <p className="mt-2 text-xs text-white/35">Proposal → won velocity</p>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Gauge className="h-5 w-5 text-amber-400" />
                <span className="text-xs text-white/30">{intelligence.data?.pipelineAging.stalled.length ?? 0} stalled</span>
              </div>
              <p className="mt-4 text-2xl font-black">{days(intelligence.data?.proposalVelocityDays.openProposalAge ?? null)}</p>
              <p className="mt-2 text-xs text-white/35">Average open proposal age</p>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Scale className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-white/30">{intelligence.data?.evidenceQuality.unallocatedSpendRecords ?? 0} unallocated spend</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Badge className="bg-emerald-500/10 text-emerald-300">{scaleCount} scale</Badge>
                <Badge className="bg-amber-500/10 text-amber-300">{maintainCount} maintain</Badge>
                <Badge className="bg-red-500/10 text-red-300">{cutCount} cut</Badge>
                <Badge variant="outline">{insufficientCount} unknown</Badge>
              </div>
              <p className="mt-3 text-xs text-white/35">Evidence-gated channel × service decisions</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-0">
              <div className="border-b border-white/[0.07] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Capital allocation matrix</h2>
                    <p className="mt-1 text-xs text-white/30">
                      No recommendation is issued without minimum sample size, service-tagged spend and evidence coverage.
                    </p>
                  </div>
                  <Badge variant="outline">{String(intelligence.data?.policy.version ?? "capital-allocation-v1")}</Badge>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px] text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-white/35">
                    <tr>
                      <th className="px-5 py-3">Decision</th>
                      <th className="px-3 py-3">Channel</th>
                      <th className="px-3 py-3">Service</th>
                      <th className="px-3 py-3">P→W</th>
                      <th className="px-3 py-3">Spend</th>
                      <th className="px-3 py-3">Revenue</th>
                      <th className="px-3 py-3">Gross margin</th>
                      <th className="px-3 py-3">GP ROAS</th>
                      <th className="px-3 py-3">MRR</th>
                      <th className="px-3 py-3">Payback</th>
                      <th className="px-3 py-3">Observed GP LTV</th>
                      <th className="px-3 py-3">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.data?.allocationRecommendations.map((row) => (
                      <tr key={row.key} className="border-b border-white/[0.05] align-top last:border-0">
                        <td className="px-5 py-3">
                          <Badge className={decisionClass(row.decision)}>{row.decision.replace("_", " ")}</Badge>
                          <p className="mt-2 text-[10px] text-white/30">{row.confidence} confidence</p>
                        </td>
                        <td className="px-3 py-3">{row.channel.replace(/_/g, " ")}</td>
                        <td className="px-3 py-3">{row.service.replace(/-/g, " ")}</td>
                        <td className="px-3 py-3">{pct(row.metrics.proposalWinRate)}</td>
                        <td className="px-3 py-3">{money(row.metrics.spend, row.currency)}</td>
                        <td className="px-3 py-3">{money(row.metrics.recognizedRevenue, row.currency)}</td>
                        <td className="px-3 py-3">{pct(row.metrics.grossMarginPct)}</td>
                        <td className="px-3 py-3">{row.metrics.grossProfitRoas ?? "—"}</td>
                        <td className="px-3 py-3">{money(row.metrics.mrr, row.currency)}</td>
                        <td className="px-3 py-3">{days(row.metrics.paybackDays)}</td>
                        <td className="px-3 py-3">{money(row.metrics.observedGrossProfitLtv, row.currency)}</td>
                        <td className="px-3 py-3">
                          <p>{pct(row.metrics.revenueCoveragePct)} revenue</p>
                          <p className="mt-1">{pct(row.metrics.costCoveragePct)} costs</p>
                          {row.blockers.length > 0 && (
                            <p className="mt-2 max-w-64 text-[10px] leading-4 text-amber-300/70">{row.blockers.join(" · ")}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!intelligence.data?.allocationRecommendations.length && (
                      <tr><td colSpan={12} className="px-5 py-10 text-center text-white/25">No acquisition cohort data yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Pipeline aging</h2>
                  <p className="mt-1 text-xs text-white/30">Stage-age thresholds flag capital trapped in stalled opportunities.</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {intelligence.data?.pipelineAging.buckets.map((bucket) => (
                  <div key={bucket.key} className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <p className="text-xs text-white/35">{bucket.key} days</p>
                    <p className="mt-1 text-xl font-black">{bucket.count}</p>
                    {bucket.valueByCurrency.map((value) => (
                      <p key={value.currency} className="mt-1 text-[10px] text-white/35">{money(value.value, value.currency)}</p>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                {intelligence.data?.pipelineAging.stalled.slice(0, 8).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/10 p-3">
                    <div>
                      <p className="text-xs font-semibold">{lead.service.replace(/-/g, " ")}</p>
                      <p className="mt-1 text-[10px] text-white/35">{lead.stage} · {lead.ageDays} days in stage</p>
                    </div>
                    <span className="text-xs font-semibold">{money(lead.estimatedValue, lead.currency)}</span>
                  </div>
                ))}
                {!intelligence.data?.pipelineAging.stalled.length && <p className="text-xs text-white/25">No stalled opportunities under the current thresholds.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider">LTV model status</h2>
              <p className="mt-4 text-sm font-semibold">{intelligence.data?.recurringRevenue.projectedLtvStatus.replace(/_/g, " ") ?? "—"}</p>
              <p className="mt-3 text-xs leading-5 text-white/35">{intelligence.data?.recurringRevenue.note}</p>
              <div className="mt-5 rounded-lg border border-white/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30">Observed ended lifetime</p>
                <p className="mt-1 text-xl font-black">
                  {intelligence.data?.recurringRevenue.observedAverageEndedLifetimeMonths ?? "—"}
                  <span className="ml-1 text-xs font-normal text-white/35">months</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-0">
              <div className="border-b border-white/[0.07] p-5">
                <div className="flex items-center gap-3">
                  <LineChart className="h-5 w-5 text-violet-400" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Acquisition cohorts</h2>
                    <p className="mt-1 text-xs text-white/30">Monthly lead cohorts with conversion and evidence-backed revenue.</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-white/35">
                    <tr>
                      <th className="px-5 py-3">Cohort</th>
                      <th className="px-3 py-3">Enquiries</th>
                      <th className="px-3 py-3">Proposals</th>
                      <th className="px-3 py-3">Won</th>
                      <th className="px-3 py-3">P→W</th>
                      <th className="px-3 py-3">Recognized revenue</th>
                      <th className="px-3 py-3">Gross profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.data?.cohorts.map((cohort) => (
                      <tr key={cohort.cohort} className="border-b border-white/[0.05] last:border-0">
                        <td className="px-5 py-3 font-semibold">{cohort.cohort}</td>
                        <td className="px-3 py-3">{cohort.enquiries}</td>
                        <td className="px-3 py-3">{cohort.proposals}</td>
                        <td className="px-3 py-3 text-emerald-400">{cohort.won}</td>
                        <td className="px-3 py-3">{pct(cohort.proposalWinRate)}</td>
                        <td className="px-3 py-3">{cohort.recognizedRevenueByCurrency.map((row) => money(row.revenue, row.currency)).join(" · ") || "—"}</td>
                        <td className="px-3 py-3">
                          {cohort.grossProfitStatus === "available"
                            ? cohort.grossProfitByCurrency.map((row) => money(row.grossProfit, row.currency)).join(" · ") || "—"
                            : <span className="text-amber-300/70">cost evidence incomplete</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Commercial evidence intake</h2>
                  <p className="mt-1 text-xs text-white/30">Only won opportunities can receive revenue or direct-cost evidence.</p>
                </div>
                <div className="flex gap-2">
                  {(["revenue", "cost", "agreement"] as const).map((item) => (
                    <Button key={item} size="sm" variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs text-white/40">
                  Won opportunity
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white"
                    value={leadId}
                    onChange={(event) => {
                      const next = wonLeads.find((lead) => lead.id === event.target.value);
                      setLeadId(event.target.value);
                      if (next?.currency) setCurrency(next.currency);
                    }}
                  >
                    <option value="">Select won opportunity</option>
                    {wonLeads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.organization || lead.name} · {lead.serviceInterest || "unclassified"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/40">
                  Service
                  <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={serviceInterest} disabled>
                    <option>{serviceInterest || "Inherited from CRM"}</option>
                    {serviceOptions.filter((item) => item === serviceInterest).map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="text-xs text-white/40">
                  Currency
                  <Input className="mt-1" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
                </label>
                <label className="text-xs text-white/40">
                  {mode === "agreement" ? "Monthly recurring revenue" : mode === "cost" ? "Direct cost amount" : "Recognized revenue"}
                  <Input className="mt-1" type="number" min={mode === "cost" ? "0" : "0.01"} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </label>
                <label className="text-xs text-white/40">
                  {mode === "agreement" ? "Agreement start" : "Evidence date"}
                  <Input className="mt-1" type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
                </label>
                {mode === "revenue" && (
                  <label className="text-xs text-white/40">
                    Revenue kind
                    <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={revenueKind} onChange={(event) => setRevenueKind(event.target.value as "one_time" | "recurring")}>
                      <option value="one_time">one time</option>
                      <option value="recurring">recurring</option>
                    </select>
                  </label>
                )}
                {mode === "cost" && (
                  <label className="text-xs text-white/40">
                    Cost category
                    <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={category} onChange={(event) => setCategory(event.target.value)}>
                      {["delivery_labour", "infrastructure", "subcontractor", "transaction", "support", "other"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                )}
                {mode === "revenue" && revenueKind === "recurring" && (
                  <>
                    <label className="text-xs text-white/40">Period start<Input className="mt-1" type="datetime-local" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></label>
                    <label className="text-xs text-white/40">Period end<Input className="mt-1" type="datetime-local" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label>
                  </>
                )}
                <label className="text-xs text-white/40 md:col-span-2">
                  Source reference
                  <Input className="mt-1" placeholder="Invoice, contract, receipt, ledger or evidence reference" value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} />
                </label>
              </div>
              <Textarea className="mt-3" rows={2} placeholder="Evidence notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              <Button
                className="mt-3"
                disabled={!leadId || !serviceInterest || !amount || !sourceReference || submitEvidence.isPending ||
                  (mode === "revenue" && revenueKind === "recurring" && (!periodStart || !periodEnd))}
                onClick={() => submitEvidence.mutate()}
              >
                Record {mode}
              </Button>
              {submitEvidence.error && <p className="mt-2 text-xs text-destructive">{submitEvidence.error.message}</p>}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Recurring agreements", icon: TrendingUp, rows: agreements.data ?? [], value: (row: EvidenceRecord) => row.monthlyRecurringRevenue ? `${money(Number(row.monthlyRecurringRevenue), row.currency)} MRR` : row.status || "agreement" },
            { title: "Revenue events", icon: CircleDollarSign, rows: revenueEvents.data ?? [], value: (row: EvidenceRecord) => money(Number(row.amount ?? 0), row.currency) },
            { title: "Direct cost evidence", icon: TrendingDown, rows: costs.data ?? [], value: (row: EvidenceRecord) => money(Number(row.amount ?? 0), row.currency) },
          ].map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.title} className="border-white/[0.07] bg-white/[0.018]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider">{group.title}</h2>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                    {group.rows.slice(0, 10).map((row) => (
                      <div key={row.id} className={`rounded-lg border p-3 ${row.voidedAt ? "border-red-500/20 opacity-50" : "border-white/[0.06]"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold">{row.serviceInterest.replace(/-/g, " ")}</p>
                            <p className="mt-1 text-[10px] text-white/35">{row.sourceReference}</p>
                          </div>
                          <span className="text-xs font-semibold">{group.value(row)}</span>
                        </div>
                      </div>
                    ))}
                    {!group.rows.length && <p className="text-xs text-white/25">No evidence recorded.</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider">Decision controls</h2>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-white/35">
            SCALE / MAINTAIN / CUT is deterministic policy output, not an AI opinion. A segment remains
            insufficient-data when sample size, service-tagged spend, recognized revenue, or direct-cost evidence is incomplete.
            Gross margin never assumes missing costs are zero, projected LTV is withheld until ended-agreement history exists,
            and currencies stay separated throughout the model.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
