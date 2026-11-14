import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  Banknote,
  BarChart3,
  CircleGauge,
  Landmark,
  RefreshCw,
  Scale,
  ShieldCheck,
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

type Posture =
  | "reinvest_candidate"
  | "selective"
  | "preserve_capital"
  | "preserve_liquidity"
  | "insufficient_data";

interface TreasuryIntelligence {
  asOf: string;
  definitions: Record<string, string>;
  treasury: {
    cashPositionByCurrency: Array<{
      currency: string;
      ledgerBalance: number;
      availableBalance: number;
      restrictedBalance: number;
      unrestrictedCash: number;
      accountCount: number;
      missingBalanceCount: number;
      freshestCapturedAt: string | null;
      stalestCapturedAt: string | null;
      balanceFresh: boolean;
    }>;
    runwayByCurrency: Array<{
      currency: string;
      unrestrictedCash: number;
      ninetyDayOperatingCashOutflow: number;
      monthlyOperatingCashBurn: number | null;
      runwayMonths: number | null;
      cashEvidenceComplete: boolean;
      balanceFresh: boolean;
    }>;
  };
  companyRoic: Array<{
    currency: string;
    currentTtm: {
      start: string;
      end: string;
      revenue: number;
      directCost: number | null;
      acquisitionSpend: number;
      operatingExpense: number | null;
      ebit: number | null;
      taxProvision: number | null;
      nopat: number | null;
      beginningInvestedCapital: number | null;
      endingInvestedCapital: number | null;
      averageInvestedCapital: number | null;
      roicPct: number | null;
      capitalTurnover: number | null;
      operatingDeployment: number;
      operatingDeploymentRatePct: number | null;
      evidence: {
        revenueLeadCount: number;
        directCostCoveragePct: number;
        operatingExpenseComplete: boolean;
        taxCoveragePct: number;
        beginningCapitalSnapshotFresh: boolean;
        endingCapitalSnapshotFresh: boolean;
        complete: boolean;
      };
    };
    priorTtm: {
      nopat: number | null;
      averageInvestedCapital: number | null;
      roicPct: number | null;
    };
    hurdle: {
      id: string;
      annualHurdleRatePct: number;
      effectiveFrom: string;
      effectiveTo: string | null;
    } | null;
    valueCreationSpreadPct: number | null;
    economicProfit: number | null;
    deltaNopat: number | null;
    deltaAverageInvestedCapital: number | null;
    incrementalRoicPct: number | null;
    posture: Posture;
    reasons: string[];
  }>;
  controls: {
    currenciesNeverBlended: boolean;
    noAssumedTaxRate: boolean;
    noAssumedCostOfCapital: boolean;
    noAssumedMissingExpenses: boolean;
    postureIsAdvisory: boolean;
    note: string;
  };
}

interface TreasuryAccount {
  id: string;
  name: string;
  institution: string | null;
  accountType: string;
  currency: string;
  status: string;
  sourceReference: string;
  archivedAt: string | null;
}

interface Evidence {
  accounts: TreasuryAccount[];
  balances: Array<Record<string, any>>;
  disbursements: Array<Record<string, any>>;
  expenses: Array<Record<string, any>>;
  taxes: Array<Record<string, any>>;
  investedCapital: Array<Record<string, any>>;
  deployments: Array<Record<string, any>>;
  attestations: Array<Record<string, any>>;
  hurdles: Array<Record<string, any>>;
}

interface Budget {
  id: string;
  currency: string;
  status: string;
  envelopeAmount: string;
  allocations: Array<{
    id: string;
    channel: string;
    serviceInterest: string;
    approvedAmount: string;
  }>;
}

type Mode =
  | "account"
  | "balance"
  | "cash"
  | "opex"
  | "tax"
  | "invested-capital"
  | "deployment"
  | "attestation"
  | "hurdle";

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
  return value === null ? "—" : `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function postureClass(value: Posture) {
  if (value === "reinvest_candidate") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (value === "selective") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (value === "preserve_liquidity") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (value === "preserve_capital") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-white/10 bg-white/[0.03] text-white/45";
}

export default function TreasuryRoic() {
  const [mode, setMode] = useState<Mode>("account");
  const [currency, setCurrency] = useState("MWK");
  const [sourceReference, setSourceReference] = useState("");
  const [notes, setNotes] = useState("");

  const [accountName, setAccountName] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState("bank");
  const [accountId, setAccountId] = useState("");
  const [ledgerBalance, setLedgerBalance] = useState("");
  const [availableBalance, setAvailableBalance] = useState("");
  const [restrictedBalance, setRestrictedBalance] = useState("0");

  const [amount, setAmount] = useState("");
  const [cashUseType, setCashUseType] = useState("operating");
  const [cashCategory, setCashCategory] = useState("payroll");
  const [serviceInterest, setServiceInterest] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  const [opexCategory, setOpexCategory] = useState("payroll_overhead");
  const [periodStart, setPeriodStart] = useState(new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 16));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 16));
  const [operatingAssets, setOperatingAssets] = useState("");
  const [operatingLiabilities, setOperatingLiabilities] = useState("");
  const [components, setComponents] = useState("{}");

  const [budgetAllocationId, setBudgetAllocationId] = useState("");
  const [deploymentCategory, setDeploymentCategory] = useState("growth_capex");
  const [approvalReference, setApprovalReference] = useState("");

  const [evidenceType, setEvidenceType] = useState("operating_expenses_complete");
  const [hurdleRate, setHurdleRate] = useState("");
  const [hurdleRationale, setHurdleRationale] = useState("");

  const intelligence = useQuery<TreasuryIntelligence>({
    queryKey: ["/api/admin/treasury/intelligence"],
  });
  const evidence = useQuery<Evidence>({
    queryKey: ["/api/admin/treasury/evidence"],
  });
  const budgets = useQuery<Budget[]>({
    queryKey: ["/api/admin/capital/budgets"],
  });

  const approvedAllocations = useMemo(
    () => (budgets.data ?? [])
      .filter((budget) => budget.status === "approved")
      .flatMap((budget) =>
        budget.allocations.map((allocation) => ({
          ...allocation,
          currency: budget.currency,
        }))),
    [budgets.data],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/treasury/intelligence"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/treasury/evidence"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/capital/budgets"] });
  };

  const submit = useMutation({
    mutationFn: async () => {
      const occurred = new Date(occurredAt).toISOString();
      if (mode === "account") {
        return apiRequest("POST", "/api/admin/treasury/accounts", {
          name: accountName,
          institution: institution || null,
          accountType,
          currency,
          status: "active",
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "balance") {
        return apiRequest("POST", "/api/admin/treasury/balances", {
          accountId,
          currency,
          ledgerBalance: Number(ledgerBalance),
          availableBalance: Number(availableBalance),
          restrictedBalance: Number(restrictedBalance),
          capturedAt: occurred,
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "cash") {
        return apiRequest("POST", "/api/admin/treasury/disbursements", {
          accountId: accountId || null,
          currency,
          amount: Number(amount),
          cashUseType,
          category: cashCategory,
          serviceInterest: serviceInterest || null,
          occurredAt: occurred,
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "opex") {
        return apiRequest("POST", "/api/admin/treasury/operating-expenses", {
          currency,
          amount: Number(amount),
          category: opexCategory,
          serviceInterest: serviceInterest || null,
          occurredAt: occurred,
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "tax") {
        return apiRequest("POST", "/api/admin/treasury/tax-provisions", {
          currency,
          amount: Number(amount),
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
          recognizedAt: occurred,
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "invested-capital") {
        let parsedComponents: Record<string, unknown> = {};
        try {
          parsedComponents = components.trim() ? JSON.parse(components) : {};
        } catch {
          throw new Error("Invested-capital components must be valid JSON.");
        }
        return apiRequest("POST", "/api/admin/treasury/invested-capital", {
          currency,
          operatingAssets: Number(operatingAssets),
          operatingLiabilities: Number(operatingLiabilities),
          capturedAt: occurred,
          components: parsedComponents,
          sourceReference,
          notes: notes || null,
        });
      }
      if (mode === "deployment") {
        return apiRequest("POST", "/api/admin/treasury/deployments", {
          budgetAllocationId: budgetAllocationId || null,
          currency,
          amount: Number(amount),
          category: deploymentCategory,
          serviceInterest: serviceInterest || null,
          occurredAt: occurred,
          sourceReference,
          approvalReference,
          notes: notes || null,
        });
      }
      if (mode === "attestation") {
        return apiRequest("POST", "/api/admin/treasury/attestations", {
          currency,
          evidenceType,
          throughAt: occurred,
          sourceReference,
          notes: notes || null,
        });
      }
      return apiRequest("POST", "/api/admin/treasury/hurdle-policies", {
        currency,
        annualHurdleRatePct: Number(hurdleRate),
        effectiveFrom: occurred,
        effectiveTo: null,
        rationale: hurdleRationale,
      });
    },
    onSuccess: () => {
      setAmount("");
      setSourceReference("");
      setNotes("");
      setLedgerBalance("");
      setAvailableBalance("");
      setRestrictedBalance("0");
      setOperatingAssets("");
      setOperatingLiabilities("");
      setApprovalReference("");
      setHurdleRate("");
      setHurdleRationale("");
      refresh();
    },
  });

  const primaryRoic = intelligence.data?.companyRoic[0];
  const primaryRunway = intelligence.data?.treasury.runwayByCurrency[0];

  return (
    <AdminShell
      title="Treasury & company ROIC"
      description="Liquidity, operating return on invested capital, hurdle-rate spread and governed capital deployment"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Company capital command</p>
              <h2 className="mt-2 max-w-4xl text-2xl font-black tracking-tight">
                Cash liquidity → NOPAT → invested capital → ROIC → value-creation spread → governed deployment
              </h2>
              <p className="mt-2 max-w-4xl text-xs leading-5 text-white/35">
                Treasury cash, accounting profitability and invested capital remain separate evidence systems.
                No currency conversion, tax rate, cost of capital or missing expense is assumed.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh evidence
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <WalletCards className="h-5 w-5 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider text-white/30">unrestricted cash</span>
              </div>
              <div className="mt-4 space-y-1">
                {(intelligence.data?.treasury.cashPositionByCurrency ?? []).map((row) => (
                  <p key={row.currency} className="text-xl font-black">{money(row.unrestrictedCash, row.currency)}</p>
                ))}
                {!intelligence.data?.treasury.cashPositionByCurrency.length && <p className="text-xl font-black">—</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <CircleGauge className="h-5 w-5 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wider text-white/30">verified runway</span>
              </div>
              <p className="mt-4 text-2xl font-black">
                {primaryRunway?.runwayMonths === null || primaryRunway?.runwayMonths === undefined
                  ? "—"
                  : `${primaryRunway.runwayMonths.toFixed(2)} mo`}
              </p>
              <p className="mt-1 text-xs text-white/35">{primaryRunway?.currency ?? "No complete cash evidence"}</p>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-violet-400" />
                <span className="text-[10px] uppercase tracking-wider text-white/30">TTM ROIC</span>
              </div>
              <p className="mt-4 text-2xl font-black">{pct(primaryRoic?.currentTtm.roicPct ?? null)}</p>
              <p className="mt-1 text-xs text-white/35">
                hurdle {pct(primaryRoic?.hurdle?.annualHurdleRatePct ?? null)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Scale className="h-5 w-5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-white/30">value spread</span>
              </div>
              <p className="mt-4 text-2xl font-black">{pct(primaryRoic?.valueCreationSpreadPct ?? null)}</p>
              <p className="mt-1 text-xs text-white/35">
                economic profit {primaryRoic ? money(primaryRoic.economicProfit, primaryRoic.currency) : "—"}
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-0">
              <div className="border-b border-white/[0.07] p-5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Company return on invested capital</h2>
                    <p className="mt-1 text-xs text-white/30">
                      TTM NOPAT ÷ average beginning/ending operating invested capital. Each currency is isolated.
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px] text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-white/35">
                    <tr>
                      <th className="px-5 py-3">Posture</th>
                      <th className="px-3 py-3">Currency</th>
                      <th className="px-3 py-3">Revenue</th>
                      <th className="px-3 py-3">EBIT</th>
                      <th className="px-3 py-3">NOPAT</th>
                      <th className="px-3 py-3">Avg invested capital</th>
                      <th className="px-3 py-3">ROIC</th>
                      <th className="px-3 py-3">Hurdle</th>
                      <th className="px-3 py-3">Spread</th>
                      <th className="px-3 py-3">Economic profit</th>
                      <th className="px-3 py-3">Capital turnover</th>
                      <th className="px-3 py-3">Incremental ROIC</th>
                      <th className="px-3 py-3">Operating deployment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(intelligence.data?.companyRoic ?? []).map((row) => (
                      <tr key={row.currency} className="border-b border-white/[0.05] align-top last:border-0">
                        <td className="px-5 py-3">
                          <Badge className={postureClass(row.posture)}>{row.posture.replace(/_/g, " ")}</Badge>
                          {row.reasons.map((reason) => (
                            <p key={reason} className="mt-2 max-w-64 text-[10px] leading-4 text-white/30">{reason}</p>
                          ))}
                        </td>
                        <td className="px-3 py-3 font-semibold">{row.currency}</td>
                        <td className="px-3 py-3">{money(row.currentTtm.revenue, row.currency)}</td>
                        <td className="px-3 py-3">{money(row.currentTtm.ebit, row.currency)}</td>
                        <td className="px-3 py-3">{money(row.currentTtm.nopat, row.currency)}</td>
                        <td className="px-3 py-3">{money(row.currentTtm.averageInvestedCapital, row.currency)}</td>
                        <td className="px-3 py-3 font-semibold">{pct(row.currentTtm.roicPct)}</td>
                        <td className="px-3 py-3">{pct(row.hurdle?.annualHurdleRatePct ?? null)}</td>
                        <td className="px-3 py-3">{pct(row.valueCreationSpreadPct)}</td>
                        <td className="px-3 py-3">{money(row.economicProfit, row.currency)}</td>
                        <td className="px-3 py-3">{row.currentTtm.capitalTurnover ?? "—"}x</td>
                        <td className="px-3 py-3">{pct(row.incrementalRoicPct)}</td>
                        <td className="px-3 py-3">
                          {money(row.currentTtm.operatingDeployment, row.currency)}
                          <p className="mt-1 text-[10px] text-white/30">{pct(row.currentTtm.operatingDeploymentRatePct)} of NOPAT</p>
                        </td>
                      </tr>
                    ))}
                    {!intelligence.data?.companyRoic.length && (
                      <tr><td colSpan={13} className="px-5 py-10 text-center text-white/25">No company ROIC evidence yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider">Treasury liquidity</h2>
                <Banknote className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-4 space-y-3">
                {(intelligence.data?.treasury.cashPositionByCurrency ?? []).map((cash) => {
                  const run = intelligence.data?.treasury.runwayByCurrency.find((row) => row.currency === cash.currency);
                  return (
                    <div key={cash.currency} className="rounded-lg border border-white/[0.06] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{cash.currency}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{cash.accountCount} accounts</Badge>
                          {cash.missingBalanceCount > 0 && <Badge className="bg-red-500/10 text-red-300">{cash.missingBalanceCount} missing balances</Badge>}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div><p className="text-white/30">Available</p><p className="mt-1 font-semibold">{money(cash.availableBalance, cash.currency)}</p></div>
                        <div><p className="text-white/30">Restricted</p><p className="mt-1 font-semibold">{money(cash.restrictedBalance, cash.currency)}</p></div>
                        <div><p className="text-white/30">Unrestricted</p><p className="mt-1 font-semibold">{money(cash.unrestrictedCash, cash.currency)}</p></div>
                        <div><p className="text-white/30">Runway</p><p className="mt-1 font-semibold">{run?.runwayMonths == null ? "—" : `${run.runwayMonths.toFixed(2)} months`}</p></div>
                      </div>
                    </div>
                  );
                })}
                {!intelligence.data?.treasury.cashPositionByCurrency.length && <p className="text-xs text-white/25">No treasury balances recorded.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider">Evidence gates</h2>
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-3">
                {(intelligence.data?.companyRoic ?? []).map((row) => (
                  <div key={row.currency} className="rounded-lg border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{row.currency}</p>
                      <Badge className={row.currentTtm.evidence.complete ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                        {row.currentTtm.evidence.complete ? "complete" : "incomplete"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-white/40">
                      <p>Direct cost coverage: {pct(row.currentTtm.evidence.directCostCoveragePct)}</p>
                      <p>Tax coverage: {pct(row.currentTtm.evidence.taxCoveragePct)}</p>
                      <p>Operating expenses: {row.currentTtm.evidence.operatingExpenseComplete ? "attested" : "missing attestation"}</p>
                      <p>Opening capital: {row.currentTtm.evidence.beginningCapitalSnapshotFresh ? "fresh" : "missing/stale"}</p>
                      <p>Closing capital: {row.currentTtm.evidence.endingCapitalSnapshotFresh ? "fresh" : "missing/stale"}</p>
                      <p>Hurdle: {row.hurdle ? "approved" : "not approved"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/[0.07] bg-white/[0.018]">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider">Treasury / ROIC evidence intake</h2>
                  <p className="mt-1 text-xs text-white/30">
                    Finance records evidence; hurdle-rate approval remains a separate high-authority action.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["account","balance","cash","opex","tax","invested-capital","deployment","attestation","hurdle"] as Mode[]).map((item) => (
                    <Button key={item} size="sm" variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {mode === "account" && <>
                  <label className="text-xs text-white/40">Account name<Input className="mt-1" value={accountName} onChange={(event)=>setAccountName(event.target.value)} /></label>
                  <label className="text-xs text-white/40">Institution<Input className="mt-1" value={institution} onChange={(event)=>setInstitution(event.target.value)} /></label>
                  <label className="text-xs text-white/40">Account type<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountType} onChange={(event)=>setAccountType(event.target.value)}>{["bank","mobile_money","cash","money_market","other"].map((item)=><option key={item}>{item}</option>)}</select></label>
                </>}

                {mode === "balance" && <>
                  <label className="text-xs text-white/40">Treasury account<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountId} onChange={(event)=>{setAccountId(event.target.value); const account=evidence.data?.accounts.find((row)=>row.id===event.target.value); if(account)setCurrency(account.currency);}}><option value="">Select</option>{(evidence.data?.accounts ?? []).filter((row)=>!row.archivedAt).map((row)=><option key={row.id} value={row.id}>{row.name} · {row.currency}</option>)}</select></label>
                  <label className="text-xs text-white/40">Ledger balance<Input className="mt-1" type="number" min="0" value={ledgerBalance} onChange={(event)=>setLedgerBalance(event.target.value)} /></label>
                  <label className="text-xs text-white/40">Available balance<Input className="mt-1" type="number" min="0" value={availableBalance} onChange={(event)=>setAvailableBalance(event.target.value)} /></label>
                  <label className="text-xs text-white/40">Restricted balance<Input className="mt-1" type="number" min="0" value={restrictedBalance} onChange={(event)=>setRestrictedBalance(event.target.value)} /></label>
                </>}

                {mode === "cash" && <>
                  <label className="text-xs text-white/40">Treasury account<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={accountId} onChange={(event)=>{setAccountId(event.target.value); const account=evidence.data?.accounts.find((row)=>row.id===event.target.value); if(account)setCurrency(account.currency);}}><option value="">Optional account</option>{(evidence.data?.accounts ?? []).filter((row)=>!row.archivedAt).map((row)=><option key={row.id} value={row.id}>{row.name} · {row.currency}</option>)}</select></label>
                  <label className="text-xs text-white/40">Cash-use type<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={cashUseType} onChange={(event)=>setCashUseType(event.target.value)}>{["operating","capital","financing"].map((item)=><option key={item}>{item}</option>)}</select></label>
                  <label className="text-xs text-white/40">Category<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={cashCategory} onChange={(event)=>setCashCategory(event.target.value)}>{["direct_delivery","payroll","marketing","software_infrastructure","rent_utilities","professional_fees","tax","other_operating","growth_capex","maintenance_capex","working_capital","product_development","debt_service","owner_distribution","other_financing"].map((item)=><option key={item}>{item}</option>)}</select></label>
                </>}

                {mode === "opex" && <label className="text-xs text-white/40">Operating expense category<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={opexCategory} onChange={(event)=>setOpexCategory(event.target.value)}>{["payroll_overhead","rent_utilities","software_tools","professional_fees","insurance","travel_admin","governance","depreciation_amortization","other"].map((item)=><option key={item}>{item}</option>)}</select></label>}

                {mode === "tax" && <>
                  <label className="text-xs text-white/40">Tax period start<Input className="mt-1" type="datetime-local" value={periodStart} onChange={(event)=>setPeriodStart(event.target.value)} /></label>
                  <label className="text-xs text-white/40">Tax period end<Input className="mt-1" type="datetime-local" value={periodEnd} onChange={(event)=>setPeriodEnd(event.target.value)} /></label>
                </>}

                {mode === "invested-capital" && <>
                  <label className="text-xs text-white/40">Operating assets<Input className="mt-1" type="number" min="0" value={operatingAssets} onChange={(event)=>setOperatingAssets(event.target.value)} /></label>
                  <label className="text-xs text-white/40">Operating liabilities<Input className="mt-1" type="number" min="0" value={operatingLiabilities} onChange={(event)=>setOperatingLiabilities(event.target.value)} /></label>
                  <label className="text-xs text-white/40 md:col-span-2">Component evidence JSON<Textarea className="mt-1 font-mono text-xs" rows={2} value={components} onChange={(event)=>setComponents(event.target.value)} /></label>
                </>}

                {mode === "deployment" && <>
                  <label className="text-xs text-white/40">Approved budget allocation<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={budgetAllocationId} onChange={(event)=>{setBudgetAllocationId(event.target.value);const row=approvedAllocations.find((item)=>item.id===event.target.value);if(row){setCurrency(row.currency);setServiceInterest(row.serviceInterest);}}}><option value="">Select when required</option>{approvedAllocations.map((row)=><option key={row.id} value={row.id}>{row.channel} → {row.serviceInterest} · {row.currency} · approved {row.approvedAmount}</option>)}</select></label>
                  <label className="text-xs text-white/40">Deployment category<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={deploymentCategory} onChange={(event)=>setDeploymentCategory(event.target.value)}>{["growth_capex","maintenance_capex","working_capital","product_development","strategic_investment","debt_repayment","owner_distribution"].map((item)=><option key={item}>{item}</option>)}</select></label>
                  <label className="text-xs text-white/40">Approval reference<Input className="mt-1" value={approvalReference} onChange={(event)=>setApprovalReference(event.target.value)} /></label>
                </>}

                {mode === "attestation" && <label className="text-xs text-white/40">Completeness attestation<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={evidenceType} onChange={(event)=>setEvidenceType(event.target.value)}><option value="operating_expenses_complete">operating expenses complete</option><option value="cash_disbursements_complete">cash disbursements complete</option></select></label>}

                {mode === "hurdle" && <>
                  <label className="text-xs text-white/40">Annual hurdle rate %<Input className="mt-1" type="number" min="0" step="0.01" value={hurdleRate} onChange={(event)=>setHurdleRate(event.target.value)} /></label>
                  <label className="text-xs text-white/40 md:col-span-2">Approval rationale<Textarea className="mt-1" rows={2} value={hurdleRationale} onChange={(event)=>setHurdleRationale(event.target.value)} /></label>
                </>}

                {!["account","balance","invested-capital"].includes(mode) && mode !== "attestation" && mode !== "hurdle" && <label className="text-xs text-white/40">Amount<Input className="mt-1" type="number" min="0" value={amount} onChange={(event)=>setAmount(event.target.value)} /></label>}
                {["cash","opex","deployment"].includes(mode) && <label className="text-xs text-white/40">Service<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={serviceInterest} onChange={(event)=>setServiceInterest(event.target.value)}><option value="">Company-wide / none</option>{services.map((item)=><option key={item}>{item}</option>)}</select></label>}
                {mode !== "account" && <label className="text-xs text-white/40">Evidence date<Input className="mt-1" type="datetime-local" value={occurredAt} onChange={(event)=>setOccurredAt(event.target.value)} /></label>}
                <label className="text-xs text-white/40">Currency<Input className="mt-1" maxLength={3} value={currency} onChange={(event)=>setCurrency(event.target.value.toUpperCase())} /></label>
                {mode !== "hurdle" && <label className="text-xs text-white/40 md:col-span-2">Source reference<Input className="mt-1" placeholder="Bank statement, management accounts, tax working, balance sheet, board approval…" value={sourceReference} onChange={(event)=>setSourceReference(event.target.value)} /></label>}
              </div>

              {mode !== "hurdle" && <Textarea className="mt-3" rows={2} placeholder="Evidence notes" value={notes} onChange={(event)=>setNotes(event.target.value)} />}
              <Button className="mt-3" disabled={submit.isPending} onClick={() => submit.mutate()}>
                Record {mode}
              </Button>
              {submit.error && <p className="mt-2 text-xs text-destructive">{submit.error.message}</p>}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5">
          <div className="flex gap-3">
            <Landmark className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Capital doctrine</h2>
              <p className="mt-2 max-w-5xl text-xs leading-5 text-white/35">
                {intelligence.data?.controls.note ?? "Treasury and ROIC evidence is advisory until governed capital authorization exists."}
              </p>
              <p className="mt-2 text-xs text-white/35">
                A large cash balance does not prove profitability. Positive NOPAT does not prove capital efficiency.
                ROIC above a hurdle does not authorize deployment. Each statement is independently evidenced.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
