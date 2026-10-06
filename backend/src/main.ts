import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { parseAllowedOrigins } from './config/cors';
import type { EnvironmentVariables } from './config/env.validation';

const JSON_BODY_LIMIT = '512kb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: parseAllowedOrigins(config.get('FRONTEND_URL', { infer: true })),
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  configureApp(app);
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`Quiz Builder API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
