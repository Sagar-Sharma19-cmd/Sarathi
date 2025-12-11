import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

const reasonCodeLabels: Record<string, string> = {
  R1_REM_HISTORY: 'score.goodHistory',
  R2_STABILITY: 'score.stability',
  R3_FIRST_TIMER: 'score.firstLoan',
  R4_DEFAULT_RISK: 'score.defaultRisk',
  R5_COUNTERPARTY_STABILITY: 'score.counterparty',
  R6_TIMELY_REPAY: 'score.timelyRepay',
  R7_BALANCE_STABILITY: 'score.balanceStability',
  R8_LOW_RISK_ACTIVITY: 'score.lowRiskActivity',
  R9_DELAYED_REPAY: 'score.delayedRepay',
  R10_OVERDRAFT_RISK: 'score.overdraftRisk',
  R11_HIGH_RISK_ACTIVITY: 'score.highRiskActivity',
};

export default function ScorePage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['score'],
    queryFn: api.getScore,
  });

  if (isLoading) {
    return (
      <Layout title={t('score.title')} showBack>
        <div className="text-center py-20">{t('common.loading')}</div>
      </Layout>
    );
  }

  const bandColors: Record<string, string> = {
    A: 'text-green-600 bg-green-50',
    B: 'text-yellow-600 bg-yellow-50',
    C: 'text-red-600 bg-red-50',
  };

  return (
    <Layout title={t('score.title')} showBack>
      <div className="card text-center mb-6">
        <p className="text-gray-600 mb-2">{t('score.yourScore')}</p>
        <div className="text-6xl font-bold text-primary-600 mb-4">
          {data?.current.score}
        </div>
        <div
          className={`inline-block px-6 py-2 rounded-full font-bold ${
            bandColors[data?.current.band || 'C']
          }`}
        >
          {t('score.band', { band: data?.current.band })}
        </div>
      </div>

      {data?.current.reasonCodes && data.current.reasonCodes.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-bold mb-4">{t('score.reasons')}</h3>
          <ul className="space-y-2">
            {data.current.reasonCodes.slice(0, 3).map(code => (
              <li key={code} className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span className="text-gray-700">{t(reasonCodeLabels[code] || code)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data?.history && data.history.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">{t('score.history')}</h3>
          <div className="space-y-3">
            {data.history.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b">
                <div>
                  <span className="font-bold">{item.score}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({item.band})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

