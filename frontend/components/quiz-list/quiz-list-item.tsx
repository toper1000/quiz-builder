import Link from 'next/link';
import { TrashIcon } from '@/components/ui/icons';
import { formatDate, pluralize } from '@/lib/format';
import type { QuizSummary } from '@/types/quiz';

interface QuizListItemProps {
  quiz: QuizSummary;
  onDelete: () => void;
}

export function QuizListItem({ quiz, onDelete }: QuizListItemProps) {
  return (
    <li className="relative flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 hover:shadow-sm has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-indigo-600">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-slate-900">
          {/* The ::after overlay makes the whole card clickable. */}
          <Link
            href={`/quizzes/${quiz.id}`}
            className="line-clamp-2 break-words outline-hidden after:absolute after:inset-0 after:rounded-lg"
          >
            {quiz.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {pluralize(quiz.questionCount, 'question')}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          created {formatDate(quiz.createdAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete quiz "${quiz.title}"`}
        title="Delete quiz"
        className="relative z-10 shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600"
      >
        <TrashIcon className="size-5" />
      </button>
    </li>
  );
}
