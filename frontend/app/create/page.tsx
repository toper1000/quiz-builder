import type { Metadata } from 'next';
import { QuizForm } from '@/components/quiz-form/quiz-form';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Create a quiz' };

export default function CreateQuizPage() {
  return (
    <>
      <PageHeader
        title="Create a quiz"
        description="Give your quiz a title and add as many questions as you need."
      />
      <QuizForm />
    </>
  );
}
