import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export default function SafeSendPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [amount, setAmount] = useState('');
  const [goal, setGoal] = useState('school_fees');
  const [lockReason, setLockReason] = useState('');
  const [error, setError] = useState('');

  const { data: merchantsData } = useQuery({
    queryKey: ['merchants', { verified: true }],
    queryFn: () => api.getMerchants(undefined, true),
  });

  const { data: safeSendsData, isLoading: loadingSafeSends } = useQuery({
    queryKey: ['my-safesends'],
    queryFn: () => api.getMySafeSends(1, 20),
  });

  const createMutation = useMutation({
    mutationFn: ({ merchantId, amount, goal, lockReason }: any) =>
      api.createSafeSend(merchantId, amount, goal, lockReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-safesends'] });
      setView('list');
      setAmount('');
      setLockReason('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create SafeSend');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!selectedMerchantId) {
      setError('Please select a merchant');
      return;
    }

    createMutation.mutate({
      merchantId: selectedMerchantId,
      amount: amountNum,
      goal,
      lockReason: lockReason || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      awaiting_proof: { text: 'Awaiting Proof', className: 'bg-blue-100 text-blue-800' },
      under_review: { text: 'Under Review', className: 'bg-purple-100 text-purple-800' },
      released: { text: 'Released', className: 'bg-green-100 text-green-800' },
      refunded: { text: 'Refunded', className: 'bg-gray-100 text-gray-800' },
      rejected: { text: 'Rejected', className: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getGoalLabel = (goalKey: string) => {
    const goals: Record<string, string> = {
      school_fees: 'School Fees',
      groceries: 'Groceries',
      rent: 'Rent',
      medical: 'Medical',
      utilities: 'Utilities',
      other: 'Other',
    };
    return goals[goalKey] || goalKey;
  };

  if (view === 'create') {
    return (
      <Layout title="Create SafeSend">
        <button onClick={() => setView('list')} className="btn-secondary mb-4">
          ← Back to List
        </button>

        <form onSubmit={handleCreate} className="card space-y-4">
          <h2 className="text-xl font-bold">Send Money Safely</h2>
          <p className="text-sm text-gray-600">
            Lock funds for a specific purpose. Money is only released when merchant provides proof.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Merchant
            </label>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">-- Choose Merchant --</option>
              {merchantsData?.merchants.map((merchant) => (
                <option key={merchant._id} value={merchant._id}>
                  {merchant.name} - {merchant.category}
                </option>
              ))}
            </select>
            {merchantsData?.merchants.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ No verified merchants available yet
                </p>
                <p className="text-sm text-yellow-800 mb-2">
                  Merchants must be <strong>verified</strong> before they can receive SafeSend payments.
                </p>
                <p className="text-sm text-yellow-800">
                  If you've created a merchant, go to the{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="underline font-medium hover:text-yellow-900"
                  >
                    Admin Panel
                  </button>
                  {' '}and click the <strong>"Verify"</strong> button next to the merchant.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="school_fees">School Fees</option>
              <option value="groceries">Groceries</option>
              <option value="rent">Rent</option>
              <option value="medical">Medical</option>
              <option value="utilities">Utilities</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder="Additional notes about this payment..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create SafeSend'}
          </button>
        </form>
      </Layout>
    );
  }

  return (
    <Layout title="SafeSend">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Your SafeSend Transfers</h2>
        <button onClick={() => setView('create')} className="btn-primary">
          + New SafeSend
        </button>
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-1">What is SafeSend?</h3>
        <p className="text-sm text-blue-800">
          SafeSend locks your money for a specific purpose (school fees, groceries, etc.). 
          The merchant can only receive funds after submitting proof of purchase. 
          If proof is rejected or not submitted, you can get a refund.
        </p>
      </div>

      {loadingSafeSends ? (
        <div className="text-center py-8">Loading...</div>
      ) : !safeSendsData?.escrows.length ? (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">No SafeSend transfers yet</p>
          <button onClick={() => setView('create')} className="btn-primary">
            Create Your First SafeSend
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {safeSendsData.escrows.map((escrow) => (
            <div
              key={escrow._id}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/safesend/${escrow._id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-lg">₹{escrow.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{getGoalLabel(escrow.goal)}</p>
                </div>
                {getStatusBadge(escrow.status)}
              </div>
              <p className="text-xs text-gray-500">
                Created: {new Date(escrow.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button onClick={() => navigate('/')} className="btn-secondary w-full">
          Back to Home
        </button>
      </div>
    </Layout>
  );
}

