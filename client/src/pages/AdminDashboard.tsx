import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, ArrowUpRight, BriefcaseBusiness, CircleAlert, FileText, Mail,
  MessageSquare, Radio, Send, ShieldCheck, Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminOverview {
  content: { posts: number; publishedPosts: number; draftPosts: number; projects: number; featuredProjects: number };
  audience: { subscribers: number; activeSubscribers: number; contacts: number; unreadContacts: number };
  delivery: { pendingEmail: number; failedEmail: number; scheduledCampaigns: number; unreadNotifications: number };
  security: { activeSessions: number };
  pipeline: { openLeads: number; qualifiedLeads: number; dueFollowUps: number; weightedValue: string | null };
  providers: { email: boolean; sms: boolean; whatsapp: boolean; push: boolean };
  recent: {
    contacts: Array<{ id: string; name: string; email: string; projectType: string | null; isRead: boolean; createdAt: string }>;
    email: Array<{ id: string; recipient: string; subject: string; status: string; createdAt: string }>;
  };
  generatedAt: string;
}

function formatTime(value: string) {
  const date = new Date(value);
  const difference = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : date.toLocaleDateString();
}

export default function AdminDashboard() {
  useEffect(() => { document.title = "Admin Command | Chrispine Mndala"; }, []);
  const overview = useQuery<AdminOverview>({ queryKey: ["/api/admin/overview"], refetchInterval: 60_000 });
  const data = overview.data;
  const metrics = data ? [
    { label: "Published posts", value: data.content.publishedPosts, detail: `${data.content.draftPosts} drafts`, icon: FileText, color: "text-blue-400" },
    { label: "Portfolio projects", value: data.content.projects, detail: `${data.content.featuredProjects} featured`, icon: BriefcaseBusiness, color: "text-violet-400" },
    { label: "Active subscribers", value: data.audience.activeSubscribers, detail: `${data.audience.subscribers} total`, icon: Users, color: "text-emerald-400" },
    { label: "Unread contacts", value: data.audience.unreadContacts, detail: `${data.audience.contacts} total leads`, icon: MessageSquare, color: "text-amber-400" },
  ] : [];

  return <AdminShell title="Command overview" description="Operational state across content, audience, delivery, and security">
    {overview.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(item => <Skeleton key={item} className="h-36" />)}</div> : overview.isError ?
      <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex items-start gap-3 pt-6"><CircleAlert className="mt-0.5 h-5 w-5 text-destructive"/><div><p className="font-semibold">Overview unavailable</p><p className="mt-1 text-sm text-muted-foreground">{overview.error.message}</p><Button className="mt-4" variant="outline" onClick={() => overview.refetch()}>Retry</Button></div></CardContent></Card> : <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, icon: Icon, color }) => <Card key={label} className="border-white/[0.07] bg-white/[0.025]"><CardContent className="p-5">
            <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-white/40">{label}</p><p className="mt-3 text-3xl font-black tracking-tight">{value}</p></div><div className="rounded-xl bg-white/[0.04] p-2.5"><Icon className={`h-5 w-5 ${color}`} /></div></div>
            <p className="mt-3 text-xs text-white/30">{detail}</p>
          </CardContent></Card>)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-white/[0.07] bg-white/[0.025]"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Operations queue</CardTitle><p className="mt-1 text-xs text-white/35">Delivery work requiring attention</p></div><Activity className="h-5 w-5 text-primary" /></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[{ label: "Open opportunities", value: data!.pipeline.openLeads, icon: BriefcaseBusiness }, { label: "Follow-ups due", value: data!.pipeline.dueFollowUps, icon: CircleAlert }, { label: "Email pending", value: data!.delivery.pendingEmail, icon: Mail }, { label: "Delivery failures", value: data!.delivery.failedEmail, icon: CircleAlert }].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-4"><Icon className="h-4 w-4 text-white/35"/><div className="flex-1"><p className="text-xs text-white/40">{label}</p><p className="text-xl font-bold">{value}</p></div></div>)}
              <Button asChild><Link href="/admin/pipeline">Open pipeline <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href="/admin/communications">Communications <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.025]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4 text-emerald-400"/>Provider readiness</CardTitle></CardHeader><CardContent className="space-y-3">
            {Object.entries(data!.providers).map(([provider, configured]) => <div key={provider} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2.5"><span className="text-sm capitalize">{provider}</span><Badge variant="outline" className={configured ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-white/10 text-white/35"}>{configured ? "Ready" : "Not configured"}</Badge></div>)}
          </CardContent></Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-white/[0.07] bg-white/[0.025]"><CardHeader><CardTitle className="text-base">Recent contacts</CardTitle></CardHeader><CardContent className="space-y-2">
            {data!.recent.contacts.map(contact => <div key={contact.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.03]"><div className={`h-2 w-2 rounded-full ${contact.isRead ? "bg-white/15" : "bg-amber-400"}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{contact.name}</p><p className="truncate text-xs text-white/30">{contact.projectType || contact.email}</p></div><span className="text-[10px] text-white/25">{formatTime(contact.createdAt)}</span></div>)}
            {!data!.recent.contacts.length && <p className="py-6 text-center text-sm text-white/30">No contact requests yet.</p>}
          </CardContent></Card>
          <Card className="border-white/[0.07] bg-white/[0.025]"><CardHeader><CardTitle className="text-base">Recent email activity</CardTitle></CardHeader><CardContent className="space-y-2">
            {data!.recent.email.map(message => <div key={message.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.03]"><Mail className="h-4 w-4 text-white/25"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{message.subject}</p><p className="truncate text-xs text-white/30">{message.recipient}</p></div><Badge variant="outline" className="text-[9px] uppercase">{message.status}</Badge></div>)}
            {!data!.recent.email.length && <p className="py-6 text-center text-sm text-white/30">No email activity yet.</p>}
          </CardContent></Card>
        </section>
        <p className="text-right text-[10px] font-mono text-white/20">REFRESHED {new Date(data!.generatedAt).toLocaleTimeString()}</p>
      </div>}
  </AdminShell>;
}
