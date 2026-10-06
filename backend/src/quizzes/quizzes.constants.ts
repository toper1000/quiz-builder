/**
 * Validation limits for quizzes. Text limits match the column sizes in prisma/schema.prisma
 * and are mirrored by the frontend form schema (frontend/lib/quiz-limits.ts).
 */
export const QUIZ_LIMITS = {
  titleMaxLength: 200,
  questionTextMaxLength: 500,
  answerTextMaxLength: 200,
  optionTextMaxLength: 200,
  minQuestions: 1,
  maxQuestions: 50,
  minOptions: 2,
  maxOptions: 10,
} as const;
