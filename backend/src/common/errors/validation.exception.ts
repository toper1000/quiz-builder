import { BadRequestException } from '@nestjs/common';
import type { FieldError } from './error-response';

export class ValidationException extends BadRequestException {
  constructor(readonly errors: FieldError[]) {
    super({ message: 'Validation failed', errors });
  }
}
