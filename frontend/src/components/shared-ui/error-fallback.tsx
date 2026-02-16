import React, { useId, useMemo, useTransition } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { buildSentence } from '@/locales/translations';
import { Button } from '@/components/ui/button';

export const ErrorFallback = ({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t, direction } = useI18n();
  
  // React 19: Memoized error message for better performance
  const memoizedErrorMessage = useMemo(() => error.message, [error.message]);
  
  // React 19: Smooth error recovery
  const handleRetry = () => {
    startTransition(() => {
      resetErrorBoundary();
    });
  };

  return (
    <div data-component-id={componentId} className={`p-6 text-center ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      <h2 className="text-xl font-semibold mb-4">{buildSentence(t, 'something', 'went', 'wrong')}</h2>
      <p className="text-gray-600 mb-4">{memoizedErrorMessage}</p>
      <Button 
        onClick={handleRetry}
        className="px-4 py-2"
      >
        {buildSentence(t, 'try', 'again')}
      </Button>
    </div>
  );
};