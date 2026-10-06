import { inputClassName, labelClassName } from '@/components/ui/form-controls';
import { CheckIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { QUESTION_TYPE_LABELS } from '@/lib/question-types';
import type { Question } from '@/types/quiz';

const choiceBaseClassName = 'flex items-center gap-3 rounded-md border px-3 py-2 text-sm';
const choiceClassName = cn(choiceBaseClassName, 'border-slate-200 bg-white text-slate-700');
const correctChoiceClassName = cn(
  choiceBaseClassName,
  'border-emerald-300 bg-emerald-50 text-emerald-900',
);

interface QuestionPreviewProps {
  question: Question;
  number: number;
}

export function QuestionPreview({ question, number }: QuestionPreviewProps) {
  const headingId = `question-${question.id}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 id={headingId} className="min-w-0 flex-1 font-semibold break-words text-slate-900">
          <span className="mr-1.5 text-slate-500">{number}.</span>
          {question.text}
        </h2>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {QUESTION_TYPE_LABELS[question.type]}
        </span>
      </div>
      <div className="mt-4">
        <AnswerPreview question={question} />
      </div>
    </section>
  );
}

function AnswerPreview({ question }: { question: Question }) {
  switch (question.type) {
    case 'BOOLEAN':
      return <BooleanAnswerPreview question={question} />;
    case 'INPUT':
      return <TextAnswerPreview question={question} />;
    case 'CHECKBOX':
      return <OptionsPreview question={question} />;
  }
}

function BooleanAnswerPreview({ question }: { question: Question }) {
  return (
    <fieldset disabled>
      <legend className="sr-only">Correct answer</legend>
      <div className="flex flex-wrap gap-3">
        {[true, false].map((value) => {
          const isCorrect = question.correctBoolean === value;
          return (
            <label
              key={String(value)}
              className={isCorrect ? correctChoiceClassName : choiceClassName}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                defaultChecked={isCorrect}
                className="size-4 accent-emerald-600"
              />
              <span>{value ? 'True' : 'False'}</span>
              {isCorrect && <CorrectBadge />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function TextAnswerPreview({ question }: { question: Question }) {
  const inputId = `question-${question.id}-answer`;
  return (
    <div>
      <label htmlFor={inputId} className={labelClassName}>
        Correct answer
      </label>
      <input
        id={inputId}
        type="text"
        defaultValue={question.correctText ?? ''}
        disabled
        className={cn(inputClassName, 'mt-1.5 disabled:text-slate-800')}
      />
    </div>
  );
}

function OptionsPreview({ question }: { question: Question }) {
  return (
    <fieldset disabled>
      <legend className="sr-only">Answer options</legend>
      <ul className="space-y-2">
        {question.options.map((option) => (
          <li key={option.id}>
            <label className={option.isCorrect ? correctChoiceClassName : choiceClassName}>
              <input
                type="checkbox"
                defaultChecked={option.isCorrect}
                className="size-4 shrink-0 accent-emerald-600"
              />
              <span className="min-w-0 flex-1 break-words">{option.text}</span>
              {option.isCorrect && <CorrectBadge />}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function CorrectBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
      <CheckIcon className="size-3.5" />
      Correct
    </span>
  );
}
