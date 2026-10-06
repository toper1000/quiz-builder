'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import { Button, ButtonLink } from '@/components/ui/button';
import { FieldError, inputClassName, labelClassName } from '@/components/ui/form-controls';
import { PlusIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import {
  createDefaultQuizFormValues,
  createEmptyQuestion,
  quizFormSchema,
  toCreateQuizPayload,
  type QuizFormValues,
  type ValidQuizFormValues,
} from '@/lib/quiz-form-schema';
import { QUIZ_LIMITS } from '@/lib/quiz-limits';
import { ApiError, getErrorMessage } from '@/services/api-client';
import { createQuiz } from '@/services/quizzes';
import { QuestionFields } from './question-fields';

interface SubmitError {
  message: string;
  details: string[];
}

export function QuizForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const form = useForm<QuizFormValues, unknown, ValidQuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: createDefaultQuizFormValues(),
  });
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  async function onSubmit(values: ValidQuizFormValues) {
    setSubmitError(null);
    setIsSaving(true);
    try {
      const quiz = await createQuiz(toCreateQuizPayload(values));
      router.push(`/quizzes/${quiz.id}`);
    } catch (error) {
      setSubmitError({
        message: getErrorMessage(error),
        details: error instanceof ApiError ? error.details : [],
      });
      setIsSaving(false);
    }
  }

  const titleError = errors.title?.message;
  const questionsError = errors.questions?.root?.message ?? errors.questions?.message;
  const canAddQuestion = fields.length < QUIZ_LIMITS.maxQuestions;

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={isSaving} className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
            <label htmlFor="quiz-title" className={labelClassName}>
              Quiz title
            </label>
            <input
              id="quiz-title"
              type="text"
              autoComplete="off"
              maxLength={QUIZ_LIMITS.titleMaxLength}
              placeholder="e.g. JavaScript Fundamentals"
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? 'quiz-title-error' : undefined}
              className={cn(inputClassName, 'mt-1.5')}
              {...register('title')}
            />
            <FieldError id="quiz-title-error" message={titleError} />
          </div>

          <section aria-labelledby="questions-heading" className="space-y-4">
            <h2 id="questions-heading" className="text-lg font-semibold text-slate-900">
              Questions <span className="font-normal text-slate-500">({fields.length})</span>
            </h2>
            <FieldError id="questions-error" message={questionsError} />

            <ol className="space-y-4">
              {fields.map((field, index) => (
                <li key={field.id}>
                  <QuestionFields
                    index={index}
                    canRemove={fields.length > QUIZ_LIMITS.minQuestions}
                    onRemove={() => remove(index)}
                  />
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                disabled={!canAddQuestion}
                onClick={() =>
                  append(createEmptyQuestion(), { focusName: `questions.${fields.length}.text` })
                }
              >
                <PlusIcon className="size-4" />
                Add question
              </Button>
              {!canAddQuestion && (
                <p className="text-sm text-slate-500">
                  A quiz can have up to {QUIZ_LIMITS.maxQuestions} questions.
                </p>
              )}
            </div>
          </section>
        </fieldset>

        {submitError && (
          <Alert title="The quiz could not be saved" onDismiss={() => setSubmitError(null)}>
            <p>{submitError.message}</p>
            {submitError.details.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {submitError.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <ButtonLink href="/quizzes" variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" isLoading={isSubmitting || isSaving}>
            {isSaving ? 'Creating quiz…' : 'Create quiz'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
