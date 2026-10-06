'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { ListIcon, PlusIcon } from '@/components/ui/icons';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/state-panels';
import { useApiResource } from '@/hooks/use-api-resource';
import { getErrorMessage, isNotFoundError } from '@/services/api-client';
import { deleteQuiz, getQuizzes } from '@/services/quizzes';
import type { QuizSummary } from '@/types/quiz';
import { QuizListItem } from './quiz-list-item';

export function QuizList() {
  const { state, retry, mutate } = useApiResource(getQuizzes);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  async function handleDelete(quiz: QuizSummary, index: number) {
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleteError(null);
    mutate((quizzes) => quizzes.filter((item) => item.id !== quiz.id));
    try {
      await deleteQuiz(quiz.id);
      setAnnouncement(`Deleted "${quiz.title}".`);
    } catch (error) {
      if (isNotFoundError(error)) {
        // Already deleted elsewhere, so the list is correct as it is.
        setAnnouncement(`Deleted "${quiz.title}".`);
        return;
      }
      mutate((quizzes) => restoreQuiz(quizzes, quiz, index));
      setDeleteError(`"${quiz.title}" was not deleted. ${getErrorMessage(error)}`);
    }
  }

  if (state.status === 'loading') {
    return <QuizListSkeleton />;
  }

  if (state.status === 'error') {
    return (
      <ErrorState
        title="Could not load quizzes"
        message={getErrorMessage(state.error)}
        onRetry={retry}
      />
    );
  }

  const quizzes = state.data;

  return (
    <div className="space-y-4">
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {deleteError && (
        <Alert title="Delete failed" onDismiss={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={<ListIcon className="size-10" />}
          title="No quizzes yet"
          description="Create your first quiz and it will show up here."
          action={
            <ButtonLink href="/create">
              <PlusIcon className="size-4" />
              Create quiz
            </ButtonLink>
          }
        />
      ) : (
        <ul aria-label="Quizzes" className="space-y-3">
          {quizzes.map((quiz, index) => (
            <QuizListItem
              key={quiz.id}
              quiz={quiz}
              onDelete={() => void handleDelete(quiz, index)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function restoreQuiz(quizzes: QuizSummary[], quiz: QuizSummary, index: number): QuizSummary[] {
  if (quizzes.some((item) => item.id === quiz.id)) {
    return quizzes;
  }
  const restored = [...quizzes];
  restored.splice(Math.min(index, restored.length), 0, quiz);
  return restored;
}

function QuizListSkeleton() {
  return (
    <LoadingSkeleton label="Loading quizzes…">
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-5 w-2/3 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}
