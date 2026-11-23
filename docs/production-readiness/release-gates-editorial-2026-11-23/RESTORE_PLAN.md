# Current backup and isolated restore: approval-dependent operations

State: not executed. Source project `twilight-meadow-16888716`, production branch
`br-misty-wave-bb79bj7l`, database `neondb`; source application baseline
`d116fcfa9c44cf66c0cc3dbb619c367b22c94243`.

Fresh 23 November provider metadata confirms `free_v3`, `branches_limit: 10`,
and 10 retained branches. Additional restore capacity is blocked within that
allowance. Latest listed snapshot is `snap-fragrant-dream-bbspabwq`, from
18 November at 16:31:52 Africa/Blantyre, before current migration adoption.
Production snapshot schedule is empty; project history retention is 21,600 seconds.
No backup, restore, branch reset, branch deletion, configuration change or purchase
was performed. All existing backup branches and snapshots are preserved.

## Exact proposed first provider operation

After approving backup retention/cost and before any new production change:

```json
{
  "operation": "create_snapshot",
  "arguments": {
    "project_id": "twilight-meadow-16888716",
    "branch_id": "br-misty-wave-bb79bj7l",
    "name": "portfolio-pre-release-gates-20261123"
  }
}
```

No expiry or deletion of an existing snapshot is proposed. Record the actual
returned snapshot ID, source timestamp/LSN, size and release/migration reference.
A snapshot by itself does not close restoration certification. Do not create
this snapshot until the approved retention and potential storage cost are known.

## Isolated restore, after capacity is resolved

The intended new branch name is `portfolio-restore-cert-20261123-01`. The exact
dependent operation below cannot be finalized until a new snapshot ID exists:

```json
{
  "operation": "restore_snapshot",
  "arguments": {
    "project_id": "twilight-meadow-16888716",
    "snapshot_id": "USE_THE_RETURNED_NEW_SNAPSHOT_ID",
    "name": "portfolio-restore-cert-20261123-01",
    "finalize": false
  }
}
```

This is a review template; the snapshot token above is not an executable ID.
`finalize` must remain false. Never set `target_branch_id` to production, finalize
the restored branch, move production compute, reset a branch or change defaults.
If the current project remains full, present an exact separate-target recovery
method and its quote before approval. Cross-project snapshot portability and a
free new project are not assumed. No purchase or overwrite is authorized.

## Acceptance and isolation

Keep the restored target private and disconnected from public routing. Do not
expose restored customer records in a public Preview. Disable all outbound
delivery, restored outbox workers, payment/webhook actions and automatic retries.
Use isolated secrets; keep production credentials out of a deployed runtime.

At the backup boundary, compare all 13 migration filenames/checksums, schema and
constraints, runtime/migrator grants, business records, audit and request-receipt
consistency. Check role recovery explicitly because provider roles may be scoped
outside the restored database. Do not replay historical migrations or seeds.
Report aggregate checks without customer payloads, passwords, sessions or secrets.

Measure backup age, recovery boundary and time to a usable application. RPO, RTO,
backup retention, target access, compute/storage cost cap and target retirement
must be owner-approved decisions; no achieved recovery guarantee is claimed.

Open decisions: current backup retention/cost; approved capacity/target; exact
restore operation after the snapshot identity is known; recovery objectives.
