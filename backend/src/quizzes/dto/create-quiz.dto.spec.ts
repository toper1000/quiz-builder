import type { ArgumentMetadata } from '@nestjs/common';
import type { FieldError } from '../../common/errors/error-response';
import { ValidationException } from '../../common/errors/validation.exception';
import { createValidationPipe } from '../../common/validation/validation.pipe';
import { QUIZ_LIMITS } from '../quizzes.constants';
import { CreateQuizDto } from './create-quiz.dto';

const pipe = createValidationPipe();
const metadata: ArgumentMetadata = { type: 'body', metatype: CreateQuizDto };

type Payload = Record<string, unknown>;

const booleanQuestion = (): Payload => ({
  type: 'BOOLEAN',
  text: 'The Earth is round.',
  correctBoolean: true,
});
const inputQuestion = (): Payload => ({
  type: 'INPUT',
  text: 'Capital of France?',
  correctText: 'Paris',
});
const checkboxQuestion = (): Payload => ({
  type: 'CHECKBOX',
  text: 'Pick the even numbers',
  options: [
    { text: '2', isCorrect: true },
    { text: '3', isCorrect: false },
  ],
});

const quizWith = (...questions: Payload[]): Payload => ({ title: 'General knowledge', questions });

async function validationErrors(payload: unknown): Promise<FieldError[]> {
  try {
    await pipe.transform(payload, metadata);
    return [];
  } catch (error) {
    if (error instanceof ValidationException) {
      return error.errors;
    }
    throw error;
  }
}

describe('CreateQuizDto validation', () => {
  it('accepts a quiz with all three question types and trims text fields', async () => {
    const payload = quizWith(booleanQuestion(), inputQuestion(), checkboxQuestion());
    payload.title = '  General knowledge  ';

    const dto = (await pipe.transform(payload, metadata)) as CreateQuizDto;

    expect(dto).toBeInstanceOf(CreateQuizDto);
    expect(dto.title).toBe('General knowledge');
    expect(dto.questions).toHaveLength(3);
  });

  describe('quiz', () => {
    it.each([
      ['a missing title', { questions: [booleanQuestion()] }, 'title must be a string'],
      [
        'a blank title',
        { title: '   ', questions: [booleanQuestion()] },
        'title must not be empty',
      ],
      [
        'a title that is too long',
        { title: 'x'.repeat(QUIZ_LIMITS.titleMaxLength + 1), questions: [booleanQuestion()] },
        `title must be at most ${QUIZ_LIMITS.titleMaxLength} characters long`,
      ],
    ])('rejects %s', async (_case, payload, message) => {
      await expect(validationErrors(payload)).resolves.toEqual([{ field: 'title', message }]);
    });

    it.each([
      ['missing questions', undefined, 'questions must be an array'],
      ['an empty question list', [], 'questions must contain at least 1 item(s)'],
      [
        'too many questions',
        Array.from({ length: QUIZ_LIMITS.maxQuestions + 1 }, booleanQuestion),
        `questions must contain at most ${QUIZ_LIMITS.maxQuestions} items`,
      ],
    ])('rejects %s', async (_case, questions, message) => {
      await expect(validationErrors({ title: 'Quiz', questions })).resolves.toEqual([
        { field: 'questions', message },
      ]);
    });

    it('rejects unknown properties', async () => {
      await expect(
        validationErrors({ ...quizWith(booleanQuestion()), extra: true }),
      ).resolves.toEqual([{ field: 'extra', message: 'property extra should not exist' }]);
    });
  });

  describe('question', () => {
    it('rejects an unknown type', async () => {
      await expect(
        validationErrors(quizWith({ type: 'RADIO', text: 'Question' })),
      ).resolves.toEqual([
        { field: 'questions.0.type', message: 'type must be one of: BOOLEAN, INPUT, CHECKBOX' },
      ]);
    });

    it('rejects blank question text', async () => {
      await expect(
        validationErrors(quizWith({ ...booleanQuestion(), text: ' ' })),
      ).resolves.toEqual([{ field: 'questions.0.text', message: 'text must not be empty' }]);
    });
  });

  describe('BOOLEAN questions', () => {
    it.each([
      ['a missing answer', undefined, 'correctBoolean is required for BOOLEAN questions'],
      ['a non-boolean answer', 'true', 'correctBoolean must be a boolean'],
    ])('reject %s', async (_case, correctBoolean, message) => {
      await expect(
        validationErrors(quizWith({ ...booleanQuestion(), correctBoolean })),
      ).resolves.toEqual([{ field: 'questions.0.correctBoolean', message }]);
    });

    it('reject answer fields of other question types', async () => {
      await expect(
        validationErrors(quizWith({ ...booleanQuestion(), correctText: 'yes', options: [] })),
      ).resolves.toEqual([
        {
          field: 'questions.0.correctText',
          message: 'correctText is only allowed for INPUT questions',
        },
        { field: 'questions.0.options', message: 'options is only allowed for CHECKBOX questions' },
      ]);
    });
  });

  describe('INPUT questions', () => {
    it.each([
      ['a missing answer', undefined, 'correctText is required for INPUT questions'],
      ['a blank answer', '   ', 'correctText must not be empty'],
      [
        'an answer that is too long',
        'x'.repeat(QUIZ_LIMITS.answerTextMaxLength + 1),
        `correctText must be at most ${QUIZ_LIMITS.answerTextMaxLength} characters long`,
      ],
    ])('reject %s', async (_case, correctText, message) => {
      await expect(
        validationErrors(quizWith({ ...inputQuestion(), correctText })),
      ).resolves.toEqual([{ field: 'questions.0.correctText', message }]);
    });

    it('accept null for fields of other question types', async () => {
      await expect(
        validationErrors(quizWith({ ...inputQuestion(), correctBoolean: null, options: null })),
      ).resolves.toEqual([]);
    });
  });

  describe('CHECKBOX questions', () => {
    const option = (text: string, isCorrect = false) => ({ text, isCorrect });

    it.each([
      ['missing options', undefined, 'options is required for CHECKBOX questions'],
      ['a single option', [option('A', true)], 'options must contain at least 2 item(s)'],
      [
        'too many options',
        Array.from({ length: QUIZ_LIMITS.maxOptions + 1 }, (_, index) =>
          option(`Option ${index}`, true),
        ),
        `options must contain at most ${QUIZ_LIMITS.maxOptions} items`,
      ],
      [
        'no correct option',
        [option('A'), option('B')],
        'options must include at least one correct option',
      ],
      [
        'duplicate option texts',
        [option('Paris', true), option(' paris ')],
        'options must not contain duplicate texts',
      ],
    ])('reject %s', async (_case, options, message) => {
      await expect(validationErrors(quizWith({ ...checkboxQuestion(), options }))).resolves.toEqual(
        [{ field: 'questions.0.options', message }],
      );
    });

    it('reject invalid options with their path', async () => {
      await expect(
        validationErrors(
          quizWith({
            ...checkboxQuestion(),
            options: [option('A', true), { text: '', isCorrect: 'yes' }],
          }),
        ),
      ).resolves.toEqual([
        { field: 'questions.0.options.1.text', message: 'text must not be empty' },
        { field: 'questions.0.options.1.isCorrect', message: 'isCorrect must be a boolean' },
      ]);
    });

    it('reject answer fields of other question types', async () => {
      await expect(
        validationErrors(quizWith({ ...checkboxQuestion(), correctBoolean: false })),
      ).resolves.toEqual([
        {
          field: 'questions.0.correctBoolean',
          message: 'correctBoolean is only allowed for BOOLEAN questions',
        },
      ]);
    });
  });
});
