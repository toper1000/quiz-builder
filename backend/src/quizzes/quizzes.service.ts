import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma, QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateQuestionDto } from './dto/create-question.dto';
import type { CreateQuizDto } from './dto/create-quiz.dto';
import { quizDetailsSelect, type QuizDetails, type QuizSummary } from './quizzes.types';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateQuizDto): Promise<QuizDetails> {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        questions: { create: dto.questions.map(toQuestionCreateInput) },
      },
      select: quizDetailsSelect,
    });
  }

  async findAll(): Promise<QuizSummary[]> {
    const quizzes = await this.prisma.quiz.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    });

    return quizzes.map(({ _count, ...quiz }) => ({ ...quiz, questionCount: _count.questions }));
  }

  async findOne(id: string): Promise<QuizDetails> {
    const quiz = await this.prisma.quiz.findUnique({ where: { id }, select: quizDetailsSelect });
    if (!quiz) {
      throw quizNotFound(id);
    }
    return quiz;
  }

  async remove(id: string): Promise<void> {
    const { count } = await this.prisma.quiz.deleteMany({ where: { id } });
    if (count === 0) {
      throw quizNotFound(id);
    }
  }
}

function toQuestionCreateInput(
  question: CreateQuestionDto,
  index: number,
): Prisma.QuestionCreateWithoutQuizInput {
  const base = { order: index + 1, type: question.type, text: question.text };

  switch (question.type) {
    case QuestionType.BOOLEAN:
      return { ...base, correctBoolean: question.correctBoolean };
    case QuestionType.INPUT:
      return { ...base, correctText: question.correctText };
    case QuestionType.CHECKBOX:
      return {
        ...base,
        options: {
          create: (question.options ?? []).map((option, optionIndex) => ({
            order: optionIndex + 1,
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        },
      };
  }
}

function quizNotFound(id: string): NotFoundException {
  return new NotFoundException(`Quiz with id "${id}" was not found`);
}
