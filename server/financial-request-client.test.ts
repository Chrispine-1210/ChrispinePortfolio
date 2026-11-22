import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../client/src/lib/queryClient.js";
import { pendingFinancialRequests, prepareFinancialRequest, resolveFinancialRequest } from "../client/src/lib/financial-request-store.js";
const actor = "finance-fixture-user", path = "/api/admin/treasury/operating-expenses";
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("navigator", { locks: { request: async (_name: string, action: () => unknown) => action() } });
  vi.stubGlobal("localStorage", { get length() { return values.size; }, key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => values.delete(key) });
});
afterEach(() => vi.unstubAllGlobals());
const identity = () => new Response(JSON.stringify({ id: actor }), { status: 200 });
describe("persistent browser financial references", () => {
  it("reuses the saved opaque reference across reinitialization, without retaining financial payload", async () => {
    const body = { amount: 12345, sourceReference: "private-record" };
    const first = await prepareFinancialRequest(actor, "POST", path, body);
    const restored = await prepareFinancialRequest(actor, "POST", path, { sourceReference: "private-record", amount: 12345 });
    expect(restored.key).toBe(first.key); expect(JSON.stringify([...values])).not.toMatch(/12345|private-record/);
    expect((await prepareFinancialRequest("other-user", "POST", path, body)).key).not.toBe(first.key);
  });
  it("preserves an unknown result and makes no automatic retry", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(identity()).mockRejectedValueOnce(new TypeError("response lost")); vi.stubGlobal("fetch", fetch);
    await expect(apiRequest("POST", path, { amount: 10 })).rejects.toThrow("outcome is unconfirmed");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(pendingFinancialRequests(actor)).toHaveLength(1);
    const sent = fetch.mock.calls[1][1].headers["Idempotency-Key"];
    expect(pendingFinancialRequests(actor)[0].key).toBe(sent);
  });
  it("clears only after a complete recorded server response", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(identity()).mockResolvedValueOnce(new Response('{"id":"record"}', { status: 201, headers: { "Idempotency-Result": "recorded" } })); vi.stubGlobal("fetch", fetch);
    await apiRequest("POST", path, { amount: 10 }); expect(pendingFinancialRequests(actor)).toHaveLength(0);
  });
  it.each([500, 503, 403])("retains references for unrecorded HTTP %s", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(identity()).mockResolvedValueOnce(new Response('{"message":"unknown"}', { status })));
    await expect(apiRequest("POST", path, {})).rejects.toThrow("Financial reference:"); expect(pendingFinancialRequests(actor)).toHaveLength(1);
  });
  it("retains references for truncated successful JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(identity()).mockResolvedValueOnce(new Response('{"id":', { status: 201, headers: { "Idempotency-Result": "recorded" } })));
    await expect(apiRequest("POST", path, {})).rejects.toThrow("response is incomplete"); expect(pendingFinancialRequests(actor)).toHaveLength(1);
  });
  it("fails before dispatch if the reference cannot persist", async () => {
    vi.stubGlobal("localStorage", { length: 0, getItem: () => null, setItem: () => { throw Error("storage quota"); } });
    const fetch = vi.fn().mockResolvedValueOnce(identity()); vi.stubGlobal("fetch", fetch);
    await expect(apiRequest("POST", path, {})).rejects.toThrow("storage quota"); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not dispatch a financial write when identity cannot be verified", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("offline")); vi.stubGlobal("fetch", fetch);
    await expect(apiRequest("POST", path, {})).rejects.toThrow("No financial change was submitted");
    expect(fetch).toHaveBeenCalledTimes(1); expect(pendingFinancialRequests(actor)).toHaveLength(0);
  });
  it("refuses unsafe allocation when browser locking is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(prepareFinancialRequest(actor, "POST", path, {})).rejects.toThrow("Web Locks");
    expect(values.size).toBe(0);
  });
  it("acknowledges only the authenticated actor's matching reference", async () => {
    const a = await prepareFinancialRequest(actor, "POST", path, {}), b = await prepareFinancialRequest("other-user", "POST", path, {});
    resolveFinancialRequest(actor, b.key); expect(pendingFinancialRequests(actor)).toHaveLength(1);
    resolveFinancialRequest(actor, a.key); expect(pendingFinancialRequests(actor)).toHaveLength(0); expect(pendingFinancialRequests("other-user")).toHaveLength(1);
  });
});
