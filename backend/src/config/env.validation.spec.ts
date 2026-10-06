import { parseAllowedOrigins } from './cors';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://quiz:quiz@localhost:5432/quiz_builder',
    FRONTEND_URL: 'http://localhost:3000',
  };

  it('converts PORT to a number and defaults it to 3001', () => {
    expect(validateEnv({ ...validEnv, PORT: '4000' }).PORT).toBe(4000);
    expect(validateEnv(validEnv).PORT).toBe(3001);
  });

  it('fails fast when required variables are missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL[\s\S]*FRONTEND_URL/);
  });

  it('rejects invalid CORS origins', () => {
    expect(() => validateEnv({ ...validEnv, FRONTEND_URL: 'localhost:3000' })).toThrow(
      'FRONTEND_URL contains invalid origins: localhost:3000',
    );
  });
});

describe('parseAllowedOrigins', () => {
  it('splits, trims and removes trailing slashes', () => {
    expect(parseAllowedOrigins(' http://localhost:3000/ , https://quiz.example.com,')).toEqual([
      'http://localhost:3000',
      'https://quiz.example.com',
    ]);
  });
});
