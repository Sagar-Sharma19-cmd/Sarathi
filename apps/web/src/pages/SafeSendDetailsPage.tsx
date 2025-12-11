import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

export default function SafeSendDetailsPage() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [proofUrl, setProofUrl] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [showProofForm, setShowProofForm] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['safesend-details', escrowId],
    queryFn: () => api.getSafeSendDetails(escrowId!),
    enabled: !!escrowId,
  });

  const submitProofMutation = useMutation({
    mutationFn: () => api.submitProof(escrowId!, proofUrl, proofDescription || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safesend-details', escrowId] });
      setProofUrl('');
      setProofDescription('');
      setShowProofForm(false);
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit proof');
    },
  });

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!proofUrl.trim()) {
      setError('Please enter a proof URL');
      return;
    }

    try {
      new URL(proofUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    submitProofMutation.mutate();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-20">Loading...</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">SafeSend not found</p>
          <button onClick={() => navigate('/safesend')} className="btn-primary">
            Back to SafeSend
          </button>
        </div>
      </Layout>
    );
  }

  const { escrow, proofs, merchant } = data;

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
      <span className={`px-3 py-1 text-sm font-semibold rounded ${badge.className}`}>
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

  return (
    <Layout title="SafeSend Details">
      <button onClick={() => navigate('/safesend')} className="btn-secondary mb-4">
        ← Back to SafeSend List
      </button>

      {/* Escrow Summary */}
      <div className="card mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary-600">₹{escrow.amount.toLocaleString()}</h2>
            <p className="text-gray-600">{getGoalLabel(escrow.goal)}</p>
          </div>
          {getStatusBadge(escrow.status)}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Merchant:</span>
            <span className="font-medium">{merchant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span>{merchant.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Merchant Phone:</span>
            <span>{merchant.phoneE164}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span>{new Date(escrow.createdAt).toLocaleString()}</span>
          </div>
          {escrow.releasedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Released:</span>
              <span className="text-green-600 font-medium">
                {new Date(escrow.releasedAt).toLocaleString()}
              </span>
            </div>
          )}
          {escrow.refundedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Refunded:</span>
              <span className="text-gray-600 font-medium">
                {new Date(escrow.refundedAt).toLocaleString()}
              </span>
            </div>
          )}
          {escrow.lockReason && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-gray-600 text-xs mb-1">Notes:</p>
              <p className="text-sm">{escrow.lockReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {escrow.status === 'awaiting_proof' && (
        <div className="card bg-blue-50 border-blue-200 mb-4">
          <p className="text-sm text-blue-800">
            🔒 Funds are locked. Waiting for merchant to submit proof of purchase.
          </p>
        </div>
      )}

      {escrow.status === 'under_review' && (
        <div className="card bg-purple-50 border-purple-200 mb-4">
          <p className="text-sm text-purple-800">
            👀 Merchant has submitted proof. Admin is reviewing it.
          </p>
        </div>
      )}

      {escrow.status === 'released' && (
        <div className="card bg-green-50 border-green-200 mb-4">
          <p className="text-sm text-green-800">
            ✅ Funds released to merchant! Proof was verified and approved.
          </p>
        </div>
      )}

      {escrow.status === 'refunded' && (
        <div className="card bg-gray-50 border-gray-200 mb-4">
          <p className="text-sm text-gray-800">
            ↩️ Funds have been refunded to your account.
          </p>
        </div>
      )}

      {/* Proof Submission Form (for merchants) */}
      {escrow.status === 'awaiting_proof' && showProofForm && (
        <div className="card mb-4">
          <h3 className="font-bold mb-3">Submit Proof of Purchase</h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitProof} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof URL (Receipt/Photo)
              </label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://example.com/receipt.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your receipt/photo to a service like Imgur, Google Drive, or Dropbox and paste the link here
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                placeholder="Details about the purchase..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={submitProofMutation.isPending}
              >
                {submitProofMutation.isPending ? 'Submitting...' : 'Submit Proof'}
              </button>
              <button
                type="button"
                onClick={() => setShowProofForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proof History */}
      {proofs.length > 0 && (
        <div className="card">
          <h3 className="font-bold mb-3">Proof Submissions</h3>
          <div className="space-y-3">
            {proofs.map((proof) => (
              <div key={proof._id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <a
                    href={proof.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline font-medium text-sm"
                  >
                    View Proof →
                  </a>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      proof.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : proof.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {proof.status}
                  </span>
                </div>

                {proof.description && (
                  <p className="text-sm text-gray-700 mb-2">{proof.description}</p>
                )}

                {proof.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <p className="text-xs text-red-800">
                      <strong>Rejection Reason:</strong> {proof.rejectionReason}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {new Date(proof.createdAt).toLocaleString()}
                  {proof.reviewedAt && ` • Reviewed: ${new Date(proof.reviewedAt).toLocaleString()}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merchant Actions */}
      {escrow.status === 'awaiting_proof' && !showProofForm && proofs.length === 0 && (
        <button onClick={() => setShowProofForm(true)} className="btn-primary w-full mt-4">
          Submit Proof of Purchase
        </button>
      )}
    </Layout>
  );
}

