import { ValidationPipe, type ValidationError } from '@nestjs/common';
import type { FieldError } from '../errors/error-response';
import { ValidationException } from '../errors/validation.exception';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: (errors) => new ValidationException(flattenValidationErrors(errors)),
  });
}

export function flattenValidationErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownErrors = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...ownErrors, ...flattenValidationErrors(error.children ?? [], field)];
  });
}
