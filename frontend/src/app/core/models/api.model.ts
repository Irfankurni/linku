export interface ApiResponse<T> {
  success: true;
  data:    T;
  meta?:   Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?:   string;
    issues?: unknown[];
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
