import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // An empty URL keeps `prisma generate` (run on `npm install`) working before .env exists.
    // Commands that talk to the database report a clear error in that case.
    url: process.env.DATABASE_URL ?? '',
  },
});
