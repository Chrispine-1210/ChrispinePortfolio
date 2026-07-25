import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, Mail, Send, ShieldBan, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";

type OutboxMessage = { id: string; toEmail: string; subject: string; status: string; createdAt: string };
type Campaign = { id: string; name: string; status: string; channels: string[]; scheduledAt: string | null };
type Suppression = { id: string; email: string; reason: string };

export default function NewsletterManagement() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  useEffect(() => { document.title = "COMMUNICATION_COMMAND | Chrispine Mndala"; }, []);

  const stats = useQuery<{ totalSubscribers: number }>({ queryKey: ["/api/admin/stats"] });
  const outbox = useQuery<OutboxMessage[]>({ queryKey: ["/api/admin/email/outbox"] });
  const campaigns = useQuery<Campaign[]>({ queryKey: ["/api/admin/campaigns"] });
  const suppressions = useQuery<Suppression[]>({ queryKey: ["/api/admin/email/suppressions"] });
  const sendEmail = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/email/send", {
      toEmail: email, subject, htmlBody: `<p>${body.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!)).replace(/\n/g, "<br>")}</p>`, textBody: body,
    }),
    onSuccess: () => { setEmail(""); setSubject(""); setBody(""); queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outbox"] }); },
  });
  const scheduleCampaign = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/campaigns", {
      name: campaignName, subject, htmlContent: `<p>${body}</p>`, textContent: body,
      channels: ["email"], audience: { newsletterSubscribers: true },
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    }),
    onSuccess: () => { setCampaignName(""); setScheduledAt(""); queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] }); },
  });

  return <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14]">
    <main className="max-w-7xl mx-auto px-4 space-y-8">
      <div><h1 className="text-4xl font-black text-white uppercase"><span className="text-primary">// </span>Communication Command</h1>
        <p className="text-muted-foreground font-mono mt-2">EMAIL · CAMPAIGNS · DELIVERY · SUPPRESSIONS</p></div>
      <div className="grid sm:grid-cols-4 gap-4">
        {[{ icon: Users, label: "Subscribers", value: stats.data?.totalSubscribers ?? 0 },
          { icon: Mail, label: "Outbox", value: outbox.data?.length ?? 0 },
          { icon: Calendar, label: "Campaigns", value: campaigns.data?.length ?? 0 },
          { icon: ShieldBan, label: "Suppressed", value: suppressions.data?.length ?? 0 }].map(({ icon: Icon, label, value }) =>
          <Card key={label} className="tech-card"><CardContent className="pt-6 flex gap-4"><Icon className="text-primary"/><div><p className="text-xs font-mono text-muted-foreground">{label}</p><p className="text-2xl text-white font-black">{value}</p></div></CardContent></Card>)}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="tech-card"><CardHeader><CardTitle>Queue an email</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="recipient@example.com" type="email"/>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"/>
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message" rows={7}/>
          <Button disabled={!email || !subject || !body || sendEmail.isPending} onClick={() => sendEmail.mutate()}><Send className="mr-2 h-4 w-4"/>Queue securely</Button>
          {sendEmail.error && <p className="text-sm text-destructive">{sendEmail.error.message}</p>}
        </CardContent></Card>
        <Card className="tech-card"><CardHeader><CardTitle>Schedule campaign</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign name"/>
          <Input value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} type="datetime-local"/>
          <p className="text-xs text-muted-foreground">Uses the subject and message from the email composer. Audience: active newsletter subscribers.</p>
          <Button variant="outline" disabled={!campaignName || !subject || !body || scheduleCampaign.isPending} onClick={() => scheduleCampaign.mutate()}><Calendar className="mr-2 h-4 w-4"/>{scheduledAt ? "Schedule" : "Save draft"}</Button>
          {scheduleCampaign.error && <p className="text-sm text-destructive">{scheduleCampaign.error.message}</p>}
        </CardContent></Card>
      </div>
      <Card className="tech-card"><CardHeader><CardTitle>Recent delivery queue</CardTitle></CardHeader><CardContent className="space-y-3">
        {outbox.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {outbox.data?.map(item => <div key={item.id} className="border border-border p-3 flex flex-wrap justify-between gap-2"><div><p className="text-white font-medium">{item.subject}</p><p className="text-xs text-muted-foreground">{item.toEmail}</p></div><Badge variant="outline">{item.status}</Badge></div>)}
        {!outbox.isLoading && !outbox.data?.length && <p className="text-muted-foreground">No queued emails yet.</p>}
      </CardContent></Card>
    </main>
  </div>;
}
