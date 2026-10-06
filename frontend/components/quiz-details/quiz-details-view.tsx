'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/state-panels';
import { useApiResource } from '@/hooks/use-api-resource';
import { formatDate, pluralize } from '@/lib/format';
import { ApiError, getErrorMessage } from '@/services/api-client';
import { getQuiz } from '@/services/quizzes';
import type { QuizDetails } from '@/types/quiz';
import { QuestionPreview } from './question-preview';

export function QuizDetailsView({ quizId }: { quizId: string }) {
  const loadQuiz = useCallback((signal: AbortSignal) => getQuiz(quizId, signal), [quizId]);
  const { state, retry } = useApiResource(loadQuiz);

  return (
    <div>
      <Link
        href="/quizzes"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <ArrowLeftIcon className="size-4" />
        All quizzes
      </Link>

      <div className="mt-4">
        {state.status === 'loading' && <QuizDetailsSkeleton />}
        {state.status === 'error' &&
          (isMissingQuizError(state.error) ? (
            <EmptyState
              title="Quiz not found"
              description="It may have been deleted, or the link is incorrect."
              action={<ButtonLink href="/quizzes">Back to quizzes</ButtonLink>}
            />
          ) : (
            <ErrorState
              title="Could not load the quiz"
              message={getErrorMessage(state.error)}
              onRetry={retry}
            />
          ))}
        {state.status === 'success' && <QuizDetailsContent quiz={state.data} />}
      </div>
    </div>
  );
}

function isMissingQuizError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

function QuizDetailsContent({ quiz }: { quiz: QuizDetails }) {
  return (
    <article aria-labelledby="quiz-title">
      <header>
        <h1
          id="quiz-title"
          className="text-2xl font-bold tracking-tight break-words text-slate-900 sm:text-3xl"
        >
          {quiz.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {pluralize(quiz.questions.length, 'question')}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          created {formatDate(quiz.createdAt)}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Read-only view: the correct answers are selected and highlighted.
        </p>
      </header>

      <ol className="mt-6 space-y-4">
        {quiz.questions.map((question, index) => (
          <li key={question.id}>
            <QuestionPreview question={question} number={index + 1} />
          </li>
        ))}
      </ol>
    </article>
  );
}

function QuizDetailsSkeleton() {
  return (
    <LoadingSkeleton label="Loading quiz…">
      <div className="h-8 w-1/2 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-1/4 rounded bg-slate-100" />
      <div className="mt-8 space-y-4">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="mt-4 h-9 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}
