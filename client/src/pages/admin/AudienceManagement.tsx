import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, UserCheck, UserMinus, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SubscriberRecord { id: string; email: string; name: string | null; isActive: boolean; subscribedAt: string; unsubscribedAt: string | null }

export default function AudienceManagement() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active">("all");
  const endpoint = `/api/admin/subscribers?status=${status}&search=${encodeURIComponent(search)}`;
  const subscribers = useQuery<SubscriberRecord[]>({ queryKey: [endpoint] });
  const update = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiRequest("PATCH", `/api/admin/subscribers/${id}`, { isActive }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [endpoint] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] }); } });
  const activeCount = subscribers.data?.filter(item => item.isActive).length ?? 0;
  return <AdminShell title="Audience" description="Newsletter subscribers, consent state, and engagement readiness">
    <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Card className="border-white/[0.07] bg-white/[0.025]"><CardContent className="flex items-center gap-4 p-5"><Users className="h-6 w-6 text-primary"/><div><p className="text-2xl font-black">{subscribers.data?.length ?? 0}</p><p className="text-xs text-white/35">Records in this view</p></div></CardContent></Card><Card className="border-white/[0.07] bg-white/[0.025]"><CardContent className="flex items-center gap-4 p-5"><UserCheck className="h-6 w-6 text-emerald-400"/><div><p className="text-2xl font-black">{activeCount}</p><p className="text-xs text-white/35">Active subscribers</p></div></CardContent></Card></div>
      <div className="flex flex-col gap-3 sm:flex-row"><form className="flex flex-1 gap-2" onSubmit={event => { event.preventDefault(); setSearch(input); }}><Input value={input} onChange={event => setInput(event.target.value)} placeholder="Search subscriber"/><Button type="submit" variant="outline"><Search className="h-4 w-4"/></Button></form><div className="flex gap-2"><Button variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>All</Button><Button variant={status === "active" ? "default" : "outline"} onClick={() => setStatus("active")}>Active</Button></div></div>
      <div className="overflow-hidden rounded-xl border border-white/[0.07]">{subscribers.data?.map(subscriber => <div key={subscriber.id} className="flex flex-col gap-3 border-b border-white/[0.06] bg-white/[0.02] p-4 last:border-0 sm:flex-row sm:items-center"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-xs font-bold">{(subscriber.name || subscriber.email).slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{subscriber.name || "Unnamed subscriber"}</p><p className="truncate text-xs text-white/35">{subscriber.email}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className={subscriber.isActive ? "border-emerald-500/30 text-emerald-400" : "text-white/30"}>{subscriber.isActive ? "Active" : "Inactive"}</Badge><span className="hidden text-[10px] text-white/25 md:block">Since {new Date(subscriber.subscribedAt).toLocaleDateString()}</span><Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: subscriber.id, isActive: !subscriber.isActive })}>{subscriber.isActive ? <UserMinus className="mr-2 h-4 w-4"/> : <UserCheck className="mr-2 h-4 w-4"/>}{subscriber.isActive ? "Deactivate" : "Reactivate"}</Button></div></div>)}{!subscribers.isLoading && !subscribers.data?.length && <div className="py-16 text-center text-sm text-white/35">No subscribers match this view.</div>}</div>
    </div>
  </AdminShell>;
}
