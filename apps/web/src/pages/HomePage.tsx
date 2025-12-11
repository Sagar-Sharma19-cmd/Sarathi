import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

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
        <div className="text-center py-20">{t('common.loading')}</div>
      </Layout>
    );
  }

  const tiles = [
    { number: 1, label: t('home.tiles.sendMoney'), path: '/send-money' },
    { number: 2, label: t('home.tiles.creditScore'), path: '/score' },
    { number: 3, label: t('home.tiles.loan'), path: '/loan', badge: data?.activeLoan ? '!' : null },
    { number: 4, label: 'SafeSend', path: '/safesend' },
    { number: 5, label: t('home.tiles.transactions'), path: '/transactions' },
    { number: 6, label: t('home.tiles.changeState'), path: '/settings' },
    { number: 7, label: t('home.tiles.help'), path: '/admin' },
    { number: 8, label: i18n.language === 'hi' ? 'AI सहायक 🤖' : 'AI Assistant 🤖', path: '/chat', special: 'ai' },
  ];

  console.log('Total tiles:', tiles.length, 'Tiles:', tiles);

  const riskColors: Record<string, string> = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50',
  };

  return (
    <Layout title={t('app.name')}>
      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('home.welcome', { name: data?.user.sarathiId.substring(0, 8) })}
          </h2>
          <p className="text-gray-600">{t('home.sarathiId', { id: data?.user.sarathiId })}</p>
        </div>

        {typeof data?.user.totalMoney === 'number' && (
          <div className="card">
            <p className="text-sm text-gray-600">{t('home.balance')}</p>
            <p className="text-3xl font-bold text-primary-600">
              {t('common.rupees')}
              {data.user.totalMoney.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        )}

        {data?.latestScore && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('score.title')}</p>
                <p className="text-3xl font-bold text-primary-600">
                  {data.latestScore.score}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{t('score.band', { band: data.latestScore.band })}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        {tiles.map(tile => (
          <div
            key={tile.number}
            className={`tile relative ${tile.special === 'ai' ? '' : ''}`}
            onClick={() => navigate(tile.path)}
          >
            {tile.badge && (
              <span className="absolute top-3 right-3 badge">{tile.badge}</span>
            )}
            <div className="tile-number">{tile.number}</div>
            <div className="tile-label">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('home.transactions.title')}</h3>
          <button
            className="text-primary-600 text-sm font-semibold"
            onClick={() => navigate('/transactions')}
          >
            {t('home.transactions.viewAll')}
          </button>
        </div>

        {data?.user.transactionHistory && data.user.transactionHistory.length > 0 ? (
          <ul className="space-y-3">
            {data.user.transactionHistory.slice(0, 5).map((entry, index) => {
              const isDebit = entry.type === 'debit';
              const riskColor = riskColors[entry.riskLevel] || 'text-gray-600 bg-gray-100';

              return (
                <li
                  key={`${entry.transactionId || entry.transactionType}-${entry.timestamp}-${index}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.description || t('home.transactions.unknown')}
                    </p>
                    {entry.counterparty && (
                      <p className="text-xs text-gray-500">
                        {t('home.transactions.counterparty', { value: entry.counterparty })}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                      {isDebit ? '-' : '+'}
                      {t('common.rupees')}
                      {entry.amount.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor}`}>
                      {t(`home.transactions.risk.${entry.riskLevel}`)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">{t('home.transactions.empty')}</p>
        )}
      </div>
    </Layout>
  );
}

