export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "IDENTIFICATION_NOT_CONFIGURED"
  | "IDENTIFICATION_SERVICE_TIMEOUT"
  | "IDENTIFICATION_SERVICE_FAILED"
  | "IDENTIFICATION_RESPONSE_INVALID"
  | "TOXICITY_SERVICE_TIMEOUT"
  | "TOXICITY_SERVICE_FAILED"
  | "TOXICITY_RESPONSE_INVALID"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export class ServiceError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function createApiError(
  code: ApiErrorCode,
  message: string,
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
    },
  };
}
