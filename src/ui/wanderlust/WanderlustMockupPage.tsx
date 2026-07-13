import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@/localization/useTranslation';

const getMockupPath = (): string => {
  const basePath = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalizedBase}wanderlust-mockup.html`;
};

export const WanderlustMockupPage = () => {
  const { t } = useTranslation('wanderlust');
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupUrl = useMemo(() => getMockupPath(), []);

  useEffect(() => {
    // Carica il contenuto HTML del file wanderlust-mockup.html
    const loadMockup = async () => {
      try {
        const response = await fetch(mockupUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(
            `Failed to load wanderlust mockup from ${mockupUrl}: ${response.status} ${response.statusText}`
          );
        }
        
        const htmlContent = await response.text();
        
        if (containerRef.current) {
          containerRef.current.innerHTML = htmlContent;
          
          // Esegui eventuali script presenti nell'HTML
          const scripts = containerRef.current.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
              newScript.src = script.src;
            } else {
              newScript.textContent = script.textContent;
            }
            document.head.appendChild(newScript);
          });
        }
      } catch (error) {
        console.error('Error loading wanderlust mockup:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-screen bg-black text-amber-100">
              <div class="text-center">
                <h2 class="text-2xl font-bold mb-4">${t('wanderlust:mockup.title')}</h2>
                <p class="text-amber-200">${t('wanderlust:mockup.error')}</p>
                <p class="text-sm text-amber-300 mt-2">${t('wanderlust:mockup.help')}</p>
              </div>
            </div>
          `;
        }
      }
    };

    loadMockup();
  }, [mockupUrl, t]);

  return (
    <div className="w-full h-full overflow-hidden">
      <div 
        ref={containerRef}
        className="w-full h-full"
        data-testid="wanderlust-mockup-container"
      />
    </div>
  );
};
