import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { requestFailureMessage, unconfirmedWriteMessage } from "./request-error";
import { isFinancialWrite } from "@shared/financial-requests";
import { prepareFinancialRequest, resolveFinancialRequest } from "./financial-request-store";

async function throwIfResNotOk(res: Response, method = "GET") {
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(requestFailureMessage(res.status, payload, res.headers.get("X-Request-Id"), method));
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  additionalHeaders: Record<string,string> = {},
): Promise<Response> {
  let reference: string | undefined, actor: string | undefined;
  if (isFinancialWrite(method, url)) {
    let identity: Response;
    try { identity = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" }); }
    catch { throw new Error("Your account could not be verified. No financial change was submitted."); }
    await throwIfResNotOk(identity);
    const user = await identity.json();
    if (typeof user.id !== "string" || !user.id) throw new Error("A database-backed account is required for financial changes.");
    actor = user.id;
    reference = (await prepareFinancialRequest(user.id, method.toUpperCase(), url, data)).key;
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { ...additionalHeaders, ...(data ? { "Content-Type": "application/json" } : {}), ...(reference && actor ? { "Idempotency-Key": reference, "X-Financial-Actor": actor } : {}) },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (error) {
    if (reference) throw new Error(`The financial outcome is unconfirmed. Reference: ${reference}. Open Financial requests to reconcile it before submitting another change.`);
    if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) throw new Error(unconfirmedWriteMessage);
    throw error;
  }

  if (reference && actor) {
    if (res.headers.get("Idempotency-Result") === "recorded") {
      // Require a complete JSON response before clearing the browser reference.
      try { await res.clone().json(); }
      catch { throw new Error(`The financial response is incomplete. Reconcile reference ${reference} in Financial requests.`); }
      resolveFinancialRequest(actor, reference);
    } else {
      const payload = await res.clone().json().catch(() => null);
      throw new Error(`${requestFailureMessage(res.status, payload, res.headers.get("X-Request-Id"), method)} Financial reference: ${reference}. Reconcile it in Financial requests.`);
    }
  }

  await throwIfResNotOk(res, method);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 10, // 10 minutes in memory
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0,
    },
  },
});
