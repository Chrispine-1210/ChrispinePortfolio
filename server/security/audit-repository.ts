import { db } from "../db.js";
import { auditEvents, type InsertAuditEvent } from "../../shared/schema.js";

export interface AuditWriter {
  append(event: InsertAuditEvent): Promise<{ id: string }>;
}

export class DrizzleAuditWriter implements AuditWriter {
  async append(event: InsertAuditEvent): Promise<{ id: string }> {
    const [created] = await db
      .insert(auditEvents)
      .values(event)
      .returning({ id: auditEvents.id });
    if (!created) throw new Error("Failed to append audit event");
    return created;
  }
}
