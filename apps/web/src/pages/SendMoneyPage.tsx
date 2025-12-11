import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export default function SendMoneyPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const remitMutation = useMutation({
    mutationFn: () => api.remit(parseInt(amount), counterparty),
    onSuccess: data => {
      setTxId(data.id);
      setSuccess(true);
      setNewBalance(data.totalMoney);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    remitMutation.mutate();
  };

  if (success) {
    return (
      <Layout title={t('sendMoney.title')} showBack>
        <div className="card text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            {t('sendMoney.success')}
          </h2>
            <div className="mt-6 text-left">
            <p className="text-sm text-gray-600">{t('sendMoney.receipt')}</p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{t('sendMoney.amount')}</span>
                <span className="font-bold">{t('common.rupees')}{amount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{t('sendMoney.counterparty')}</span>
                <span className="font-mono text-sm">{counterparty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('sendMoney.transactionId')}</span>
                <span className="font-mono text-xs">{txId.substring(0, 12)}...</span>
              </div>
              </div>
              {newBalance !== null && (
                <div className="flex justify-between mt-3">
                  <span className="text-gray-600">{t('home.balance')}</span>
                  <span className="font-bold">
                    {t('common.rupees')}{newBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
          </div>
          <button
            className="btn btn-primary w-full mt-6"
            onClick={() => {
              setSuccess(false);
              setAmount('');
              setCounterparty('');
                setNewBalance(null);
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('sendMoney.title')} showBack>
      <form onSubmit={handleSubmit} className="card">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('sendMoney.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500">
              {t('common.rupees')}
            </span>
            <input
              type="number"
              className="input pl-10"
              placeholder={t('sendMoney.amountPlaceholder')}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="1"
              max="50000"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('sendMoney.counterparty')}
          </label>
          <input
            type="tel"
            className="input"
            placeholder={t('sendMoney.counterpartyPlaceholder')}
            value={counterparty}
            onChange={e => setCounterparty(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={remitMutation.isPending}
        >
          {remitMutation.isPending ? t('common.loading') : t('sendMoney.send')}
        </button>

        {remitMutation.isError && (
          <p className="text-red-600 text-sm mt-4">
            {(remitMutation.error as Error).message}
          </p>
        )}
      </form>
    </Layout>
  );
}

