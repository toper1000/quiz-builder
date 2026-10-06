import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../app.setup';
import type { ErrorResponse } from '../common/errors/error-response';
import { PrismaService } from '../prisma/prisma.service';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

const QUIZ_ID = '7d3c2f0e-4b1a-4c8e-9f2d-1a2b3c4d5e6f';

const quizDetails = {
  id: QUIZ_ID,
  title: 'General knowledge',
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  questions: [
    {
      id: '0b9a6c1e-2d3f-4a5b-8c7d-9e0f1a2b3c4d',
      order: 1,
      type: 'BOOLEAN',
      text: 'The Earth is round.',
      correctBoolean: true,
      correctText: null,
      options: [],
    },
  ],
};

describe('QuizzesController (HTTP)', () => {
  const prisma = {
    quiz: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [QuizzesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /quizzes', () => {
    it('creates a quiz and returns it with status 201', async () => {
      prisma.quiz.create.mockResolvedValue(quizDetails);

      const response = await request(server)
        .post('/quizzes')
        .send({
          title: 'General knowledge',
          questions: [{ type: 'BOOLEAN', text: 'The Earth is round.', correctBoolean: true }],
        })
        .expect(201);

      expect(response.body).toEqual(JSON.parse(JSON.stringify(quizDetails)));
      expect(prisma.quiz.create).toHaveBeenCalledTimes(1);
    });

    it('returns 400 with field errors and does not touch the database for an invalid payload', async () => {
      const response = await request(server)
        .post('/quizzes')
        .send({ title: ' ', questions: [{ type: 'CHECKBOX', text: 'Pick one', options: [] }] })
        .expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        errors: [
          { field: 'title', message: 'title must not be empty' },
          { field: 'questions.0.options', message: 'options must contain at least 2 item(s)' },
        ],
        path: '/quizzes',
        timestamp: expect.any(String),
      });
      expect(prisma.quiz.create).not.toHaveBeenCalled();
    });

    it('returns 400 for malformed JSON', async () => {
      const response = await request(server)
        .post('/quizzes')
        .set('Content-Type', 'application/json')
        .send('{"title": ')
        .expect(400);

      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    });

    it('returns 413 in the standard error format when the body is too large', async () => {
      // The test app uses the default 100kb JSON limit; main.ts raises it to 512kb.
      const response = await request(server)
        .post('/quizzes')
        .send({ title: 'x'.repeat(150 * 1024), questions: [] })
        .expect(413);

      expect(response.body).toMatchObject({
        statusCode: 413,
        error: 'Payload Too Large',
        message: 'request entity too large',
        path: '/quizzes',
      });
    });
  });

  describe('GET /quizzes', () => {
    it('returns the quizzes with their number of questions', async () => {
      prisma.quiz.findMany.mockResolvedValue([
        { id: QUIZ_ID, title: 'Quiz', createdAt: quizDetails.createdAt, _count: { questions: 2 } },
      ]);

      const response = await request(server).get('/quizzes').expect(200);

      expect(response.body).toEqual([
        { id: QUIZ_ID, title: 'Quiz', createdAt: '2026-01-01T10:00:00.000Z', questionCount: 2 },
      ]);
    });

    it('hides internal error details behind a generic 500 response', async () => {
      prisma.quiz.findMany.mockRejectedValue(new Error('connection refused'));

      const response = await request(server).get('/quizzes').expect(500);
      const body = response.body as ErrorResponse;

      expect(body.message).toBe('An unexpected error occurred');
      expect(JSON.stringify(body)).not.toContain('connection refused');
    });
  });

  describe('GET /quizzes/:id', () => {
    it('returns the quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizDetails);

      const response = await request(server).get(`/quizzes/${QUIZ_ID}`).expect(200);

      expect(response.body).toEqual(JSON.parse(JSON.stringify(quizDetails)));
    });

    it('returns 400 when the id is not a UUID', async () => {
      const response = await request(server).get('/quizzes/not-a-uuid').expect(400);
      const body = response.body as ErrorResponse;

      expect(body.errors).toEqual([{ field: 'id', message: 'id must be a valid UUID' }]);
      expect(prisma.quiz.findUnique).not.toHaveBeenCalled();
    });

    it('returns 404 when the quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      const response = await request(server).get(`/quizzes/${QUIZ_ID}`).expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: `Quiz with id "${QUIZ_ID}" was not found`,
        path: `/quizzes/${QUIZ_ID}`,
      });
    });
  });

  describe('DELETE /quizzes/:id', () => {
    it('deletes the quiz and returns 204 without a body', async () => {
      prisma.quiz.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(server).delete(`/quizzes/${QUIZ_ID}`).expect(204);

      expect(response.text).toBe('');
      expect(prisma.quiz.deleteMany).toHaveBeenCalledWith({ where: { id: QUIZ_ID } });
    });

    it('returns 404 when the quiz does not exist', async () => {
      prisma.quiz.deleteMany.mockResolvedValue({ count: 0 });

      await request(server).delete(`/quizzes/${QUIZ_ID}`).expect(404);
    });
  });
});
