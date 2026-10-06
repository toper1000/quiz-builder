export const QUESTION_TYPES = ['BOOLEAN', 'INPUT', 'CHECKBOX'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuizSummary {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  order: number;
  type: QuestionType;
  text: string;
  correctBoolean: boolean | null;
  correctText: string | null;
  options: QuestionOption[];
}

export interface QuizDetails {
  id: string;
  title: string;
  createdAt: string;
  questions: Question[];
}

export type CreateQuestionPayload =
  | { type: 'BOOLEAN'; text: string; correctBoolean: boolean }
  | { type: 'INPUT'; text: string; correctText: string }
  | { type: 'CHECKBOX'; text: string; options: { text: string; isCorrect: boolean }[] };

export interface CreateQuizPayload {
  title: string;
  questions: CreateQuestionPayload[];
}
