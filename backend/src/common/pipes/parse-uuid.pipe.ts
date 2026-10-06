import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ValidationException } from '../errors/validation.exception';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (isUUID(value)) {
      return value;
    }
    const field = metadata.data ?? 'id';
    throw new ValidationException([{ field, message: `${field} must be a valid UUID` }]);
  }
}
