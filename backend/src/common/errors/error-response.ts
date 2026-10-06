export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  errors?: FieldError[];
  path: string;
  timestamp: string;
}
