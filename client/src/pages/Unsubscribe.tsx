import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Unsubscribe() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") ?? "");
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [message, setMessage] = useState("");
  async function submit() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.message??"The request could not be confirmed.");
      setDone(true); window.history.replaceState(null,"","/unsubscribe");
    }catch(error){setMessage(error instanceof Error?error.message:"The request could not be confirmed.");}
    finally{setBusy(false);}
  }
  return <div className="mx-auto max-w-xl px-5 pt-32 pb-20"><h1 className="text-3xl font-semibold">Newsletter preferences</h1>
    <p className="my-6">{done?"You are unsubscribed from newsletter messages.":"Confirm below to stop newsletter messages. Account and requested service messages are handled separately."}</p>
    {!done&&<Button disabled={busy||token.length<32} onClick={()=>void submit()}>{busy?"Updating…":"Unsubscribe"}</Button>}
    {!token&&!done&&<p>A valid link from your newsletter is required.</p>}{message&&<p role="alert" className="mt-5">{message}</p>}
  </div>;
}
