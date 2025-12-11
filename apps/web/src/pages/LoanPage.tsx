import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export default function LoanPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [decision, setDecision] = useState<{
    decision: 'approved' | 'rejected';
    band: string;
    offer?: {
      loanId: string;
      amount: number;
      apr: number;
      termDays: number;
      estimatedEMI: number;
      dueDate: Date;
    };
  } | null>(null);

  const { data: activeLoanData } = useQuery({
    queryKey: ['activeLoan'],
    queryFn: api.getActiveLoan,
  });

  const requestMutation = useMutation({
    mutationFn: (amt: number) => api.requestLoan(amt),
    onSuccess: data => {
      setDecision(data);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (loanId: string) => api.acceptLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLoan'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setDecision(null);
      setAmount('');
    },
  });

  const [repayAmount, setRepayAmount] = useState('');
  const repayMutation = useMutation({
    mutationFn: () =>
      api.repayLoan(activeLoanData!.activeLoan!.loanId, parseInt(repayAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLoan'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setRepayAmount('');
      alert(t('loan.repaymentSuccess'));
    },
  });

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    requestMutation.mutate(parseInt(amount));
  };

  // Show active loan if exists
  if (activeLoanData?.activeLoan) {
    const loan = activeLoanData.activeLoan;
    return (
      <Layout title={t('loan.title')} showBack>
        <div className="card">
          <h2 className="text-xl font-bold mb-4">{t('loan.activeLoan')}</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.principal')}</span>
              <span className="font-bold">{t('common.rupees')}{loan.principal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.totalRepayment')}</span>
              <span className="font-bold">{t('common.rupees')}{loan.totalDue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.remaining')}</span>
              <span className="font-bold text-primary-600">
                {t('common.rupees')}{loan.remaining}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.term')}</span>
              <span>{loan.termDays} {t('loan.days')}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('loan.repaymentAmount')}
            </label>
            <input
              type="number"
              className="input mb-4"
              placeholder="0"
              value={repayAmount}
              onChange={e => setRepayAmount(e.target.value)}
              max={loan.remaining}
            />
            <button
              className="btn btn-primary w-full"
              onClick={() => repayMutation.mutate()}
              disabled={!repayAmount || repayMutation.isPending}
            >
              {repayMutation.isPending ? t('common.loading') : t('loan.makeRepayment')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show decision result if exists
  if (decision) {
    if (decision.decision === 'rejected') {
      return (
        <Layout title={t('loan.title')} showBack>
          <div className="card text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">{t('loan.rejected')}</h2>
            <p className="text-gray-600 mb-6">Band: {decision.band}</p>
            <button
              className="btn btn-secondary w-full"
              onClick={() => {
                setDecision(null);
                setAmount('');
              }}
            >
              {t('common.back')}
            </button>
          </div>
        </Layout>
      );
    }

    return (
      <Layout title={t('loan.title')} showBack>
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600">{t('loan.approved')}</h2>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.amount')}</span>
              <span className="font-bold">{t('common.rupees')}{decision.offer!.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.interest')}</span>
              <span>{decision.offer!.apr}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.term')}</span>
              <span>{decision.offer!.termDays} {t('loan.days')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('loan.totalRepayment')}</span>
              <span className="font-bold text-primary-600">
                {t('common.rupees')}{decision.offer!.estimatedEMI}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={() => acceptMutation.mutate(decision.offer!.loanId)}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? t('common.loading') : t('loan.acceptOffer')}
          </button>
        </div>
      </Layout>
    );
  }

  // Show loan request form
  return (
    <Layout title={t('loan.title')} showBack>
      <form onSubmit={handleRequest} className="card">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('loan.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500">
              {t('common.rupees')}
            </span>
            <input
              type="number"
              className="input pl-10"
              placeholder={t('loan.amountPlaceholder')}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              min="1000"
              max="5000"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={requestMutation.isPending}
        >
          {requestMutation.isPending ? t('common.loading') : t('loan.checkEligibility')}
        </button>

        {requestMutation.isError && (
          <p className="text-red-600 text-sm mt-4">
            {(requestMutation.error as Error).message}
          </p>
        )}
      </form>
    </Layout>
  );
}

