import { useEffect, useRef } from 'react';

export default function CarbonAd() {
  const serveId = import.meta.env.VITE_CARBON_ADS_SERVE as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serveId || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = `//cdn.carbonads.com/carbon.js?serve=${serveId}&placement=httphaiku`;
    script.async = true;
    script.id = '_carbonads_js';
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  if (!serveId) return null;

  return <div ref={containerRef} className="carbon-ad" />;
}
