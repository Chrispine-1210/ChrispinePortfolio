import { createServer } from "node:http";
import { eq } from "drizzle-orm";
import { db, database } from "./database.js";
import { users, roles, userRoles } from "../../../shared/schema.js";
import { app } from "../../../server/app.js";
import { getDatabaseAuthRuntime } from "../../../server/security/database-auth-routes.js";
import { serveStatic } from "../../../server/static.js";

if (
  process.env.NODE_ENV !== "test" ||
  process.env.ENGINEERING_QA_FIXTURE !== "isolated-pglite-only" ||
  process.env.VERCEL
) {
  throw new Error("The review-session fixture cannot run outside isolated QA");
}
const [user] = await db
  .insert(users)
  .values({
    email: "engineering-review@qa.invalid",
    status: "active",
    emailVerifiedAt: new Date(),
  })
  .returning();
const [role] = await db
  .select()
  .from(roles)
  .where(eq(roles.key, "super_administrator"));
if (!role) throw new Error("QA role migration is missing");
await db
  .insert(userRoles)
  .values({ userId: user.id, roleId: role.id, assignedBy: user.id });
app.get("/_qa/start", async (_req, res, next) => {
  try {
    const session = await getDatabaseAuthRuntime().sessions.issue({
      userId: user.id,
      userSecurityVersion: user.securityVersion,
    });
    res.cookie("admin_session", session.token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    res.redirect("/admin/workspace");
  } catch (error) {
    next(error);
  }
});
serveStatic(app);
const server = createServer(app);
server.listen({ host: "127.0.0.1", port: Number(process.env.PORT) }, () =>
  console.log(
    `Isolated synthetic review: http://127.0.0.1:${process.env.PORT}/_qa/start`,
  ),
);
process.on("SIGTERM", () => server.close(() => void database.close()));
