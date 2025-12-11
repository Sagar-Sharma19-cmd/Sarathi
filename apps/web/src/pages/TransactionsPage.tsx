import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => api.getTransactions(page),
  });

  if (isLoading) {
    return (
      <Layout title={t('transactions.title')} showBack>
        <div className="text-center py-20">{t('common.loading')}</div>
      </Layout>
    );
  }

  if (!data?.transactions.length) {
    return (
      <Layout title={t('transactions.title')} showBack>
        <div className="card text-center">
          <p className="text-gray-600">{t('transactions.empty')}</p>
        </div>
      </Layout>
    );
  }

  const typeLabels: Record<string, string> = {
    remit: 'transactions.type.remit',
    repay: 'transactions.type.repay',
    loan_disbursal: 'transactions.type.loan_disbursal',
    safesend_escrow: 'transactions.type.safesend_escrow',
    safesend_release: 'transactions.type.safesend_release',
    safesend_refund: 'transactions.type.safesend_refund',
  };

  const statusColors: Record<string, string> = {
    success: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    pending: 'text-yellow-600 bg-yellow-50',
  };

  return (
    <Layout title={t('transactions.title')} showBack>
      <div className="space-y-3">
        {data.transactions.map(tx => (
          <div key={tx.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-lg">
                  {t('common.rupees')}{tx.amount}
                </p>
                <p className="text-sm text-gray-600">{t(typeLabels[tx.type] ?? tx.type)}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  statusColors[tx.status]
                }`}
              >
                {t(`transactions.status.${tx.status}`)}
              </span>
            </div>
            {tx.counterparty && (
              <p className="text-sm text-gray-500 mb-1">To: {tx.counterparty}</p>
            )}
            <p className="text-xs text-gray-400">
              {new Date(tx.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            className="btn btn-secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← {t('common.back')}
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.pagination.totalPages}
          >
            {t('common.next')} →
          </button>
        </div>
      )}
    </Layout>
  );
}

