import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Project } from "@shared/schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ProjectStatus =
  | "planned"
  | "active"
  | "hold"
  | "completed"
  | "cancelled"
  | "legacy";

type ProjectConfidentiality = "internal" | "confidential" | "restricted";

type ProjectForm = {
  projectCode: string;
  name: string;
  organizationName: string;
  sector: string;
  country: string;
  status: ProjectStatus;
  confidentiality: ProjectConfidentiality;
  internalSummary: string;
  repositoryUrl: string;
  deploymentUrl: string;
};

const EMPTY_PROJECT: ProjectForm = {
  projectCode: "",
  name: "",
  organizationName: "",
  sector: "",
  country: "Malawi",
  status: "active",
  confidentiality: "internal",
  internalSummary: "",
  repositoryUrl: "",
  deploymentUrl: "",
};

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "hold",
  "completed",
  "cancelled",
  "legacy",
];

const CONFIDENTIALITY_LEVELS: ProjectConfidentiality[] = [
  "internal",
  "confidential",
  "restricted",
];

function formFromProject(project: Project): ProjectForm {
  return {
    projectCode: project.projectCode,
    name: project.name,
    organizationName: project.organizationName ?? "",
    sector: project.sector ?? "",
    country: project.country ?? "",
    status: project.status as ProjectStatus,
    confidentiality: project.confidentiality as ProjectConfidentiality,
    internalSummary: project.internalSummary ?? "",
    repositoryUrl: project.repositoryUrl ?? "",
    deploymentUrl: project.deploymentUrl ?? "",
  };
}

function nullable(value: string) {
  return value.trim() || null;
}

export default function ProjectManagement() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>(EMPTY_PROJECT);

  const projects = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
  };

  const closeEditor = () => {
    setEditing(null);
    setEditorOpen(false);
    setForm(EMPTY_PROJECT);
  };

  const save = useMutation({
    mutationFn: () =>
      apiRequest(
        editing ? "PATCH" : "POST",
        editing ? `/api/admin/projects/${editing.id}` : "/api/admin/projects",
        {
          projectCode: form.projectCode.trim(),
          name: form.name.trim(),
          organizationName: nullable(form.organizationName),
          sector: nullable(form.sector),
          country: nullable(form.country),
          status: form.status,
          confidentiality: form.confidentiality,
          internalSummary: nullable(form.internalSummary),
          repositoryUrl: nullable(form.repositoryUrl),
          deploymentUrl: nullable(form.deploymentUrl),
        },
      ),
    onSuccess: () => {
      refresh();
      closeEditor();
    },
  });

  const archive = useMutation({
    mutationFn: ({
      id,
      justification,
    }: {
      id: string;
      justification: string;
    }) =>
      apiRequest("POST", `/api/admin/projects/${id}/archive`, {
        justification,
      }),
    onSuccess: refresh,
  });

  const beginCreate = () => {
    setEditing(null);
    setForm(EMPTY_PROJECT);
    setEditorOpen(true);
  };

  const beginEdit = (project: Project) => {
    setEditing(project);
    setForm(formFromProject(project));
    setEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const archiveProject = (project: Project) => {
    const justification = window.prompt(
      `Archive “${project.name}”? Enter a justification (minimum 8 characters).`,
    );
    const normalized = justification?.trim() ?? "";
    if (normalized.length < 8) return;
    archive.mutate({ id: project.id, justification: normalized });
  };

  const query = search.trim().toLowerCase();
  const visibleProjects =
    projects.data?.filter((project) => {
      if (!query) return true;
      return [
        project.projectCode,
        project.name,
        project.organizationName,
        project.sector,
        project.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    }) ?? [];

  return (
    <AdminShell
      title="Projects"
      description="Private operational records. Nothing here becomes public automatically."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/25" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search internal projects"
            />
          </div>
          <Button onClick={beginCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Button>
        </div>

        {editorOpen && (
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="text-base">
                {editing ? "Edit internal project" : "Create internal project"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Project code"
                  value={form.projectCode}
                  onChange={(event) =>
                    setForm({ ...form, projectCode: event.target.value })
                  }
                />
                <Input
                  placeholder="Project name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
                <Input
                  placeholder="Organization"
                  value={form.organizationName}
                  onChange={(event) =>
                    setForm({ ...form, organizationName: event.target.value })
                  }
                />
                <Input
                  placeholder="Sector"
                  value={form.sector}
                  onChange={(event) =>
                    setForm({ ...form, sector: event.target.value })
                  }
                />
                <Input
                  placeholder="Country"
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as ProjectStatus,
                    })
                  }
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.confidentiality}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      confidentiality:
                        event.target.value as ProjectConfidentiality,
                    })
                  }
                >
                  {CONFIDENTIALITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Repository URL"
                  value={form.repositoryUrl}
                  onChange={(event) =>
                    setForm({ ...form, repositoryUrl: event.target.value })
                  }
                />
                <Input
                  placeholder="Deployment URL"
                  value={form.deploymentUrl}
                  onChange={(event) =>
                    setForm({ ...form, deploymentUrl: event.target.value })
                  }
                />
              </div>

              <Textarea
                rows={5}
                placeholder="Internal summary — never public by default"
                value={form.internalSummary}
                onChange={(event) =>
                  setForm({ ...form, internalSummary: event.target.value })
                }
              />

              {save.error && (
                <p className="text-sm text-destructive">{save.error.message}</p>
              )}

              <div className="flex gap-2">
                <Button
                  disabled={
                    !form.projectCode.trim() ||
                    !form.name.trim() ||
                    save.isPending
                  }
                  onClick={() => save.mutate()}
                >
                  {save.isPending ? "Saving…" : "Save project"}
                </Button>
                <Button variant="outline" onClick={closeEditor}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="font-medium">Projects could not be loaded.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {projects.error.message}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => projects.refetch()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {visibleProjects.map((project) => (
            <Card
              key={project.id}
              className="border-white/[0.07] bg-white/[0.025]"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-primary">
                      {project.projectCode}
                    </p>
                    <h2 className="mt-1 truncate font-semibold">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-xs text-white/35">
                      {project.organizationName || "Internal venture"}
                      {" · "}
                      {project.country || "Country not set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge variant="outline">{project.status}</Badge>
                    <Badge variant="outline">
                      {project.confidentiality}
                    </Badge>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm text-white/45">
                  {project.internalSummary || "No internal summary."}
                </p>

                <div className="mt-4 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginEdit(project)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={archive.isPending}
                    onClick={() => archiveProject(project)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!projects.isLoading && !projects.isError && !visibleProjects.length && (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-white/35">
              No internal projects match this view.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
