import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, isURL, Max, Min, validateSync } from 'class-validator';
import { parseAllowedOrigins } from './cors';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3001;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL!: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config);
  const problems = validateSync(env).flatMap((error) => Object.values(error.constraints ?? {}));

  if (typeof env.FRONTEND_URL === 'string') {
    const invalidOrigins = parseAllowedOrigins(env.FRONTEND_URL).filter(
      (origin) =>
        !isURL(origin, {
          require_tld: false,
          require_protocol: true,
          protocols: ['http', 'https'],
        }),
    );
    if (invalidOrigins.length > 0) {
      problems.push(`FRONTEND_URL contains invalid origins: ${invalidOrigins.join(', ')}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${problems.join('\n- ')}`);
  }
  return env;
}
