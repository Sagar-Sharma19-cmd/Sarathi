import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export default function AdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [months, setMonths] = useState('6');
  const [amount, setAmount] = useState('2500');
  const [counterparty, setCounterparty] = useState('+919999999999');

  // Merchant form
  const [merchantName, setMerchantName] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('');
  const [merchantState, setMerchantState] = useState('DL');
  const [showMerchantForm, setShowMerchantForm] = useState(false);

  const { data: merchantsData } = useQuery({
    queryKey: ['all-merchants'],
    queryFn: () => api.getMerchants(),
  });

  const { data: pendingProofsData } = useQuery({
    queryKey: ['pending-proofs'],
    queryFn: () => api.getPendingProofs(1, 10),
  });

  const seedMutation = useMutation({
    mutationFn: () =>
      api.seedData(parseInt(months), parseInt(amount), counterparty),
    onSuccess: data => {
      alert(
        `${t('admin.seedSuccess')}\nScore: ${data.score.score} (${data.score.band})`
      );
    },
  });

  const createMerchantMutation = useMutation({
    mutationFn: () =>
      api.createMerchant(merchantName, merchantPhone, merchantCategory, merchantState),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-merchants'] });
      setMerchantName('');
      setMerchantPhone('');
      setMerchantCategory('');
      setShowMerchantForm(false);
      alert('✅ Merchant created successfully!\n\n⚠️ Don\'t forget to click the "Verify" button to make this merchant available in SafeSend.');
    },
    onError: (err: any) => {
      if (err.statusCode === 403) {
        alert('Access denied: You need admin privileges to create merchants.\n\nPlease contact an administrator to grant you admin access.');
      } else if (err.statusCode === 401) {
        alert('Your session has expired. You will be redirected to login.');
      } else {
        alert(`Failed to create merchant: ${err.message || 'Unknown error'}`);
      }
    },
  });

  const verifyMerchantMutation = useMutation({
    mutationFn: (merchantId: string) => api.verifyMerchant(merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-merchants'] });
      alert('Merchant verified successfully!');
    },
  });

  const reviewProofMutation = useMutation({
    mutationFn: ({ proofId, approved, rejectionReason }: any) =>
      api.reviewProof(proofId, approved, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-proofs'] });
      alert('Proof reviewed successfully!');
    },
    onError: (err: any) => {
      alert(`Failed to review proof: ${err.message || 'Unknown error'}`);
    },
  });

  return (
    <Layout title={t('admin.title')} showBack>
      {/* Seed Data Section */}
      <div className="card mb-4">
        <h2 className="text-xl font-bold mb-4">{t('admin.seedData')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.months')}
            </label>
            <input
              type="number"
              className="input"
              value={months}
              onChange={e => setMonths(e.target.value)}
              min="1"
              max="12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.amount')}
            </label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sendMoney.counterparty')}
            </label>
            <input
              type="tel"
              className="input"
              value={counterparty}
              onChange={e => setCounterparty(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? t('common.loading') : t('admin.seed')}
          </button>

          {seedMutation.isError && (
            <p className="text-red-600 text-sm">
              {(seedMutation.error as Error).message}
            </p>
          )}
        </div>
      </div>

      {/* Merchant Management */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Manage Merchants</h2>
            <p className="text-xs text-gray-600 mt-1">Create and verify merchants for SafeSend</p>
          </div>
          <button
            onClick={() => setShowMerchantForm(!showMerchantForm)}
            className="btn-secondary text-sm"
          >
            {showMerchantForm ? 'Cancel' : '+ Add Merchant'}
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> After creating a merchant, click the <strong>"Verify"</strong> button 
            to make them available for SafeSend payments. Only verified merchants appear in the SafeSend feature.
          </p>
        </div>

        {showMerchantForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Merchant Name *</label>
              <input
                type="text"
                placeholder="e.g., ABC School"
                value={merchantName}
                onChange={e => setMerchantName(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={merchantPhone}
                onChange={e => setMerchantPhone(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                placeholder="e.g., School, Grocery, Medical"
                value={merchantCategory}
                onChange={e => setMerchantCategory(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State Code (2 letters) *</label>
              <input
                type="text"
                placeholder="e.g., DL, MH, KA"
                value={merchantState}
                onChange={e => setMerchantState(e.target.value.toUpperCase())}
                className="input w-full"
                maxLength={2}
                required
              />
            </div>
            {createMerchantMutation.isError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {(createMerchantMutation.error as any)?.message || 'Failed to create merchant'}
              </div>
            )}
            <button
              onClick={() => {
                if (!merchantName.trim()) {
                  alert('Please enter merchant name');
                  return;
                }
                if (!merchantPhone.trim() || !merchantPhone.match(/^\+91[6-9]\d{9}$/)) {
                  alert('Please enter valid Indian phone number (format: +919876543210)');
                  return;
                }
                if (!merchantCategory.trim()) {
                  alert('Please enter category');
                  return;
                }
                if (!merchantState.trim() || merchantState.length !== 2) {
                  alert('Please enter valid 2-letter state code (e.g., DL, MH)');
                  return;
                }
                createMerchantMutation.mutate();
              }}
              disabled={createMerchantMutation.isPending}
              className="btn-primary w-full"
            >
              {createMerchantMutation.isPending ? 'Creating...' : 'Create Merchant (Unverified)'}
            </button>
          </div>
        )}

        {merchantsData?.merchants && merchantsData.merchants.length > 0 ? (
          <div className="space-y-2">
            {merchantsData.merchants.map(merchant => (
              <div key={merchant._id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium">{merchant.name}</p>
                  <p className="text-sm text-gray-600">{merchant.category} • {merchant.phoneE164} • {merchant.stateCode}</p>
                </div>
                {!merchant.verified ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      Unverified
                    </span>
                    <button
                      onClick={() => verifyMerchantMutation.mutate(merchant._id)}
                      disabled={verifyMerchantMutation.isPending}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      {verifyMerchantMutation.isPending ? 'Verifying...' : 'Verify →'}
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    ✓ Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 border rounded bg-gray-50">
            <p className="text-sm">No merchants yet. Click "+ Add Merchant" to create one.</p>
          </div>
        )}
      </div>

      {/* Pending Proofs */}
      {pendingProofsData && pendingProofsData.proofs.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Pending Proof Reviews</h2>
          <div className="space-y-3">
            {pendingProofsData.proofs.map(proof => (
              <div key={proof._id} className="border rounded p-3">
                <a
                  href={proof.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline font-medium mb-2 block"
                >
                  View Proof →
                </a>
                {proof.description && (
                  <p className="text-sm text-gray-700 mb-2">{proof.description}</p>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  Escrow: {proof.escrowId} • Submitted: {new Date(proof.createdAt).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      reviewProofMutation.mutate({ proofId: proof._id, approved: true })
                    }
                    disabled={reviewProofMutation.isPending}
                    className="btn-primary flex-1 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const rejectionReason = prompt('Rejection reason:');
                      if (rejectionReason) {
                        reviewProofMutation.mutate({
                          proofId: proof._id,
                          approved: false,
                          rejectionReason,
                        });
                      }
                    }}
                    disabled={reviewProofMutation.isPending}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

