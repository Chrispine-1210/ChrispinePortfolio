/**
 * Application Error hierarchy for better error handling and classification
 */

export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  INTERNAL = "INTERNAL_ERROR",
  SERVICE = "SERVICE_ERROR",
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorType.VALIDATION, message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(ErrorType.NOT_FOUND, `${resource} with id "${id}" not found`, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(ErrorType.UNAUTHORIZED, message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(ErrorType.FORBIDDEN, message, 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorType.CONFLICT, message, 409, details);
    this.name = "ConflictError";
  }
}

export class ServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorType.SERVICE, message, 500, details);
    this.name = "ServiceError";
  }
}
