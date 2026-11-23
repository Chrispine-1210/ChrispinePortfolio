import { sql, type SQL } from "drizzle-orm";
import {
  acquisitionSpendEntries, capitalDeploymentEntries, directCostEntries,
  operatingExpenseEntries, revenueEvents, treasuryCashDisbursements,
} from "../../shared/schema.js";
import { moneyMinor, moneyNumber } from "../../shared/money.js";
import { db } from "../db.js";

type Period = "current" | "prior" | "runway";
type Source = "revenue" | "directCost" | "acquisition" | "operatingExpense" | "operatingDeployment" | "operatingOutflow";
type Total = { source: Source; period: Period; currency: string; amount: string; records: string };
type Coverage = { period: Period; currency: string; leads: string; complete: string };

// Run inside financialReadHandler's repeatable-read transaction. SUM stays in
// PostgreSQL numeric; neither row caps nor one SQL parameter per record apply.
export async function treasuryWindowTotals(now: Date, currentStart: Date, priorStart: Date, runwayStart: Date) {
  const windows = sql`windows(period,start_at,end_at) AS (VALUES
    ('current',${currentStart.toISOString()}::timestamp,${now.toISOString()}::timestamp),
    ('prior',${priorStart.toISOString()}::timestamp,${currentStart.toISOString()}::timestamp),
    ('runway',${runwayStart.toISOString()}::timestamp,${now.toISOString()}::timestamp))`;
  const sources = [
    { name: "revenue", table: revenueEvents, at: revenueEvents.occurredAt, extra: sql`true` },
    { name: "directCost", table: directCostEntries, at: directCostEntries.occurredAt, extra: sql`true` },
    { name: "acquisition", table: acquisitionSpendEntries, at: acquisitionSpendEntries.occurredAt, extra: sql`true` },
    { name: "operatingExpense", table: operatingExpenseEntries, at: operatingExpenseEntries.occurredAt, extra: sql`true` },
    { name: "operatingDeployment", table: capitalDeploymentEntries, at: capitalDeploymentEntries.occurredAt,
      extra: sql`${capitalDeploymentEntries.category} IN ('growth_capex','working_capital','product_development')` },
    { name: "operatingOutflow", table: treasuryCashDisbursements, at: treasuryCashDisbursements.occurredAt,
      extra: sql`${treasuryCashDisbursements.cashUseType}='operating'` },
  ] as const;
  const parts: SQL[] = sources.map(source => sql`SELECT ${source.name}::text AS source,w.period,
    ${source.table.currency} AS currency,sum(${source.table.amount})::text AS amount,count(*)::text AS records
    FROM ${source.table} CROSS JOIN windows w
    WHERE ${source.table.voidedAt} IS NULL AND ${source.extra}
      AND ${source.at}>=w.start_at
      AND (${source.at}<w.end_at OR (w.period<>'prior' AND ${source.at}=w.end_at))
    GROUP BY w.period,${source.table.currency}`);
  const [totals, coverage] = await Promise.all([
    db.execute<Total>(sql`WITH ${windows} ${sql.join(parts,sql` UNION ALL `)}`),
    db.execute<Coverage>(sql`WITH ${windows}, latest_cost AS (
      SELECT lead_id,currency,max(through_at) AS through_at FROM cost_evidence_attestations
      WHERE voided_at IS NULL GROUP BY lead_id,currency
    ), revenue_leads AS (
      SELECT w.period,r.currency,r.lead_id,max(r.occurred_at) AS latest_revenue
      FROM revenue_events r CROSS JOIN windows w
      WHERE w.period<>'runway' AND r.voided_at IS NULL AND r.occurred_at>=w.start_at
        AND (r.occurred_at<w.end_at OR (w.period='current' AND r.occurred_at=w.end_at))
      GROUP BY w.period,r.currency,r.lead_id
    ) SELECT r.period,r.currency,count(*)::text AS leads,
      count(*) FILTER(WHERE c.through_at>=r.latest_revenue)::text AS complete
      FROM revenue_leads r LEFT JOIN latest_cost c ON c.lead_id=r.lead_id AND c.currency=r.currency
      GROUP BY r.period,r.currency`),
  ]);
  const amounts = new Map(totals.rows.map(row => [`${row.source}:${row.period}:${row.currency}`,row.amount]));
  return {
    currencies: [...new Set(totals.rows.map(row => row.currency))],
    sourceRecordCount: totals.rows.filter(row=>row.period!=="runway").reduce((n,row)=>n+Number(row.records),0),
    amount: (source: Source, period: Period, currency: string) => moneyNumber(moneyMinor(amounts.get(`${source}:${period}:${currency}`)??"0")),
    coverage: (period: Period,currency: string) => {
      const row=coverage.rows.find(row=>row.period===period&&row.currency===currency);
      return {leads:Number(row?.leads??0),complete:Number(row?.complete??0)};
    },
  };
}
