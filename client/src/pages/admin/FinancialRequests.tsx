import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { pendingFinancialRequests, resolveFinancialRequest } from "@/lib/financial-request-store";

type Receipt = { state: "unconfirmed" | "recorded"; key: string; status?: number; method?: string; path?: string; originalRequestId?: string; recordedAt?: string; result?: unknown; message?: string };
export default function FinancialRequests() {
  const { user } = useCustomAuth();
  const activeActor = useRef(user?.id);
  activeActor.current = user?.id;
  const [key, setKey] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setReceipt(null); setKey(""); setError(""); }, [user?.id]);
  let pending: ReturnType<typeof pendingFinancialRequests> = [], storageError = "";
  try { if (user?.id) pending = pendingFinancialRequests(user.id); }
  catch (problem) { storageError = problem instanceof Error ? problem.message : "Saved references unavailable"; }
  async function inspect(reference: string) {
    const actor = user?.id;
    setKey(reference); setBusy(true); setError(""); setReceipt(null);
    try {
      const response = await fetch(`/api/admin/financial-requests/${encodeURIComponent(reference)}`, { credentials: "include", cache: "no-store" });
      const result = await response.json();
      if (activeActor.current !== actor) return;
      if (!response.ok) throw new Error(result.message ?? "The request reference could not be inspected");
      setReceipt(result);
    } catch (problem) { if (activeActor.current === actor) setError(problem instanceof Error ? problem.message : "Inspection failed"); }
    finally { setBusy(false); }
  }
  return <AdminShell title="Financial requests" description="Reconcile financial changes after a lost or incomplete response.">
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-white/70">A recorded receipt confirms the original result. An unconfirmed reference may still be running. Keep its reference and check again before making another submission.</p>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={event => { event.preventDefault(); void inspect(key); }}>
        <label className="flex-1 text-sm">Request reference<Input className="mt-2" value={key} onChange={event => setKey(event.target.value)} required minLength={20} maxLength={100} placeholder="Enter the saved request reference" /></label>
        <Button className="sm:self-end" disabled={busy} type="submit">{busy ? "Checking…" : "Check receipt"}</Button>
      </form>
      {(error || storageError) && <p role="alert" className="text-sm text-red-300">{error || storageError}</p>}
      {receipt && <section aria-live="polite" className="space-y-3 rounded-xl border border-white/15 p-5">
        <h2 className="font-semibold">{receipt.state === "recorded" ? `Recorded result · HTTP ${receipt.status}` : "Outcome unconfirmed"}</h2>
        <p className="break-all font-mono text-xs">{receipt.key}</p>
        {receipt.state === "recorded" ? <>
          <p className="break-all text-sm text-white/70">{receipt.method} {receipt.path}</p>
          <p className="text-xs text-white/60">Original request: {receipt.originalRequestId} · {receipt.recordedAt}</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/20 p-3 text-xs">{JSON.stringify(receipt.result, null, 2)}</pre>
          <Button variant="outline" onClick={() => { if (user?.id) resolveFinancialRequest(user.id, receipt.key); setReceipt(null); }}>Acknowledge recorded result</Button>
        </> : <p className="text-sm text-amber-200">{receipt.message}</p>}
      </section>}
      <section className="space-y-3"><h2 className="font-semibold">Saved references on this browser</h2>
        {pending.length ? pending.map(item => <div key={item.key} className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 text-sm"><p className="break-all">{item.method} {item.path}</p><p className="break-all font-mono text-xs text-white/60">{item.key}</p><p className="text-xs text-white/60">{item.createdAt}</p></div><Button variant="outline" disabled={busy} onClick={() => void inspect(item.key)}>Check receipt</Button></div>) : <p className="text-sm text-white/60">No unresolved references are saved for this account.</p>}
      </section>
    </div>
  </AdminShell>;
}
