export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function notImplemented(feature: string): ApiError {
  return new ApiError(
    501,
    'NOT_IMPLEMENTED',
    `${feature} is wired in the TypeScript backend scaffold but not implemented yet.`,
  );
}

export function unauthenticated(message = 'Authentication is required.'): ApiError {
  return new ApiError(401, 'UNAUTHENTICATED', message);
}

export function forbidden(message = 'You do not have permission to access this resource.'): ApiError {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function notFound(path: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', `No route matches ${path}.`);
}
