import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, Pencil, Plus, Search } from "lucide-react";
import type { Project } from "@shared/schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";

const empty = {
  projectCode: "", name: "", organizationName: "", sector: "", country: "Malawi",
  status: "active", confidentiality: "internal", internalSummary: "",
  repositoryUrl: "", deploymentUrl: "",
};

export default function ProjectManagement() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const projects = useQuery<Project[]>({ queryKey: ["/api/admin/projects"] });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
  };
  const reset = () => { setEditing(null); setOpen(false); setForm(empty); };
  const save = useMutation({
    mutationFn: () => apiRequest(editing ? "PATCH" : "POST", editing ? `/api/admin/projects/${editing.id}` : "/api/admin/projects", {
      ...form,
      organizationName: form.organizationName || null,
      sector: form.sector || null,
      country: form.country || null,
      internalSummary: form.internalSummary || null,
      repositoryUrl: form.repositoryUrl || null,
      deploymentUrl: form.deploymentUrl || null,
    }),
    onSuccess: () => { refresh(); reset(); },
  });
  const archive = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      apiRequest("POST", `/api/admin/projects/${id}/archive`, { justification }),
    onSuccess: refresh,
  });
  const beginEdit = (project: Project) => {
    setEditing(project);
    setOpen(true);
    setForm({
      projectCode: project.projectCode,
      name: project.name,
      organizationName: project.organizationName ?? "",
      sector: project.sector ?? "",
      country: project.country ?? "",
      status: project.status,
      confidentiality: project.confidentiality,
      internalSummary: project.internalSummary ?? "",
      repositoryUrl: project.repositoryUrl ?? "",
      deploymentUrl: project.deploymentUrl ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const visible = projects.data?.filter((project) =>
    `${project.projectCode} ${project.name} ${project.organizationName ?? ""} ${project.sector ?? ""}`
      .toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return <AdminShell title="Projects" description="Logic diagnostic"><div>{visible.length} projects</div></AdminShell>;
}
