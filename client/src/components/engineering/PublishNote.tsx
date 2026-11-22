import { lazy, Suspense, useState } from "react";
import { ImagePicker } from "@/components/admin/ImagePicker";
const RichTextEditor=lazy(()=>import("@/components/admin/RichTextEditor"));
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  publicationInput,
  topics,
  type EngineeringRecord,
  type Publication,
} from "@shared/engineering";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export function PublishNote({
  entry,
  onClose,
  onPublished,
}: {
  entry: EngineeringRecord;
  onClose: () => void;
  onPublished: () => void;
}) {
  const d = entry.details as Record<string, unknown>;
  const [form, setForm] = useState({
    slug: entry.title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 170),
    title: entry.title,
    summary: entry.summary,
    body: String(d.work ?? d.outline ?? d.exercise ?? ""),
    learning: String(d.lesson ?? d.learning ?? ""),
    topic: String(d.topic ?? "networking"),
    mediaUrl: String(d.mediaUrl ?? ""),
    imageUrl: "",
    imageAlt: "",
    evidenceLevel: "self_reported",
    limitations: "",
    disclosureReviewed: false,
  });
  const [evidenceText, setEvidenceText] = useState(entry.evidence.join("\n"));
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [published, setPublished] = useState<Publication | null>(null);
  const change = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setRequestKey(crypto.randomUUID());
  };
  const publish = useMutation({
    mutationFn: async () => {
      const input = publicationInput.parse({
        ...form,
        evidenceUrls: evidenceText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        expectedVersion: entry.version,
        requestKey,
      });
      const r = await apiRequest(
        "POST",
        `/api/admin/engineering/records/${entry.id}/publish`,
        input,
      );
      return r.json() as Promise<Publication>;
    },
    onSuccess: (n) => {
      setPublished(n);
      onPublished();
    },
  });
  const cls =
    "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400";
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !publish.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-slate-200 bg-[#f7f7f2] text-slate-950 sm:max-w-3xl">
        <DialogHeader>
          <p className="text-xs uppercase tracking-widest text-amber-800">
            Public disclosure review
          </p>
          <DialogTitle className="text-2xl">Prepare a field note</DialogTitle>
        </DialogHeader>
        {published ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
            <h2 className="text-xl font-semibold">
              Your reviewed note is published.
            </h2>
            <p className="my-4 text-sm leading-relaxed">
              The public version is an independent snapshot. Private revisions
              will not silently change it.
            </p>
            <Button asChild>
              <Link href={`/journey/${published.slug}`}>
                Open the published note
              </Link>
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              publish.mutate();
            }}
            className="space-y-5"
          >
            <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Review every field below. Only this public copy is shared. Remove
              client details, private identifiers, credentials and unsupported
              outcomes.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["title", "Public title"],
                  ["slug", "Public URL name"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  {label}
                  <Input
                    className={cls}
                    required
                    value={form[key]}
                    onChange={(e) => change(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="block space-y-2 text-sm font-medium">
              Short introduction
              <Textarea
                className={cls}
                rows={3}
                value={form.summary}
                onChange={(e) => change("summary", e.target.value)}
              />
            </label>
            <Suspense fallback={<p role="status">Loading the field note editor…</p>}><RichTextEditor label="Public write-up (at least 80 characters)" value={form.body} onChange={value=>change("body",value)} allowUploads={false}/></Suspense>
            <label className="block space-y-2 text-sm font-medium">
              What did you learn?
              <Textarea
                className={cls}
                rows={3}
                value={form.learning}
                onChange={(e) => change("learning", e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Topic
                <select
                  value={form.topic}
                  onChange={(e) => change("topic", e.target.value)}
                  className={`h-11 w-full rounded-md border px-3 ${cls}`}
                >
                  {topics.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Evidence level
                <select
                  value={form.evidenceLevel}
                  onChange={(e) => change("evidenceLevel", e.target.value)}
                  className={`h-11 w-full rounded-md border px-3 ${cls}`}
                >
                  <option value="self_reported">Personal field note</option>
                  <option value="source_reviewed">Source reviewed</option>
                  <option value="runtime_verified">Runtime verified</option>
                </select>
              </label>
            </div>
            {(
              [
                ["mediaUrl", "YouTube, Vimeo or supported social post URL"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-2 text-sm font-medium">
                {label}
                <Input
                  className={cls}
                  value={form[key]}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            ))}
            <ImagePicker allowUploads={false} label="Field note cover" value={form.imageUrl} onChange={value=>change("imageUrl",value)} alt={form.imageAlt} onAltChange={value=>change("imageAlt",value)}/>
            <label className="block space-y-2 text-sm font-medium">
              Public supporting evidence links, one per line
              <Textarea
                className={cls}
                rows={3}
                value={evidenceText}
                onChange={(e) => {
                  setEvidenceText(e.target.value);
                  setRequestKey(crypto.randomUUID());
                }}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Limitations / what this does not establish
              <Textarea
                className={cls}
                rows={3}
                placeholder="State the scope, remaining checks and any unmeasured result."
                value={form.limitations}
                onChange={(e) => change("limitations", e.target.value)}
              />
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-4 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.disclosureReviewed}
                onChange={(e) => change("disclosureReviewed", e.target.checked)}
              />
              <span>
                I reviewed this public copy, have permission to disclose its
                content and images, and have qualified any unverified claims.
              </span>
            </label>
            {publish.error && (
              <p role="alert" className="text-sm text-red-700">
                {publish.error.message}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={publish.isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={!form.disclosureReviewed || publish.isPending}
                className="bg-[#244b3b] text-white hover:bg-[#19372b]"
              >
                {publish.isPending
                  ? "Publishing…"
                  : "Publish reviewed snapshot"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
