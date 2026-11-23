import { describe, expect, it, vi } from "vitest";
import { requestFailureMessage } from "../client/src/lib/request-error.js";
import { apiRequest } from "../client/src/lib/queryClient.js";

describe("safe request failure guidance", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("does not advise resubmission after an uncertain %s", method => {
    const message = requestFailureMessage(503, { message: "private error; please retry" }, "fixture-reference", method);
    expect(message).toContain("Check the record before submitting again");
    expect(message).not.toMatch(/please retry|private error/i);
    expect(message).toContain("fixture-reference");
  });
  it("retains read retry guidance and bounded validation feedback", () => {
    expect(requestFailureMessage(503, { message: "private driver" }, null)).toBe("Service temporarily unavailable. Please retry.");
    expect(requestFailureMessage(400, { fields: [{ message: "Name required" }] }, null, "POST")).toBe("Name required");
  });
  it("treats a lost write response as uncertain without automatically resending", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);
    try {
      await expect(apiRequest("POST", "/api/admin/content/posts", {})).rejects.toThrow("Check the record");
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });
  it("preserves read transport errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    try { await expect(apiRequest("GET", "/api/blog")).rejects.toThrow("Failed to fetch"); }
    finally { vi.unstubAllGlobals(); }
  });
});
