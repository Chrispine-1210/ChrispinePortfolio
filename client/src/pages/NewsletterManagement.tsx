import { useEffect,useState } from "react";
import { useMutation,useQuery } from "@tanstack/react-query";
import { Calendar,Mail,RefreshCw,ShieldAlert,CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest,queryClient } from "@/lib/queryClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCustomAuth } from "@/hooks/useCustomAuth";

type Message={id:string;toEmail:string;subject:string;status:string;provider:string|null;providerMessageId:string|null;
  attemptCount:number;maxAttempts:number;lastError:string|null;createdAt:string;updatedAt:string;sentAt:string|null;deliveredAt:string|null};
type Queue={items:Message[];counts:Record<string,number>;nextCursor:string|null;providerConfigured:boolean;sampledAt:string};
type Detail={message:Message;events:Array<{id:string;eventType:string;provider:string|null;occurredAt:string;providerEventId:string|null}>;nextCursor:string|null};
type Campaign={id:string;name:string;status:string;channels:string[];scheduledAt:string|null};
type Reference={key:string;fingerprint:string;createdAt:string};
const labels:Record<string,string>={pending:"Queued",processing:"Worker processing",retry:"Retry scheduled",uncertain:"Acceptance uncertain",
  sent:"Provider accepted",delivered:"Delivered",failed:"Failed",suppressed:"Suppressed",bounced:"Bounced",complained:"Complaint",cancelled:"Cancelled"};
const time=(value:string|null)=>value?new Date(value).toLocaleString():"—";
const html=(value:string)=>`<p>${value.replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]!)).replace(/\n/g,"<br>")}</p>`;
const read=async<T,>(url:string):Promise<T>=>(await apiRequest("GET",url)).json();
async function fingerprint(value:unknown){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,"0")).join("");}

export default function NewsletterManagement(){
  const {user}=useCustomAuth(),permissions=new Set(user?.permissions??[]);
  const canSend=permissions.has("email.send"),canReconcile=permissions.has("email.delivery.reconcile"),canCampaign=permissions.has("campaigns.manage");
  const [status,setStatus]=useState(""),[cursors,setCursors]=useState<string[]>([]),[selected,setSelected]=useState<string|null>(null),[eventCursor,setEventCursor]=useState<string|null>(null);
  const [email,setEmail]=useState(""),[subject,setSubject]=useState(""),[body,setBody]=useState(""),[reference,setReference]=useState<Reference|null>(null);
  const [receipt,setReceipt]=useState<Message|null>(null),[localError,setLocalError]=useState("");
  const [campaignName,setCampaignName]=useState(""),[scheduledAt,setScheduledAt]=useState("");
  const [campaignReference,setCampaignReference]=useState<Reference|null>(null),[campaignReceipt,setCampaignReceipt]=useState<Campaign|null>(null);
  const [outcome,setOutcome]=useState("accepted"),[providerReference,setProviderReference]=useState(""),[providerMessageId,setProviderMessageId]=useState("");
  const [justification,setJustification]=useState(""),[evidenceChecked,setEvidenceChecked]=useState(false);
  const storageKey=user?.id?`portfolio:email-queue:${user.id}`:null;
  useEffect(()=>{document.title="Communications | Chrispine Mndala";},[]);
  useEffect(()=>{setReference(null);setReceipt(null);setCampaignReference(null);setCampaignReceipt(null);setLocalError("");if(!storageKey)return;
    try{const raw=localStorage.getItem(storageKey);if(raw){const saved=JSON.parse(raw);
      if(!/^[A-Za-z0-9_-]{20,100}$/.test(saved.key)||!/^[a-f0-9]{64}$/.test(saved.fingerprint))throw Error();setReference(saved);}
      const campaignRaw=localStorage.getItem(storageKey+":campaign");if(campaignRaw){const saved=JSON.parse(campaignRaw);
        if(!/^[A-Za-z0-9_-]{20,100}$/.test(saved.key)||!/^[a-f0-9]{64}$/.test(saved.fingerprint))throw Error();setCampaignReference(saved);}}
    catch{setLocalError("The saved queue reference cannot be read. Resolve browser storage before submitting another message.");}
  },[storageKey]);
  useEffect(()=>{setEventCursor(null);setOutcome("accepted");setProviderReference("");setProviderMessageId("");setJustification("");setEvidenceChecked(false);},[selected]);
  const cursor=cursors.at(-1),queueUrl=`/api/admin/email/queue?${new URLSearchParams({...status?{status}:{},...cursor?{cursor}:{}})}`;
  const queue=useQuery<Queue>({queryKey:[queueUrl],staleTime:0});
  const detailUrl=`/api/admin/email/queue/${selected}${eventCursor?`?cursor=${encodeURIComponent(eventCursor)}`:""}`;
  const detail=useQuery<Detail>({queryKey:[detailUrl],enabled:Boolean(selected),staleTime:0});
  const campaigns=useQuery<Campaign[]>({queryKey:["/api/admin/campaigns"],enabled:canCampaign});
  function refresh(){void queryClient.invalidateQueries({predicate:q=>typeof q.queryKey[0]==="string"&&q.queryKey[0].startsWith("/api/admin/email/")});}
  function recordReceipt(record:Message){setReceipt(record);setSelected(record.id);refresh();
    try{if(storageKey)localStorage.removeItem(storageKey);setReference(null);}catch{setLocalError("Queue acceptance is recorded, but the browser reference could not be cleared. Keep the receipt below.");}}
  const send=useMutation({mutationFn:async()=>{
    setLocalError("");if(!storageKey)throw Error("A signed-in database account is required.");
    const message={toEmail:email.trim().toLowerCase(),subject:subject.trim(),htmlBody:html(body),textBody:body,messageType:"transactional"};
    if(new TextEncoder().encode(JSON.stringify(message)).length>9000)throw Error("Message exceeds the supported size. Shorten it before queuing.");
    const hash=await fingerprint(message);let saved:Reference|null=null;
    const raw=localStorage.getItem(storageKey);if(raw){const existing=JSON.parse(raw) as Reference;saved=existing;if(existing.fingerprint!==hash)throw Error("The unresolved reference belongs to different content. Check that queue reference before starting another message.");}
    const prepared=saved??{key:crypto.randomUUID(),fingerprint:hash,createdAt:new Date().toISOString()};
    localStorage.setItem(storageKey,JSON.stringify(prepared));setReference(prepared);
    return(await apiRequest("POST","/api/admin/email/send",{...message,idempotencyKey:prepared.key},{"X-Queue-Actor":user!.id})).json() as Promise<Message>;
  },onSuccess:recordReceipt});
  const check=useMutation({mutationFn:async()=>{if(!reference)throw Error("No queue reference to check");
    return read<{state:string;record?:Message;message?:string}>(`/api/admin/email/requests/${reference.key}`);},
    onSuccess:result=>{if(result.state==="recorded"&&result.record)recordReceipt(result.record);}});
  const reconcile=useMutation({mutationFn:async()=>{
    if(!selected||!evidenceChecked)throw Error("Confirm that provider evidence was checked");
    return apiRequest("POST",`/api/admin/email/${selected}/reconcile`,{outcome,providerReference,justification,...outcome==="accepted"?{providerMessageId}:{}},{"X-Queue-Actor":user!.id});
  },onSuccess:()=>{setEvidenceChecked(false);refresh();}});
  function recordCampaign(record:Campaign){setCampaignReceipt(record);void campaigns.refetch();
    try{if(storageKey)localStorage.removeItem(storageKey+":campaign");setCampaignReference(null);}catch{setLocalError("Campaign recorded, but its browser reference could not be cleared.");}}
  const schedule=useMutation({mutationFn:async()=>{
    if(!storageKey)throw Error("A signed-in account is required");
    const content={name:campaignName.trim(),subject:subject.trim(),htmlContent:html(body),textContent:body,
      channels:["email"],audience:{newsletterSubscribers:true},...scheduledAt?{scheduledAt:new Date(scheduledAt).toISOString()}:{}};
    if(new TextEncoder().encode(JSON.stringify(content)).length>9000)throw Error("Campaign message exceeds the supported size");
    const hash=await fingerprint(content),raw=localStorage.getItem(storageKey+":campaign");
    const saved=raw?JSON.parse(raw) as Reference:null;if(saved&&saved.fingerprint!==hash)throw Error("Check the unresolved campaign reference before changing its content or schedule.");
    const prepared=saved??{key:crypto.randomUUID(),fingerprint:hash,createdAt:new Date().toISOString()};
    localStorage.setItem(storageKey+":campaign",JSON.stringify(prepared));setCampaignReference(prepared);
    return(await apiRequest("POST","/api/admin/campaigns",{...content,requestKey:prepared.key},{"X-Queue-Actor":user!.id})).json() as Promise<Campaign>;
  },onSuccess:recordCampaign});
  const checkCampaign=useMutation({mutationFn:async()=>{if(!campaignReference)throw Error("No campaign reference to check");
    return read<{state:string;record?:Campaign;message?:string}>(`/api/admin/campaign-requests/${campaignReference.key}`);},
    onSuccess:result=>{if(result.state==='recorded'&&result.record)recordCampaign(result.record);}});
  const cancel=useMutation({mutationFn:(id:string)=>apiRequest("POST",`/api/admin/campaigns/${id}/cancel`),onSuccess:()=>void campaigns.refetch()});
  const counts=queue.data?.counts,message=detail.data?.message,disabled=send.isPending||Boolean(receipt);
  return <AdminShell title="Communications" description="Delivery records, message receipts and accountable reconciliation">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-primary">Communication operations</p><h1 className="text-3xl font-semibold text-white">Know what reached the provider.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Queueing, provider acceptance and delivery are separate events. Uncertain acceptance stays held until evidence resolves it.</p></div>
        <Button variant="outline" onClick={refresh} disabled={queue.isFetching}><RefreshCw className="mr-2 h-4 w-4"/>Refresh records</Button></div>
      {queue.isError?<p role="alert" className="text-destructive">Delivery records unavailable: {queue.error.message}</p>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Awaiting dispatch',counts?(counts.pending??0)+(counts.retry??0):null],['Uncertain acceptance',counts?.uncertain??(counts?0:null)],['Delivered',counts?.delivered??(counts?0:null)],['Failed / bounced',counts?(counts.failed??0)+(counts.bounced??0)+(counts.complained??0):null]].map(([label,value])=>
          <Card key={label} className="tech-card"><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value??'…'}</p></CardContent></Card>)}</div>}
      <p className="text-sm text-muted-foreground">Counts cover the entire queue. {queue.data?`Sampled ${time(queue.data.sampledAt)}. ${queue.data.providerConfigured?'Sender configured; actual delivery still needs provider evidence.':'Outbound provider disabled or sender incomplete.'}`:'Reading configuration…'}</p>
      {canSend&&<Card className="tech-card"><CardHeader><CardTitle>Prepare a message</CardTitle></CardHeader><CardContent className="space-y-4">
        <form onSubmit={event=>{event.preventDefault();send.mutate();}} className="space-y-3">
          <label className="block text-sm">Recipient email<Input aria-label="Recipient email" type="email" required maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} disabled={disabled}/></label>
          <label className="block text-sm">Subject<Input aria-label="Subject" required maxLength={500} value={subject} onChange={e=>setSubject(e.target.value)} disabled={disabled}/></label>
          <label className="block text-sm">Message<Textarea aria-label="Message" required maxLength={4000} rows={6} value={body} onChange={e=>setBody(e.target.value)} disabled={disabled}/></label>
          <Button type="submit" disabled={disabled||Boolean(localError)||!queue.data?.providerConfigured}><Mail className="mr-2 h-4 w-4"/>{send.isPending?'Recording queue request…':reference?'Submit identical message with saved reference':'Queue message'}</Button>
        </form>
        {reference&&<div className="rounded-lg border border-amber-400/30 p-4"><p className="font-medium">Keep this queue reference</p><p className="break-all font-mono text-sm">{reference.key}</p>
          <p className="my-2 text-sm text-muted-foreground">Check whether the original request committed. Submitting identical content uses this same reference and cannot create a second queue record.</p>
          <Button variant="outline" disabled={check.isPending} onClick={()=>check.mutate()}>Check queue reference</Button>
          {check.data?.state==='unconfirmed'&&<p role="status" className="mt-2 text-sm">{check.data.message}</p>}</div>}
        {(localError||send.error||check.error)&&<p role="alert" className="text-sm text-destructive">{localError||send.error?.message||check.error?.message}</p>}
        {receipt&&<div role="status" className="rounded-lg border border-primary/30 p-4"><p><CheckCircle2 className="mr-2 inline h-4 w-4"/>Queue record confirmed: {labels[receipt.status]??receipt.status}</p><p className="mt-1 break-all font-mono text-sm">{receipt.id}</p>
          <Button variant="outline" className="mt-3" onClick={()=>{setEmail('');setSubject('');setBody('');setReceipt(null);send.reset();check.reset();}}>Start a new message</Button></div>}
      </CardContent></Card>}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="tech-card"><CardHeader><CardTitle>Delivery queue</CardTitle></CardHeader><CardContent className="space-y-4">
          <label className="block text-sm">Delivery state<select aria-label="Delivery state" className="ml-3 rounded-md border border-border bg-background p-2" value={status} onChange={e=>{setStatus(e.target.value);setCursors([]);}}>
            <option value="">All states</option>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          {queue.isLoading&&<p role="status">Reading delivery queue…</p>}
          {queue.data?.items.map(item=><button key={item.id} className={`w-full rounded-lg border p-4 text-left ${selected===item.id?'border-primary':'border-border'}`} onClick={()=>setSelected(item.id)}>
            <span className="flex flex-wrap justify-between gap-2"><strong className="text-white">{item.subject}</strong><Badge variant="outline">{labels[item.status]??item.status}</Badge></span>
            <span className="mt-2 block break-all text-sm text-muted-foreground">{item.toEmail}</span><span className="mt-1 block text-sm text-muted-foreground">{time(item.createdAt)}</span></button>)}
          {queue.data&&!queue.data.items.length&&<p>No messages match this state.</p>}
          <div className="flex gap-3"><Button variant="outline" disabled={!cursors.length||queue.isFetching} onClick={()=>setCursors(previous=>previous.slice(0,-1))}>Previous page</Button>
            <Button variant="outline" disabled={!queue.data?.nextCursor||queue.isFetching} onClick={()=>setCursors(previous=>[...previous,queue.data!.nextCursor!])}>Next page</Button></div>
        </CardContent></Card>
        <Card className="tech-card"><CardHeader><CardTitle>Delivery evidence</CardTitle></CardHeader><CardContent className="space-y-4">
          {!selected&&<p className="text-muted-foreground">Select a message to inspect its delivery record and event timeline.</p>}
          {detail.isFetching&&<p role="status">Reading message evidence…</p>}{detail.isError&&<p role="alert" className="text-destructive">{detail.error.message}</p>}
          {message&&<><h3 className="text-lg font-medium text-white">{message.subject}</h3><p className="break-all text-sm">{message.toEmail}</p><Badge variant="outline">{labels[message.status]??message.status}</Badge>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm"><dt>Provider</dt><dd>{message.provider??'Unconfirmed'}</dd><dt>Provider message</dt><dd className="break-all">{message.providerMessageId??'Unconfirmed'}</dd><dt>Attempts</dt><dd>{message.attemptCount} / {message.maxAttempts}</dd><dt>Accepted</dt><dd>{time(message.sentAt)}</dd><dt>Delivered</dt><dd>{time(message.deliveredAt)}</dd></dl>
            {message.lastError&&<p className="rounded-md border border-border p-3 text-sm">{message.lastError}</p>}
            <h4 className="font-medium">Event timeline</h4>{detail.data?.events.map(event=><div key={event.id} className="border-l border-primary/40 pl-4"><p>{event.eventType.replaceAll('_',' ')}</p><p className="text-sm text-muted-foreground">{time(event.occurredAt)} · {event.provider??'Application'}</p></div>)}
            {!detail.data?.events.length&&<p className="text-sm text-muted-foreground">No delivery event has been recorded.</p>}
            <div className="flex gap-3">{eventCursor&&<Button variant="outline" onClick={()=>setEventCursor(null)}>Latest events</Button>}{detail.data?.nextCursor&&<Button variant="outline" onClick={()=>setEventCursor(detail.data!.nextCursor)}>Older events</Button>}</div>
            {message.status==='uncertain'&&<div className="space-y-3 rounded-lg border border-amber-400/30 p-4"><p className="font-medium"><ShieldAlert className="mr-2 inline h-4 w-4"/>Resolve provider acceptance</p>
              <p className="text-sm text-muted-foreground">Use the provider's message record or support confirmation. An absent callback alone does not prove that sending failed.</p>
              {!canReconcile?<p className="text-sm">An operator with delivery-reconciliation permission must record the decision.</p>:<form className="space-y-3" onSubmit={event=>{event.preventDefault();reconcile.mutate();}}>
                <label className="block text-sm">Verified outcome<select aria-label="Verified outcome" className="mt-1 w-full rounded-md border border-border bg-background p-2" value={outcome} onChange={e=>setOutcome(e.target.value)}><option value="accepted">Provider accepted this message</option><option value="confirmed_not_sent" disabled={Boolean(message.providerMessageId)}>Provider confirmed it was not accepted</option></select></label>
                <label className="block text-sm">Provider evidence reference<Input aria-label="Provider evidence reference" required minLength={5} maxLength={1000} value={providerReference} onChange={e=>setProviderReference(e.target.value)}/></label>
                {outcome==='accepted'&&<label className="block text-sm">Verified provider message ID<Input aria-label="Verified provider message ID" required maxLength={255} value={providerMessageId} onChange={e=>setProviderMessageId(e.target.value)}/></label>}
                <label className="block text-sm">Decision justification<Textarea aria-label="Decision justification" required minLength={12} maxLength={2000} value={justification} onChange={e=>setJustification(e.target.value)}/></label>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={evidenceChecked} onChange={e=>setEvidenceChecked(e.target.checked)}/>I checked provider evidence for this recipient and this message.</label>
                <Button type="submit" disabled={!evidenceChecked||reconcile.isPending}>{reconcile.isPending?'Recording evidence…':'Record verified outcome'}</Button>
                {reconcile.error&&<p role="alert" className="text-sm text-destructive">{reconcile.error.message}</p>}
              </form>}
            </div>}
          </>}
        </CardContent></Card>
      </div>
      {canCampaign&&<Card className="tech-card"><CardHeader><CardTitle><Calendar className="mr-2 inline h-5 w-5"/>Email campaigns</CardTitle></CardHeader><CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Uses the subject and message above. Only active, consented newsletter subscribers are eligible. “Audience queued” confirms fanout, not delivery.</p>
        <label className="block text-sm">Campaign name<Input aria-label="Campaign name" maxLength={180} value={campaignName} onChange={e=>setCampaignName(e.target.value)}/></label>
        <label className="block text-sm">Scheduled time<Input aria-label="Scheduled time" type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/></label>
        <Button disabled={!campaignName||!subject||!body||schedule.isPending||Boolean(campaignReceipt)||Boolean(localError)||Boolean(scheduledAt&&!queue.data?.providerConfigured)} onClick={()=>schedule.mutate()}>{campaignReference?'Submit identical campaign with saved reference':scheduledAt?'Schedule campaign':'Save campaign draft'}</Button>
        {campaignReference&&<div className="rounded-lg border border-amber-400/30 p-3"><p className="break-all text-sm">Campaign reference: {campaignReference.key}</p><Button variant="outline" className="mt-2" disabled={checkCampaign.isPending} onClick={()=>checkCampaign.mutate()}>Check campaign reference</Button>{checkCampaign.data?.state==='unconfirmed'&&<p className="mt-2 text-sm">{checkCampaign.data.message}</p>}</div>}
        {campaignReceipt&&<div role="status" className="rounded-lg border border-primary/30 p-3"><p>Campaign record confirmed: {campaignReceipt.name}</p><Button variant="outline" className="mt-2" onClick={()=>{setCampaignName('');setScheduledAt('');setCampaignReceipt(null);schedule.reset();checkCampaign.reset();}}>Prepare another campaign</Button></div>}
        {checkCampaign.error&&<p role="alert" className="text-destructive">{checkCampaign.error.message}</p>}
        {schedule.error&&<p role="alert" className="text-destructive">{schedule.error.message}</p>}{campaigns.isError&&<p role="alert" className="text-destructive">Campaign records unavailable: {campaigns.error.message}</p>}
        {campaigns.data?.map(campaign=><div key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"><div><p>{campaign.name}</p><p className="text-sm text-muted-foreground">{campaign.status==='completed'?'Audience queued':campaign.status} · {time(campaign.scheduledAt)}</p></div>
          {campaign.status==='scheduled'&&<Button variant="outline" disabled={cancel.isPending} onClick={()=>cancel.mutate(campaign.id)}>Cancel scheduled campaign</Button>}</div>)}
        {cancel.error&&<p role="alert" className="text-destructive">{cancel.error.message}</p>}
      </CardContent></Card>}
    </div>
  </AdminShell>;
}
