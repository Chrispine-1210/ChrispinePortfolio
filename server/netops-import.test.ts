import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
const html = readFileSync("network-ops-training-platform/index.html", "utf8");
const source = html
  .split("/* workspace-validator:start */")[1]
  .split("/* workspace-validator:end */")[0];
const validate = (value: unknown) =>
  runInNewContext(`${source};validateWorkspace(JSON.parse(input))`, {
    input: JSON.stringify(value),
  });
const fixture = () => ({
  settings: { targetDifficulty: 2 },
  weeklyNotes: "",
  lab: {
    hypothesis: "",
    falsifier: "",
    findings: "",
    rootCause: "",
    remediation: "",
    verification: "",
    devices: [],
    commands: [],
  },
  challenges: [
    {
      id: "fixture",
      title: "Fixture",
      date: "2026-11-23",
      difficulty: 2,
      status: "planned",
      domains: ["DNS"],
      impact: "",
      scenario: "",
      questions: [],
      evidence: [],
      solution: [],
      exercise: "",
      followup: "",
      result: null,
    },
  ],
});
describe("NetOps imported workspace boundary", () => {
  it("accepts a complete legacy export and normalizes its format", () => {
    expect(validate(fixture()).formatVersion).toBe(2);
  });
  it("rejects strings in numeric fields before they can reach HTML interpolation", () => {
    const value: any = fixture();
    value.challenges[0].difficulty = "<img src=x onerror=alert(1)>";
    expect(() => validate(value)).toThrow();
  });
  it("rejects prototype domain keys and duplicate record identities", () => {
    const value: any = fixture();
    value.challenges[0].domains = ["__proto__"];
    expect(() => validate(value)).toThrow();
    value.challenges[0].domains = ["DNS"];
    value.challenges.push({ ...value.challenges[0] });
    expect(() => validate(value)).toThrow();
  });
  it("rejects incomplete completed results and unsupported versions", () => {
    const value: any = fixture();
    value.challenges[0].status = "completed";
    expect(() => validate(value)).toThrow();
    value.challenges[0].status = "planned";
    value.formatVersion = 99;
    expect(() => validate(value)).toThrow();
  });
});
