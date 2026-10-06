/**
 * Mirrors backend/src/quizzes/quizzes.constants.ts so the form rejects
 * exactly what the API would reject.
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
