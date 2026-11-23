import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { EditorialPage } from "@/components/editorial/EditorialPage";
export default function AccountRecovery() {
  const reset = window.location.pathname === "/reset-password";
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "",
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [message, setMessage] = useState("");
  const capabilities = useQuery<{ recoveryEnabled: boolean }>({
    queryKey: ["/api/auth/capabilities"],
    retry: false,
  });
  useEffect(() => {
    document.title = "Account recovery | Chrispine Mndala";
    if (reset) window.history.replaceState(null, "", "/reset-password");
  }, [reset]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (reset && password !== confirmation) {
      setMessage("Passwords must match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/auth/recovery/${reset ? "complete" : "request"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            reset ? { token, password, confirmation } : { email },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw Error(result.message ?? "The request could not be confirmed.");
      setDone(true);
      setMessage(result.message);
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The request could not be confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  const enabled = capabilities.data?.recoveryEnabled;
  return (
    <EditorialPage>
      <div className="recovery-layout">
        <div>
          <p className="portfolio-overline">Account access</p>
          <h1>
            {reset ? (
              <>
                A new password.
                <br />
                <em>A fresh sign-in.</em>
              </>
            ) : (
              <>
                Back to
                <br />
                <em>your account.</em>
              </>
            )}
          </h1>
          <p className="editorial-lead">
            Recovery uses a private, short-lived link sent to an established
            account address. Completing it invalidates existing sessions.
          </p>
        </div>
        <div className="account-panel">
          {capabilities.isLoading ? (
            <p role="status">Checking recovery availability…</p>
          ) : !enabled ? (
            <>
              <h2>Recovery is not enabled</h2>
              <p>
                Contact the account owner through your established channel. No
                recovery email has been requested from this page.
              </p>
              <Link href="/contact" className="editorial-text-link">
                Contact Chrispine
              </Link>
            </>
          ) : done ? (
            <>
              <h2>{reset ? "Password changed" : "Check your inbox"}</h2>
              <p role="status">{message}</p>
              <Link href="/login" className="editorial-button">
                Return to sign in
              </Link>
            </>
          ) : reset && !/^[A-Za-z0-9_-]{43}$/.test(token) ? (
            <>
              <h2>A valid link is required</h2>
              <p>
                Open the complete link from your recovery email. If it has
                expired, request another link.
              </p>
              <Link href="/forgot-password" className="editorial-text-link">
                Request recovery
              </Link>
            </>
          ) : (
            <form
              onSubmit={(event) => void submit(event)}
              className="recovery-form"
            >
              <h2>
                {reset ? "Choose a new password" : "Request a private link"}
              </h2>
              {reset ? (
                <>
                  <label>
                    New password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={1024}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <label>
                    Confirm password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={1024}
                      required
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                    />
                  </label>
                  <p>
                    Use at least 12 characters. All current sessions will be
                    signed out.
                  </p>
                </>
              ) : (
                <label>
                  Account email
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={320}
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              )}
              <button className="editorial-button" disabled={busy}>
                {busy
                  ? "Processing…"
                  : reset
                    ? "Change password"
                    : "Request recovery link"}
              </button>
              {message && <p role="alert">{message}</p>}
              <Link href="/login" className="editorial-text-link">
                Return to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </EditorialPage>
  );
}
