import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  Landmark,
  RefreshCw,
  Repeat2,
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
type AllocationDecision = "scale" | "maintain" | "cut" | "insufficient_data";
type CashSignal = "increase_candidate" | "hold_candidate" | "reduce_candidate" | "insufficient_data";

interface Lead {
  id: string;
  name: string;
  organization: string | null;
  stage: string;
  serviceInterest: string | null;
  currency: string;
}

interface Agreement {
  id: string;
  leadId: string;
  serviceInterest: string;
  currency: string;
  monthlyRecurringRevenue: string;
  status: string;
  voidedAt: string | null;
}

interface Invoice {
  id: string;
  leadId: string;
  serviceInterest: string;
  invoiceNumber: string;
  currency: string;
  amount: string;
  issuedAt: string;
  dueAt: string;
  status: string;
  voidedAt: string | null;
}

interface BudgetAllocation {
  id: string;
  budgetId: string;
  channel: string;
  serviceInterest: string;
  recommendationDecision: AllocationDecision;
  recommendationConfidence: "low" | "medium" | "high";
  recommendedAmount: string;
  approvedAmount: string;
  sourceWindow: WindowValue;
  rationale: string;
  actualSpend?: number;
  remainingApproved?: number;
  approvedUtilizationPct?: number | null;
  recommendedVariance?: number;
  approvedVariance?: number;
}

interface Budget {
  id: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  envelopeAmount: string;
  status: "draft" | "approved" | "closed";
  sourceReference: string;
  allocations: BudgetAllocation[];
}

interface RevenueRecommendation {
  key: string;
  channel: string;
  service: string;
  currency: string;
  decision: AllocationDecision;
  confidence: "low" | "medium" | "high";
  reasons: string[];
  blockers: string[];
  metrics: {
    spend: number;
    recognizedRevenue: number;
    grossProfit: number | null;
    grossMarginPct: number | null;
    grossProfitRoas: number | null;
    mrr: number;
    arr: number;
    paybackDays: number | null;
    observedGrossProfitLtv: number | null;
  };
}

interface RevenueIntelligence {
  allocationRecommendations: RevenueRecommendation[];
}

interface CapitalIntelligence {
  window: WindowValue;
  basis: {
    cashRealization: "invoice_cohort";
    capitalReturn: "lead_acquisition_cohort";
    retention: "trailing_period";
    deliveryUtilization: "activity_window";
  };
  retentionPeriodStart: string;
  asOf: string;
  cashRealization: {
    invoiceCohortByCurrency: Array<{
      currency: string;
      invoiced: number;
      collected: number;
      outstanding: number;
      realizationRatePct: number | null;
      averagePaidInvoiceDays: number | null;
      weightedAverageCollectionDays: number | null;
    }>;
    currentReceivablesAging: Array<{
      key: string;
      count: number;
      valueByCurrency: Array<{ currency: string; value: number }>;
    }>;
  };
  retention: Array<{
    key: string;
    service: string;
    currency: string;
    beginningMrr: number;
    newMrr: number;
    expansionMrr: number;
    contractionMrr: number;
    churnMrr: number;
    reactivationMrr: number;
    beginningLogos: number;
    churnedLogos: number;
    unreconciledEndedAgreements: number;
    evidenceComplete: boolean;
    grrPct: number | null;
    nrrPct: number | null;
    logoChurnPct: number | null;
  }>;
  deliveryUtilization: Array<{
    service: string;
    availableHours: number;
    deliveryHours: number;
    billableHours: number;
    utilizationPct: number | null;
    billableUtilizationPct: number | null;
    scopeCount: number;
  }>;
  realizedCapitalReturn: Array<{
    key: string;
    channel: string;
    service: string;
    currency: string;
    cashCollected: number;
    directCost: number;
    acquisitionSpend: number;
    cashCollectingLeads: number;
    completeCostLeads: number;
    costCoveragePct: number;
    cashGrossContribution: number | null;
    netCapitalReturn: number | null;
    cashReturnMultiple: number | null;
    capitalRoiPct: number | null;
    grr: number | null;
    nrr: number | null;
    retentionEvidenceComplete: boolean;
    reinvestmentSignal: CashSignal;
    reasons: string[];
  }>;
  budgetPerformance: Array<Budget & {
    allocations: Array<BudgetAllocation & {
      actualSpend: number;
      remainingApproved: number;
      approvedUtilizationPct: number | null;
      recommendedVariance: number;
      approvedVariance: number;
    }>;
  }>;
  controls: {
    reinvestmentSignalIsAdvisory: boolean;
    budgetApprovalRequired: boolean;
    reinvestmentPolicy: {
      version: string;
      increaseMinimumCashReturnMultiple: number;
      recurringIncreaseMinimumNrrPct: number;
      holdMinimumCashReturnMultiple: number;
      recurringHoldMinimumNrrPct: number;
      recurringRetentionEvidenceRequired: boolean;
    };
    note: string;
  };
}

const services = [
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

function posture(
  upstream: AllocationDecision | undefined,
  cash: CashSignal,
): "increase" | "hold" | "reduce" | "evidence_hold" {
  if (upstream === "cut" || cash === "reduce_candidate") return "reduce";
  if (upstream === "scale" && cash === "increase_candidate") return "increase";
  if (upstream === "insufficient_data" || !upstream || cash === "insufficient_data") return "evidence_hold";
  return "hold";
}

function postureClass(value: ReturnType<typeof posture>) {
  if (value === "increase") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (value === "reduce") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (value === "hold") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-white/10 bg-white/[0.03] text-white/45";
}

export default function CapitalOperatingSystem() {
  const [windowValue, setWindowValue] = useState<WindowValue>("90d");
  const [mode, setMode] = useState<"invoice" | "collection" | "retention" | "capacity" | "budget" | "allocation">("invoice");
  const [sourceReference, setSourceReference] = useState("");
  const [notes, setNotes] = useState("");

  const [leadId, setLeadId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [currency, setCurrency] = useState("MWK");
  const [amount, setAmount] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 16));
  const [dueAt, setDueAt] = useState(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 16));

  const [invoiceId, setInvoiceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 16));

  const [agreementId, setAgreementId] = useState("");
  const [movementType, setMovementType] = useState<"expansion" | "contraction" | "churn" | "reactivation">("expansion");
  const [mrrDelta, setMrrDelta] = useState("");
  const [effectiveAt, setEffectiveAt] = useState(new Date().toISOString().slice(0, 16));

  const [capacityService, setCapacityService] = useState("managed-it");
  const [capacityScope, setCapacityScope] = useState("");
  const [periodStart, setPeriodStart] = useState(new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 16));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 16));
  const [availableHours, setAvailableHours] = useState("");
  const [deliveryHours, setDeliveryHours] = useState("");
  const [billableHours, setBillableHours] = useState("");

  const [budgetId, setBudgetId] = useState("");
  const [budgetPeriodStart, setBudgetPeriodStart] = useState(new Date().toISOString().slice(0, 16));
  const [budgetPeriodEnd, setBudgetPeriodEnd] = useState(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 16));
  const [envelopeAmount, setEnvelopeAmount] = useState("");
  const [recommendationKey, setRecommendationKey] = useState("");
  const [recommendedAmount, setRecommendedAmount] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [allocationRationale, setAllocationRationale] = useState("");

  const capitalEndpoint = `/api/admin/capital/intelligence?window=${windowValue}`;
  const revenueEndpoint = `/api/admin/revenue/intelligence?window=${windowValue}`;
  const capital = useQuery<CapitalIntelligence>({ queryKey: [capitalEndpoint] });
  const revenue = useQuery<RevenueIntelligence>({ queryKey: [revenueEndpoint] });
  const leads = useQuery<Lead[]>({ queryKey: ["/api/admin/leads?search="] });
  const invoices = useQuery<Invoice[]>({ queryKey: ["/api/admin/capital/invoices"] });
  const agreements = useQuery<Agreement[]>({ queryKey: ["/api/admin/revenue/agreements"] });
  const budgets = useQuery<Budget[]>({ queryKey: ["/api/admin/capital/budgets"] });

  const wonLeads = useMemo(() => (leads.data ?? []).filter((lead) => lead.stage === "won"), [leads.data]);
  const selectedLead = wonLeads.find((lead) => lead.id === leadId);
  const selectedRecommendation = revenue.data?.allocationRecommendations.find((row) => row.key === recommendationKey);
  const upstreamMap = useMemo(
    () => new Map((revenue.data?.allocationRecommendations ?? []).map((row) => [`${row.channel}::${row.service}::${row.currency}`, row])),
    [revenue.data],
  );

  const refresh = () => {
    [
      capitalEndpoint,
      revenueEndpoint,
      "/api/admin/capital/invoices",
      "/api/admin/capital/collections",
      "/api/admin/capital/retention-movements",
      "/api/admin/capital/capacity",
      "/api/admin/capital/budgets",
      "/api/admin/revenue/agreements",
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!sourceReference && mode !== "allocation") throw new Error("Source reference is required.");
      if (mode === "invoice") {
        if (!selectedLead?.serviceInterest) throw new Error("Select a won opportunity with a service.");
        return apiRequest("POST", "/api/admin/capital/invoices", {
          leadId: selectedLead.id,
          serviceInterest: selectedLead.serviceInterest,
          invoiceNumber,
          currency,
          amount: Number(amount),
          issuedAt: new Date(issuedAt).toISOString(),
          dueAt: new Date(dueAt).toISOString(),
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "collection") {
        return apiRequest("POST", "/api/admin/capital/collections", {
          invoiceId,
          amount: Number(amount),
          receivedAt: new Date(receivedAt).toISOString(),
          paymentMethod,
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "retention") {
        const delta = Math.abs(Number(mrrDelta)) * (movementType === "contraction" || movementType === "churn" ? -1 : 1);
        return apiRequest("POST", "/api/admin/capital/retention-movements", {
          agreementId,
          movementType,
          mrrDelta: delta,
          effectiveAt: new Date(effectiveAt).toISOString(),
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "capacity") {
        return apiRequest("POST", "/api/admin/capital/capacity", {
          serviceInterest: capacityService,
          capacityScope,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
          availableHours: Number(availableHours),
          deliveryHours: Number(deliveryHours),
          billableHours: Number(billableHours),
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "budget") {
        return apiRequest("POST", "/api/admin/capital/budgets", {
          periodStart: new Date(budgetPeriodStart).toISOString(),
          periodEnd: new Date(budgetPeriodEnd).toISOString(),
          currency,
          envelopeAmount: Number(envelopeAmount),
          sourceReference,
          notes: notes || null,
        });
      }
      if (!selectedRecommendation) throw new Error("Select an upstream allocation recommendation.");
      return apiRequest("POST", `/api/admin/capital/budgets/${budgetId}/allocations`, {
        channel: selectedRecommendation.channel,
        serviceInterest: selectedRecommendation.service,
        recommendationDecision: selectedRecommendation.decision,
        recommendationConfidence: selectedRecommendation.confidence,
        recommendedAmount: Number(recommendedAmount),
        approvedAmount: Number(approvedAmount),
        sourceWindow: windowValue,
        recommendationSnapshot: selectedRecommendation,
        rationale: allocationRationale,
      });
    },
    onSuccess: () => {
      setAmount("");
      setMrrDelta("");
      setSourceReference("");
      setNotes("");
      setInvoiceNumber("");
      setEnvelopeAmount("");
      setRecommendedAmount("");
      setApprovedAmount("");
      setAllocationRationale("");
      refresh();
    },
  });

  const approveBudget = useMutation({
    mutationFn: ({ id, exceptionReason }: { id: string; exceptionReason?: string }) =>
      apiRequest("POST", `/api/admin/capital/budgets/${id}/approve`, {
        exceptionReason: exceptionReason || null,
      }),
    onSuccess: refresh,
  });

  const receivablesByCurrency = useMemo(() => {
    const values = new Map<string, number>();
    for (const bucket of capital.data?.cashRealization.currentReceivablesAging ?? []) {
      for (const row of bucket.valueByCurrency) {
        values.set(row.currency, (values.get(row.currency) ?? 0) + row.value);
      }
    }
    return [...values.entries()].map(([currency, value]) => ({ currency, value }));
  }, [capital.data]);

  const overdueByCurrency = useMemo(() => {
    const values = new Map<string, number>();
    for (const bucket of capital.data?.cashRealization.currentReceivablesAging ?? []) {
      if (bucket.key === "not_due") continue;
      for (const row of bucket.valueByCurrency) {
        values.set(row.currency, (values.get(row.currency) ?? 0) + row.value);
      }
    }
    return [...values.entries()].map(([currency, value]) => ({ currency, value }));
  }, [capital.data]);
  const allocationRows = capital.data?.realizedCapitalReturn ?? [];
  const increaseCount = allocationRows.filter((row) =>
    posture(upstreamMap.get(row.key)?.decision, row.reinvestmentSignal) === "increase").length;
  const reduceCount = allocationRows.filter((row) =>
    posture(upstreamMap.get(row.key)?.decision, row.reinvestmentSignal) === "reduce").length;

  return (
    <AdminShell
      title="Capital operating system"
      description="Cash realization, retention, delivery utilization, capital return and governed reinvestment"
    >
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Lead → revenue → cash → retention → capital return → reinvestment
            </p>
            <p className="mt-1 max-w-3xl text-xs text-white/30">
              Accrual economics and realized-cash economics remain separate. Reinvestment signals are advisory; only an approved budget authorizes spending.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["30d", "90d", "365d", "all"] as WindowValue[]).map((item) => (
              <Button key={item} size="sm" variant={windowValue === item ? "default" : "outline"} onClick={() => setWindowValue(item)}>
                {item === "all" ? "All time" : item}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
            <div className="flex items-center justify-between"><Banknote className="h-5 w-5 text-emerald-400" /><span className="text-xs text-white/30">cash realization</span></div>
            <div className="mt-4 space-y-1">
              {capital.data?.cashRealization.invoiceCohortByCurrency.map((row) => (
                <p key={row.currency} className="text-xl font-black">{money(row.collected, row.currency)} <span className="text-xs font-normal text-white/35">collected</span></p>
              ))}
              {!capital.data?.cashRealization.invoiceCohortByCurrency.length && <p className="text-xl font-black">—</p>}
            </div>
          </CardContent></Card>

          <Card className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
            <div className="flex items-center justify-between"><CalendarClock className="h-5 w-5 text-amber-400" /><span className="text-xs text-white/30">receivables</span></div>
            <div className="mt-4 space-y-1">
              {receivablesByCurrency.map((row) => (
                <p key={row.currency} className="text-lg font-black">{money(row.value, row.currency)}</p>
              ))}
              {!receivablesByCurrency.length && <p className="text-2xl font-black">—</p>}
            </div>
            <p className="mt-1 text-xs text-white/35">
              {overdueByCurrency.length
                ? `Overdue: ${overdueByCurrency.map((row) => money(row.value, row.currency)).join(" · ")}`
                : "No overdue receivables"}
            </p>
          </CardContent></Card>

          <Card className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
            <div className="flex items-center justify-between"><Repeat2 className="h-5 w-5 text-violet-400" /><span className="text-xs text-white/30">retention</span></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(capital.data?.retention ?? []).slice(0, 3).map((row) => (
                <Badge key={row.key} variant="outline">{row.service.replace(/-/g, " ")} NRR {pct(row.nrrPct)}</Badge>
              ))}
              {!capital.data?.retention.length && <span className="text-xl font-black">—</span>}
            </div>
          </CardContent></Card>

          <Card className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
            <div className="flex items-center justify-between"><Scale className="h-5 w-5 text-primary" /><span className="text-xs text-white/30">reinvestment posture</span></div>
            <div className="mt-4 flex gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-300">{increaseCount} increase</Badge>
              <Badge className="bg-red-500/10 text-red-300">{reduceCount} reduce</Badge>
            </div>
            <p className="mt-2 text-xs text-white/35">Requires both upstream economics and realized-cash evidence</p>
          </CardContent></Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-0">
            <div className="border-b border-white/[0.07] p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider">Cash realization</h2>
              <p className="mt-1 text-xs text-white/30">Invoice-cohort collections; cash is never inferred from recognized revenue.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-b border-white/[0.07] text-white/35"><tr>
                  <th className="px-5 py-3">Currency</th><th className="px-3 py-3">Invoiced</th><th className="px-3 py-3">Collected</th><th className="px-3 py-3">Outstanding</th><th className="px-3 py-3">Realization</th><th className="px-3 py-3">Weighted collection days</th>
                </tr></thead>
                <tbody>
                  {capital.data?.cashRealization.invoiceCohortByCurrency.map((row) => (
                    <tr key={row.currency} className="border-b border-white/[0.05] last:border-0">
                      <td className="px-5 py-3 font-semibold">{row.currency}</td>
                      <td className="px-3 py-3">{money(row.invoiced, row.currency)}</td>
                      <td className="px-3 py-3 text-emerald-400">{money(row.collected, row.currency)}</td>
                      <td className="px-3 py-3">{money(row.outstanding, row.currency)}</td>
                      <td className="px-3 py-3">{pct(row.realizationRatePct)}</td>
                      <td className="px-3 py-3">{days(row.weightedAverageCollectionDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>

          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider">Receivables aging</h2>
            <div className="mt-4 space-y-3">
              {capital.data?.cashRealization.currentReceivablesAging.map((bucket) => (
                <div key={bucket.key} className="rounded-lg border border-white/[0.06] p-3">
                  <div className="flex justify-between"><span className="text-xs font-semibold">{bucket.key}</span><Badge variant="outline">{bucket.count}</Badge></div>
                  <p className="mt-2 text-[10px] text-white/35">{bucket.valueByCurrency.map((row) => money(row.value, row.currency)).join(" · ") || "—"}</p>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-0">
            <div className="border-b border-white/[0.07] p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider">Capital return & reinvestment</h2>
              <p className="mt-1 text-xs text-white/30">
                Final operating posture intersects PR #23 accrual economics with realized cash return. It remains advisory until a budget is approved.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-left text-xs">
                <thead className="border-b border-white/[0.07] text-white/35"><tr>
                  <th className="px-5 py-3">Posture</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3">Service</th><th className="px-3 py-3">Upstream</th><th className="px-3 py-3">Cash signal</th><th className="px-3 py-3">Cash collected</th><th className="px-3 py-3">Cash GP</th><th className="px-3 py-3">Spend</th><th className="px-3 py-3">Cash return</th><th className="px-3 py-3">ROI</th><th className="px-3 py-3">GRR</th><th className="px-3 py-3">NRR</th><th className="px-3 py-3">Cost evidence</th>
                </tr></thead>
                <tbody>
                  {allocationRows.map((row) => {
                    const upstream = upstreamMap.get(row.key);
                    const final = posture(upstream?.decision, row.reinvestmentSignal);
                    return (
                      <tr key={row.key} className="border-b border-white/[0.05] last:border-0">
                        <td className="px-5 py-3"><Badge className={postureClass(final)}>{final.replace("_", " ")}</Badge></td>
                        <td className="px-3 py-3">{row.channel.replace(/_/g, " ")}</td>
                        <td className="px-3 py-3">{row.service.replace(/-/g, " ")}</td>
                        <td className="px-3 py-3">{upstream?.decision.replace("_", " ") ?? "no upstream evidence"}</td>
                        <td className="px-3 py-3">{row.reinvestmentSignal.replace("_candidate", "").replace("_", " ")}</td>
                        <td className="px-3 py-3">{money(row.cashCollected, row.currency)}</td>
                        <td className="px-3 py-3">{money(row.cashGrossContribution, row.currency)}</td>
                        <td className="px-3 py-3">{money(row.acquisitionSpend, row.currency)}</td>
                        <td className="px-3 py-3">{row.cashReturnMultiple === null ? "—" : `${row.cashReturnMultiple}x`}</td>
                        <td className="px-3 py-3">{pct(row.capitalRoiPct)}</td>
                        <td className="px-3 py-3">{pct(row.grr)}</td>
                        <td className="px-3 py-3">{pct(row.nrr)}</td>
                        <td className="px-3 py-3">{pct(row.costCoveragePct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-0">
            <div className="border-b border-white/[0.07] p-5"><h2 className="text-sm font-bold uppercase tracking-wider">Retention / MRR bridge</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-b border-white/[0.07] text-white/35"><tr><th className="px-5 py-3">Service</th><th className="px-3 py-3">Beginning MRR</th><th className="px-3 py-3">Expansion</th><th className="px-3 py-3">Contraction</th><th className="px-3 py-3">Churn</th><th className="px-3 py-3">GRR</th><th className="px-3 py-3">NRR</th></tr></thead>
                <tbody>{capital.data?.retention.map((row) => (
                  <tr key={row.key} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-5 py-3">{row.service.replace(/-/g, " ")}</td>
                    <td className="px-3 py-3">{money(row.beginningMrr, row.currency)}</td>
                    <td className="px-3 py-3 text-emerald-400">{money(row.expansionMrr + row.reactivationMrr, row.currency)}</td>
                    <td className="px-3 py-3">{money(row.contractionMrr, row.currency)}</td>
                    <td className="px-3 py-3 text-red-300">{money(row.churnMrr, row.currency)}</td>
                    <td className="px-3 py-3">{pct(row.grrPct)}</td>
                    <td className="px-3 py-3">{pct(row.nrrPct)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </CardContent></Card>

          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-0">
            <div className="border-b border-white/[0.07] p-5"><h2 className="text-sm font-bold uppercase tracking-wider">Delivery utilization</h2></div>
            <div className="divide-y divide-white/[0.06]">
              {capital.data?.deliveryUtilization.map((row) => (
                <div key={row.service} className="grid gap-2 p-4 sm:grid-cols-[1.4fr_.7fr_.7fr]">
                  <div><p className="text-xs font-semibold">{row.service.replace(/-/g, " ")}</p><p className="mt-1 text-[10px] text-white/35">{row.scopeCount} capacity scopes · {row.availableHours.toFixed(1)} available hours</p></div>
                  <div className="text-xs"><span className="text-white/35">Delivery </span>{pct(row.utilizationPct)}</div>
                  <div className="text-xs"><span className="text-white/35">Billable </span>{pct(row.billableUtilizationPct)}</div>
                </div>
              ))}
              {!capital.data?.deliveryUtilization.length && <p className="p-5 text-xs text-white/25">No capacity evidence yet.</p>}
            </div>
          </CardContent></Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-0">
            <div className="border-b border-white/[0.07] p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider">Budget control</h2>
              <p className="mt-1 text-xs text-white/30">Recommendations are snapshots. Approved amounts remain explicit human capital decisions.</p>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {(capital.data?.budgetPerformance ?? []).map((budget) => (
                <div key={budget.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{money(Number(budget.envelopeAmount), budget.currency)} envelope · {budget.status}</p>
                      <p className="mt-1 text-[10px] text-white/35">{new Date(budget.periodStart).toLocaleDateString()} → {new Date(budget.periodEnd).toLocaleDateString()}</p>
                    </div>
                    {budget.status === "draft" && <Button
                      size="sm"
                      disabled={approveBudget.isPending}
                      onClick={() => {
                        const exceptions = budget.allocations.filter((allocation) =>
                          Number(allocation.approvedAmount) > 0 &&
                          ["cut", "insufficient_data"].includes(allocation.recommendationDecision));
                        if (!exceptions.length) {
                          approveBudget.mutate({ id: budget.id });
                          return;
                        }
                        const reason = window.prompt(
                          "This budget allocates capital to CUT or INSUFFICIENT_DATA segments. Enter the accountable exception reason:",
                        );
                        if (reason && reason.trim().length >= 10) {
                          approveBudget.mutate({ id: budget.id, exceptionReason: reason.trim() });
                        }
                      }}
                    >Approve budget</Button>}
                  </div>
                  <div className="mt-4 grid gap-2 lg:grid-cols-2">
                    {budget.allocations.map((allocation) => (
                      <div key={allocation.id} className="rounded-lg border border-white/[0.06] p-3">
                        <div className="flex justify-between gap-3"><p className="text-xs font-semibold">{allocation.channel} → {allocation.serviceInterest.replace(/-/g, " ")}</p><Badge variant="outline">{allocation.recommendationDecision}</Badge></div>
                        <p className="mt-2 text-[10px] text-white/35">recommended {money(Number(allocation.recommendedAmount), budget.currency)} · approved {money(Number(allocation.approvedAmount), budget.currency)} · actual {money(allocation.actualSpend ?? 0, budget.currency)}</p>
                        <p className="mt-1 text-[10px] text-white/35">approved utilization {pct(allocation.approvedUtilizationPct ?? null)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!capital.data?.budgetPerformance.length && <p className="p-5 text-xs text-white/25">No capital budget exists yet.</p>}
            </div>
          </CardContent></Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]"><CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-sm font-bold uppercase tracking-wider">Capital evidence & control intake</h2><p className="mt-1 text-xs text-white/30">Record cash, retention and capacity evidence or propose a budget. Budget approval remains separately permissioned.</p></div>
              <div className="flex flex-wrap gap-2">
                {(["invoice","collection","retention","capacity","budget","allocation"] as const).map((item) => (
                  <Button key={item} size="sm" variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>{item}</Button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {mode === "invoice" && <>
                <label className="text-xs text-white/40">Won opportunity<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={leadId} onChange={(event) => { setLeadId(event.target.value); const lead=wonLeads.find((row)=>row.id===event.target.value); if(lead?.currency) setCurrency(lead.currency); }}>
                  <option value="">Select</option>{wonLeads.map((lead)=><option key={lead.id} value={lead.id}>{lead.organization || lead.name} · {lead.serviceInterest}</option>)}
                </select></label>
                <label className="text-xs text-white/40">Invoice number<Input className="mt-1" value={invoiceNumber} onChange={(event)=>setInvoiceNumber(event.target.value)} /></label>
                <label className="text-xs text-white/40">Currency<Input className="mt-1" maxLength={3} value={currency} onChange={(event)=>setCurrency(event.target.value.toUpperCase())} /></label>
                <label className="text-xs text-white/40">Amount<Input className="mt-1" type="number" min="0.01" value={amount} onChange={(event)=>setAmount(event.target.value)} /></label>
                <label className="text-xs text-white/40">Issued<Input className="mt-1" type="datetime-local" value={issuedAt} onChange={(event)=>setIssuedAt(event.target.value)} /></label>
                <label className="text-xs text-white/40">Due<Input className="mt-1" type="datetime-local" value={dueAt} onChange={(event)=>setDueAt(event.target.value)} /></label>
              </>}

              {mode === "collection" && <>
                <label className="text-xs text-white/40">Invoice<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={invoiceId} onChange={(event)=>setInvoiceId(event.target.value)}>
                  <option value="">Select</option>{(invoices.data ?? []).filter((invoice)=>!invoice.voidedAt && invoice.status !== "paid").map((invoice)=><option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {money(Number(invoice.amount), invoice.currency)}</option>)}
                </select></label>
                <label className="text-xs text-white/40">Amount received<Input className="mt-1" type="number" min="0.01" value={amount} onChange={(event)=>setAmount(event.target.value)} /></label>
                <label className="text-xs text-white/40">Method<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={paymentMethod} onChange={(event)=>setPaymentMethod(event.target.value)}>{["bank_transfer","mobile_money","cash","card","cheque","other"].map((item)=><option key={item}>{item}</option>)}</select></label>
                <label className="text-xs text-white/40">Received<Input className="mt-1" type="datetime-local" value={receivedAt} onChange={(event)=>setReceivedAt(event.target.value)} /></label>
              </>}

              {mode === "retention" && <>
                <label className="text-xs text-white/40">Recurring agreement<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={agreementId} onChange={(event)=>setAgreementId(event.target.value)}>
                  <option value="">Select</option>{(agreements.data ?? []).filter((row)=>!row.voidedAt).map((row)=><option key={row.id} value={row.id}>{row.serviceInterest.replace(/-/g," ")} · {money(Number(row.monthlyRecurringRevenue), row.currency)} · {row.status}</option>)}
                </select></label>
                <label className="text-xs text-white/40">Movement<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={movementType} onChange={(event)=>setMovementType(event.target.value as typeof movementType)}>{["expansion","contraction","churn","reactivation"].map((item)=><option key={item}>{item}</option>)}</select></label>
                <label className="text-xs text-white/40">MRR change<Input className="mt-1" type="number" min="0.01" value={mrrDelta} onChange={(event)=>setMrrDelta(event.target.value)} /></label>
                <label className="text-xs text-white/40">Effective<Input className="mt-1" type="datetime-local" value={effectiveAt} onChange={(event)=>setEffectiveAt(event.target.value)} /></label>
              </>}

              {mode === "capacity" && <>
                <label className="text-xs text-white/40">Service<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={capacityService} onChange={(event)=>setCapacityService(event.target.value)}>{services.map((item)=><option key={item}>{item}</option>)}</select></label>
                <label className="text-xs text-white/40">Capacity scope<Input className="mt-1" placeholder="e.g. Network operations team" value={capacityScope} onChange={(event)=>setCapacityScope(event.target.value)} /></label>
                <label className="text-xs text-white/40">Period start<Input className="mt-1" type="datetime-local" value={periodStart} onChange={(event)=>setPeriodStart(event.target.value)} /></label>
                <label className="text-xs text-white/40">Period end<Input className="mt-1" type="datetime-local" value={periodEnd} onChange={(event)=>setPeriodEnd(event.target.value)} /></label>
                <label className="text-xs text-white/40">Available hours<Input className="mt-1" type="number" min="0" value={availableHours} onChange={(event)=>setAvailableHours(event.target.value)} /></label>
                <label className="text-xs text-white/40">Delivery hours<Input className="mt-1" type="number" min="0" value={deliveryHours} onChange={(event)=>setDeliveryHours(event.target.value)} /></label>
                <label className="text-xs text-white/40">Billable hours<Input className="mt-1" type="number" min="0" value={billableHours} onChange={(event)=>setBillableHours(event.target.value)} /></label>
              </>}

              {mode === "budget" && <>
                <label className="text-xs text-white/40">Period start<Input className="mt-1" type="datetime-local" value={budgetPeriodStart} onChange={(event)=>setBudgetPeriodStart(event.target.value)} /></label>
                <label className="text-xs text-white/40">Period end<Input className="mt-1" type="datetime-local" value={budgetPeriodEnd} onChange={(event)=>setBudgetPeriodEnd(event.target.value)} /></label>
                <label className="text-xs text-white/40">Currency<Input className="mt-1" maxLength={3} value={currency} onChange={(event)=>setCurrency(event.target.value.toUpperCase())} /></label>
                <label className="text-xs text-white/40">Capital envelope<Input className="mt-1" type="number" min="0.01" value={envelopeAmount} onChange={(event)=>setEnvelopeAmount(event.target.value)} /></label>
              </>}

              {mode === "allocation" && <>
                <label className="text-xs text-white/40">Draft budget<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={budgetId} onChange={(event)=>setBudgetId(event.target.value)}>
                  <option value="">Select</option>{(budgets.data ?? []).filter((budget)=>budget.status==="draft").map((budget)=><option key={budget.id} value={budget.id}>{money(Number(budget.envelopeAmount), budget.currency)} · {new Date(budget.periodStart).toLocaleDateString()}</option>)}
                </select></label>
                <label className="text-xs text-white/40">Upstream recommendation<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white" value={recommendationKey} onChange={(event)=>{
                  const key=event.target.value;
                  setRecommendationKey(key);
                  setRecommendedAmount("");
                  setApprovedAmount("");
                }}>
                  <option value="">Select</option>{(revenue.data?.allocationRecommendations ?? []).map((row)=><option key={row.key} value={row.key}>{row.decision} · {row.channel} → {row.service.replace(/-/g," ")} · {row.currency}</option>)}
                </select></label>
                <label className="text-xs text-white/40">Recommended amount<Input className="mt-1" type="number" min="0" placeholder="Finance recommendation; no automatic multiplier" value={recommendedAmount} onChange={(event)=>setRecommendedAmount(event.target.value)} /></label>
                <label className="text-xs text-white/40">Approved amount<Input className="mt-1" type="number" min="0" value={approvedAmount} onChange={(event)=>setApprovedAmount(event.target.value)} /></label>
                <label className="text-xs text-white/40 md:col-span-2">Approval rationale<Textarea className="mt-1" rows={2} value={allocationRationale} onChange={(event)=>setAllocationRationale(event.target.value)} /></label>
              </>}

              {mode !== "allocation" && <label className="text-xs text-white/40 md:col-span-2">Source reference<Input className="mt-1" placeholder="Invoice, receipt, bank reference, contract, timesheet or budget memo" value={sourceReference} onChange={(event)=>setSourceReference(event.target.value)} /></label>}
            </div>
            {mode !== "allocation" && <Textarea className="mt-3" rows={2} placeholder="Evidence notes" value={notes} onChange={(event)=>setNotes(event.target.value)} />}
            <Button className="mt-3" disabled={submit.isPending} onClick={() => submit.mutate()}>
              Record {mode}
            </Button>
            {submit.error && <p className="mt-2 text-xs text-destructive">{submit.error.message}</p>}
          </CardContent></Card>
        </section>

        <section className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5">
          <div className="flex gap-3"><Landmark className="mt-0.5 h-5 w-5 text-primary" /><div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Capital governance boundary</h2>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-white/35">{capital.data?.controls.note ?? "Reinvestment signals remain advisory until an approved budget exists."}</p>
            <p className="mt-2 text-xs text-white/35">The operating chain is now explicit: gross profit → recurring revenue → cash realized → retention → realized capital return → approved reinvestment.</p>
          </div></div>
        </section>
      </div>
    </AdminShell>
  );
}
