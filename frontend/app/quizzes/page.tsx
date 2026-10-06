import type { Metadata } from 'next';
import { QuizList } from '@/components/quiz-list/quiz-list';
import { ButtonLink } from '@/components/ui/button';
import { PlusIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Quizzes' };

export default function QuizzesPage() {
  return (
    <>
      <PageHeader
        title="Quizzes"
        description="All quizzes, newest first. Open one to see its questions."
        actions={
          <ButtonLink href="/create">
            <PlusIcon className="size-4" />
            Create quiz
          </ButtonLink>
        }
      />
      <QuizList />
    </>
  );
}
