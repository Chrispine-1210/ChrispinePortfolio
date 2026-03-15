/**
 * Pagination - Utility for handling pagination in queries
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class Pagination {
  /**
   * Calculate pagination offset
   */
  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validate pagination params
   */
  static validate(page: number, limit: number): { page: number; limit: number } {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.max(1, Math.min(100, Math.floor(limit))); // Max 100 items per page

    return { page: validPage, limit: validLimit };
  }

  /**
   * Create paginated result
   */
  static paginate<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResult<T> {
    const { page: validPage, limit: validLimit } = this.validate(page, limit);
    const totalPages = Math.ceil(total / validLimit);

    return {
      data,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPreviousPage: validPage > 1,
      },
    };
  }
}
