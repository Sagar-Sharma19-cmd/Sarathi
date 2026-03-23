import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, ArrowLeft, Bell } from 'lucide-react';

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
  const { logout } = useAuth();

  const hasBackground = Boolean(backgroundImageUrl);
  const overlayAlpha = Math.min(Math.max(backgroundOverlayOpacity, 0), 1);
  const containerStyle = hasBackground
    ? {
        backgroundImage: `linear-gradient(rgba(240,249,255,${overlayAlpha}), rgba(240,249,255,${overlayAlpha})), url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : undefined;
    
  const containerClassName = `min-h-screen relative pb-16 ${hasBackground ? 'bg-cover bg-center' : 'bg-slate-50'}`;
  const headerClassName = 'bg-white/70 text-gray-900 border-b border-white/50 shadow-sm backdrop-blur-md';
  const mainClassName = `max-w-4xl mx-auto px-4 py-8 ${hasBackground ? 'bg-white/40 ring-1 ring-white/60 rounded-3xl shadow-2xl mt-6 backdrop-blur-xl' : ''}`;

  return (
    <div className={containerClassName} style={containerStyle}>
      <header className={`${headerClassName} sticky top-0 z-50 transition-all duration-300`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {showBack && (
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="p-2 rounded-full transition-colors text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft size={22} strokeWidth={2.5} />
              </motion.button>
            )}
            
            {!showBack && (
              <motion.div 
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-white p-1"
              >
                <img src="/logo.png" alt="Sarathi Logo" className="w-full h-full object-contain" />
              </motion.div>
            )}
            
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-orange-500">
              {title || 'Sarathi'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full text-gray-600 hover:text-primary-600 transition-colors relative"
            >
              <Bell size={20} strokeWidth={2.5} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </motion.button>
            
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              title="Logout"
              className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`${mainClassName} pb-20`}
      >
        {children}
      </motion.main>
    </div>
  );
}

