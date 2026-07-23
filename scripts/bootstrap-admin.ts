import { and, eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { hashPasswordArgon2id } from "../server/security/passwords.js";
import { auditEvents, roles, userRoles, users } from "../shared/schema.js";

async function bootstrapAdministrator() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const allowAdditional = process.env.ALLOW_ADDITIONAL_SUPER_ADMIN === "true";

  if (!email || !password) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required for this one-time command",
    );
  }

  const passwordHash = await hashPasswordArgon2id(password);

  const result = await db.transaction(async (transaction) => {
    const [superAdministratorRole] = await transaction
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, "super_administrator"))
      .limit(1);
    if (!superAdministratorRole) {
      throw new Error("Secure-foundation migration has not been applied");
    }

    const existingSuperAdministrators = await transaction
      .select({ id: users.id, email: users.email })
      .from(userRoles)
      .innerJoin(users, eq(users.id, userRoles.userId))
      .where(
        and(
          eq(userRoles.roleId, superAdministratorRole.id),
          eq(users.status, "active"),
        ),
      );

    const sameAdministrator = existingSuperAdministrators.find(
      (administrator) => administrator.email?.toLowerCase() === email,
    );
    if (existingSuperAdministrators.length > 0 && !sameAdministrator && !allowAdditional) {
      throw new Error(
        "An active super administrator already exists; set ALLOW_ADDITIONAL_SUPER_ADMIN=true only after an explicit access review",
      );
    }

    const [existingUser] = await transaction
      .select({ id: users.id, securityVersion: users.securityVersion })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const [administrator] = existingUser
      ? await transaction
          .update(users)
          .set({
            passwordHash,
            status: "active",
            emailVerifiedAt: new Date(),
            securityVersion: existingUser.securityVersion + 1,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning({ id: users.id, email: users.email })
      : await transaction
          .insert(users)
          .values({
            email,
            passwordHash,
            status: "active",
            emailVerifiedAt: new Date(),
          })
          .returning({ id: users.id, email: users.email });

    if (!administrator) throw new Error("Failed to provision administrator");

    await transaction
      .insert(userRoles)
      .values({
        userId: administrator.id,
        roleId: superAdministratorRole.id,
        assignedBy: administrator.id,
      })
      .onConflictDoNothing();

    await transaction.insert(auditEvents).values({
      actorUserId: administrator.id,
      action: "identity.super_administrator.bootstrap",
      resourceType: "user",
      resourceId: administrator.id,
      result: "success",
      metadata: { method: "local_cli" },
    });

    return administrator;
  });

  process.stdout.write(
    `Super administrator provisioned for ${result.email} (${result.id}).\n`,
  );
}

bootstrapAdministrator().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap failure";
  process.stderr.write(`Administrator bootstrap failed: ${message}\n`);
  process.exitCode = 1;
});
