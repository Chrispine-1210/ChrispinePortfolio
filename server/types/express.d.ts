import type { SessionPrincipal } from "../security/session-service.js";

declare global {
  namespace Express {
    interface Request {
      securityPrincipal?: SessionPrincipal;
      requestId?: string;
      authorizedAdminPermission?: string;
    }
  }
}

export {};
