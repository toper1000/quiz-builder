import { NotFoundException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';
import { quizDetailsSelect } from './quizzes.types';

const QUIZ_ID = '7d3c2f0e-4b1a-4c8e-9f2d-1a2b3c4d5e6f';

function createPrismaMock() {
  return {
    quiz: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

describe('QuizzesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: QuizzesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new QuizzesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates the quiz, its ordered questions and options in a single nested write', async () => {
      const dto: CreateQuizDto = {
        title: 'General knowledge',
        questions: [
          { type: QuestionType.BOOLEAN, text: 'The Earth is round.', correctBoolean: true },
          { type: QuestionType.INPUT, text: 'Capital of France?', correctText: 'Paris' },
          {
            type: QuestionType.CHECKBOX,
            text: 'Pick the even numbers',
            options: [
              { text: '2', isCorrect: true },
              { text: '3', isCorrect: false },
            ],
          },
        ],
      };
      const createdQuiz = { id: QUIZ_ID, title: dto.title, createdAt: new Date(), questions: [] };
      prisma.quiz.create.mockResolvedValue(createdQuiz);

      await expect(service.create(dto)).resolves.toBe(createdQuiz);

      expect(prisma.quiz.create).toHaveBeenCalledTimes(1);
      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          title: 'General knowledge',
          questions: {
            create: [
              { order: 1, type: 'BOOLEAN', text: 'The Earth is round.', correctBoolean: true },
              { order: 2, type: 'INPUT', text: 'Capital of France?', correctText: 'Paris' },
              {
                order: 3,
                type: 'CHECKBOX',
                text: 'Pick the even numbers',
                options: {
                  create: [
                    { order: 1, text: '2', isCorrect: true },
                    { order: 2, text: '3', isCorrect: false },
                  ],
                },
              },
            ],
          },
        },
        select: quizDetailsSelect,
      });
    });

    it('only persists the answer field that belongs to the question type', async () => {
      prisma.quiz.create.mockResolvedValue({});

      await service.create({
        title: 'Quiz',
        questions: [
          {
            type: QuestionType.BOOLEAN,
            text: 'Question',
            correctBoolean: false,
            correctText: 'ignored',
            options: [{ text: 'ignored', isCorrect: true }],
          },
        ],
      });

      expect(prisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            title: 'Quiz',
            questions: {
              create: [{ order: 1, type: 'BOOLEAN', text: 'Question', correctBoolean: false }],
            },
          },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns quizzes newest first with their number of questions', async () => {
      const createdAt = new Date('2026-01-01T10:00:00.000Z');
      prisma.quiz.findMany.mockResolvedValue([
        { id: QUIZ_ID, title: 'Quiz', createdAt, _count: { questions: 3 } },
      ]);

      await expect(service.findAll()).resolves.toEqual([
        { id: QUIZ_ID, title: 'Quiz', createdAt, questionCount: 3 },
      ]);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the quiz with its questions', async () => {
      const quiz = { id: QUIZ_ID, title: 'Quiz', createdAt: new Date(), questions: [] };
      prisma.quiz.findUnique.mockResolvedValue(quiz);

      await expect(service.findOne(QUIZ_ID)).resolves.toBe(quiz);
      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: QUIZ_ID },
        select: quizDetailsSelect,
      });
    });

    it('throws NotFoundException when the quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.findOne(QUIZ_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the quiz', async () => {
      prisma.quiz.deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.remove(QUIZ_ID)).resolves.toBeUndefined();
      expect(prisma.quiz.deleteMany).toHaveBeenCalledWith({ where: { id: QUIZ_ID } });
    });

    it('throws NotFoundException when the quiz does not exist', async () => {
      prisma.quiz.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(QUIZ_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
