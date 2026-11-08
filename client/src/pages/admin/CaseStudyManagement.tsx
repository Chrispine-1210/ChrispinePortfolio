import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Eye, FileCheck2, Pencil, Plus, Search, ShieldAlert } from "lucide-react";
import type { CaseStudy, CaseStudyEvidence, Project } from "@shared/schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCustomAuth } from "@/hooks/useCustomAuth";

type CaseStudyRow = CaseStudy & { evidenceCount: number; approvedPublicEvidenceCount: number };
const empty = { projectId:"", title:"", slug:"", summary:"", challenge:"", solution:"", outcome:"", category:"Software", technologies:"", visibility:"private" as "private"|"public"|"unlisted", featured:false, order:0 };
const emptyEvidence = { claim:"", sourceType:"repository", sourceReference:"", notes:"" };

export default function CaseStudyManagement() {
  const { user } = useCustomAuth();
  const canApprove = !user?.permissions || user.permissions.includes("portfolio.approve");
  const [search,setSearch]=useState("");
  const [editing,setEditing]=useState<CaseStudyRow|null>(null);
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState<CaseStudyRow|null>(null);
  const [form,setForm]=useState(empty);
  const [evidenceForm,setEvidenceForm]=useState(emptyEvidence);
  const studies=useQuery<CaseStudyRow[]>({queryKey:["/api/admin/case-studies"]});
  const projects=useQuery<Project[]>({queryKey:["/api/admin/projects"]});
  const evidence=useQuery<CaseStudyEvidence[]>({queryKey:["/api/admin/case-studies",selected?.id??"none","evidence"],enabled:Boolean(selected),queryFn:async()=>{const r=await fetch(`/api/admin/case-studies/${selected!.id}/evidence`,{credentials:"include"});if(!r.ok) throw new Error("Failed to load evidence");return r.json();}});

  useEffect(()=>{ if(selected){ const fresh=studies.data?.find((item)=>item.id===selected.id); if(fresh) setSelected(fresh); } },[studies.data]);

  const refresh=()=>{queryClient.invalidateQueries({queryKey:["/api/admin/case-studies"]});queryClient.invalidateQueries({queryKey:["/api/admin/overview"]});if(selected) queryClient.invalidateQueries({queryKey:["/api/admin/case-studies",selected.id,"evidence"]});};
  const reset=()=>{setEditing(null);setOpen(false);setForm(empty);};
  const save=useMutation({mutationFn:()=>apiRequest(editing?"PATCH":"POST",editing?`/api/admin/case-studies/${editing.id}`:"/api/admin/case-studies",{...form,projectId:form.projectId||null,technologies:form.technologies.split(",").map(v=>v.trim()).filter(Boolean),challenge:form.challenge||null,solution:form.solution||null,outcome:form.outcome||null}),onSuccess:()=>{refresh();reset();}});
  const transition=useMutation({mutationFn:({id,action,justification}:{id:string;action:string;justification?:string})=>apiRequest("POST",`/api/admin/case-studies/${id}/transition`,{action,justification}),onSuccess:refresh});
  const addEvidence=useMutation({mutationFn:()=>apiRequest("POST",`/api/admin/case-studies/${selected!.id}/evidence`,{...evidenceForm,notes:evidenceForm.notes||null}),onSuccess:()=>{setEvidenceForm(emptyEvidence);refresh();}});
  const approveEvidence=useMutation({mutationFn:(id:string)=>apiRequest("PATCH",`/api/admin/case-study-evidence/${id}`,{verificationStatus:"internally_verified",disclosureStatus:"approved_public"}),onSuccess:refresh});

  const edit=(study:CaseStudyRow)=>{setEditing(study);setOpen(true);setForm({projectId:study.projectId??"",title:study.title,slug:study.slug,summary:study.summary,challenge:study.challenge??"",solution:study.solution??"",outcome:study.outcome??"",category:study.category,technologies:study.technologies.join(", "),visibility:study.visibility as typeof empty.visibility,featured:study.featured,order:study.order});window.scrollTo({top:0,behavior:"smooth"});};
  const visible=studies.data?.filter((s)=>`${s.title} ${s.summary} ${s.category} ${s.workflowStatus}`.toLowerCase().includes(search.toLowerCase()))??[];
  const run=(study:CaseStudyRow,action:string)=>{if(action==="archive"){const justification=window.prompt("Archive justification (minimum 8 characters)");if(!justification||justification.trim().length<8)return;transition.mutate({id:study.id,action,justification:justification.trim()});return;}transition.mutate({id:study.id,action});};

  return <AdminShell title="Case studies" description="Public editorial records with server-enforced evidence gates">
    <div className="space-y-6">
      <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-white/25"/><Input className="pl-9" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search governed case studies"/></div><Button onClick={()=>{reset();setOpen(true)}}><Plus className="mr-2 h-4 w-4"/>New case study</Button></div>
      {open&&<Card className="border-primary/20 bg-primary/[0.03]"><CardHeader><CardTitle>{editing?"Edit draft case study":"Create draft case study"}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.projectId} onChange={(e)=>setForm({...form,projectId:e.target.value})}><option value="">No linked project</option>{projects.data?.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.name}</option>)}</select>
          <Input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
          <Input placeholder="Slug" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"")})}/>
          <Input placeholder="Category" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}/>
          <Input placeholder="Technologies, comma separated" value={form.technologies} onChange={(e)=>setForm({...form,technologies:e.target.value})}/>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.visibility} onChange={(e)=>setForm({...form,visibility:e.target.value as typeof empty.visibility})}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select>
        </div>
        <Textarea rows={3} placeholder="Public summary" value={form.summary} onChange={(e)=>setForm({...form,summary:e.target.value})}/>
        <div className="grid gap-3 lg:grid-cols-3"><Textarea rows={6} placeholder="Challenge" value={form.challenge} onChange={(e)=>setForm({...form,challenge:e.target.value})}/><Textarea rows={6} placeholder="Solution" value={form.solution} onChange={(e)=>setForm({...form,solution:e.target.value})}/><Textarea rows={6} placeholder="Outcome / evidence boundary" value={form.outcome} onChange={(e)=>setForm({...form,outcome:e.target.value})}/></div>
        <label className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" checked={form.featured} onChange={(e)=>setForm({...form,featured:e.target.checked})}/>Featured public study</label>
        {save.error&&<p className="text-sm text-destructive">{save.error.message}</p>}
        <div className="flex gap-2"><Button disabled={!form.title||!form.slug||!form.summary||save.isPending} onClick={()=>save.mutate()}>{save.isPending?"Saving…":"Save draft"}</Button><Button variant="outline" onClick={reset}>Cancel</Button></div>
      </CardContent></Card>}

      <div className="grid gap-4 lg:grid-cols-2">{visible.map((study)=><Card key={study.id} className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{study.title}</h2><p className="mt-1 text-xs text-white/35">{study.category}</p></div><div className="flex flex-wrap gap-2 justify-end"><Badge variant="outline">{study.workflowStatus}</Badge><Badge className={study.evidenceGateStatus==="approved"?"bg-emerald-500/15 text-emerald-300":"bg-amber-500/15 text-amber-300"}>{study.evidenceGateStatus==="approved"?"Evidence approved":"Evidence blocked"}</Badge></div></div>
        <p className="mt-4 line-clamp-3 text-sm text-white/45">{study.summary}</p>
        <div className="mt-3 text-[10px] text-white/30">{study.approvedPublicEvidenceCount}/{study.evidenceCount} evidence records approved for public disclosure</div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
          <Button size="sm" variant="outline" onClick={()=>setSelected(study)}><FileCheck2 className="mr-2 h-4 w-4"/>Evidence</Button>
          {study.workflowStatus==="draft"&&<><Button size="sm" variant="outline" onClick={()=>edit(study)}><Pencil className="mr-2 h-4 w-4"/>Edit</Button><Button size="sm" onClick={()=>run(study,"submit_review")}>Submit review</Button></>}
          {study.workflowStatus==="in_review"&&<><Button size="sm" variant="outline" onClick={()=>run(study,"return_draft")}>Return draft</Button><Button size="sm" onClick={()=>run(study,"approve")}>Approve</Button></>}
          {study.workflowStatus==="approved"&&<><Button size="sm" variant="outline" onClick={()=>run(study,"return_draft")}>Return draft</Button><Button size="sm" onClick={()=>run(study,"publish")}><Eye className="mr-2 h-4 w-4"/>Publish</Button></>}
          {study.workflowStatus!=="archived"&&<Button size="sm" variant="ghost" className="text-destructive" onClick={()=>run(study,"archive")}>Archive</Button>}
          {study.workflowStatus==="archived"&&<Button size="sm" onClick={()=>run(study,"restore")}>Restore to private draft</Button>}
        </div>
        {transition.error&&<p className="mt-3 text-xs text-destructive">{transition.error.message}</p>}
      </CardContent></Card>)}</div>

      <Sheet open={Boolean(selected)} onOpenChange={(value)=>{if(!value)setSelected(null)}}><SheetContent className="w-full overflow-y-auto border-white/[0.07] bg-[#0b0e18] sm:max-w-xl"><SheetHeader><SheetTitle>Evidence — {selected?.title}</SheetTitle></SheetHeader>{selected&&<div className="mt-6 space-y-5">
        <div className={`rounded-xl border p-4 ${selected.evidenceGateStatus==="approved"?"border-emerald-500/20 bg-emerald-500/5":"border-amber-500/20 bg-amber-500/5"}`}><div className="flex items-center gap-2">{selected.evidenceGateStatus==="approved"?<CheckCircle2 className="h-5 w-5 text-emerald-400"/>:<ShieldAlert className="h-5 w-5 text-amber-400"/>}<p className="font-medium">Publication gate: {selected.evidenceGateStatus}</p></div><p className="mt-2 text-xs text-white/40">At least one verified claim must be approved for public disclosure. Unverified or unresolved evidence blocks approval and publication.</p></div>
        {["draft","in_review"].includes(selected.workflowStatus)&&<Card><CardContent className="space-y-3 pt-6"><Textarea placeholder="Claim being supported" value={evidenceForm.claim} onChange={(e)=>setEvidenceForm({...evidenceForm,claim:e.target.value})}/><div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Source type" value={evidenceForm.sourceType} onChange={(e)=>setEvidenceForm({...evidenceForm,sourceType:e.target.value})}/><Input placeholder="Source reference / URL / document" value={evidenceForm.sourceReference} onChange={(e)=>setEvidenceForm({...evidenceForm,sourceReference:e.target.value})}/></div><p className="text-xs text-white/30">New evidence starts private and unverified. Verification and public-disclosure approval are separate privileged actions.</p><Textarea placeholder="Evidence notes" value={evidenceForm.notes} onChange={(e)=>setEvidenceForm({...evidenceForm,notes:e.target.value})}/><Button disabled={!evidenceForm.claim||!evidenceForm.sourceReference||addEvidence.isPending} onClick={()=>addEvidence.mutate()}>Add evidence</Button></CardContent></Card>}
        <div className="space-y-3">{evidence.data?.map((item)=><Card key={item.id} className="border-white/[0.07]"><CardContent className="p-4"><p className="text-sm font-medium">{item.claim}</p><p className="mt-2 break-all text-xs text-white/35">{item.sourceType}: {item.sourceReference}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{item.verificationStatus}</Badge><Badge variant="outline">{item.disclosureStatus}</Badge></div>{canApprove&&["draft","in_review"].includes(selected.workflowStatus)&&!(["internally_verified","externally_verified"].includes(item.verificationStatus)&&item.disclosureStatus==="approved_public")&&<Button className="mt-3" size="sm" variant="outline" disabled={approveEvidence.isPending} onClick={()=>approveEvidence.mutate(item.id)}>Verify internally + approve public</Button>}</CardContent></Card>)}</div>
      </div>}</SheetContent></Sheet>
    </div>
  </AdminShell>;
}
