# Quiz Builder

A full-stack app for building quizzes. Users create a quiz with any number of questions of three
types, browse all quizzes, open a quiz to see its structure, and delete quizzes.

| Question type   | API value  | Correct answer                                      |
| --------------- | ---------- | --------------------------------------------------- |
| True / False    | `BOOLEAN`  | `correctBoolean`: `true` or `false`                 |
| Short answer    | `INPUT`    | `correctText`: the expected text                    |
| Multiple choice | `CHECKBOX` | `options`: 2-10 options, one or more marked correct |

**Stack**

- **Backend:** Node.js, NestJS 11, TypeScript, Prisma 7, PostgreSQL 17, class-validator, Jest
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, React Hook Form, Zod
- **Tooling:** ESLint and Prettier in both packages, Docker Compose for the database

## Contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database: migrations and seed](#database-migrations-and-seed)
- [Running the backend and the frontend](#running-the-backend-and-the-frontend)
- [Creating a sample quiz](#creating-a-sample-quiz)
- [API](#api)
- [Validation rules](#validation-rules)
- [Tests and code quality](#tests-and-code-quality)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Possible improvements](#possible-improvements)

## Prerequisites

- **Node.js** 20.19+, 22.13+ or 24+ (an LTS release is recommended) and **npm** 10+
- **Docker** with Docker Compose, to run PostgreSQL. An existing PostgreSQL 14+ server works too:
  point `DATABASE_URL` at it and skip `docker compose`.

Ports used: `5432` (PostgreSQL), `3001` (API) and `3000` (web app).

## Quick start

```bash
# 1. Start PostgreSQL (from the repository root)
docker compose up -d

# 2. Backend: http://localhost:3001
cd backend
cp .env.example .env
npm install            # also generates the Prisma client
npm run db:deploy      # creates the tables
npm run db:seed        # optional: adds a sample quiz
npm run start:dev

# 3. Frontend: http://localhost:3000 (in a second terminal, from the repository root)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. On Windows `cp` works in PowerShell; in `cmd.exe` use `copy`.

## Environment variables

`.env` files are git-ignored. Each package has a committed `.env.example` with working local
defaults.

**Backend** (`backend/.env`):

| Variable       | Description                                                         | Example                                                            |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string (Prisma CLI and runtime)               | `postgresql://quiz:quiz@localhost:5432/quiz_builder?schema=public` |
| `PORT`         | Port of the API (default `3001`)                                    | `3001`                                                             |
| `FRONTEND_URL` | Origin(s) allowed by CORS: the URL of the frontend, comma-separated | `http://localhost:3000`                                            |

The API validates these variables on startup and stops with a clear message if one is missing or
invalid.

**Frontend** (`frontend/.env.local`):

| Variable              | Description                                         | Example                 |
| --------------------- | --------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API. It is called from the browser. | `http://localhost:3001` |

`NEXT_PUBLIC_*` values are embedded at build time, so rebuild the frontend after changing it.

**Docker Compose** (optional, from the shell or a root `.env` file): `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB` (defaults `quiz` / `quiz` / `quiz_builder`) and `POSTGRES_PORT`
(default `5432`). These local development credentials match `backend/.env.example`; if you change
them, update `DATABASE_URL` too.

## Database: migrations and seed

```bash
docker compose up -d        # start PostgreSQL 17 (data is kept in a named volume)
docker compose ps           # the container should be "healthy"
```

Run these from `backend/`:

| Command               | What it does                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run db:deploy`   | Applies the committed migrations (`prisma migrate deploy`)                                                  |
| `npm run db:migrate`  | Development workflow: applies migrations and creates a new one after a schema change (`prisma migrate dev`) |
| `npm run db:seed`     | Creates the sample quiz "JavaScript Fundamentals" (5 questions, all three types). Safe to run repeatedly    |
| `npm run db:reset`    | Drops all data and re-applies the migrations; run `npm run db:seed` afterwards                              |
| `npm run db:generate` | Regenerates the Prisma client (also runs automatically after `npm install`)                                 |

Stop the database with `docker compose down`, or `docker compose down -v` to also delete its data.

## Running the backend and the frontend

| Package  | Development (watch mode) | Production                                |
| -------- | ------------------------ | ----------------------------------------- |
| backend  | `npm run start:dev`      | `npm run build` then `npm run start:prod` |
| frontend | `npm run dev`            | `npm run build` then `npm start`          |

The API listens on <http://localhost:3001> and the web app on <http://localhost:3000>. The
frontend expects the API to be running; if it is not, the pages show an error with a "Try again"
button.

## Creating a sample quiz

**Through the UI**

1. Open <http://localhost:3000/create> (or click **Create quiz** in the header).
2. Enter a quiz title.
3. For each question choose the **Answer type**, enter the **Question text** and set the correct
   answer:
   - **True / False**: select True or False.
   - **Short answer**: type the expected answer.
   - **Multiple choice**: fill in 2-10 options (**Add option** / ✕) and tick **Correct** for
     every correct option.
4. Use **Add question** and **Remove** to manage the questions.
5. Click **Create quiz**. The quiz is saved and its page opens. It is also listed on
   <http://localhost:3000/quizzes>, where the trash icon deletes it.

**With curl**

```bash
curl -X POST http://localhost:3001/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "World Geography",
    "questions": [
      { "type": "BOOLEAN", "text": "Mount Everest is the highest mountain above sea level.", "correctBoolean": true },
      { "type": "INPUT", "text": "What is the capital city of Australia?", "correctText": "Canberra" },
      {
        "type": "CHECKBOX",
        "text": "Which of these countries are in South America?",
        "options": [
          { "text": "Peru", "isCorrect": true },
          { "text": "Chile", "isCorrect": true },
          { "text": "Kenya", "isCorrect": false },
          { "text": "Norway", "isCorrect": false }
        ]
      }
    ]
  }'
```

The same payload is stored in `backend/examples/create-quiz.json`, which avoids quoting issues
in PowerShell or `cmd.exe` (run from `backend/`):

```bash
curl -X POST http://localhost:3001/quizzes -H "Content-Type: application/json" --data @examples/create-quiz.json
```

In PowerShell call `curl.exe` explicitly, because `curl` is an alias of `Invoke-WebRequest` there.

**With the seed script**: `npm run db:seed` (from `backend/`).

## API

Base URL: `http://localhost:3001`. All bodies are JSON.

| Method   | Path           | Description                                                                  | Success                     | Errors                                   |
| -------- | -------------- | ---------------------------------------------------------------------------- | --------------------------- | ---------------------------------------- |
| `POST`   | `/quizzes`     | Creates a quiz with its questions and options in one transaction             | `201` with the created quiz | `400` validation, `413` body over 512 KB |
| `GET`    | `/quizzes`     | Lists all quizzes, newest first: `id`, `title`, `createdAt`, `questionCount` | `200`                       |                                          |
| `GET`    | `/quizzes/:id` | Returns one quiz with its questions (in order) and options                   | `200`                       | `400` invalid UUID, `404`                |
| `DELETE` | `/quizzes/:id` | Deletes a quiz together with its questions and options                       | `204` (no body)             | `400` invalid UUID, `404`                |

`GET /quizzes`:

```json
[
  {
    "id": "adee6d87-911a-4368-890e-b8230a63df71",
    "title": "JavaScript Fundamentals",
    "createdAt": "2026-10-06T16:36:42.666Z",
    "questionCount": 5
  }
]
```

`GET /quizzes/:id` (the response of `POST /quizzes` has the same shape):

```json
{
  "id": "f4c47b14-a991-441c-822c-a13a1c37f181",
  "title": "World Geography",
  "createdAt": "2026-10-06T16:37:34.961Z",
  "questions": [
    {
      "id": "3250929a-7761-4765-ada6-7dca86da1205",
      "order": 1,
      "type": "BOOLEAN",
      "text": "Mount Everest is the highest mountain above sea level.",
      "correctBoolean": true,
      "correctText": null,
      "options": []
    },
    {
      "id": "2f669cbf-3bb8-49c2-b7e8-52659dab9732",
      "order": 2,
      "type": "INPUT",
      "text": "What is the capital city of Australia?",
      "correctBoolean": null,
      "correctText": "Canberra",
      "options": []
    },
    {
      "id": "7013bdb2-0fc2-4397-8691-3478cc6fedb8",
      "order": 3,
      "type": "CHECKBOX",
      "text": "Which of these countries are in South America?",
      "correctBoolean": null,
      "correctText": null,
      "options": [
        {
          "id": "0fb3a20f-bd58-4d35-9b7f-f1889635e700",
          "text": "Peru",
          "isCorrect": true
        },
        {
          "id": "af3c89bd-9646-462a-87d3-4f3f9321c076",
          "text": "Chile",
          "isCorrect": true
        },
        {
          "id": "17fb7639-4f6a-42f8-b0a5-329a0b32a680",
          "text": "Kenya",
          "isCorrect": false
        },
        {
          "id": "a2e08c48-6b79-436f-8218-52c9d0d1f1ff",
          "text": "Norway",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

**Errors** always have the same shape. `errors` is only present for validation failures, and each
`field` is a path into the request body:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "questions.0.correctBoolean",
      "message": "correctBoolean is required for BOOLEAN questions"
    },
    {
      "field": "questions.2.options",
      "message": "options must include at least one correct option"
    }
  ],
  "path": "/quizzes",
  "timestamp": "2026-10-06T16:37:42.807Z"
}
```

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Quiz with id \"11111111-2222-4333-8444-555555555555\" was not found",
  "path": "/quizzes/11111111-2222-4333-8444-555555555555",
  "timestamp": "2026-10-06T16:37:43.773Z"
}
```

Unexpected errors return `500` with a generic message. The details are only written to the server
log.

## Validation rules

The API is the source of truth (`class-validator` DTOs in `backend/src/quizzes/dto`). The
frontend mirrors the same rules with a Zod schema (`frontend/lib/quiz-form-schema.ts`), so
problems are shown next to the fields before anything is sent.

| Field                        | Rule                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `title`                      | Required string, trimmed, 1-200 characters                                                                           |
| `questions`                  | 1-50 questions; their order is their position in the array                                                           |
| `questions[].type`           | `BOOLEAN`, `INPUT` or `CHECKBOX`                                                                                     |
| `questions[].text`           | Required string, trimmed, 1-500 characters                                                                           |
| `questions[].correctBoolean` | `BOOLEAN`: required, `true` or `false`. Other types: must be left out (`null` is accepted)                           |
| `questions[].correctText`    | `INPUT`: required, trimmed, 1-200 characters. Other types: must be left out                                          |
| `questions[].options`        | `CHECKBOX`: 2-10 options, at least one correct, no duplicate texts (case-insensitive). Other types: must be left out |
| `options[].text`             | Required string, trimmed, 1-200 characters                                                                           |
| `options[].isCorrect`        | Required boolean                                                                                                     |
| Any other property           | Rejected (`property x should not exist`)                                                                             |
| `:id` route parameter        | Must be a UUID                                                                                                       |
| Request body                 | At most 512 KB                                                                                                       |

## Tests and code quality

```bash
cd backend
npm test               # Jest: service, validation rules and HTTP layer, with Prisma mocked (no database needed)
npm run test:cov       # same, with a coverage report
```

Both packages have the same quality scripts:

| Script                 | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `npm run lint`         | ESLint (`npm run lint:fix` fixes what it can) |
| `npm run format`       | Formats all files with Prettier               |
| `npm run format:check` | Fails if a file is not formatted              |
| `npm run typecheck`    | TypeScript type check without emitting files  |

The backend uses `typescript-eslint` with type-aware rules. The frontend uses `eslint-config-next`
(Core Web Vitals, TypeScript, React hooks) plus the full `jsx-a11y` recommended rule set. Prettier
also sorts Tailwind classes in the frontend.

## Project structure

```text
quiz-builder/
├── docker-compose.yml             PostgreSQL 17 for local development
├── backend/                       NestJS REST API
│   ├── prisma/
│   │   ├── schema.prisma          data model
│   │   ├── migrations/            SQL migrations
│   │   └── seed.ts                sample quiz
│   ├── prisma.config.ts           Prisma CLI configuration (schema, migrations, seed, connection URL)
│   ├── examples/create-quiz.json  sample POST /quizzes payload
│   └── src/
│       ├── main.ts                bootstrap: Helmet, CORS, body size limit, shutdown hooks
│       ├── app.module.ts          root module with environment validation
│       ├── app.setup.ts           global ValidationPipe and exception filter (shared with the tests)
│       ├── config/                environment validation, CORS origin parsing
│       ├── common/                error format, exception filter, validation pipe and decorators, UUID pipe
│       ├── prisma/                PrismaService / PrismaModule
│       └── quizzes/               controller, service, DTOs, custom validators and their tests
└── frontend/                      Next.js client
    ├── app/                       routes (App Router)
    │   ├── layout.tsx             page shell: header navigation, skip link
    │   ├── page.tsx               "/" redirects to /quizzes
    │   ├── create/page.tsx        /create
    │   ├── quizzes/page.tsx       /quizzes
    │   ├── quizzes/[id]/page.tsx  /quizzes/:id
    │   └── error.tsx, not-found.tsx, icon.svg, globals.css
    ├── components/
    │   ├── layout/                site header
    │   ├── quiz-form/             create form: question editor and answer fields per type
    │   ├── quiz-list/             quiz list with optimistic delete
    │   ├── quiz-details/          read-only quiz view
    │   └── ui/                    buttons, alerts, loading/empty/error states, form controls, icons
    ├── hooks/use-api-resource.ts  data loading with abort, retry and local updates
    ├── lib/                       Zod form schema, limits, formatting helpers
    ├── services/                  API client (fetch wrapper) and quiz endpoints
    └── types/quiz.ts              API types
```

**`app/` instead of `pages/`.** The task's suggested layout has `frontend/pages/`, which belongs
to the older Next.js Pages Router. This project uses the App Router, where routes live in
`frontend/app/`: each folder is a URL segment and its `page.tsx` is the page. So
`app/create/page.tsx` serves `/create`, `app/quizzes/page.tsx` serves `/quizzes` and
`app/quizzes/[id]/page.tsx` serves `/quizzes/:id`. `components/` and `services/` are kept as
suggested.

## Design decisions

- **Data model.** `Quiz` → `Question` → `Option`, linked with foreign keys and `ON DELETE
CASCADE`, so deleting a quiz removes everything that belongs to it in one statement.
  Type-specific answers are nullable columns (`correctBoolean`, `correctText`) on the question, and
  only checkbox questions have rows in `Option`. That keeps the schema small, readable and fully
  typed. A JSON column would lose type safety; one table per question type would complicate every
  query.
- **Explicit ordering.** Questions and options have an `order` column with a unique
  `(parent, order)` constraint, because PostgreSQL does not guarantee row order without
  `ORDER BY`. The order comes from the position in the request array, so clients cannot send gaps
  or duplicates. `Option.order` is a small addition to the suggested model for the same reason.
- **UUID primary keys**, so ids in URLs are not guessable or enumerable. Route ids are checked
  with a UUID pipe before reaching the database.
- **Column limits match the validation limits** (`VARCHAR(200)`, `VARCHAR(500)`), as a second line
  of defence behind the DTOs.
- **One transaction per quiz.** `POST /quizzes` is a single Prisma nested write, so a quiz is
  never stored half-created. It returns the same shape as `GET /quizzes/:id`.
- **Race-free 404 on delete.** `DELETE` uses `deleteMany({ where: { id } })` and returns 404 when
  nothing was deleted, with no separate "exists?" query.
- **Strict, type-aware validation.** Global `ValidationPipe` with `whitelist`,
  `forbidNonWhitelisted`, `transform` and `stopAtFirstError`. Custom decorators make each answer
  field required for its own question type and rejected for the others. Composite decorators fix
  the order of the rules, so each field reports its most relevant problem.
- **One error format.** A global exception filter formats validation errors, 404s, malformed JSON,
  oversized bodies, Prisma errors and unexpected errors in the same JSON shape, and never leaks
  stack traces.
- **Security basics.** CORS only allows the origins in `FRONTEND_URL` (methods `GET`, `POST`,
  `DELETE`), Helmet sets security headers, every input is validated and unknown fields are
  rejected. Prisma's query builder is used everywhere, with no raw SQL. JSON bodies are limited to
  512 KB, and configuration comes only from environment variables (the committed defaults are
  local development values). The frontend sends basic security headers too.
- **Frontend data flow.** Pages are small server components; interactive parts are client
  components that call the API through `services/` (a typed `fetch` wrapper that turns failures
  into an `ApiError`). The `useApiResource` hook handles loading, error and retry, and aborts
  stale requests.
- **Optimistic delete.** After confirmation the quiz disappears from the list at once. If the
  request fails it is put back at its position and an error is shown; a 404 counts as success,
  because the quiz is already gone. The result is announced to screen readers.
- **Form design.** React Hook Form with `useFieldArray` for questions and a nested
  `useFieldArray` for options, validated by Zod. Every question keeps the answer fields of all
  types, so switching the type does not lose what was typed. Only the selected type is validated
  and sent. The submit button and the form are disabled while saving, and the app then redirects
  to the new quiz.
- **Accessibility and responsiveness.** Every input has a label, errors are linked with
  `aria-describedby` and `aria-invalid`, groups use `fieldset`/`legend`, focus moves to the first
  invalid field, and there are a skip link and visible focus styles. Colours meet WCAG AA contrast.
  The layout is a single column that works from 320 px wide.
- **Versions.** NestJS 11 (its newest CommonJS line) works smoothly with Jest and `ts-jest`;
  NestJS 12 is ESM-only. Prisma 7 runs with the `pg` driver adapter and the CommonJS-friendly
  `prisma-client-js` generator. TypeScript is pinned to 5.9, the newest version supported by
  `typescript-eslint` and `ts-jest`. The backend uses ESLint 10; the frontend stays on ESLint 9
  because the React plugins in `eslint-config-next` do not support ESLint 10 yet.

## Possible improvements

- Edit quizzes (`PATCH /quizzes/:id`), reorder questions with drag and drop, duplicate a quiz.
- Pagination, search and sorting for `GET /quizzes`.
- Authentication and quiz ownership, then rate limiting (`@nestjs/throttler`).
- OpenAPI / Swagger documentation generated from the DTOs, and a shared package for the
  validation limits and API types (they are duplicated in `backend/src/quizzes/quizzes.constants.ts`
  and `frontend/lib/quiz-limits.ts`).
- More tests: end-to-end API tests against a real PostgreSQL (e.g. Testcontainers), frontend
  unit tests (Vitest + Testing Library) and browser tests (Playwright).
- A CI pipeline (lint, format check, type check, tests, builds) and Dockerfiles for the API and
  the web app, so the whole stack runs with one `docker compose up`.
- Database `CHECK` constraints that tie the answer columns to the question type.
- Server-side rendering of the quiz page (with the quiz title in the page metadata), an undo
  toast instead of the confirmation dialog, dark mode and translations.
- Moving to Prisma's ESM `prisma-client` generator together with an upgrade to NestJS 12.
