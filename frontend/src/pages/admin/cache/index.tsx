import { useEffect, useRef, useState } from 'react';
import { PageInnerLayout } from '@/layouts';
import { fetchCacheMonitorUrl } from '@/services/cache.api';
import { useApiQuery } from '@/hooks/use-api-query';
import type { CacheMonitorResponse } from '@shared/types/monitor.types';

export default function CachePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [monitorUrl, setMonitorUrl] = useState<string>('');

  const { data: monitorData, isLoading, error } = useApiQuery<CacheMonitorResponse>(
    ['cache-monitor-url'],
    fetchCacheMonitorUrl,
    {}
  );

  useEffect(() => {
    if (monitorData?.url) {
      setMonitorUrl(monitorData.url);
    }
  }, [monitorData]);

  if (isLoading) {
    return (
      <PageInnerLayout Header={<Header />}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cache monitor...</p>
          </div>
        </div>
      </PageInnerLayout>
    );
  }

  if (error) {
    return (
      <PageInnerLayout Header={<Header />}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load cache monitor</p>
            <p className="text-gray-600">Please check your configuration</p>
          </div>
        </div>
      </PageInnerLayout>
    );
  }

  return (
    <PageInnerLayout Header={<Header />}>
      <div className="h-full">
        <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
          {monitorUrl && (
            <iframe
              ref={iframeRef}
              src={monitorUrl}
              className="w-full h-full border-0"
              title="Dragonfly Cache Monitor"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            />
          )}
        </div>
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;
