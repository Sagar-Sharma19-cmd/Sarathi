import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number;
}

export function Layout({
  children,
  title,
  showBack,
  backgroundImageUrl,
  backgroundOverlayOpacity = 0.9,
}: LayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hasBackground = Boolean(backgroundImageUrl);
  const overlayAlpha = Math.min(Math.max(backgroundOverlayOpacity, 0), 1);
  const containerStyle = hasBackground
    ? {
        backgroundImage: `linear-gradient(rgba(255,255,255,${overlayAlpha}), rgba(255,255,255,${overlayAlpha})), url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : undefined;
  const containerClassName = `min-h-screen relative pb-16 ${hasBackground ? 'bg-cover bg-center bg-no-repeat' : 'bg-cyan-100'}`;
  const headerClassName = hasBackground
    ? 'bg-sky-200 text-gray-900 border-b border-sky-300 shadow-sm'
    : 'bg-sky-200 text-gray-900 border-b border-sky-300 shadow-sm';
  const backButtonHoverClass = 'hover:bg-white/60 text-gray-900';
  const mainClassName = `max-w-4xl mx-auto px-4 py-6 ${hasBackground ? 'bg-white/90 rounded-2xl shadow-lg mt-6 backdrop-blur-sm' : ''}`;

  return (
    <div className={containerClassName} style={containerStyle}>
      {!hasBackground && null}
      <header className={`${headerClassName} sticky top-0 z-20 backdrop-blur bg-opacity-95 bg-sky-200/95`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className={`mr-3 p-2 rounded-lg transition-colors ${backButtonHoverClass}`}
            >
              ← {t('common.back')}
            </button>
          )}
          <h1 className="text-xl font-semibold tracking-tight brand-wordmark">{title || t('app.name')}</h1>
        </div>
      </header>
      <main className={`${mainClassName} animate-fade-in`}>{children}</main>
    </div>
  );
}

