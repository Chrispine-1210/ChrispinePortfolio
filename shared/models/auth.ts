// Keep legacy imports working while maintaining a single authoritative user model.
export {
  users,
  insertUserSchema,
  upsertUserSchema,
  type InsertUser,
  type UpsertUser,
  type User,
} from "../schema.js";
