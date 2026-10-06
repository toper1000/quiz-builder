import type { CreateQuizPayload, QuizDetails, QuizSummary } from '@/types/quiz';
import { apiRequest } from './api-client';

export function getQuizzes(signal?: AbortSignal): Promise<QuizSummary[]> {
  return apiRequest<QuizSummary[]>('/quizzes', { signal });
}

export function getQuiz(id: string, signal?: AbortSignal): Promise<QuizDetails> {
  return apiRequest<QuizDetails>(`/quizzes/${encodeURIComponent(id)}`, { signal });
}

export function createQuiz(payload: CreateQuizPayload): Promise<QuizDetails> {
  return apiRequest<QuizDetails>('/quizzes', { method: 'POST', body: payload });
}

export function deleteQuiz(id: string): Promise<void> {
  return apiRequest<void>(`/quizzes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
