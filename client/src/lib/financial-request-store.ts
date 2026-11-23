import { canonicalRequestJson, financialRequestKeyPattern } from "@shared/financial-requests";

export type PendingFinancialRequest = { key: string; method: string; path: string; createdAt: string };
const prefix = (actor: string) => `financial-request-v1:${encodeURIComponent(actor)}:`;
const storage = () => {
  if (typeof localStorage === "undefined") throw new Error("Persistent browser storage is required before recording financial changes.");
  return localStorage;
};
export function pendingFinancialRequests(actor: string): PendingFinancialRequest[] {
  const store = storage(), result: PendingFinancialRequest[] = [];
  for (let i = 0; i < store.length; i++) {
    const name = store.key(i);
    if (!name?.startsWith(prefix(actor))) continue;
    const item = JSON.parse(store.getItem(name) ?? "null");
    if (!item || !financialRequestKeyPattern.test(item.key) || typeof item.method !== "string" || typeof item.path !== "string" || typeof item.createdAt !== "string") {
      throw new Error("A saved financial reference is unreadable. Reconcile saved references before recording another change.");
    }
    result.push(item);
  }
  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function prepareFinancialRequest(actor: string, method: string, path: string, body: unknown) {
  const bytes = new TextEncoder().encode(canonicalRequestJson({ actor, method, path, body: body ?? null }));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(v => v.toString(16).padStart(2, "0")).join("");
  const name = prefix(actor) + hash;
  if (typeof navigator === "undefined" || !navigator.locks) throw new Error("This browser cannot safely coordinate saved financial references. Use a browser with Web Locks support.");
  return navigator.locks.request(name, () => {
  const store = storage();
  // Validate the entire retained set before allocating a new reference.
  const pending = pendingFinancialRequests(actor);
  const existing = store.getItem(name);
  if (existing) return JSON.parse(existing) as PendingFinancialRequest;
  if (pending.length >= 100) throw new Error("Reconcile saved financial requests before recording more changes.");
  const item: PendingFinancialRequest = { key: crypto.randomUUID(), method, path, createdAt: new Date().toISOString() };
  store.setItem(name, JSON.stringify(item));
  if (store.getItem(name) !== JSON.stringify(item)) throw new Error("The financial request reference could not be saved. No change was submitted.");
  return item;
  });
}
// Call only after an authenticated server receipt or explicit recorded response.
export function resolveFinancialRequest(actor: string, key: string) {
  const store = storage(), matches: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const name = store.key(i);
    if (name?.startsWith(prefix(actor)) && JSON.parse(store.getItem(name) ?? "null")?.key === key) matches.push(name);
  }
  for (const name of matches) store.removeItem(name);
}
