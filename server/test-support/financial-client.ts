import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Express } from "express";

// Existing workflow suites issue independent operations, not replay probes.
export default function financialClient(app: Express) {
  return request.agent(app).use((test: { set(name: string, value: string): unknown }) => { test.set("Idempotency-Key", randomUUID()); });
}
