import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
import type { ErrorResponse, FieldError } from '../errors/error-response';

interface ErrorDetails {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

const PRISMA_CLIENT_ERRORS: Record<string, ErrorDetails> = {
  P2002: { statusCode: HttpStatus.CONFLICT, message: 'A record with the same unique value exists' },
  P2025: { statusCode: HttpStatus.NOT_FOUND, message: 'The requested record was not found' },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const { statusCode, message, errors } = toErrorDetails(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponse = {
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      message,
      ...(errors && { errors }),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(http.getResponse<Response>(), body, statusCode);
  }
}

function toErrorDetails(exception: unknown): ErrorDetails {
  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }
  if (isExposedClientError(exception)) {
    return { statusCode: exception.statusCode, message: exception.message };
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const clientError = PRISMA_CLIENT_ERRORS[exception.code];
    if (clientError) {
      return clientError;
    }
  }
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
  };
}

/**
 * 4xx errors created with the `http-errors` package and marked as safe to expose,
 * e.g. body-parser's 413 "request entity too large".
 */
function isExposedClientError(
  exception: unknown,
): exception is { statusCode: number; message: string } {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }
  const { statusCode, expose, message } = exception as Record<string, unknown>;
  return (
    typeof statusCode === 'number' &&
    statusCode >= 400 &&
    statusCode < 500 &&
    expose === true &&
    typeof message === 'string'
  );
}

function fromHttpException(exception: HttpException): ErrorDetails {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { statusCode, message: response };
  }

  const { message, errors } = response as { message?: unknown; errors?: FieldError[] };
  return { statusCode, message: normalizeMessage(message, exception.message), errors };
}

function normalizeMessage(message: unknown, fallback: string): string {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.join('; ');
  }
  return fallback;
}
