import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { EditorialPhoto } from "@/components/EditorialPhoto";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Subscribe() {
  const { user, isLoading } = useAuth();
  const actor = useRef(user?.id); actor.current = user?.id;
  const readiness = useQuery<{ enabled: boolean; mode: string }>({ queryKey: ["/api/billing/status"] });
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  useEffect(() => {
    document.title = "Membership | Chrispine Mndala";
    try { setReference(user?.id ? localStorage.getItem(`billing-request:${user.id}`) ?? "" : ""); }
    catch { setMessage("Saved checkout references are unavailable in this browser."); }
  }, [user?.id]);
  function follow(result: {status?: string; url?: string; message?: string}) {
    if (result.status === "created" && result.url) {
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("The checkout address could not be verified.");
      window.location.assign(result.url);
    } else setMessage(result.status === "completed" ? "Checkout is recorded. View your membership in the dashboard." : "The outcome is unconfirmed. Keep this reference; do not create another request.");
  }
  async function checkout() {
    if (!user) return;
    const actorId = user.id;
    setBusy(true); setMessage("");
    try {
      if (!navigator.locks) throw new Error("This browser cannot safely save a checkout reference.");
      const allocation = await navigator.locks.request(`billing-request:${user.id}`, () => {
        const name = `billing-request:${user.id}`, existing = localStorage.getItem(name);
        if (existing) return {key:existing, existing:true};
        const key = crypto.randomUUID(); localStorage.setItem(name, key);
        if (localStorage.getItem(name) !== key) throw new Error("The checkout reference could not be saved.");
        return {key, existing:false};
      });
      if (actor.current !== actorId) throw new Error("The signed-in account changed. Sign in and inspect your saved reference.");
      setReference(allocation.key);
      // Another tab may already have submitted this reference. Inspect only.
      const response = allocation.existing
        ? await fetch(`/api/billing/requests/${encodeURIComponent(allocation.key)}`, {credentials:"include",cache:"no-store"})
        : await fetch("/api/billing/checkout", {method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-Billing-Actor":actorId},body:JSON.stringify({requestKey:allocation.key})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Checkout could not be confirmed. Keep the saved reference.");
      if (actor.current !== actorId) throw new Error("The signed-in account changed. Inspect your saved reference after signing in.");
      follow(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout could not be confirmed."); }
    finally { setBusy(false); }
  }
  async function inspect() {
    const actorId = user?.id;
    setBusy(true);
    try {
      const response = await fetch(`/api/billing/requests/${encodeURIComponent(reference)}`, {credentials:"include",cache:"no-store"});
      const result = await response.json(); if (!response.ok) throw new Error(result.message ?? "Inspection failed");
      if (!actorId || actor.current !== actorId) throw new Error("The signed-in account changed. Inspect the reference after signing in.");
      follow(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Inspection failed"); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-5xl px-5 pt-28 pb-20">
    <div className="grid items-center gap-8 lg:grid-cols-2"><div><h1 className="text-4xl font-semibold">Membership & updates</h1>
      <p className="mt-5 text-muted-foreground">Follow the technical writing and project notes. Membership availability is shown below.</p></div><EditorialPhoto photo="reading" eager /></div>
    <Card className="mt-10"><CardHeader><CardTitle>{readiness.data?.enabled ? "Test membership checkout" : "Membership is being prepared"}</CardTitle></CardHeader><CardContent className="space-y-4">
      {readiness.data?.enabled ? <><p>Sandbox checkout is enabled for acceptance testing. Live billing is not available.</p>
        {isLoading ? <p>Checking your session…</p> : !user ? <Button asChild><Link href="/login">Sign in</Link></Button> : reference ? <>
          <p className="break-all text-sm">Saved reference: {reference}</p><Button disabled={busy} onClick={() => void inspect()}>Check saved checkout</Button>
        </> : <Button disabled={busy} onClick={() => void checkout()}>Open test checkout</Button>}</> : <p>Paid membership is not available. You can explore the public writing, project casebooks and engineering journal.</p>}
      {message && <p role="status">{message}</p>}<p><Link href="/dashboard">Membership dashboard</Link></p>
    </CardContent></Card>
  </div>;
}
