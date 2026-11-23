import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BookOpen,
  FolderOpen,
  ShieldCheck,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { EditorialPage } from "@/components/editorial/EditorialPage";
import { setSEO } from "@/lib/seoHelper";
export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { logout, logoutPending } = useCustomAuth();
  const billing = useQuery<{ enabled: boolean; mode: string }>({
    queryKey: ["/api/billing/status"],
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setSEO(
      "Your account | Chrispine Mndala",
      "Manage your account and explore the writing, project casebooks and engineering journal.",
      "/dashboard",
    );
  }, []);
  async function portal() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Billing-Actor":user?.id??"" },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.message ?? "Billing account could not be opened.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "billing.stripe.com")
        throw Error("Billing address could not be verified.");
      window.location.assign(url.href);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Billing account unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <EditorialPage>
      <header className="account-heading">
        <p className="portfolio-overline">Your account</p>
        <h1>
          A place for
          <br />
          <em>the next question.</em>
        </h1>
        <p className="editorial-lead">
          Your membership, public writing and the work behind the work.
        </p>
      </header>
      {isLoading ? (
        <p role="status">Checking your session…</p>
      ) : !user ? (
        <div className="account-panel">
          <ShieldCheck size={28} />
          <h2>Sign in to continue</h2>
          <p>
            Use your authorized account to view membership details. The public
            work and journal are open to explore.
          </p>
          <div className="editorial-actions">
            <Link href="/login" className="editorial-button">
              Sign in
            </Link>
            <Link href="/portfolio" className="editorial-button secondary">
              Explore the work
            </Link>
          </div>
        </div>
      ) : (
        <div className="account-layout">
          <aside className="account-profile">
            <div className="account-avatar">
              {(user.firstName?.[0] ?? user.email?.[0] ?? "C").toUpperCase()}
            </div>
            <h2>
              {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                "Your account"}
            </h2>
            <p>{user.email}</p>
            <span className="account-membership">
              {user.isPremium ? "Sandbox membership active" : "Public reader"}
            </span>
            <button
              onClick={() => logout()}
              disabled={logoutPending}
              className="editorial-text-link"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </aside>
          <div className="account-main">
            <section className="account-panel">
              <CreditCard size={26} />
              <h2>Membership & billing</h2>
              <p>
                {billing.data?.enabled
                  ? "Sandbox billing is available for acceptance testing. No live membership sales are enabled."
                  : "Paid membership is being prepared. Public casebooks, journal entries and writing remain available as published."}
              </p>
              {user.isPremium ? (
                <button
                  className="editorial-button secondary"
                  disabled={busy}
                  onClick={() => void portal()}
                >
                  Manage sandbox billing
                </button>
              ) : (
                <Link href="/subscribe" className="editorial-button secondary">
                  View membership availability
                </Link>
              )}
              {message && <p role="status">{message}</p>}
            </section>
            <section className="account-reading">
              <Link href="/blog">
                <BookOpen size={24} />
                <h3>Writing & research</h3>
                <p>Read the questions, methods and technical explanations.</p>
              </Link>
              <Link href="/portfolio">
                <FolderOpen size={24} />
                <h3>Project casebooks</h3>
                <p>
                  Explore architecture, workflows and the available evidence.
                </p>
              </Link>
            </section>
            <p className="account-security-note">
              <ShieldCheck size={17} />
              Account recovery and session controls are separate from membership
              billing.
            </p>
          </div>
        </div>
      )}
    </EditorialPage>
  );
}
