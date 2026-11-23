import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  RefreshCw,
  ShieldCheck,
  Database,
  Mail,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
type Status = {
  sampledAt: string;
  release: { commitSha?: string; environment?: string; branch?: string };
  database: { role: string; branch_id: string | null };
  queue: Record<string, number>;
  integrations: Record<
    string,
    { configured: boolean; mode?: string; acceptance: string }
  >;
  releaseGates: Array<{
    key: string;
    label: string;
    state: string;
    detail: string;
  }>;
};
export default function OperationsControl() {
  const status = useQuery<Status>({
    queryKey: ["/api/admin/operations/status"],
    retry: false,
  });
  const data = status.data;
  return (
    <AdminShell
      title="Release & operations"
      description="Observed runtime state, delivery exceptions and separate release decisions"
    >
      <div className="operations-control">
        <div className="operations-intro">
          <div>
            <p className="portfolio-overline">Evidence-led control</p>
            <h2>
              Know what is observed.
              <br />
              <em>Keep the open gates visible.</em>
            </h2>
            <p>
              This view reads application state. Restore certification, provider
              acceptance and release approval require their own evidence.
            </p>
          </div>
          <button
            className="operations-button"
            disabled={status.isFetching}
            onClick={() => void status.refetch()}
          >
            <RefreshCw size={17} />
            {status.isFetching ? "Refreshing…" : "Refresh evidence"}
          </button>
        </div>
        {status.isLoading ? (
          <p role="status">Reading operations state…</p>
        ) : status.isError ? (
          <div className="operations-error" role="alert">
            <h3>Operations evidence unavailable</h3>
            <p>{status.error.message}</p>
            <p>No readiness result has been inferred.</p>
          </div>
        ) : (
          data && (
            <>
              <section className="operations-runtime">
                <div>
                  <Database size={23} />
                  <h3>Runtime identity</h3>
                  <dl>
                    <dt>Environment</dt>
                    <dd>{data.release.environment ?? "Unavailable"}</dd>
                    <dt>Commit</dt>
                    <dd className="operations-code">
                      {data.release.commitSha ?? "Unavailable"}
                    </dd>
                    <dt>Database branch</dt>
                    <dd className="operations-code">
                      {data.database.branch_id ?? "Not reported"}
                    </dd>
                    <dt>Database role</dt>
                    <dd>{data.database.role}</dd>
                  </dl>
                </div>
                <div>
                  <Mail size={23} />
                  <h3>Delivery attention</h3>
                  <div className="operations-queue">
                    {[
                      { key: "uncertain", label: "Uncertain acceptance" },
                      { key: "expired", label: "Expired worker leases" },
                      { key: "failed", label: "Failed / bounced / complained" },
                      { key: "pending", label: "Pending / retry queued" },
                    ].map((item) => (
                      <div key={item.key}>
                        <strong>{data.queue[item.key] ?? 0}</strong>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/admin/communications"
                    className="operations-link"
                  >
                    Inspect delivery records
                  </Link>
                </div>
              </section>
              <section>
                <div className="operations-section-title">
                  <ShieldCheck size={21} />
                  <h3>Integration configuration</h3>
                </div>
                <div className="operations-integrations">
                  {Object.entries(data.integrations).map(([name, item]) => (
                    <article key={name}>
                      <h4>{name}</h4>
                      <span
                        className={`operations-status ${item.configured ? "configured" : ""}`}
                      >
                        {item.configured
                          ? "Configured"
                          : "Disabled / incomplete"}
                      </span>
                      {item.mode && <p>Mode: {item.mode}</p>}
                      <p>Provider acceptance evidence required.</p>
                    </article>
                  ))}
                </div>
              </section>
              <section>
                <div className="operations-section-title">
                  <FileCheck2 size={21} />
                  <h3>Release gates</h3>
                </div>
                <div className="operations-gates">
                  {data.releaseGates.map((gate) => (
                    <article key={gate.key}>
                      <div>
                        <h4>{gate.label}</h4>
                        <span>
                          {gate.state === "owner_approval_required"
                            ? "Owner approval required"
                            : "External evidence required"}
                        </span>
                      </div>
                      <p>{gate.detail}</p>
                    </article>
                  ))}
                </div>
              </section>
              <p className="operations-sampled">
                Application evidence sampled{" "}
                {new Date(data.sampledAt).toLocaleString()}. Refreshing this
                view does not run workflows, send messages or change production
                data.
              </p>
            </>
          )
        )}
        <section className="operations-destinations">
          <h3>Continue the work</h3>
          <div>
            <Link href="/admin/workspace">Engineering records</Link>
            <Link href="/admin/content">Publication workflow</Link>
            <Link href="/admin/financial-requests">Financial receipts</Link>
            <Link href="/admin/security">Session & access controls</Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
