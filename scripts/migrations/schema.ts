import { createHash } from "node:crypto";
import type { MigrationClient } from "./runner.js";

// Read definitions only. User rows, sequence current values, role ownership and
// credentials are excluded. Provider/extension-owned objects and schemas outside
// the application's public schema are outside this structural baseline.
const catalogSql = `
WITH relations AS (
 SELECT c.* FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')
 AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e')
), objects AS (
 SELECT 'relation' AS kind, c.relname::text AS key, jsonb_build_object('kind',c.relkind,'persistence',c.relpersistence,
  'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity,'options',c.reloptions,
  'partition',pg_catalog.pg_get_expr(c.relpartbound,c.oid)) AS definition FROM relations c
 UNION ALL
 SELECT 'column', c.relname||'.'||a.attname, jsonb_build_object('position',a.attnum,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
  'notNull',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'collation',co.collname,
  'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid))
 FROM relations c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
 LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 LEFT JOIN pg_catalog.pg_collation co ON co.oid=a.attcollation
 WHERE a.attnum>0 AND NOT a.attisdropped
 UNION ALL
 SELECT 'constraint', c.relname||'.'||k.conname, jsonb_build_object('definition',pg_catalog.pg_get_constraintdef(k.oid,false),
  'validated',k.convalidated,'deferrable',k.condeferrable,'deferred',k.condeferred)
 FROM relations c JOIN pg_catalog.pg_constraint k ON k.conrelid=c.oid
 UNION ALL
 SELECT 'index', c.relname||'.'||i.relname, jsonb_build_object('definition',pg_catalog.pg_get_indexdef(x.indexrelid,0,false),
  'valid',x.indisvalid,'ready',x.indisready)
 FROM relations c JOIN pg_catalog.pg_index x ON x.indrelid=c.oid JOIN pg_catalog.pg_class i ON i.oid=x.indexrelid
 UNION ALL
 SELECT 'trigger',c.relname||'.'||t.tgname,jsonb_build_object('definition',pg_catalog.pg_get_triggerdef(t.oid,false),'enabled',t.tgenabled)
 FROM relations c JOIN pg_catalog.pg_trigger t ON t.tgrelid=c.oid WHERE NOT t.tgisinternal
 UNION ALL
 SELECT 'function',p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('definition',pg_catalog.pg_get_functiondef(p.oid))
 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind IN ('f','p')
 AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
 UNION ALL
 SELECT 'enum',t.typname,jsonb_build_object('labels',(SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_catalog.pg_enum e WHERE e.enumtypid=t.oid))
 FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e'
 UNION ALL
 SELECT 'view',c.relname,jsonb_build_object('definition',pg_catalog.pg_get_viewdef(c.oid,false)) FROM relations c WHERE c.relkind IN ('v','m')
 UNION ALL
 SELECT 'sequence',c.relname,jsonb_build_object('type',pg_catalog.format_type(s.seqtypid,NULL),'start',s.seqstart::text,
  'increment',s.seqincrement::text,'min',s.seqmin::text,'max',s.seqmax::text,'cache',s.seqcache::text,'cycle',s.seqcycle)
 FROM relations c JOIN pg_catalog.pg_sequence s ON s.seqrelid=c.oid
 UNION ALL
 SELECT 'policy',c.relname||'.'||p.polname,jsonb_build_object('command',p.polcmd,'permissive',p.polpermissive,
  'roles',(SELECT jsonb_agg(CASE WHEN x=0 THEN 'public' ELSE pg_catalog.pg_get_userbyid(x)::text END ORDER BY x) FROM unnest(p.polroles) x),
  'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid))
 FROM relations c JOIN pg_catalog.pg_policy p ON p.polrelid=c.oid
)
SELECT kind,key,definition FROM objects ORDER BY kind COLLATE "C",key COLLATE "C"`;

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
}

export function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }

export async function schemaObjects(client: MigrationClient) {
  const { rows } = await client.query(catalogSql);
  return rows;
}

export async function schemaIdentity(client: MigrationClient) {
  const rows = await schemaObjects(client);
  return { digest: sha256(canonicalJson(rows)), objectCount: rows.length };
}
