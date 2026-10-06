import { applyDecorators } from '@nestjs/common';
import type { QuestionType } from '@prisma/client';
import {
  IsDefined,
  registerDecorator,
  ValidateIf,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

type ValidatorFn = (value: unknown, args: ValidationArguments) => boolean;

function createPropertyValidator(name: string, message: string, validate: ValidatorFn) {
  return (options?: ValidationOptions): PropertyDecorator =>
    (target, propertyKey) => {
      registerDecorator({
        name,
        target: target.constructor,
        propertyName: propertyKey.toString(),
        options: { message, ...options },
        validator: { validate },
      });
    };
}

function questionTypeOf(args: ValidationArguments): unknown {
  return (args.object as { type?: unknown }).type;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function IsAnswerForType(
  type: QuestionType,
  ...rules: PropertyDecorator[]
): PropertyDecorator {
  const allowedOnlyForType = createPropertyValidator(
    'allowedOnlyForType',
    `$property is only allowed for ${type} questions`,
    (_value, args) => questionTypeOf(args) === type,
  );

  return applyDecorators(
    ValidateIf(
      (question: { type?: unknown }, value: unknown) => question.type === type || value != null,
    ),
    IsDefined({ message: `$property is required for ${type} questions` }),
    allowedOnlyForType(),
    ...rules,
  );
}

export const HasCorrectOption = createPropertyValidator(
  'hasCorrectOption',
  '$property must include at least one correct option',
  (value) =>
    Array.isArray(value) && value.some((option) => isRecord(option) && option.isCorrect === true),
);

export const HasUniqueOptionTexts = createPropertyValidator(
  'hasUniqueOptionTexts',
  '$property must not contain duplicate texts',
  (value) => {
    if (!Array.isArray(value)) {
      return true;
    }
    const texts = value
      .map((option) => (isRecord(option) && typeof option.text === 'string' ? option.text : ''))
      .map((text) => text.trim().toLowerCase())
      .filter((text) => text.length > 0);
    return new Set(texts).size === texts.length;
  },
);
