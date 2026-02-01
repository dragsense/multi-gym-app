import { useTransition, useId } from 'react';
import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';

type ApiFunction<T = any, P = any> = (params: P) => Promise<T>;

export function useApiMutation<T = any, P = any>(
  mutationFn: ApiFunction<T, P>,
  options?: UseMutationOptions<T, Error, P>
): UseMutationResult<T, Error, P> & {
  reset: () => void;
  componentId: string;
  startTransition: (callback: () => void) => void;
} {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const mutation = useMutation<T, Error, P>({
    mutationFn: (params: P) => {
      return new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await mutationFn(params);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    },
    ...options,
  });

  return {
    ...mutation,
    componentId,
    startTransition,
    reset: () => mutation.reset(),
  };
}