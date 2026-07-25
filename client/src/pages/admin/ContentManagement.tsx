import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Archive,
  CheckCircle2,
  Clock3,
  Edit3,
  FilePlus2,
  History,
  RotateCcw,
  Search,
  Send,
  Undo2,
} from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ContentForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  featuredImage: string;
  readTimeMinutes: number;
  isPremium: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  visibility: "public" | "unlisted" | "private";
  changeSummary: string;
};

type ContentVersion = {
  id: string;
  version: number;
  changeSummary: string | null;
  createdBy: string | null;
  createdAt: string;
};
type TransitionAction =
  | "submit_review"
  | "return_draft"
  | "approve"
  | "schedule"
  | "publish"
  | "archive"
  | "restore";

const emptyForm: ContentForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Programming",
  tags: "",
  featuredImage: "",
  readTimeMinutes: 5,
  isPremium: false,
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  ogImage: "",
  visibility: "public",
  changeSummary: "",
};

const statusStyles: Record<string, string> = {
  draft: "bg-white/5 text-white/50",
  in_review: "bg-amber-500/15 text-amber-300",
  approved: "bg-cyan-500/15 text-cyan-300",
  scheduled: "bg-violet-500/15 text-violet-300",
  published: "bg-emerald-500/15 text-emerald-300",
  archived: "bg-rose-500/15 text-rose-300",
};

function nullable(value: string) {
  return value.trim() || null;
}

export default function ContentManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const posts = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/content/posts"],
  });
  const versions = useQuery<ContentVersion[]>({
    queryKey: ["/api/admin/content/posts", historyId, "versions"],
    enabled: Boolean(historyId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/content/posts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    if (historyId)
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/content/posts", historyId, "versions"],
      });
  };
  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setEditorOpen(false);
  };
  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        featuredImage: nullable(form.featuredImage),
        seoTitle: nullable(form.seoTitle),
        seoDescription: nullable(form.seoDescription),
        canonicalUrl: nullable(form.canonicalUrl),
        ogImage: nullable(form.ogImage),
        changeSummary: form.changeSummary.trim() || undefined,
      };
      return apiRequest(
        editingId ? "PATCH" : "POST",
        editingId
          ? `/api/admin/content/posts/${editingId}`
          : "/api/admin/content/posts",
        payload,
      );
    },
    onSuccess: () => {
      refresh();
      toast({ title: editingId ? "Revision saved" : "Draft created" });
      reset();
    },
    onError: (error) =>
      toast({
        title: "Could not save post",
        description: error.message,
        variant: "destructive",
      }),
  });
  const transition = useMutation({
    mutationFn: ({
      id,
      action,
      scheduledAt,
      justification,
    }: {
      id: string;
      action: TransitionAction;
      scheduledAt?: string;
      justification?: string;
    }) =>
      apiRequest("POST", `/api/admin/content/posts/${id}/transition`, {
        action,
        scheduledAt,
        justification,
      }),
    onSuccess: () => {
      refresh();
      toast({ title: "Workflow updated" });
    },
    onError: (error) =>
      toast({
        title: "Transition rejected",
        description: error.message,
        variant: "destructive",
      }),
  });

  const runTransition = (post: BlogPost, action: TransitionAction) => {
    if (action === "schedule") {
      const value = window.prompt(
        "Schedule publication (ISO date/time, including timezone)",
        new Date(Date.now() + 3_600_000).toISOString(),
      );
      if (!value) return;
      const date = new Date(value);
      if (Number.isNaN(date.getTime()))
        return toast({
          title: "Invalid schedule date",
          variant: "destructive",
        });
      transition.mutate({
        id: post.id,
        action,
        scheduledAt: date.toISOString(),
      });
      return;
    }
    if (action === "archive") {
      const justification = window.prompt(
        "Why is this published item being archived?",
      );
      if (!justification) return;
      transition.mutate({ id: post.id, action, justification });
      return;
    }
    transition.mutate({ id: post.id, action });
  };
  const beginEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setEditorOpen(true);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags?.join(", ") ?? "",
      featuredImage: post.featuredImage ?? "",
      readTimeMinutes: post.readTimeMinutes ?? 5,
      isPremium: post.isPremium ?? false,
      seoTitle: post.seoTitle ?? "",
      seoDescription: post.seoDescription ?? "",
      canonicalUrl: post.canonicalUrl ?? "",
      ogImage: post.ogImage ?? "",
      visibility: (post.visibility as ContentForm["visibility"]) ?? "public",
      changeSummary: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const visible =
    posts.data?.filter((post) =>
      `${post.title} ${post.excerpt} ${post.category} ${post.workflowStatus}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) ?? [];

  return (
    <AdminShell
      title="Content"
      description="Govern drafts, review, approvals, scheduling, publication, and revision history"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/25" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search content or workflow state"
            />
          </div>
          <Button
            onClick={() => {
              reset();
              setEditorOpen(true);
            }}
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            New draft
          </Button>
        </div>

        {editorOpen && (
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="text-base">
                {editingId ? "Edit governed revision" : "Create draft"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Title"
                />
                <Input
                  value={form.slug}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    })
                  }
                  placeholder="URL slug"
                />
                <Input
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  placeholder="Category"
                />
                <Input
                  value={form.tags}
                  onChange={(event) =>
                    setForm({ ...form, tags: event.target.value })
                  }
                  placeholder="Tags, separated by commas"
                />
                <Input
                  type="number"
                  min={1}
                  max={240}
                  value={form.readTimeMinutes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      readTimeMinutes: Number(event.target.value),
                    })
                  }
                  placeholder="Read time"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.visibility}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      visibility: event.target
                        .value as ContentForm["visibility"],
                    })
                  }
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <Input
                value={form.featuredImage}
                onChange={(event) =>
                  setForm({ ...form, featuredImage: event.target.value })
                }
                placeholder="Featured image URL (optional)"
              />
              <Textarea
                value={form.excerpt}
                onChange={(event) =>
                  setForm({ ...form, excerpt: event.target.value })
                }
                placeholder="Excerpt"
                rows={3}
              />
              <Textarea
                className="min-h-72 font-mono"
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                placeholder="Article content (Markdown)"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  maxLength={70}
                  value={form.seoTitle}
                  onChange={(event) =>
                    setForm({ ...form, seoTitle: event.target.value })
                  }
                  placeholder="SEO title (70 characters)"
                />
                <Input
                  maxLength={170}
                  value={form.seoDescription}
                  onChange={(event) =>
                    setForm({ ...form, seoDescription: event.target.value })
                  }
                  placeholder="SEO description (170 characters)"
                />
                <Input
                  value={form.canonicalUrl}
                  onChange={(event) =>
                    setForm({ ...form, canonicalUrl: event.target.value })
                  }
                  placeholder="Canonical URL"
                />
                <Input
                  value={form.ogImage}
                  onChange={(event) =>
                    setForm({ ...form, ogImage: event.target.value })
                  }
                  placeholder="Social preview image URL"
                />
              </div>
              <Input
                value={form.changeSummary}
                onChange={(event) =>
                  setForm({ ...form, changeSummary: event.target.value })
                }
                placeholder={
                  editingId
                    ? "Revision summary (recommended)"
                    : "Initial draft note"
                }
              />
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(event) =>
                    setForm({ ...form, isPremium: event.target.checked })
                  }
                />{" "}
                Premium content
              </label>
              <div className="flex gap-2">
                <Button
                  disabled={
                    !form.title ||
                    !form.slug ||
                    !form.excerpt ||
                    !form.content ||
                    save.isPending
                  }
                  onClick={() => save.mutate()}
                >
                  {save.isPending
                    ? "Saving..."
                    : editingId
                      ? "Save revision"
                      : "Save draft"}
                </Button>
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {historyId && (
          <Card className="border-white/[0.07] bg-white/[0.025]">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                Immutable revision history
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setHistoryId(null)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.isLoading && (
                <p className="text-sm text-white/40">Loading revisions...</p>
              )}
              {versions.data?.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Version {version.version}
                    </p>
                    <p className="text-xs text-white/40">
                      {version.changeSummary || "No revision summary"}
                    </p>
                  </div>
                  <time className="text-xs text-white/30">
                    {new Date(version.createdAt).toLocaleString()}
                  </time>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {visible.map((post) => (
            <Card
              key={post.id}
              className="border-white/[0.07] bg-white/[0.025]"
            >
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold">{post.title}</h2>
                    <Badge variant="outline">{post.category}</Badge>
                    <Badge
                      className={
                        statusStyles[post.workflowStatus] ?? statusStyles.draft
                      }
                    >
                      {post.workflowStatus.replace("_", " ")}
                    </Badge>
                    {post.isPremium && (
                      <Badge className="bg-violet-500/15 text-violet-300">
                        Premium
                      </Badge>
                    )}
                    <Badge variant="outline">v{post.currentVersion}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/40">
                    {post.excerpt}
                  </p>
                  <p className="mt-2 text-[10px] text-white/20">
                    Updated{" "}
                    {post.updatedAt
                      ? new Date(post.updatedAt).toLocaleString()
                      : "—"}
                    {post.scheduledAt
                      ? ` · Scheduled ${new Date(post.scheduledAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.workflowStatus === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => beginEdit(post)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryId(post.id)}
                  >
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Button>
                  {post.workflowStatus === "draft" && (
                    <Button
                      size="sm"
                      disabled={transition.isPending}
                      onClick={() => runTransition(post, "submit_review")}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Review
                    </Button>
                  )}
                  {post.workflowStatus === "in_review" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => runTransition(post, "approve")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTransition(post, "return_draft")}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Return
                      </Button>
                    </>
                  )}
                  {post.workflowStatus === "approved" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => runTransition(post, "publish")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTransition(post, "schedule")}
                      >
                        <Clock3 className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTransition(post, "return_draft")}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Return
                      </Button>
                    </>
                  )}
                  {post.workflowStatus === "scheduled" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => runTransition(post, "publish")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Publish now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTransition(post, "return_draft")}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Return
                      </Button>
                    </>
                  )}
                  {post.workflowStatus === "published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTransition(post, "archive")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  )}
                  {post.workflowStatus === "archived" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTransition(post, "restore")}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!posts.isLoading && !visible.length && (
            <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-white/35">
              No posts match this view.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
