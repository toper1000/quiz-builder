'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/state-panels';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="An unexpected error occurred while showing this page."
      onRetry={reset}
    />
  );
}
