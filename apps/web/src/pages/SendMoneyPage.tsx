import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Navigation, IndianRupee, CreditCard, Banknote, ShieldCheck, UserCircle, QrCode } from 'lucide-react';

export default function SendMoneyPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);
  
  // Fake Razorpay states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState(0);

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
  });

  const remitMutation = useMutation({
    mutationFn: () => api.remit(parseInt(amount), counterparty),
    onSuccess: data => {
      setTxId(data.id);
      setSuccess(true);
      setNewBalance(data.totalMoney);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseInt(amount) < 1) return;
    
    // Trigger Razorpay Fake Simulation
    setIsProcessing(true);
    setProcessingState(0);
    
    // Simulate Razorpay connection states
    setTimeout(() => setProcessingState(1), 1000); // Connecting securely...
    setTimeout(() => setProcessingState(2), 2500); // Authenticating bank...
    setTimeout(() => {
      setProcessingState(3); // Completing transfer...
      remitMutation.mutate();
    }, 4000);
  };

  const handleQuickAmount = (val: string) => {
    setAmount(val);
  };

  if (success) {
    return (
      <Layout title={t('sendMoney.title')} showBack backgroundImageUrl="/background.png" backgroundOverlayOpacity={0.96}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-2xl p-8 text-center max-w-sm mx-auto mt-4 border border-green-100 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
            className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-100"
          >
            <CheckCircle2 size={56} strokeWidth={2.5} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              Payment Successful
            </h2>
            <p className="text-gray-500 font-medium text-sm mb-6">Secured by Razorpay • UPI</p>
            
            <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 text-left">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 border-dashed">
                <span className="text-gray-500 text-sm font-medium">Amount Paid</span>
                <span className="font-extrabold text-2xl text-gray-900 flex items-center">
                  <span className="text-gray-400 font-medium mr-1 text-lg">₹</span>
                  {parseInt(amount).toLocaleString('en-IN')}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Paid to</span>
                  <span className="font-bold text-gray-900">{counterparty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Transaction ID</span>
                  <span className="font-mono text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">{txId.substring(0, 12).toUpperCase()}</span>
                </div>
                {newBalance !== null && (
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                    <span className="text-gray-500 text-sm">New Balance</span>
                    <span className="font-bold text-primary-700">₹{newBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-4 font-bold text-lg transition-colors shadow-lg"
              onClick={() => {
                setSuccess(false);
                setAmount('');
                setCounterparty('');
                setNewBalance(null);
              }}
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout title={t('sendMoney.title')} showBack backgroundImageUrl="/background.png" backgroundOverlayOpacity={0.96}>
      
      {/* Fake Razorpay Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full mx-4 text-center">
              <div className="mb-6 flex justify-center">
                {/* Fake Razorpay Logo/Animation */}
                <div className="relative w-20 h-20">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-primary-600"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="text-primary-600" size={32} />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
              <div className="text-2xl font-black text-gray-900 mb-6 flex justify-center items-center">
                <span>₹{amount}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingState >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {processingState >= 1 ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />}
                  </div>
                  <span className={`font-medium ${processingState >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Connecting securely...</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingState >= 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {processingState >= 2 ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />}
                  </div>
                  <span className={`font-medium ${processingState >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Authenticating bank...</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${processingState >= 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {processingState >= 3 ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />}
                  </div>
                  <span className={`font-medium ${processingState >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Completing transfer...</span>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <ShieldCheck size={14} /> Secured by Razorpay
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative z-10 max-w-md mx-auto">
        
        {/* Header Profile Section */}
        <div className="flex flex-col items-center justify-center mb-8 pb-8 border-b border-gray-200/50">
          <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden mb-4 shadow-inner flex items-center justify-center border-4 border-white shadow-xl relative">
            {counterparty ? (
              <span className="text-3xl font-black text-primary-600">{counterparty.substring(0, 2).toUpperCase()}</span>
            ) : (
              <UserCircle size={48} className="text-gray-300" strokeWidth={1.5} />
            )}
            
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <Navigation size={12} className="text-white transform rotate-45" fill="currentColor" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {counterparty || "Paying someone new?"}
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {counterparty ? 'Verified Payee' : 'Enter mobile number below'}
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl border border-white/60">
          
          <div className="mb-6 relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">
              Payee Mobile Number
            </label>
            <div className="flex items-center bg-gray-50/80 rounded-2xl border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all p-2">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 mr-2 flex-shrink-0">
                <span className="font-bold text-sm text-gray-600">+91</span>
              </div>
              <input
                type="tel"
                className="w-full bg-transparent border-none text-lg font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0"
                placeholder="10-digit mobile number"
                value={counterparty}
                onChange={e => setCounterparty(e.target.value.replace(/\D/g, '').substring(0, 10))}
                required
              />
              <div className="w-10 h-10 flex items-center justify-center text-gray-400 flex-shrink-0 cursor-pointer hover:text-primary-600 transition-colors">
                <QrCode size={20} />
              </div>
            </div>
          </div>

          <div className="mb-8 relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-2">
              Amount to Send
            </label>
            <div className="flex items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-inner h-24 overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <span className={`text-3xl font-medium transition-colors ${amount ? 'text-gray-900' : 'text-gray-300'} mr-1`}>₹</span>
              <input
                type="number"
                className="w-full bg-transparent border-none text-4xl sm:text-5xl font-black text-gray-900 placeholder-gray-200 focus:outline-none focus:ring-0 p-0"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="1"
                max="50000"
              />
            </div>
            {meData?.user.totalMoney && (
              <p className="text-xs font-semibold text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                Available Balance: <span className="text-gray-800">₹{meData.user.totalMoney.toLocaleString('en-IN')}</span>
              </p>
            )}
            
            {/* Quick amount chips */}
            <div className="flex gap-2 justify-center mt-4">
              {['500', '1000', '2500', '5000'].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickAmount(val)}
                  className="px-4 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm text-sm font-bold text-gray-600 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all"
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-8">
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary-500 bg-primary-50/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary-600 border border-primary-100">
                  <Banknote size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Sarathi Wallet</p>
                  <p className="text-xs font-medium text-gray-500">Instant Transfer</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center border-2 border-white shadow-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-black text-lg shadow-xl shadow-gray-900/20 transition-all disabled:opacity-50 disabled:grayscale"
            disabled={!amount || parseInt(amount) < 1 || isProcessing || remitMutation.isPending}
          >
            {isProcessing || remitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full"></motion.div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Pay Now <Navigation size={18} fill="currentColor" />
              </span>
            )}
          </motion.button>
          
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400">
             <ShieldCheck size={14} /> Payments secured by Sarathi & Razorpay
          </div>

          {remitMutation.isError && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 bg-red-50 font-semibold text-sm mt-4 p-3 rounded-xl border border-red-100 flex items-center justify-center">
              {(remitMutation.error as Error).message}
            </motion.p>
          )}
        </div>
      </form>
    </Layout>
  );
}

