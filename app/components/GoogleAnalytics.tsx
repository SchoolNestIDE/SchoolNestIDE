// app/GoogleAnalytics.tsx

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const GoogleAnalytics = () => {
  const pathname = usePathname();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-3LZ78NQL76', {
          page_path: url,
        });
      }
    };

    if (typeof window !== 'undefined') {
      handleRouteChange(pathname);
    }
  }, [pathname]);

  return null; // This component doesn't render anything visible
};

export default GoogleAnalytics;
