'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { FieldError, labelClassName } from '@/components/ui/form-controls';
import type { QuizFormValues } from '@/lib/quiz-form-schema';

const CHOICES = [
  { value: true, label: 'True' },
  { value: false, label: 'False' },
] as const;

export function BooleanAnswerField({ index }: { index: number }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<QuizFormValues>();
  const error = errors.questions?.[index]?.correctBoolean?.message;
  const errorId = `question-${index}-correct-boolean-error`;

  return (
    <Controller
      control={control}
      name={`questions.${index}.correctBoolean`}
      render={({ field }) => (
        <fieldset
          role="radiogroup"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        >
          <legend className={labelClassName}>Correct answer</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {CHOICES.map(({ value, label }, choiceIndex) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 has-checked:border-indigo-500 has-checked:bg-indigo-50 has-checked:text-indigo-800"
              >
                <input
                  type="radio"
                  name={field.name}
                  value={String(value)}
                  checked={field.value === value}
                  onChange={() => field.onChange(value)}
                  onBlur={field.onBlur}
                  ref={choiceIndex === 0 ? field.ref : undefined}
                  className="size-4 accent-indigo-600"
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError id={errorId} message={error} />
        </fieldset>
      )}
    />
  );
}
