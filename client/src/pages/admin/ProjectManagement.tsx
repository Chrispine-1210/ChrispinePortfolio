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

  return <AdminShell title="Projects" description="Private operational records. Nothing here becomes public automatically.">
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-white/25"/><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search internal projects"/></div>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="mr-2 h-4 w-4"/>New project</Button>
      </div>

      {open && <Card className="border-primary/20 bg-primary/[0.03]"><CardHeader><CardTitle>{editing ? "Edit internal project" : "Create internal project"}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Project code" value={form.projectCode} onChange={(e) => setForm({...form, projectCode:e.target.value})}/>
          <Input placeholder="Project name" value={form.name} onChange={(e) => setForm({...form, name:e.target.value})}/>
          <Input placeholder="Organization" value={form.organizationName} onChange={(e) => setForm({...form, organizationName:e.target.value})}/>
          <Input placeholder="Sector" value={form.sector} onChange={(e) => setForm({...form, sector:e.target.value})}/>
          <Input placeholder="Country" value={form.country} onChange={(e) => setForm({...form, country:e.target.value})}/>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({...form,status:e.target.value})}>
            {["planned","active","hold","completed","cancelled","legacy"].map((v)=><option key={v}>{v}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.confidentiality} onChange={(e) => setForm({...form,confidentiality:e.target.value})}>
            {["internal","confidential","restricted"].map((v)=><option key={v}>{v}</option>)}
          </select>
          <Input placeholder="Repository URL" value={form.repositoryUrl} onChange={(e) => setForm({...form, repositoryUrl:e.target.value})}/>
          <Input placeholder="Deployment URL" value={form.deploymentUrl} onChange={(e) => setForm({...form, deploymentUrl:e.target.value})}/>
        </div>
        <Textarea rows={5} placeholder="Internal summary — never public by default" value={form.internalSummary} onChange={(e) => setForm({...form, internalSummary:e.target.value})}/>
        {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
        <div className="flex gap-2"><Button disabled={!form.projectCode || !form.name || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save project"}</Button><Button variant="outline" onClick={reset}>Cancel</Button></div>
      </CardContent></Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((project)=><Card key={project.id} className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono text-primary">{project.projectCode}</p><h2 className="mt-1 font-semibold">{project.name}</h2><p className="mt-1 text-xs text-white/35">{project.organizationName || "Internal venture"} · {project.country || "Country not set"}</p></div><div className="flex gap-2"><Badge variant="outline">{project.status}</Badge><Badge variant="outline">{project.confidentiality}</Badge></div></div>
          <p className="mt-4 line-clamp-3 text-sm text-white/45">{project.internalSummary || "No internal summary."}</p>
          <div className="mt-4 flex justify-end gap-2 border-t border-white/[0.06] pt-4"><Button size="sm" variant="outline" onClick={() => beginEdit(project)}><Pencil className="mr-2 h-4 w-4"/>Edit</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => { const justification=window.prompt("Archive justification (minimum 8 characters)"); if(justification && justification.trim().length>=8) archive.mutate({id:project.id,justification:justification.trim()}); }}><Archive className="mr-2 h-4 w-4"/>Archive</Button></div>
        </Card>)}
        {!projects.isLoading && !visible.length && <div className="col-span-full rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-white/35">No internal projects match this view.</div>}
      </div>
    </div>
  </AdminShell>;
}
