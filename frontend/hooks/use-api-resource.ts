'use client';

import { useCallback, useEffect, useState } from 'react';

export type ResourceState<T> =
  { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'success'; data: T };

/**
 * Loads data when the component mounts and whenever `load` changes; stale requests are aborted.
 * `load` must be stable: a module-level function or a function wrapped in useCallback.
 */
export function useApiResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', error });
        }
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  const mutate = useCallback((update: (data: T) => T) => {
    setState((current) =>
      current.status === 'success' ? { status: 'success', data: update(current.data) } : current,
    );
  }, []);

  return { state, retry, mutate };
}
