import { createHash } from "node:crypto";
import { and,desc,eq,lt,or,sql } from "drizzle-orm";
import { Router,type Request } from "express";
import { z } from "zod";
import { emailDeliveryEvents,emailOutbox,auditEvents } from "../../shared/schema.js";
import { canonicalRequestJson } from "../../shared/financial-requests.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";
import { env } from "../env.js";
import { ApiError,asyncHandler } from "../middleware.js";

const states=["pending","processing","retry","uncertain","sent","delivered","failed","suppressed","bounced","complained","cancelled"] as const;
const queueQuery=z.object({status:z.enum(states).optional(),cursor:z.string().max(400).optional()});
const cursorSchema=z.object({at:z.string().datetime(),id:z.string().uuid()}).strict();
const referencePattern=/^[A-Za-z0-9_-]{20,100}$/;
const messageProjection={id:emailOutbox.id,toEmail:emailOutbox.toEmail,subject:emailOutbox.subject,status:emailOutbox.status,
  provider:emailOutbox.provider,providerMessageId:emailOutbox.providerMessageId,attemptCount:emailOutbox.attemptCount,
  maxAttempts:emailOutbox.maxAttempts,lastError:emailOutbox.lastError,createdAt:emailOutbox.createdAt,updatedAt:emailOutbox.updatedAt,
  sentAt:emailOutbox.sentAt,deliveredAt:sql<string|null>`(SELECT max(occurred_at)::text FROM email_delivery_events WHERE outbox_id=${emailOutbox.id} AND event_type='delivery')`,availableAt:emailOutbox.availableAt};

function cursorValue(value?:string){
  if(!value)return null;
  try{return cursorSchema.parse(JSON.parse(Buffer.from(value,"base64url").toString()));}
  catch{throw new ApiError(400,"Invalid queue page reference");}
}

export function createEmailOperationsRouter(){
  const router=Router();
  router.get("/api/admin/email/queue",requireAdminPermission("email.delivery.read"),asyncHandler(async(req,res)=>{
    const query=queueQuery.parse(req.query),cursor=cursorValue(query.cursor);
    const result=await db.transaction(async transaction=>{
      const rows=await transaction.select(messageProjection).from(emailOutbox).where(and(
        ...(query.status?[eq(emailOutbox.status,query.status)]:[]),
        ...(cursor?[or(lt(emailOutbox.createdAt,new Date(cursor.at)),and(eq(emailOutbox.createdAt,new Date(cursor.at)),lt(emailOutbox.id,cursor.id)))]:[]),
      )).orderBy(desc(emailOutbox.createdAt),desc(emailOutbox.id)).limit(51);
      const counts=await transaction.execute<{status:string;count:string}>(sql`SELECT status,count(*)::text AS count FROM email_outbox GROUP BY status`);
      const items=rows.slice(0,50),last=items.at(-1);
      return{items,counts:Object.fromEntries(counts.rows.map(row=>[row.status,Number(row.count)])),
        nextCursor:rows.length>50&&last?Buffer.from(JSON.stringify({at:last.createdAt.toISOString(),id:last.id})).toString("base64url"):null};
    },{isolationLevel:"repeatable read",accessMode:"read only"});
    res.json({...result,providerConfigured:env.EMAIL_PROVIDER==="postmark"&&Boolean(env.POSTMARK_FROM_EMAIL),
      sampledAt:new Date().toISOString(),countsScope:"entire_queue",providerAcceptance:"not_inferred_from_configuration"});
  }));
  router.get("/api/admin/email/queue/:id",requireAdminPermission("email.delivery.read"),asyncHandler(async(req,res)=>{
    const id=z.string().uuid().parse(req.params.id),cursor=cursorValue(typeof req.query.cursor==="string"?req.query.cursor:undefined);
    const [message]=await db.select(messageProjection).from(emailOutbox).where(eq(emailOutbox.id,id)).limit(1);
    if(!message)return res.status(404).json({message:"Delivery record not found"});
    const rows=await db.select({id:emailDeliveryEvents.id,eventType:emailDeliveryEvents.eventType,provider:emailDeliveryEvents.provider,
      providerEventId:emailDeliveryEvents.providerEventId,occurredAt:emailDeliveryEvents.occurredAt}).from(emailDeliveryEvents)
      .where(and(eq(emailDeliveryEvents.outboxId,id),...(cursor?[or(lt(emailDeliveryEvents.occurredAt,new Date(cursor.at)),
        and(eq(emailDeliveryEvents.occurredAt,new Date(cursor.at)),lt(emailDeliveryEvents.id,cursor.id)))]:[])))
      .orderBy(desc(emailDeliveryEvents.occurredAt),desc(emailDeliveryEvents.id)).limit(51);
    const events=rows.slice(0,50),last=events.at(-1);
    res.json({message,events,nextCursor:rows.length>50&&last?Buffer.from(JSON.stringify({at:last.occurredAt.toISOString(),id:last.id})).toString("base64url"):null});
  }));
  router.get("/api/admin/email/requests/:key",requireAdminPermission("email.send"),asyncHandler(async(req,res)=>{
    if(!referencePattern.test(req.params.key))throw new ApiError(400,"Invalid email queue reference");
    const actor=req.securityPrincipal?.userId;if(!actor)throw new ApiError(403,"Database-backed identity required");
    const [record]=await db.select(messageProjection).from(emailOutbox)
      .where(eq(emailOutbox.idempotencyKey,`admin:${actor}:${req.params.key}`)).limit(1);
    res.json(record?{state:"recorded",record}:{state:"unconfirmed",message:"No committed queue record is visible. Keep this reference; a request may still be running."});
  }));
  return router;
}

export const queueEmailInput=z.object({toEmail:z.string().email().max(320),subject:z.string().trim().min(1).max(500),
  htmlBody:z.string().min(1).max(500_000),textBody:z.string().max(200_000).nullable().optional(),
  replyTo:z.string().email().max(320).nullable().optional(),messageType:z.enum(["transactional","marketing"]).default("transactional"),
  idempotencyKey:z.string().regex(referencePattern),metadata:z.record(z.string(),z.unknown()).nullable().optional()}).strict();

export async function enqueueEmail(request:Request){
  const input=queueEmailInput.parse(request.body),actor=request.securityPrincipal?.userId;
  if(!actor)throw new ApiError(403,"Database-backed identity required");
  if(request.get("X-Queue-Actor")!==actor)throw new ApiError(409,"The signed-in account changed. No message was queued.","EMAIL_QUEUE_ACTOR_CHANGED");
  if(env.EMAIL_PROVIDER!=="postmark"||!env.POSTMARK_FROM_EMAIL)throw new ApiError(503,"Outbound email is disabled or its sender is not configured");
  const key=input.idempotencyKey,idempotencyKey=`admin:${actor}:${key}`;
  const {idempotencyKey:ignored,...content}=input;
  const fingerprint=createHash("sha256").update(canonicalRequestJson(content)).digest("hex");
  return db.transaction(async transaction=>{
    const [queued]=await transaction.insert(emailOutbox).values({...content,fromEmail:env.POSTMARK_FROM_EMAIL!,fromName:env.POSTMARK_FROM_NAME,
      idempotencyKey,metadata:{...input.metadata,queueActor:actor,queueFingerprint:fingerprint}}).onConflictDoNothing().returning(messageProjection);
    if(!queued){
      const [existing]=await transaction.select({...messageProjection,metadata:emailOutbox.metadata}).from(emailOutbox)
        .where(eq(emailOutbox.idempotencyKey,idempotencyKey)).limit(1);
      if(!existing||(existing.metadata as Record<string,unknown>|null)?.queueFingerprint!==fingerprint)throw new ApiError(409,"This queue reference belongs to different message content. Reconcile the original request first.","EMAIL_QUEUE_CONFLICT");
      const {metadata,...record}=existing;return{record,replayed:true,key};
    }
    await transaction.insert(auditEvents).values({actorUserId:actor,actorSessionId:request.securityPrincipal?.sessionId,
      action:"email.queue",resourceType:"email_outbox",resourceId:queued.id,result:"success",requestId:request.requestId,
      newState:{status:queued.status,queueReference:key}});
    return{record:queued,replayed:false,key};
  });
}
