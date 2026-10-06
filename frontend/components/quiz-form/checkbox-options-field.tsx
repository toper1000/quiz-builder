'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FieldError,
  FieldHint,
  inputClassName,
  labelClassName,
} from '@/components/ui/form-controls';
import { PlusIcon, XMarkIcon } from '@/components/ui/icons';
import { createEmptyOption, type QuizFormValues } from '@/lib/quiz-form-schema';
import { QUIZ_LIMITS } from '@/lib/quiz-limits';

export function CheckboxOptionsField({ index }: { index: number }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<QuizFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: `questions.${index}.options` });

  const optionErrors = errors.questions?.[index]?.options;
  const listError = optionErrors?.root?.message ?? optionErrors?.message;
  const idPrefix = `question-${index}-options`;
  const canAddOption = fields.length < QUIZ_LIMITS.maxOptions;
  const canRemoveOption = fields.length > QUIZ_LIMITS.minOptions;
  const describedBy = [`${idPrefix}-hint`, listError && `${idPrefix}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset aria-describedby={describedBy}>
      <legend className={labelClassName}>Answer options</legend>
      <FieldHint id={`${idPrefix}-hint`}>
        Tick every correct option. Use {QUIZ_LIMITS.minOptions} to {QUIZ_LIMITS.maxOptions} options.
      </FieldHint>

      <ul className="mt-3 space-y-2">
        {fields.map((field, optionIndex) => {
          const optionNumber = optionIndex + 1;
          const inputId = `${idPrefix}-${optionIndex}-text`;
          const textError = optionErrors?.[optionIndex]?.text?.message;

          return (
            <li key={field.id} className="flex items-start gap-2">
              <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 has-checked:border-emerald-400 has-checked:bg-emerald-50 has-checked:text-emerald-800">
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-600"
                  {...register(`questions.${index}.options.${optionIndex}.isCorrect`)}
                />
                <span>
                  Correct<span className="sr-only"> (option {optionNumber})</span>
                </span>
              </label>
              <div className="min-w-0 flex-1">
                <label htmlFor={inputId} className="sr-only">
                  Option {optionNumber}
                </label>
                <input
                  id={inputId}
                  type="text"
                  autoComplete="off"
                  maxLength={QUIZ_LIMITS.optionTextMaxLength}
                  placeholder={`Option ${optionNumber}`}
                  aria-invalid={Boolean(textError)}
                  aria-describedby={textError ? `${inputId}-error` : undefined}
                  className={inputClassName}
                  {...register(`questions.${index}.options.${optionIndex}.text`)}
                />
                <FieldError id={`${inputId}-error`} message={textError} />
              </div>
              <Button
                variant="ghost"
                className="shrink-0 px-2.5 py-2.5"
                onClick={() => remove(optionIndex)}
                disabled={!canRemoveOption}
                aria-label={`Remove option ${optionNumber}`}
              >
                <XMarkIcon className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
      <FieldError id={`${idPrefix}-error`} message={listError} />

      <Button
        variant="secondary"
        className="mt-3"
        disabled={!canAddOption}
        onClick={() =>
          append(createEmptyOption(), {
            focusName: `questions.${index}.options.${fields.length}.text`,
          })
        }
      >
        <PlusIcon className="size-4" />
        Add option
      </Button>
    </fieldset>
  );
}
