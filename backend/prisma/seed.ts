import { PrismaPg } from '@prisma/adapter-pg';
import { type Prisma, PrismaClient, QuestionType } from '@prisma/client';

const SAMPLE_QUIZ_TITLE = 'JavaScript Fundamentals';

const sampleQuestions: Prisma.QuestionCreateWithoutQuizInput[] = [
  {
    order: 1,
    type: QuestionType.BOOLEAN,
    text: 'JavaScript is a statically typed language.',
    correctBoolean: false,
  },
  {
    order: 2,
    type: QuestionType.INPUT,
    text: 'Which keyword declares a block-scoped variable that cannot be reassigned?',
    correctText: 'const',
  },
  {
    order: 3,
    type: QuestionType.CHECKBOX,
    text: 'Which of the following are primitive types in JavaScript?',
    options: {
      create: [
        { order: 1, text: 'string', isCorrect: true },
        { order: 2, text: 'number', isCorrect: true },
        { order: 3, text: 'object', isCorrect: false },
        { order: 4, text: 'boolean', isCorrect: true },
      ],
    },
  },
  {
    order: 4,
    type: QuestionType.BOOLEAN,
    text: 'The expression `typeof null` evaluates to "object".',
    correctBoolean: true,
  },
  {
    order: 5,
    type: QuestionType.CHECKBOX,
    text: 'Which array methods return a new array instead of mutating the original one?',
    options: {
      create: [
        { order: 1, text: 'map', isCorrect: true },
        { order: 2, text: 'filter', isCorrect: true },
        { order: 3, text: 'push', isCorrect: false },
        { order: 4, text: 'sort', isCorrect: false },
      ],
    },
  },
];

async function seed(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.quiz.findFirst({
    where: { title: SAMPLE_QUIZ_TITLE },
    select: { id: true },
  });
  if (existing) {
    console.log(`Sample quiz already exists (id: ${existing.id}), nothing to do.`);
    return;
  }

  const quiz = await prisma.quiz.create({
    data: { title: SAMPLE_QUIZ_TITLE, questions: { create: sampleQuestions } },
    select: { id: true, title: true, _count: { select: { questions: true } } },
  });
  console.log(
    `Created sample quiz "${quiz.title}" with ${quiz._count.questions} questions (id: ${quiz.id}).`,
  );
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and run `npm run db:seed`.',
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
