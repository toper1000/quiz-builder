import type { Metadata } from 'next';
import { QuizDetailsView } from '@/components/quiz-details/quiz-details-view';

export const metadata: Metadata = { title: 'Quiz details' };

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  // The key resets the view's state when navigating between quizzes.
  return <QuizDetailsView key={id} quizId={id} />;
}
