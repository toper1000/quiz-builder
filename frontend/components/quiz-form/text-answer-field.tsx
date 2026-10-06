'use client';

import { useFormContext } from 'react-hook-form';
import { FieldError, inputClassName, labelClassName } from '@/components/ui/form-controls';
import { cn } from '@/lib/cn';
import type { QuizFormValues } from '@/lib/quiz-form-schema';
import { QUIZ_LIMITS } from '@/lib/quiz-limits';

export function TextAnswerField({ index }: { index: number }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuizFormValues>();
  const error = errors.questions?.[index]?.correctText?.message;
  const inputId = `question-${index}-correct-text`;

  return (
    <div>
      <label htmlFor={inputId} className={labelClassName}>
        Correct answer
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        maxLength={QUIZ_LIMITS.answerTextMaxLength}
        placeholder="The expected short answer"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(inputClassName, 'mt-1.5')}
        {...register(`questions.${index}.correctText`)}
      />
      <FieldError id={`${inputId}-error`} message={error} />
    </div>
  );
}
