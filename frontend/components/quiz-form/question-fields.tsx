'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldError, inputClassName, labelClassName } from '@/components/ui/form-controls';
import { TrashIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { QUESTION_TYPE_LABELS } from '@/lib/question-types';
import type { QuizFormValues } from '@/lib/quiz-form-schema';
import { QUIZ_LIMITS } from '@/lib/quiz-limits';
import { QUESTION_TYPES } from '@/types/quiz';
import { BooleanAnswerField } from './boolean-answer-field';
import { CheckboxOptionsField } from './checkbox-options-field';
import { TextAnswerField } from './text-answer-field';

interface QuestionFieldsProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}

export function QuestionFields({ index, canRemove, onRemove }: QuestionFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<QuizFormValues>();
  const type = useWatch({ control, name: `questions.${index}.type` });
  const textError = errors.questions?.[index]?.text?.message;
  const number = index + 1;
  const idPrefix = `question-${index}`;

  return (
    <section
      aria-labelledby={`${idPrefix}-heading`}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id={`${idPrefix}-heading`}
          className="text-sm font-semibold tracking-wide text-slate-500 uppercase"
        >
          Question {number}
        </h3>
        <Button
          variant="ghost"
          className="px-2 py-1.5"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove question ${number}`}
        >
          <TrashIcon className="size-4" />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <label htmlFor={`${idPrefix}-text`} className={labelClassName}>
            Question text
          </label>
          <textarea
            id={`${idPrefix}-text`}
            rows={2}
            maxLength={QUIZ_LIMITS.questionTextMaxLength}
            placeholder="e.g. What is the capital of France?"
            aria-invalid={Boolean(textError)}
            aria-describedby={textError ? `${idPrefix}-text-error` : undefined}
            className={cn(inputClassName, 'mt-1.5 resize-y')}
            {...register(`questions.${index}.text`)}
          />
          <FieldError id={`${idPrefix}-text-error`} message={textError} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-type`} className={labelClassName}>
            Answer type
          </label>
          <select
            id={`${idPrefix}-type`}
            className={cn(inputClassName, 'mt-1.5')}
            {...register(`questions.${index}.type`)}
          >
            {QUESTION_TYPES.map((questionType) => (
              <option key={questionType} value={questionType}>
                {QUESTION_TYPE_LABELS[questionType]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        {type === 'BOOLEAN' && <BooleanAnswerField index={index} />}
        {type === 'INPUT' && <TextAnswerField index={index} />}
        {type === 'CHECKBOX' && <CheckboxOptionsField index={index} />}
      </div>
    </section>
  );
}
