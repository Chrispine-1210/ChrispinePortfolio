import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Save } from "lucide-react";
import {
  recordKinds,
  statuses,
  emptyDetails,
  recordInput,
  type EngineeringRecord,
  type EngineeringContext,
  type RecordKind,
} from "@shared/engineering";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

export const kindLabels: Record<RecordKind, string> = {
  diary: "Engineering diary",
  task: "Delivery tasks",
  work_log: "Daily work ledger",
  risk: "Risk register",
  decision: "Decisions",
  meeting: "Meetings",
  presentation: "Presentations",
  content: "Content studio",
  ai_review: "AI review",
  asset: "Asset register",
  security_event: "Security observations",
  practice: "Skills & deliberate practice",
};
const topicChoices = [
  "networking",
  "programming",
  "hardware",
  "servers",
  "software",
  "cybersecurity",
  "embedded",
];
type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "date"
    | "datetime"
    | "boolean"
    | "list"
    | "links"
    | "asset";
  options?: string[];
  hint?: string;
};
export const fieldsByKind: Record<RecordKind, Field[]> = {
  diary: [
    {
      key: "objective",
      label: "What is the engineering question or objective?",
    },
    { key: "work", label: "What did you investigate, build or repair?" },
    { key: "lesson", label: "What did the evidence teach you?" },
    { key: "nextStep", label: "Next practical step" },
    { key: "topic", label: "Skill area", options: topicChoices },
    {
      key: "minutes",
      label: "Reflection estimate, minutes",
      type: "number",
      hint: "Use the work ledger for counted daily effort; diary estimates are not counted again.",
    },
  ],
  task: [
    { key: "acceptance", label: "Definition of done" },
    { key: "result", label: "Delivered result / evidence summary" },
    { key: "dependencies", label: "Prerequisite tasks", type: "links" },
    {
      key: "impact",
      label: "Primary contribution",
      options: ["delivery", "revenue", "reliability", "learning", "delegation"],
    },
    {
      key: "effortMinutes",
      label: "Estimated effort, minutes",
      type: "number",
    },
  ],
  work_log: [
    { key: "minutes", label: "Actual time spent, minutes", type: "number" },
    {
      key: "category",
      label: "Work category",
      options: ["delivery", "learning", "maintenance", "coordination"],
    },
    { key: "result", label: "Concrete result" },
    { key: "relatedEntries", label: "Related work", type: "links" },
  ],
  risk: [
    { key: "likelihood", label: "Likelihood, 1–5", type: "number" },
    { key: "impact", label: "Impact, 1–5", type: "number" },
    { key: "mitigation", label: "Mitigation and accountable next step" },
    { key: "trigger", label: "What would trigger a response?" },
    { key: "reviewDate", label: "Review date", type: "date" },
  ],
  decision: [
    { key: "problem", label: "Decision to make" },
    { key: "options", label: "Options, one per line", type: "list" },
    { key: "choice", label: "Selected option (must match an option)" },
    { key: "rationale", label: "Reason and evidence" },
    { key: "expectedBenefit", label: "Expected value and how to measure it" },
    { key: "reviewDate", label: "Review date", type: "date" },
    {
      key: "reversible",
      label: "This decision can be reversed",
      type: "boolean",
    },
  ],
  meeting: [
    {
      key: "startsAt",
      label: "Start time (include timezone offset)",
      type: "text",
    },
    {
      key: "endsAt",
      label: "End time (include timezone offset)",
      type: "text",
    },
    { key: "agenda", label: "Agenda and intended decision" },
    { key: "participants", label: "Participants / roles", type: "text" },
    { key: "minutes", label: "Minutes and decisions" },
    { key: "actionEntries", label: "Follow-up tasks", type: "links" },
  ],
  presentation: [
    { key: "audience", label: "Audience", type: "text" },
    { key: "objective", label: "Desired audience decision" },
    { key: "keyMessage", label: "Core message" },
    {
      key: "sections",
      label: "Slide / section headings, one per line",
      type: "list",
    },
    { key: "runOfShow", label: "Run of show and timing" },
    { key: "rehearsalNotes", label: "Rehearsal notes" },
    {
      key: "assetUrl",
      label: "Approved presentation link, optional",
      type: "text",
    },
  ],
  content: [
    { key: "topic", label: "Skill area", options: topicChoices },
    {
      key: "platform",
      label: "Publishing destination",
      options: [
        "website",
        "youtube",
        "vimeo",
        "facebook",
        "instagram",
        "tiktok",
        "linkedin",
      ],
    },
    {
      key: "mediaUrl",
      label: "Video or social post URL, optional",
      type: "text",
    },
    { key: "outline", label: "Content outline / script" },
    {
      key: "transcript",
      label: "Transcript or accessible written explanation",
    },
    {
      key: "callToAction",
      label: "Useful next step for the audience",
      type: "text",
    },
  ],
  ai_review: [
    { key: "purpose", label: "What should AI help you accomplish?" },
    { key: "provider", label: "Provider used, if any", type: "text" },
    { key: "model", label: "Model / version used, if known", type: "text" },
    {
      key: "classification",
      label: "Input classification",
      options: ["public", "internal", "confidential"],
    },
    { key: "outputSummary", label: "Output summary (remove secrets)" },
    {
      key: "verdict",
      label: "Human review verdict",
      options: ["pending", "accepted", "rejected"],
    },
    { key: "reviewNotes", label: "What did you verify or reject?" },
    {
      key: "reportedCostMwk",
      label: "Reported cost, MWK (leave blank if unknown)",
      type: "number",
    },
  ],
  asset: [
    {
      key: "layer",
      label: "Asset layer",
      options: [
        "physical",
        "endpoint",
        "network",
        "server",
        "application",
        "database",
        "cloud",
      ],
    },
    {
      key: "identifier",
      label: "Hostname, label or service identifier (no secrets)",
      type: "text",
    },
    {
      key: "criticality",
      label: "Operational criticality",
      options: ["low", "medium", "high", "critical"],
    },
    {
      key: "authorized",
      label: "I own this asset or have authorization to monitor it",
      type: "boolean",
    },
    {
      key: "monitoring",
      label: "Current observation mode",
      options: ["not_connected", "manual_review"],
    },
    { key: "source", label: "Evidence / observation source", type: "text" },
    {
      key: "lastObservedAt",
      label: "Last observed time, ISO format (optional)",
      type: "text",
    },
    { key: "recoveryPlan", label: "Recovery owner and procedure" },
  ],
  security_event: [
    { key: "assetId", label: "Authorized asset", type: "asset" },
    {
      key: "observedAt",
      label: "Observation time with timezone offset",
      type: "text",
    },
    {
      key: "severity",
      label: "Initial severity",
      options: ["low", "medium", "high", "critical"],
    },
    { key: "source", label: "Log or observation source", type: "text" },
    { key: "finding", label: "Observed facts, indicators and uncertainty" },
    {
      key: "disposition",
      label: "Triage status",
      options: ["untriaged", "investigating", "expected", "resolved"],
    },
    { key: "response", label: "Response taken and evidence (manual record)" },
  ],
  practice: [
    { key: "topic", label: "Skill area", options: topicChoices },
    { key: "goal", label: "Skill or principle to strengthen" },
    { key: "exercise", label: "Hands-on exercise" },
    { key: "learning", label: "Mistake, correction and repeatable lesson" },
    {
      key: "confidence",
      label: "Self-assessed confidence, 1–5",
      type: "number",
    },
    {
      key: "authorizedScope",
      label: "Authorized lab / device scope, where relevant",
    },
  ],
};
const selectClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputClass =
  "min-h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";
export function RecordEditor({
  context,
  kind,
  entry,
  records,
  onClose,
  onSaved,
}: {
  context: EngineeringContext;
  kind: RecordKind;
  entry: EngineeringRecord | null;
  records: EngineeringRecord[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
  }).format(new Date());
  const [form, setForm] = useState(() =>
    entry
      ? {
          context: entry.context,
          kind: entry.kind,
          title: entry.title,
          summary: entry.summary,
          workDate: entry.workDate,
          dueDate: entry.dueDate,
          status: entry.status,
          priority: entry.priority,
          accountable: entry.accountable,
          evidence: entry.evidence,
          details: entry.details,
        }
      : {
          context,
          kind,
          title: "",
          summary: "",
          workDate: date,
          dueDate: null as string | null,
          status: "draft",
          priority: 2,
          accountable: "Me",
          evidence: [] as string[],
          details: emptyDetails(kind, date),
        },
  );
  const [evidenceText, setEvidenceText] = useState(
    entry?.evidence.join("\n") ?? "",
  );
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [validation, setValidation] = useState("");
  const change = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setRequestKey(crypto.randomUUID());
  };
  const detail = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));
    setRequestKey(crypto.randomUUID());
  };
  const save = useMutation({
    mutationFn: async () => {
      const validated = recordInput.safeParse({
        ...form,
        evidence: evidenceText
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean),
      });
      if (!validated.success) {
        const message = validated.error.issues
          .map((x) => x.message)
          .slice(0, 4)
          .join(". ");
        setValidation(message);
        throw new Error(message);
      }
      setValidation("");
      await apiRequest(
        entry ? "PATCH" : "POST",
        entry
          ? `/api/admin/engineering/records/${entry.id}`
          : "/api/admin/engineering/records",
        {
          record: validated.data,
          requestKey,
          ...(entry ? { expectedVersion: entry.version } : {}),
        },
      );
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-slate-200 bg-[#f7f7f2] text-slate-950 sm:max-w-3xl">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[.2em] text-blue-700">
            {context} / Private operating record
          </p>
          <DialogTitle className="text-2xl">
            {entry ? "Revise" : "New"}{" "}
            {kindLabels[form.kind as RecordKind].toLowerCase()}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Record type
              <select
                disabled={!!entry}
                className={selectClass}
                value={form.kind}
                onChange={(e) => {
                  const k = e.target.value as RecordKind;
                  setForm((f) => ({
                    ...f,
                    kind: k,
                    details: emptyDetails(k, f.workDate),
                  }));
                  setRequestKey(crypto.randomUUID());
                }}
              >
                {recordKinds.map((k) => (
                  <option key={k} value={k}>
                    {kindLabels[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Status
              <select
                className={selectClass}
                value={form.status}
                onChange={(e) => change("status", e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-2 text-sm font-medium">
            Title
            <Input
              autoFocus
              required
              minLength={3}
              maxLength={200}
              className={inputClass}
              value={form.title}
              onChange={(e) => change("title", e.target.value)}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Context / progress summary
            <Textarea
              rows={3}
              maxLength={1600}
              className={inputClass}
              value={form.summary}
              onChange={(e) => change("summary", e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="space-y-2 text-sm font-medium">
              Work date
              <Input
                type="date"
                required
                className={inputClass}
                value={form.workDate}
                onChange={(e) => change("workDate", e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Due date
              <Input
                type="date"
                className={inputClass}
                value={form.dueDate ?? ""}
                onChange={(e) => change("dueDate", e.target.value || null)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Priority
              <select
                className={selectClass}
                value={form.priority}
                onChange={(e) => change("priority", Number(e.target.value))}
              >
                {[4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n === 4
                      ? "Critical"
                      : n === 3
                        ? "High"
                        : n === 2
                          ? "Normal"
                          : "Low"}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Accountable role
              <Input
                className={inputClass}
                required
                value={form.accountable}
                onChange={(e) => change("accountable", e.target.value)}
              />
            </label>
          </div>
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
            {fieldsByKind[form.kind as RecordKind].map((f) => {
              const value = (form.details as Record<string, unknown>)[f.key];
              return (
                <label
                  key={f.key}
                  className="block space-y-2 text-sm font-medium"
                >
                  <span>{f.label}</span>
                  {f.type === "boolean" ? (
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => detail(f.key, e.target.checked)}
                      />
                      <span className="font-normal text-slate-600">
                        {value ? "Yes" : "No"}
                      </span>
                    </span>
                  ) : f.options ? (
                    <select
                      className={selectClass}
                      value={String(value ?? "")}
                      onChange={(e) => detail(f.key, e.target.value)}
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "links" ? (
                    <select
                      multiple
                      className={selectClass + " h-32"}
                      value={(value as string[]) ?? []}
                      onChange={(e) =>
                        detail(
                          f.key,
                          [...e.target.selectedOptions].map((o) => o.value),
                        )
                      }
                    >
                      {records
                        .filter(
                          (r) =>
                            r.id !== entry?.id &&
                            r.status !== "archived" &&
                            (f.key === "relatedEntries" || r.kind === "task"),
                        )
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} · {r.status}
                          </option>
                        ))}
                    </select>
                  ) : f.type === "asset" ? (
                    <select
                      required
                      className={selectClass}
                      value={String(value ?? "")}
                      onChange={(e) => detail(f.key, e.target.value)}
                    >
                      <option value="">Choose an authorized asset</option>
                      {records
                        .filter(
                          (r) =>
                            r.kind === "asset" &&
                            (r.details as { authorized?: boolean }).authorized,
                        )
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                    </select>
                  ) : f.type === "number" ? (
                    <Input
                      type="number"
                      step={f.key === "reportedCostMwk" ? "0.01" : "1"}
                      className={inputClass}
                      value={value === null ? "" : Number(value ?? 0)}
                      onChange={(e) =>
                        detail(
                          f.key,
                          e.target.value === "" && f.key === "reportedCostMwk"
                            ? null
                            : Number(e.target.value),
                        )
                      }
                    />
                  ) : f.type === "date" ? (
                    <Input
                      required
                      type="date"
                      className={inputClass}
                      value={String(value ?? "")}
                      onChange={(e) => detail(f.key, e.target.value)}
                    />
                  ) : f.type === "text" ? (
                    <Input
                      className={inputClass}
                      value={String(value ?? "")}
                      onChange={(e) =>
                        detail(
                          f.key,
                          e.target.value ||
                            (f.key === "lastObservedAt" ? null : ""),
                        )
                      }
                    />
                  ) : (
                    <Textarea
                      className={inputClass}
                      rows={3}
                      maxLength={1200}
                      value={
                        f.type === "list"
                          ? ((value as string[]) ?? []).join("\n")
                          : String(value ?? "")
                      }
                      onChange={(e) =>
                        detail(
                          f.key,
                          f.type === "list"
                            ? e.target.value.split("\n")
                            : e.target.value,
                        )
                      }
                    />
                  )}{" "}
                  {f.hint && (
                    <span className="block text-xs font-normal leading-relaxed text-slate-500">
                      {f.hint}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <label className="block space-y-2 text-sm font-medium">
            Evidence links, one HTTPS URL per line
            <Textarea
              rows={2}
              className={inputClass}
              value={evidenceText}
              onChange={(e) => {
                setEvidenceText(e.target.value);
                setRequestKey(crypto.randomUUID());
              }}
            />
          </label>
          <p className="text-xs leading-relaxed text-slate-500">
            Private by default. Accountable names record responsibility and do
            not grant access. Store no passwords, API keys, patient data or
            client secrets. Publishing uses a separate disclosure review.
          </p>
          {(validation || save.error) && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {validation || save.error?.message}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={save.isPending}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              <Save className="mr-2 h-4 w-4" />
              {save.isPending
                ? "Saving…"
                : entry
                  ? "Save revision"
                  : "Save private record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
