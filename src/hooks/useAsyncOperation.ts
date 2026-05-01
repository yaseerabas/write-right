import { useState, useCallback, useRef } from 'react';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  retryCount?: number;
}

export function useAsyncOperation<T = any>(options: UseAsyncOperationOptions = {}) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const operationRef = useRef<(() => Promise<T>) | null>(null);
  const retryCountRef = useRef(0);

  const execute = useCallback(async (operation: () => Promise<T>) => {
    operationRef.current = operation;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      retryCountRef.current = 0;
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      options.onError?.(errorMessage);
      throw error;
    }
  }, [options]);

  const retry = useCallback(async () => {
    if (operationRef.current && retryCountRef.current < (options.retryCount || 3)) {
      retryCountRef.current++;
      return execute(operationRef.current);
    }
    throw new Error('Maximum retry attempts reached');
  }, [execute, options.retryCount]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
    operationRef.current = null;
    retryCountRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: retryCountRef.current < (options.retryCount || 3)
  };
}