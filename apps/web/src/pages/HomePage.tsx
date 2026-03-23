import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';
import { motion } from 'framer-motion';
import { Send, TrendingUp, Landmark, ShieldCheck, History, Settings, HelpCircle, Bot, ChevronRight, Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

// HomePage with AI Assistant tile #8
export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center -mt-20">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"
          />
        </div>
      </Layout>
    );
  }

  const tiles = [
    { number: 1, label: t('home.tiles.sendMoney'), path: '/send-money', icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
    { number: 2, label: t('home.tiles.creditScore'), path: '/score', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { number: 3, label: t('home.tiles.loan'), path: '/loan', badge: data?.activeLoan ? '!' : null, icon: Landmark, color: 'text-violet-600', bg: 'bg-violet-100' },
    { number: 4, label: 'SafeSend', path: '/safesend', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { number: 5, label: t('home.tiles.transactions'), path: '/transactions', icon: History, color: 'text-rose-600', bg: 'bg-rose-100' },
    { number: 6, label: t('home.tiles.changeState'), path: '/settings', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100' },
    { number: 7, label: t('home.tiles.help'), path: '/admin', icon: HelpCircle, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { number: 8, label: i18n.language === 'hi' ? 'AI सहायक' : 'AI Assistant', path: '/chat', special: 'ai', icon: Bot, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  const riskColors: Record<string, string> = {
    low: 'text-green-700 bg-green-100',
    medium: 'text-yellow-700 bg-yellow-100',
    high: 'text-red-700 bg-red-100',
  };

  return (
    <Layout title={t('app.name')} backgroundImageUrl="/background.png" backgroundOverlayOpacity={0.96}>
      <div className="mb-8 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
              {t('home.welcome', { name: data?.user.name ? data.user.name : data?.user.sarathiId.substring(0, 8) })}
            </h2>
            <p className="text-gray-500 font-medium text-xs sm:text-sm mt-1 truncate">{t('home.sarathiId', { id: data?.user.sarathiId })}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer flex-shrink-0"
            onClick={() => navigate('/settings')}
          >
            {data?.user.name ? data.user.name.substring(0, 2).toUpperCase() : data?.user.sarathiId.substring(0, 2).toUpperCase()}
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typeof data?.user.totalMoney === 'number' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl bg-gradient-to-br from-primary-800 to-primary-600 text-white p-6 shadow-xl relative overflow-hidden ring-1 ring-white/20"
            >
              <div className="absolute opacity-10 top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <Activity size={180} />
              </div>
              <p className="text-primary-100 text-sm font-bold mb-2 uppercase tracking-wider">{t('home.balance')}</p>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-sm">
                <span className="text-primary-300 font-medium mr-1">{t('common.rupees')}</span>
                {data.user.totalMoney.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/send-money')}
                  className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl py-2.5 font-semibold text-white flex items-center justify-center gap-2 transition-colors border border-white/10"
                >
                  <ArrowUpRight size={18} /> Send
                </button>
                <button 
                  onClick={() => navigate('/loan')}
                  className="flex-1 bg-white hover:bg-gray-50 rounded-xl py-2.5 font-bold text-primary-700 flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <ArrowDownLeft size={18} /> Receive
                </button>
              </div>
            </motion.div>
          )}

          {data?.latestScore && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.4, delay: 0.15 }}
              onClick={() => navigate('/score')}
              className="rounded-3xl bg-white p-6 shadow-lg border-b-4 border-b-emerald-500 cursor-pointer relative overflow-hidden group hover:shadow-xl transition-all"
            >
              <div className="absolute -right-6 -bottom-6 text-emerald-50 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                <TrendingUp size={140} strokeWidth={1} />
              </div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">{t('score.title')}</p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <p className="text-5xl font-black text-gray-900 drop-shadow-sm">
                      {data.latestScore.score}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg text-sm">
                    <ShieldCheck size={16} />
                    {t('score.band', { band: data.latestScore.band })}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl shadow-inner group-hover:bg-emerald-50 transition-colors">
                  <TrendingUp className="text-emerald-500 transform group-hover:-translate-y-1 transition-transform" size={32} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-4 gap-y-8 gap-x-2 sm:gap-x-4">
          {tiles.map((tile, index) => {
            const Icon = tile.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + (index * 0.05) }}
                key={tile.number}
                className="flex flex-col items-center gap-3 cursor-pointer group"
                onClick={() => navigate(tile.path)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`relative flex items-center justify-center w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl ${tile.bg} shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-black/5`}>
                  {tile.badge && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-xs text-white items-center justify-center font-bold border-2 border-white shadow-sm">
                        {tile.badge}
                      </span>
                    </span>
                  )}
                  <Icon className={`${tile.color} transform group-hover:scale-110 transition-transform duration-300`} size={28} strokeWidth={2} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600 text-center leading-tight group-hover:text-gray-900 transition-colors max-w-[80px]">
                  {tile.label.replace(' 🤖', '')}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-3xl bg-white border border-gray-100 shadow-xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600"></div>
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">{t('home.transactions.title')}</h3>
            <button
              className="flex items-center text-primary-600 text-sm font-bold group hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full transition-colors"
              onClick={() => navigate('/transactions')}
            >
              {t('home.transactions.viewAll')}
              <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {data?.user.transactionHistory && data.user.transactionHistory.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {data.user.transactionHistory.slice(0, 5).map((entry, index) => {
              const isDebit = entry.type === 'debit';
              const riskColor = riskColors[entry.riskLevel] || 'text-gray-700 bg-gray-100';

              return (
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + (0.05 * index) }}
                  key={`${entry.transactionId || entry.transactionType}-${entry.timestamp}-${index}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50/80 transition-colors cursor-pointer"
                  onClick={() => navigate('/transactions')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${isDebit ? 'bg-red-50 text-red-500 ring-1 ring-red-100' : 'bg-green-50 text-green-500 ring-1 ring-green-100'}`}>
                      {isDebit ? <ArrowUpRight size={22} strokeWidth={2.5} /> : <ArrowDownLeft size={22} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base leading-tight">
                        {entry.description || t('home.transactions.unknown')}
                      </p>
                      <div className="flex items-center mt-1 gap-2">
                        {entry.counterparty && (
                          <span className="text-sm font-medium text-gray-500">
                            {entry.counterparty}
                          </span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-xs font-semibold text-gray-400">
                          {new Intl.DateTimeFormat('en-IN', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          }).format(new Date(entry.timestamp))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`font-black text-lg ${isDebit ? 'text-gray-900' : 'text-green-600'}`}>
                      {isDebit ? '-' : '+'}
                      {t('common.rupees')}
                      {entry.amount.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${riskColor}`}>
                      {t(`home.transactions.risk.${entry.riskLevel}`)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <History size={32} />
            </div>
            <p className="text-base font-semibold text-gray-600">{t('home.transactions.empty')}</p>
            <p className="text-sm text-gray-400 mt-1">Make your first transaction to see it here</p>
            <button 
              onClick={() => navigate('/send-money')}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold shadow-sm transition-colors text-sm"
            >
              Send Money Now
            </button>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}

