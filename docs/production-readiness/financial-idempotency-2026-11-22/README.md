# Persistent financial request receipts

Financial writes now require a durable request reference. A single database
transaction encloses existing validation, business changes, audit and the
original HTTP status/body. No success is sent before commit. Same-actor/key
requests serialize on a transaction advisory lock and replay the original
result; different input/action returns 409. Committed receipts do not expire
and cannot be updated or deleted. Permissions are checked again on each request.

Shared database helpers follow the active transaction through AsyncLocalStorage;
nested business transactions use savepoints on the same connection. There is
no second-connection lock holder. Statement/lock waits are bounded.

The browser persists only an opaque key, hashed request identity, method, path
and timestamp, scoped to the signed-in account. Web Locks coordinate allocation
between tabs. It retains unknown outcomes across reloads and makes no automatic
write retry. Account identity is rechecked before dispatch. The authenticated
Financial requests page inspects the original result and acknowledges recorded
receipts. An absent receipt remains **unconfirmed**, including during in-flight
execution; absence is never permission to submit a new key.

## Evidence

- `native-proof.json`: 14 real PostgreSQL 18.7 checks, including six independent
  simultaneous HTTP requests, actual client disconnect during execution,
  recovery/replay after commit, and replay in a fresh application process.
- Existing forty-operation mutation/audit rollback matrix now also includes
  request receipts in its before/after snapshots.
- Browser transport/storage tests cover unknown outcomes, incomplete response
  bodies, denied storage/locking, actor separation and no automatic retries.
- `preview-migration.json`: 0012 applied to the isolated Preview through the
  guarded journal/catalog transaction. Runtime SELECT/INSERT allowed;
  UPDATE/DELETE/TRUNCATE denied. This file records the original Preview snapshot.
  The retained 23 November production review confirms 0012 adoption, restricted
  runtime identity and the merged READY production deployment. See the current
  [release gate register](../RELEASE_GATES.md). This does not close the remaining
  financial, recovery, billing, delivery, restore or owner-browser gates.
- Source-only prefix/full catalogs retain the twelve-migration starting point
  and thirteen-migration result. Earlier B04 evidence remains historical;
  its tools pin the source filenames/checksums it certified.

This certifies request idempotency, not all financial mathematics or concurrency
between different request keys. Monetary correctness, recovery, product billing,
provider delivery, restore certification and owner admin-browser acceptance
remain open. Local/native checks are separate from GitHub-hosted assurance;
the account billing lock is not solved by source changes or reruns.
