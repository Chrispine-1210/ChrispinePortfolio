// Timestamp columns use the application UTC storage convention.
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import Stripe from "stripe";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import * as schema from "../shared/schema.js";
import type { BillingGateway } from "./billing.js";
import { contextualDatabase } from "./database-context.js";

let database:any, engine:any, app:Express, member:{id:string;cookie:string}, owner:{id:string;cookie:string};
let current:any, checkoutParameters:any, checkoutKey:string;
const native = Boolean(process.env.HARDENING_NATIVE_PORT);
const provider = {verify:(payload:Buffer,signature:string)=>Stripe.webhooks.constructEvent(payload,signature,"whsec_fixture_only"),
  subscription:vi.fn(async()=>current), checkout:vi.fn(async(parameters:any,key:string)=>{checkoutParameters=parameters;checkoutKey=key;return{id:`cs_test_${randomUUID()}`,url:"https://checkout.stripe.com/c/pay/cs_test_fixture"};}),
  portal:vi.fn(async()=>({url:"https://billing.stripe.com/p/session/test_fixture"}))} satisfies BillingGateway;
vi.mock("./db.js",()=>({db:contextualDatabase(engine)}));
async function principal(role?:string){
  const {rows:[user]}=await database.query("INSERT INTO users(email,is_admin,is_premium) VALUES($1,true,true) RETURNING id,security_version",[`${randomUUID()}@test.invalid`]);
  if(role)await database.query("INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE key=$2",[user.id,role]);
  const {getDatabaseAuthRuntime}=await import("./security/database-auth-routes.js");
  const session=await getDatabaseAuthRuntime().sessions.issue({userId:user.id,userSecurityVersion:user.security_version});
  return{id:user.id,cookie:`admin_session=${session.token}`};
}
beforeAll(async()=>{
  vi.stubEnv("TZ","UTC");
  for(const [key,value] of Object.entries({ADMIN_AUTH_MODE:"database",DATABASE_URL:"postgresql://fixture:fixture@localhost/fixture",
    AUTH_KEY_PEPPER:"local-commercial-boundary-fixture-pepper",BILLING_MODE:"sandbox",STRIPE_SECRET_KEY:"sk_test_fixture_only",
    STRIPE_WEBHOOK_SECRET:"whsec_fixture_only",STRIPE_PRICE_ID:"price_fixture",APP_BASE_URL:"https://acceptance.test.invalid",
    EMAIL_PROVIDER:"postmark",POSTMARK_SERVER_TOKEN:"POSTMARK_API_TEST",POSTMARK_FROM_EMAIL:"sender@test.invalid",
    POSTMARK_WEBHOOK_USERNAME:"fixture",POSTMARK_WEBHOOK_PASSWORD:"fixture-webhook-password-with-32-characters",NOTIFICATION_WORKER_SECRET:"fixture-worker-secret-with-32-characters"}))vi.stubEnv(key,value);
  vi.spyOn(console,"error").mockImplementation(()=>{});
  if(native){
    if(process.env.HARDENING_NATIVE_QA!=="disposable-loopback")throw Error("Native QA refused");
    const pg=(await import("pg")).default;
    const pool=new pg.Pool({host:"127.0.0.1",port:Number(process.env.HARDENING_NATIVE_PORT),user:"postgres",database:"commercial_qa",max:8});
    database={query:pool.query.bind(pool),exec:pool.query.bind(pool),close:pool.end.bind(pool)};
    engine=(await import("drizzle-orm/node-postgres")).drizzle({client:pool,schema});
  }else{database=new PGlite();engine=drizzle(database,{schema});}
  await database.exec("SET TIME ZONE 'UTC'");
  for(const name of(await readdir("migrations")).filter(name=>/^\d{4}_.*\.sql$/.test(name)).sort())await database.exec(await readFile(`migrations/${name}`,"utf8"));
  const {createApp}=await import("./app.js");app=createApp({billingGateway:()=>provider});
  member=await principal();owner=await principal("super_administrator");
});
afterAll(async()=>{await database?.close();vi.unstubAllEnvs();});
const post=(path:string,body:object,cookie=member.cookie)=>request(app).post(path).set("Cookie",cookie).send(body);
async function approvedCheckout(actor=member){
  const key=randomUUID();const result=await post("/api/billing/checkout",{requestKey:key},actor.cookie).expect(201);
  const {rows:[record]}=await database.query("SELECT * FROM billing_checkout_requests WHERE user_id=$1 AND request_key=$2",[actor.id,key]);
  return{key,record,result};
}
function subscription(actorId:string,checkoutId:string){return{id:`sub_${randomUUID()}`,livemode:false,customer:"cus_fixture",metadata:{userId:actorId,checkoutRequestId:checkoutId},status:"active",
  latest_invoice:{status:"paid",livemode:false,customer:"cus_fixture",parent:{subscription_details:{subscription:""}}},
  items:{data:[{price:{id:"price_fixture"},quantity:1,current_period_end:Math.floor(Date.now()/1000)+3600}]}};}
function webhook(id=randomUUID(),extra:object={}){
  const body=JSON.stringify({id:`evt_${id}`,object:"event",type:"customer.subscription.updated",livemode:false,created:1,data:{object:{id:current.id}},...extra});
  return request(app).post("/api/stripe-webhook").set("Content-Type","application/json").set("stripe-signature",Stripe.webhooks.generateTestHeaderString({payload:body,secret:"whsec_fixture_only"})).send(body);
}

describe("membership and recurring payment boundaries",()=>{
  it("exposes a safe member profile and never trusts legacy admin/premium flags",async()=>{
    await request(app).get("/api/auth/user").expect(401);
    const profile=await request(app).get("/api/auth/user").set("Cookie",member.cookie).expect(200);
    expect(profile.body).toMatchObject({id:member.id,isAdmin:false,isPremium:false,permissions:[]});
    expect(profile.headers["cache-control"]).toBe("no-store");
    expect(profile.body).not.toHaveProperty("passwordHash");expect(profile.body).not.toHaveProperty("stripeCustomerId");
    expect((await request(app).get("/api/auth/me").set("Cookie",member.cookie)).body.isAdmin).toBe(false);
    await request(app).get("/api/admin/treasury/intelligence").set("Cookie",member.cookie).expect(403);
    await request(app).get("/api/login").expect(303).expect("Location","/login");
    await post("/api/billing/portal",{}).set("X-Billing-Actor",owner.id).expect(409);
  });
  it("keeps premium bodies and internal fields out of public search and detail",async()=>{
    const slug=`premium-${randomUUID()}`;
    await database.query("INSERT INTO blog_posts(title,slug,excerpt,content,category,is_premium,is_published,workflow_status) VALUES('Member fixture',$1,'Public summary','Private paid body','Engineering',true,true,'published')",[slug]);
    const result=await request(app).get("/api/blog/search?q=Member%20fixture").expect(200);
    expect(result.body.data).toHaveLength(1);expect(result.body.data[0]).not.toHaveProperty("content");
    expect(result.body.data[0]).not.toHaveProperty("approvedBy");expect(JSON.stringify(result.body)).not.toContain("Private paid body");
    const denied=await request(app).get(`/api/blog/${slug}`).expect(403);expect(denied.headers["cache-control"]).toContain("no-store");
    await request(app).get(`/api/blog/${slug}`).set("Cookie",member.cookie).expect(403);
    expect((await request(app).get(`/api/blog/${slug}`).set("Cookie",owner.cookie).expect(200)).body.content).toBe("Private paid body");
  });
  it("requires login and server-selected pricing; replays one durable owned checkout",async()=>{
    await request(app).post("/api/billing/checkout").send({requestKey:randomUUID()}).expect(401);
    await post("/api/billing/checkout",{requestKey:randomUUID(),price:"price_attacker"}).expect(400);
    await post("/api/billing/checkout",{requestKey:randomUUID()}).set("X-Billing-Actor",owner.id).expect(409);
    const before=provider.checkout.mock.calls.length,checkout=await approvedCheckout();
    expect(checkoutParameters).toMatchObject({mode:"subscription",client_reference_id:member.id,line_items:[{price:"price_fixture",quantity:1}],subscription_data:{metadata:{userId:member.id,checkoutRequestId:checkout.record.id}}});
    expect(checkoutKey).toBe(`portfolio-checkout:${checkout.record.id}`);
    await post("/api/billing/checkout",{requestKey:checkout.key}).expect(200);
    expect(provider.checkout.mock.calls.length).toBe(before+1);
    await post("/api/billing/checkout",{requestKey:randomUUID()}).expect(409);
    const other=await principal();expect((await request(app).get(`/api/billing/requests/${checkout.key}`).set("Cookie",other.cookie)).body.status).toBe("unconfirmed");
    await database.query("UPDATE billing_checkout_requests SET status='completed' WHERE id=$1",[checkout.record.id]);
  });
  it("does not retry provider calls after an uncertain checkout outcome",async()=>{
    const actor=await principal(),key=randomUUID();provider.checkout.mockRejectedValueOnce(Error("connection lost after acceptance"));
    const before=provider.checkout.mock.calls.length;
    expect((await post("/api/billing/checkout",{requestKey:key},actor.cookie).expect(503)).body.code).toBe("WRITE_OUTCOME_UNKNOWN");
    expect((await post("/api/billing/checkout",{requestKey:key},actor.cookie).expect(202)).body.status).toBe("uncertain");
    await post("/api/billing/checkout",{requestKey:randomUUID()},actor.cookie).expect(409);
    expect(provider.checkout.mock.calls.length).toBe(before+1);
  });
  it("accepts real SDK signatures over raw bytes, grants only paid bound state, and receipts duplicate events",async()=>{
    const checkout=await approvedCheckout();current=subscription(member.id,checkout.record.id);current.latest_invoice.parent.subscription_details.subscription=current.id;
    await request(app).post("/api/stripe-webhook").send({id:"unsigned"}).expect(400);
    const id=randomUUID(),before=provider.subscription.mock.calls.length;
    await webhook(id).expect(200,{received:true,duplicate:false});
    await webhook(id).expect(200,{received:true,duplicate:true});
    expect(provider.subscription.mock.calls.length).toBe(before+1);
    expect((await request(app).get("/api/auth/user").set("Cookie",member.cookie)).body.isPremium).toBe(true);
    await webhook(id,{created:2}).expect(409);
    await expect(database.query("DELETE FROM billing_event_receipts WHERE id=$1",[`evt_${id}`])).rejects.toMatchObject({code:"P0001"});
    current.status="canceled";await webhook().expect(200);
    expect((await request(app).get("/api/auth/user").set("Cookie",member.cookie)).body.isPremium).toBe(false);
    // A delayed active event still reconciles current canceled provider state.
    await webhook(randomUUID(),{created:0}).expect(200);
    expect((await request(app).get("/api/auth/user").set("Cookie",member.cookie)).body.isPremium).toBe(false);
  });
  it("rejects foreign ownership, price mismatch and live events without granting access",async()=>{
    const actor=await principal(),checkout=await approvedCheckout(actor);current=subscription(actor.id,checkout.record.id);
    current.metadata.userId=owner.id;await webhook().expect(409);
    current.metadata.userId=actor.id;current.items.data[0].price.id="price_other";await webhook().expect(409);
    current.items.data[0].price.id="price_fixture";await webhook(randomUUID(),{livemode:true}).expect(409);
    current.latest_invoice.customer="cus_other";await webhook().expect(200);
    expect((await request(app).get("/api/auth/user").set("Cookie",actor.cookie)).body.isPremium).toBe(false);
  });
});

describe("delivery uncertainty, ownership and audience handling",()=>{
  const email=async(extra:object={})=>{const {rows:[row]}=await database.query("INSERT INTO email_outbox(to_email,from_email,subject,html_body,status,locked_by,locked_at,idempotency_key,available_at) VALUES($1,'sender@test.invalid','Hello','<p>Hello</p>',$2,$3,$4,$5,now()-interval '1 second') RETURNING *",[`${randomUUID()}@test.invalid`,(extra as any).status??"pending",(extra as any).worker??null,(extra as any).lockedAt??null,randomUUID()]);return row;};
  it("quarantines expired leases and prevents a late worker from overwriting another state",async()=>{
    const {DrizzleEmailOutboxRepository}=await import("./email/drizzle-outbox-repository.js");const repository=new DrizzleEmailOutboxRepository();
    const row=await email({status:"processing",worker:"dead",lockedAt:new Date(Date.now()-11*60000)});
    expect((await repository.claimBatch("replacement",3,new Date())).some(item=>item.id===row.id)).toBe(false);
    expect((await database.query("SELECT status FROM email_outbox WHERE id=$1",[row.id])).rows[0].status).toBe("uncertain");
    await expect(repository.markSent(row.id,{provider:"postmark",messageId:"wrong-owner"},new Date(),"dead")).rejects.toThrow("lease");
  });
  it("records provider acceptance persistence failure as uncertain and never dispatches it twice",async()=>{
    const {DrizzleEmailOutboxRepository}=await import("./email/drizzle-outbox-repository.js");const {EmailDispatcher}=await import("./email/dispatcher.js");
    const repository=new DrizzleEmailOutboxRepository(),row=await email();
    const save=vi.spyOn(repository,"markSent").mockRejectedValueOnce(Error("database response lost"));
    const send=vi.fn(async()=>({provider:"postmark",messageId:`provider_${row.id}`}));
    expect((await new EmailDispatcher(repository,{name:"fixture",send}).processBatch("owner",3)).uncertain).toBe(1);
    save.mockRestore();await new EmailDispatcher(repository,{name:"fixture",send}).processBatch("next",3);
    expect(send).toHaveBeenCalledTimes(1);
    expect((await database.query("SELECT status,provider_message_id FROM email_outbox WHERE id=$1",[row.id])).rows[0]).toEqual({status:"uncertain",provider_message_id:`provider_${row.id}`});
    await post(`/api/admin/email/${row.id}/reconcile`,{outcome:"confirmed_not_sent",providerReference:"ticket-123",justification:"Provider confirmed no acceptance"},owner.cookie).expect(409);
    await post(`/api/admin/email/${row.id}/reconcile`,{outcome:"accepted",providerMessageId:`provider_${row.id}`,providerReference:"provider-message-record",justification:"Verified accepted provider message record"}).expect(403);
  });
  it("authenticates callbacks and recovers lost acceptance by metadata plus recipient",async()=>{
    const row=await email({status:"uncertain"});
    const body={RecordType:"Delivery",MessageID:`pm_${row.id}`,Recipient:row.to_email,Metadata:{outbox_id:row.id},DeliveredAt:new Date().toISOString()};
    await request(app).post("/api/webhooks/postmark").send(body).expect(403);
    const callback=(data:object)=>request(app).post("/api/webhooks/postmark").auth("fixture","fixture-webhook-password-with-32-characters").send(data);
    await callback({...body,Recipient:"foreign@test.invalid"}).expect(200);
    expect((await database.query("SELECT status FROM email_outbox WHERE id=$1",[row.id])).rows[0].status).toBe("uncertain");
    await callback(body).expect(200,{received:true,duplicate:false});await callback(body).expect(200,{received:true,duplicate:true});
    expect((await database.query("SELECT status,provider_message_id FROM email_outbox WHERE id=$1",[row.id])).rows[0]).toEqual({status:"delivered",provider_message_id:body.MessageID});
  });
  it("queues only supported consented email audiences and makes unsubscribe replay harmless",async()=>{
    const {queueDueEmailCampaign}=await import("./email/campaign-worker.js");
    await post("/api/admin/campaigns",{name:"Unsupported",channels:["sms"],audience:{newsletterSubscribers:true}},owner.cookie).expect(400);
    const {rows:[subscriber]}=await database.query("INSERT INTO newsletter_subscribers(email,subscribed_at) VALUES($1,now()-interval '1 second') RETURNING *",[`${randomUUID()}@test.invalid`]);
    const result=await post("/api/admin/campaigns",{name:"Consent fixture",subject:"News",htmlContent:"<p>News</p>",channels:["email"],audience:{newsletterSubscribers:true},scheduledAt:new Date(Date.now()-1000).toISOString()},owner.cookie).expect(201);
    expect((await queueDueEmailCampaign()).queued).toBe(1);expect((await queueDueEmailCampaign()).queued).toBe(0);
    const {rows:[queued]}=await database.query("SELECT * FROM email_outbox WHERE idempotency_key=$1",[`campaign:${result.body.id}:${subscriber.id}`]);
    const url=new URL(queued.html_body.match(/href="([^"]+)"/)[1].replaceAll("&amp;","&"));
    await post("/api/newsletter/unsubscribe",{token:url.searchParams.get("token")}).expect(200);
    await post("/api/newsletter/unsubscribe",{token:url.searchParams.get("token")}).expect(200);
    const {DrizzleEmailOutboxRepository}=await import("./email/drizzle-outbox-repository.js");
    const repository=new DrizzleEmailOutboxRepository();
    expect(await repository.isSuppressed(subscriber.email,new Date(),"marketing")).toBe(true);
    expect(await repository.isSuppressed(subscriber.email,new Date(),"transactional")).toBe(false);
    expect((await database.query("SELECT is_active FROM newsletter_subscribers WHERE id=$1",[subscriber.id])).rows[0].is_active).toBe(false);
  });
});

describe("financial correctness on actual HTTP routes",()=>{
  const financePost=(path:string,body:object)=>post(path,body,owner.cookie).set("Idempotency-Key",randomUUID());
  it("rejects fractional cents before any financial entry is committed",async()=>{
    await financePost("/api/admin/treasury/operating-expenses",{currency:"XTS",amount:1.005,category:"software_tools",occurredAt:new Date().toISOString(),sourceReference:randomUUID()}).expect(400);
    expect(Number((await database.query("SELECT count(*) AS total FROM operating_expense_entries")).rows[0].total)).toBe(0);
  });
  async function invoice(amount:number){
    const service="software",reference=randomUUID();
    const{rows:[lead]}=await database.query("INSERT INTO leads(name,email,service_interest,stage,currency) VALUES('Fixture','fixture@test.invalid',$1,'won','XTS') RETURNING id",[service]);
    const result=await financePost("/api/admin/capital/invoices",{leadId:lead.id,serviceInterest:service,invoiceNumber:reference,currency:"XTS",amount,
      issuedAt:new Date(Date.now()-60000).toISOString(),dueAt:new Date(Date.now()+60000).toISOString(),sourceReference:reference}).expect(201);
    return result.body;
  }
  const collection=(invoiceId:string,amount:number)=>financePost("/api/admin/capital/collections",{invoiceId,amount,paymentMethod:"cash",receivedAt:new Date().toISOString(),sourceReference:randomUUID()});
  it("settles 0.30 exactly with 0.10 and 0.20, then rejects an extra minor unit",async()=>{
    const row=await invoice(0.3);await collection(row.id,0.1).expect(201);await collection(row.id,0.2).expect(201);
    expect((await database.query("SELECT status FROM commercial_invoices WHERE id=$1",[row.id])).rows[0].status).toBe("paid");
    const rejected=await collection(row.id,0.01).expect(409);expect(rejected.body.outstanding).toBe(0);
  });
  it("reports every cohort record beyond the old 5000-row cap",async()=>{
    const before=await request(app).get("/api/admin/pipeline/funnel?window=all").set("Cookie",owner.cookie).expect(200);
    await database.exec("INSERT INTO leads(name,email,stage,currency,estimated_value) SELECT 'Full window fixture',n||'@test.invalid','won','XQA',0.01 FROM generate_series(1,5001)n");
    try {
      const result=await request(app).get("/api/admin/pipeline/funnel?window=all").set("Cookie",owner.cookie).expect(200);
      expect(result.body.overall.enquiries-before.body.overall.enquiries).toBe(5001);
      expect(result.body.financialByCurrency.find((row:any)=>row.currency==='XQA').wonValue).toBe(50.01);
      for(const path of ['/api/admin/acquisition/intelligence?window=all','/api/admin/revenue/intelligence?window=all','/api/admin/capital/intelligence?window=all'])
        await request(app).get(path).set('Cookie',owner.cookie).expect(200);
    } finally {await database.exec("DELETE FROM leads WHERE name='Full window fixture'");}
  },30000);
  it("aggregates more than 20000 treasury records without mixing currencies, voids or future amounts",async()=>{
    const {rows:[lead]}=await database.query("INSERT INTO leads(name,email,stage) VALUES('Aggregate fixture','aggregate@test.invalid','won') RETURNING id");
    try {
      await database.query(`INSERT INTO revenue_events(lead_id,service_interest,revenue_kind,currency,amount,occurred_at,source_reference)
        SELECT $1,'enterprise-software','one_time','XQA',0.01,now()-interval '1 day','aggregate-'||n FROM generate_series(1,20001)n`,[lead.id]);
      await database.query(`INSERT INTO revenue_events(lead_id,service_interest,revenue_kind,currency,amount,occurred_at,source_reference,voided_at,void_reason)
        VALUES($1,'enterprise-software','one_time','XQB',9.99,now()-interval '1 day','other currency',NULL,NULL),
          ($1,'enterprise-software','one_time','XQA',500,now()+interval '1 day','future',NULL,NULL),
          ($1,'enterprise-software','one_time','XQA',700,now()-interval '1 day','voided',now(),'Synthetic correction fixture')`,[lead.id]);
      const result=await request(app).get('/api/admin/treasury/intelligence').set('Cookie',owner.cookie).expect(200);
      expect(result.body.coverage).toMatchObject({complete:true,method:'database_full_window_aggregates',snapshot:'repeatable_read'});
      expect(result.body.companyRoic.find((row:any)=>row.currency==='XQA').currentTtm.revenue).toBe(200.01);
      expect(result.body.companyRoic.find((row:any)=>row.currency==='XQB').currentTtm.revenue).toBe(9.99);
    } finally {await database.query('DELETE FROM leads WHERE id=$1',[lead.id]);}
  },30000);
  it("counts the shared treasury boundary once and uses exact full-window cost coverage",async()=>{
    const {treasuryWindowTotals}=await import('./treasury/reporting.js');
    const asOf=new Date('2026-11-23T12:00:00Z'),start=new Date('2025-11-23T12:00:00Z'),prior=new Date('2024-11-23T12:00:00Z');
    const {rows:[lead]}=await database.query("INSERT INTO leads(name,email,stage) VALUES('Boundary fixture','boundary@test.invalid','won') RETURNING id");
    try {
      await database.query(`INSERT INTO revenue_events(lead_id,service_interest,revenue_kind,currency,amount,occurred_at,source_reference)
        VALUES($1,'enterprise-software','one_time','XQC',0.10,$2,'boundary'),
          ($1,'enterprise-software','one_time','XQC',0.20,$3,'end')`,[lead.id,start.toISOString(),asOf.toISOString()]);
      await database.query(`INSERT INTO cost_evidence_attestations(lead_id,service_interest,currency,through_at,source_reference)
        VALUES($1,'enterprise-software','XQC',$2,'boundary attestation')`,[lead.id,asOf.toISOString()]);
      const totals=await treasuryWindowTotals(asOf,start,prior,start);
      expect(totals.amount('revenue','current','XQC')).toBe(0.30);
      expect(totals.amount('revenue','prior','XQC')).toBe(0);
      expect(totals.coverage('current','XQC')).toEqual({leads:1,complete:1});
    } finally {await database.query('DELETE FROM leads WHERE id=$1',[lead.id]);}
  });
  it.runIf(native)("serializes competing collections with distinct request references",async()=>{
    const row=await invoice(0.3);const results=await Promise.all([collection(row.id,0.2),collection(row.id,0.2)]);
    expect(results.map(row=>row.status).sort()).toEqual([201,409]);
    expect((await database.query("SELECT sum(amount)::text AS total FROM cash_collections WHERE invoice_id=$1",[row.id])).rows[0].total).toBe("0.20");
  });
  it.runIf(native)("serializes overlapping hurdle approvals even when request references differ",async()=>{
    const body={currency:"XTS",annualHurdleRatePct:10,effectiveFrom:new Date().toISOString(),rationale:"Independent concurrent approval fixture"};
    const results=await Promise.all(Array.from({length:6},()=>financePost("/api/admin/treasury/hurdle-policies",body)));
    expect(results.map(row=>row.status).sort()).toEqual([201,409,409,409,409,409]);
    expect(Number((await database.query("SELECT count(*) AS total FROM capital_hurdle_policies WHERE currency='XTS'")).rows[0].total)).toBe(1);
  });
});
