import type { Prisma } from '@prisma/client';

export const quizDetailsSelect = {
  id: true,
  title: true,
  createdAt: true,
  questions: {
    orderBy: { order: 'asc' },
    select: {
      id: true,
      order: true,
      type: true,
      text: true,
      correctBoolean: true,
      correctText: true,
      options: {
        orderBy: { order: 'asc' },
        select: { id: true, text: true, isCorrect: true },
      },
    },
  },
} satisfies Prisma.QuizSelect;

export type QuizDetails = Prisma.QuizGetPayload<{ select: typeof quizDetailsSelect }>;

export interface QuizSummary {
  id: string;
  title: string;
  createdAt: Date;
  questionCount: number;
}
