/**
 * API Client Service
 * Centralized, type-safe API communication layer with error handling
 */

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  requestId: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: number;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

class ApiClient {
  private baseUrl: string = "";

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>("GET", endpoint);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("POST", endpoint, data);
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("PUT", endpoint, data);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>("DELETE", endpoint);
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json() as ApiResponse<T>;

    if (!response.ok || !responseData.success) {
      throw this.handleError(responseData as ApiErrorResponse);
    }

    return (responseData as ApiSuccessResponse<T>).data;
  }

  /**
   * Error handling
   */
  private handleError(error: ApiErrorResponse): Error {
    const message = `[${error.error.code}] ${error.error.message}`;
    const err = new Error(message);
    (err as any).code = error.error.code;
    (err as any).details = error.error.details;
    return err;
  }
}

export const apiClient = new ApiClient();
