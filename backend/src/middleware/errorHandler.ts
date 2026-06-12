import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError, isApiError } from '../utils/apiError';

function zodFields(error: ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((fields, issue) => {
    const key = issue.path.join('.') || 'request';
    fields[key] = issue.message;
    return fields;
  }, {});
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        fields: zodFields(error),
      },
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    const apiError = new ApiError(400, 'INVALID_JSON', 'Request body contains invalid JSON.');
    res.status(apiError.statusCode).json({
      error: {
        code: apiError.code,
        message: apiError.message,
        fields: apiError.fields,
      },
    });
    return;
  }

  if (isApiError(error)) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        fields: error.fields,
      },
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error.',
      fields: {},
    },
  });
};
