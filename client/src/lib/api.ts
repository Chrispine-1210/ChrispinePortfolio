// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

// Custom error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Type-safe API fetch
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = (await res.json()) as ApiResponse<T>;

    if (!res.ok) {
      throw new ApiError(
        res.status,
        data.error?.message || "API Error",
        data.error?.code
      );
    }

    return data.data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, err instanceof Error ? err.message : "Unknown error");
  }
}
