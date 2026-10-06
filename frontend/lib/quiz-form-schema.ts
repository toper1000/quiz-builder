import { z } from 'zod';
import {
  QUESTION_TYPES,
  type CreateQuestionPayload,
  type CreateQuizPayload,
  type QuestionType,
} from '@/types/quiz';
import { QUIZ_LIMITS } from './quiz-limits';

// Client-side mirror of the backend validation rules (backend/src/quizzes/dto).
//
// Every question keeps the answer fields of all three types, so switching the type in the
// form does not throw away what was typed. Only the fields of the selected type are
// validated (in superRefine) and sent to the API (see toCreateQuizPayload).

const optionSchema = z.object({
  text: z.string().trim(),
  isCorrect: z.boolean(),
});

type OptionValues = z.output<typeof optionSchema>;

const questionSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    text: z
      .string()
      .trim()
      .min(1, 'Enter the question text')
      .max(
        QUIZ_LIMITS.questionTextMaxLength,
        `Use at most ${QUIZ_LIMITS.questionTextMaxLength} characters`,
      ),
    correctBoolean: z.boolean().nullable(),
    correctText: z.string().trim(),
    options: z.array(optionSchema),
  })
  .superRefine((question, ctx) => {
    switch (question.type) {
      case 'BOOLEAN':
        if (question.correctBoolean === null) {
          ctx.addIssue({
            code: 'custom',
            path: ['correctBoolean'],
            message: 'Select the correct answer',
          });
        }
        break;
      case 'INPUT':
        if (question.correctText.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['correctText'],
            message: 'Enter the correct answer',
          });
        } else if (question.correctText.length > QUIZ_LIMITS.answerTextMaxLength) {
          ctx.addIssue({
            code: 'custom',
            path: ['correctText'],
            message: `Use at most ${QUIZ_LIMITS.answerTextMaxLength} characters`,
          });
        }
        break;
      case 'CHECKBOX':
        validateOptions(question.options, ctx);
        break;
    }
  });

function validateOptions(options: OptionValues[], ctx: z.RefinementCtx): void {
  const seenTexts = new Set<string>();

  options.forEach((option, index) => {
    const path = ['options', index, 'text'];
    const normalizedText = option.text.toLowerCase();
    if (option.text.length === 0) {
      ctx.addIssue({ code: 'custom', path, message: 'Enter the option text' });
    } else if (option.text.length > QUIZ_LIMITS.optionTextMaxLength) {
      ctx.addIssue({
        code: 'custom',
        path,
        message: `Use at most ${QUIZ_LIMITS.optionTextMaxLength} characters`,
      });
    } else if (seenTexts.has(normalizedText)) {
      ctx.addIssue({ code: 'custom', path, message: 'This option is already in the list' });
    }
    seenTexts.add(normalizedText);
  });

  if (options.length < QUIZ_LIMITS.minOptions) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: `Add at least ${QUIZ_LIMITS.minOptions} options`,
    });
  } else if (options.length > QUIZ_LIMITS.maxOptions) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: `Use at most ${QUIZ_LIMITS.maxOptions} options`,
    });
  } else if (!options.some((option) => option.isCorrect)) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Mark at least one option as correct',
    });
  }
}

export const quizFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a quiz title')
    .max(QUIZ_LIMITS.titleMaxLength, `Use at most ${QUIZ_LIMITS.titleMaxLength} characters`),
  questions: z
    .array(questionSchema)
    .min(QUIZ_LIMITS.minQuestions, 'Add at least one question')
    .max(QUIZ_LIMITS.maxQuestions, `A quiz can have at most ${QUIZ_LIMITS.maxQuestions} questions`),
});

export type QuizFormValues = z.input<typeof quizFormSchema>;
export type ValidQuizFormValues = z.output<typeof quizFormSchema>;
type ValidQuestionValues = ValidQuizFormValues['questions'][number];

export function createEmptyOption(): QuizFormValues['questions'][number]['options'][number] {
  return { text: '', isCorrect: false };
}

export function createEmptyQuestion(
  type: QuestionType = 'BOOLEAN',
): QuizFormValues['questions'][number] {
  return {
    type,
    text: '',
    correctBoolean: null,
    correctText: '',
    options: Array.from({ length: QUIZ_LIMITS.minOptions }, createEmptyOption),
  };
}

export function createDefaultQuizFormValues(): QuizFormValues {
  return { title: '', questions: [createEmptyQuestion()] };
}

export function toCreateQuizPayload(values: ValidQuizFormValues): CreateQuizPayload {
  return { title: values.title, questions: values.questions.map(toQuestionPayload) };
}

function toQuestionPayload(question: ValidQuestionValues): CreateQuestionPayload {
  switch (question.type) {
    case 'BOOLEAN':
      return {
        type: 'BOOLEAN',
        text: question.text,
        correctBoolean: question.correctBoolean === true,
      };
    case 'INPUT':
      return { type: 'INPUT', text: question.text, correctText: question.correctText };
    case 'CHECKBOX':
      return {
        type: 'CHECKBOX',
        text: question.text,
        options: question.options.map(({ text, isCorrect }) => ({ text, isCorrect })),
      };
  }
}
