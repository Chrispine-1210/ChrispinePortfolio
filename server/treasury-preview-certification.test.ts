import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:child_process")>(),
  spawnSync: vi.fn(),
}));
vi.mock("node:timers/promises", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:timers/promises")>(),
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

const deploymentUrl = "portfolio-mock.vercel.app";
const commitSha = "a".repeat(40);
const databaseBranchId = "br-isolated-fixture";
const budgetsPath = "/api/admin/capital/budgets";
const deploymentsPath = "/api/admin/treasury/deployments";
const evidencePath = "/api/admin/treasury/evidence";
const logoutRequest = "POST /api/auth/logout";
const closeRequest = `POST ${budgetsPath}/fixture-budget/close`;
const voidRequest = (id: string) => `POST ${evidencePath}/deployment/${id}/void`;

type Scenario = "success" | "lost-budget" | "lost-deployment" | "lost-over-allocation" | "uncertain-budget" | "changed-release";

function mockVercel(scenario: Scenario) {
  const requests: string[] = [];
  const budgets: Array<{ id: string; sourceReference: string; status: string }> = [];
  const deployments: Array<{ id: string; sourceReference: string; voidedAt: string | null }> = [];
  let budgetReads = 0;
  let deploymentReads = 0;
  let loggedOut = false;

  vi.mocked(spawnSync).mockImplementation((command, args) => {
    expect(command).toBe("vercel");
    const argv = args as string[];
    const exit = (status: number, stderr = "") => ({ pid: 1, status, signal: null, output: [], stdout: "", stderr });
    if (argv[0] === "whoami") return exit(0);
    const path = argv[1];
    const method = argv.includes("-X") ? argv[argv.indexOf("-X") + 1] : "GET";
    const body = argv.includes("--data") ? JSON.parse(argv[argv.indexOf("--data") + 1]) : undefined;
    const request = `${method} ${path}`;
    requests.push(request);
    const reply = (status: number, json: unknown, headers = "") => {
      writeFileSync(argv[argv.indexOf("--dump-header") + 1], `HTTP/2 ${status}\r\n${headers}\r\n`);
      writeFileSync(argv[argv.indexOf("--output") + 1], JSON.stringify(json));
      return exit(0);
    };
    const lostResponse = () => exit(28, "Simulated response loss after request dispatch");

    switch (request) {
      case "GET /api/release":
        return reply(200, {
          environment: "preview",
          commitSha: loggedOut && scenario === "changed-release" ? "b".repeat(40) : commitSha,
          deploymentUrl,
          databaseBranchId,
        });
      case "POST /api/auth/login":
        return reply(200, {}, "Set-Cookie: admin_session=fixture; HttpOnly\r\n");
      case "GET /api/auth/me":
        return reply(200, { id: "fixture-admin" });
      case logoutRequest:
        loggedOut = true;
        return reply(200, {});
      case `POST ${budgetsPath}`:
        if (scenario === "uncertain-budget") return lostResponse();
        budgets.push({ id: "fixture-budget", sourceReference: body.sourceReference, status: "draft" });
        return scenario === "lost-budget" ? lostResponse() : reply(201, budgets[0]);
      case `GET ${budgetsPath}`:
        budgetReads++;
        return reply(200, scenario === "lost-budget" && budgetReads === 1 ? [] : budgets);
      case `POST ${budgetsPath}/fixture-budget/allocations`:
        return reply(200, { id: "fixture-allocation" });
      case `POST ${budgetsPath}/fixture-budget/approve`:
        budgets[0].status = "approved";
        return reply(200, budgets[0]);
      case closeRequest:
        expect(body.certificationSourceReference).toBe(budgets[0].sourceReference);
        budgets[0].status = "closed";
        return reply(200, budgets[0]);
      case `POST ${deploymentsPath}`: {
        if (body.amount === 1 && scenario !== "lost-over-allocation") {
          return reply(409, {
            message: "Capital deployment exceeds approved allocation balance",
            approvedAmount: 16000,
            alreadyDeployed: 16000,
            remainingAmount: 0,
          });
        }
        const row = { id: body.amount === 1 ? "excess-deployment" : "valid-deployment", sourceReference: body.sourceReference, voidedAt: null };
        deployments.push(row);
        if (scenario === "lost-deployment") {
          deployments.push({ ...row, id: "unrelated-deployment", sourceReference: `${row.sourceReference}-other` });
        }
        return scenario === "lost-deployment" || body.amount === 1 ? lostResponse() : reply(201, row);
      }
      case `GET ${evidencePath}`:
        deploymentReads++;
        return reply(200, scenario === "lost-deployment" && deploymentReads === 1 ? {} : { deployments });
      case "GET /api/admin/treasury/intelligence":
        return reply(200, {});
      case voidRequest("valid-deployment"):
      case voidRequest("excess-deployment"): {
        const id = path.split("/").at(-2);
        const row = deployments.find((item) => item.id === id)!;
        row.voidedAt = "2026-11-16T12:00:00.000Z";
        return reply(200, row);
      }
      default:
        throw new Error(`Unexpected mock Vercel request ${request}`);
    }
  });

  return { requests, budgets, deployments };
}

describe("treasury Preview certification cleanup", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("CERT_BASE_URL", `https://${deploymentUrl}`);
    vi.stubEnv("CERT_ADMIN_EMAIL", "fixture@test.invalid");
    vi.stubEnv("CERT_ADMIN_PASSWORD", "synthetic-fixture-password");
    vi.stubEnv("CERT_EXPECTED_GIT_SHA", commitSha);
    vi.stubEnv("CERT_EXPECTED_DATABASE_BRANCH_ID", databaseBranchId);
    vi.stubEnv("CERT_DEPLOYMENT_AMOUNT", "16000");
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { scenario: "lost-budget", recoveredBudgetIds: ["fixture-budget"], recoveredDeploymentIds: [], voided: [] },
    { scenario: "lost-deployment", recoveredBudgetIds: [], recoveredDeploymentIds: ["valid-deployment"], voided: ["valid-deployment"] },
    { scenario: "lost-over-allocation", recoveredBudgetIds: [], recoveredDeploymentIds: ["excess-deployment"], voided: ["valid-deployment", "excess-deployment"] },
  ] as const)("cleans up after $scenario and preserves the failing exit", async ({ scenario, recoveredBudgetIds, recoveredDeploymentIds, voided }) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { requests, budgets, deployments } = mockVercel(scenario);

    await expect(import("../scripts/certify-treasury-preview.mjs")).rejects.toThrow("Simulated response loss");

    expect(budgets[0].status).toBe("closed");
    expect(deployments.filter((row) => row.voidedAt).map((row) => row.id)).toEqual(voided);
    expect(requests.filter((request) => request === closeRequest || request === logoutRequest || request.endsWith("/void")))
      .toEqual([...voided.map(voidRequest), closeRequest, logoutRequest]);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      decision: "FAIL",
      marker: expect.stringMatching(/^preview-cert-/),
      recoveredBudgetIds,
      recoveredDeploymentIds,
      cleanupError: null,
    });
  });

  it("reports an unconfirmed create after three lookups and logs out", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { requests } = mockVercel("uncertain-budget");

    await expect(import("../scripts/certify-treasury-preview.mjs")).rejects.toThrow("Simulated response loss");

    expect(requests.filter((request) => request === `GET ${budgetsPath}`)).toHaveLength(3);
    expect(requests).not.toContain(closeRequest);
    expect(requests.at(-1)).toBe(logoutRequest);
    const report = JSON.parse(log.mock.calls[0][0]);
    expect(report.cleanupError).toBe(`Budget creation could not be reconciled: ${report.marker}-budget`);
  });

  it("rechecks deployment identity after cleanup and logout before reporting PASS", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { requests } = mockVercel("success");

    await import("../scripts/certify-treasury-preview.mjs");

    expect(requests.slice(-2)).toEqual([logoutRequest, "GET /api/release"]);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ decision: "PASS", validDeploymentStatus: 201, overAllocationStatus: 409 });
  });

  it("withholds PASS if release identity changes after logout", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { requests, budgets, deployments } = mockVercel("changed-release");

    await expect(import("../scripts/certify-treasury-preview.mjs")).rejects.toThrow("Exact-head mismatch");

    expect(budgets[0].status).toBe("closed");
    expect(deployments[0].voidedAt).toBeTruthy();
    expect(requests.slice(-2)).toEqual([logoutRequest, "GET /api/release"]);
    expect(log).not.toHaveBeenCalled();
  });
});
