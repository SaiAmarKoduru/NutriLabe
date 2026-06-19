'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      data?: { [key: string]: any }
    ) => void;
  }
}

export const usePageTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_search: searchParams?.toString(),
      });
    }
  }, [pathname, searchParams]);
};
