import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

// The composite decorators below use applyDecorators() so that rules run in the order they are
// listed. Together with `stopAtFirstError` this reports the most relevant message per field
// (e.g. "must be a string" instead of "must be at most 200 characters" for a missing value).

export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export function IsRequiredText(maxLength: number): PropertyDecorator {
  return applyDecorators(
    Trim(),
    IsString({ message: '$property must be a string' }),
    IsNotEmpty({ message: '$property must not be empty' }),
    MaxLength(maxLength, { message: `$property must be at most ${maxLength} characters long` }),
  );
}

export function IsArrayOfSize(min: number, max: number): PropertyDecorator {
  return applyDecorators(
    IsArray({ message: '$property must be an array' }),
    ArrayMinSize(min, { message: `$property must contain at least ${min} item(s)` }),
    ArrayMaxSize(max, { message: `$property must contain at most ${max} items` }),
  );
}
