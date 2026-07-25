import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCheck, Mail, MessageSquare, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ContactRecord { id: string; name: string; email: string; projectType: string | null; message: string; preferredContact: string | null; isRead: boolean; createdAt: string }

export default function ContactsManagement() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "unread">("all");
  const endpoint = `/api/admin/contacts?status=${status}&search=${encodeURIComponent(search)}`;
  const query = useQuery<ContactRecord[]>({ queryKey: [endpoint] });
  const update = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => apiRequest("PATCH", `/api/admin/contacts/${id}`, { isRead }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [endpoint] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] }); },
  });
  return <AdminShell title="Contacts" description="Review and process enquiries from your portfolio contact channels">
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row"><form className="flex flex-1 gap-2" onSubmit={event => { event.preventDefault(); setSearch(input); }}><Input value={input} onChange={event => setInput(event.target.value)} placeholder="Search name, email, or message"/><Button type="submit" variant="outline"><Search className="h-4 w-4"/></Button></form>
        <div className="flex gap-2"><Button variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>All</Button><Button variant={status === "unread" ? "default" : "outline"} onClick={() => setStatus("unread")}>Unread</Button></div></div>
      <div className="grid gap-3">
        {query.data?.map(contact => <Card key={contact.id} className={`border-white/[0.07] bg-white/[0.025] ${!contact.isRead ? "border-l-2 border-l-amber-400" : ""}`}><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{contact.name}</h2>{contact.projectType && <Badge variant="outline">{contact.projectType}</Badge>}{!contact.isRead && <Badge className="bg-amber-500/15 text-amber-300">New</Badge>}</div><a className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline" href={`mailto:${contact.email}`}><Mail className="h-3 w-3"/>{contact.email}</a><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/60">{contact.message}</p><p className="mt-3 text-[10px] text-white/25">{new Date(contact.createdAt).toLocaleString()} · prefers {contact.preferredContact || "email"}</p></div><div className="flex gap-2"><Button asChild size="sm"><a href={`mailto:${contact.email}?subject=${encodeURIComponent("Re: Your portfolio enquiry")}`}><MessageSquare className="mr-2 h-4 w-4"/>Reply</a></Button><Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: contact.id, isRead: !contact.isRead })}><CheckCheck className="mr-2 h-4 w-4"/>{contact.isRead ? "Mark unread" : "Mark read"}</Button></div></div></CardContent></Card>)}
        {!query.isLoading && !query.data?.length && <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-white/35">No contacts match this view.</div>}
      </div>
    </div>
  </AdminShell>;
}
