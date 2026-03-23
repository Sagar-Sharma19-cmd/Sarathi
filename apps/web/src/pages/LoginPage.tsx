import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, CheckCircle2, Heart, Users, Landmark, AlertCircle } from 'lucide-react';

// Helper function to normalize phone number
function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '').trim();
  
  // If already starts with +91, just ensure it has exactly 10 digits after
  if (cleaned.startsWith('+91')) {
    const digitsAfter91 = cleaned.substring(3);
    if (digitsAfter91.length > 10) {
      cleaned = '+91' + digitsAfter91.substring(0, 10);
    }
    return cleaned;
  }
  
  // Handle numbers starting with 91
  if (cleaned.startsWith('91') && cleaned.length > 2) {
    const digitsAfter91 = cleaned.substring(2);
    // If more than 10 digits, take only first 10
    if (digitsAfter91.length > 10) {
      cleaned = '+91' + digitsAfter91.substring(0, 10);
    } else {
      cleaned = '+91' + digitsAfter91;
    }
    return cleaned;
  }
  
  // Handle numbers starting with 0
  if (cleaned.startsWith('0')) {
    const digitsAfter0 = cleaned.substring(1);
    if (digitsAfter0.length > 10) {
      cleaned = '+91' + digitsAfter0.substring(0, 10);
    } else {
      cleaned = '+91' + digitsAfter0;
    }
    return cleaned;
  }
  
  // For any other number, add +91 and limit to 10 digits
  if (cleaned.length > 10) {
    cleaned = '+91' + cleaned.substring(0, 10);
  } else {
    cleaned = '+91' + cleaned;
  }
  
  return cleaned;
}

// Helper function to validate phone number format
function validatePhoneNumber(phone: string): { valid: boolean; error?: string; normalized?: string } {
  const normalized = normalizePhoneNumber(phone);
  
  // Check if it matches the required pattern: +91 followed by 10 digits, first digit 6-9
  if (!normalized.match(/^\+91[6-9]\d{9}$/)) {
    const digitsAfter91 = normalized.replace(/^\+91/, '');
    if (digitsAfter91.length !== 10) {
      return {
        valid: false,
        error: `Phone number must have exactly 10 digits after +91. You have ${digitsAfter91.length} digits.`,
        normalized
      };
    }
    if (!/^[6-9]/.test(digitsAfter91)) {
      return {
        valid: false,
        error: 'Phone number must start with 6, 7, 8, or 9',
        normalized
      };
    }
    return {
      valid: false,
      error: 'Invalid phone number format',
      normalized
    };
  }
  
  return { valid: true, normalized };
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Modes and steps
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');

  // Form state
  const [name, setName] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [language, setLanguage] = useState(i18n.language);

  // Handle phone number input with auto-formatting
  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/[^\d+]/g, '').trim();
    
    if (cleaned.startsWith('+91')) {
      const digitsAfter91 = cleaned.substring(3);
      if (digitsAfter91.length > 10) {
        cleaned = '+91' + digitsAfter91.substring(0, 10);
      }
      setPhoneE164(cleaned);
      return;
    }
    
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        const digitsAfter0 = cleaned.substring(1);
        if (digitsAfter0.length > 10) {
          cleaned = '+91' + digitsAfter0.substring(0, 10);
        } else {
          cleaned = '+91' + digitsAfter0;
        }
      } else if (cleaned.startsWith('91') && cleaned.length > 2) {
        const digitsAfter91 = cleaned.substring(2);
        if (digitsAfter91.length > 10) {
          cleaned = '+91' + digitsAfter91.substring(0, 10);
        } else {
          cleaned = '+91' + digitsAfter91;
        }
      } else {
        if (cleaned.length > 10) {
          cleaned = '+91' + cleaned.substring(0, 10);
        } else {
          cleaned = '+91' + cleaned;
        }
      }
    }
    
    setPhoneE164(cleaned);
  };

  // Mutations
  const registerMutation = useMutation({
    mutationFn: () => {
      const phoneValidation = validatePhoneNumber(phoneE164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number');
      }
      return api.register(name, phoneValidation.normalized!, password);
    },
    onSuccess: () => {
      setMode('login');
      setLoginStep('credentials');
    },
  });

  const loginInitiateMutation = useMutation({
    mutationFn: () => {
      const phoneValidation = validatePhoneNumber(phoneE164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number');
      }
      return api.loginInitiate(phoneValidation.normalized!, password);
    },
    onSuccess: () => {
      setLoginStep('otp');
    },
  });

  const loginVerifyMutation = useMutation({
    mutationFn: () => {
      const phoneValidation = validatePhoneNumber(phoneE164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number');
      }
      return api.loginVerify(phoneValidation.normalized!, otp);
    },
    onSuccess: data => {
      login(data.jwt, data.sarathiId);
      i18n.changeLanguage(data.profile.preferredLang);
      navigate('/home');
    },
  });

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  // For nice slide animations
  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 flex-col md:flex-row">
      
      {/* Left Column - Hero/Value Prop (Visible mainly on larger screens) */}
      <div 
        className="w-full md:w-5/12 lg:w-1/2 min-h-[30vh] md:min-h-screen relative flex flex-col justify-end p-8 sm:p-12"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: 'url(/images/login-hero.jpg)' }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-primary-900/30 mix-blend-multiply z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-20 text-white max-w-xl"
        >
          <div className="flex items-center gap-3 mb-6 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
            <img src="/logo.png" alt="Sarathi" className="w-8 h-8 rounded-full bg-white p-1" />
            <span className="font-bold tracking-widest uppercase text-sm">Sarathi</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Empowering Your <span className="text-primary-300">Financial Journey</span> Across Borders.
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-lg font-medium">
            Your trusted companion for seamless remittances, portable identity, and instant micro-loans wherever your work takes you.
          </p>

          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center gap-4 text-white/90 bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold">100% Secure & Trusted</h4>
                <p className="text-xs text-white/70">Bank-grade security for your hard-earned money</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white/90 bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Landmark className="text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold">Portable Credit Score</h4>
                <p className="text-xs text-white/70">Build your score based on your remittances</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-10 lg:px-20 py-12 md:py-8 bg-white z-20 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none md:-ml-6 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] overflow-hidden relative min-h-[70vh]">
        
        {/* Top Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mx-20 -my-20 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -mx-20 -my-20 opacity-50 pointer-events-none" />

        <div className="w-full max-w-sm mx-auto relative z-10">
          
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome Back!' : 'Join Sarathi'}
            </h2>
            <p className="text-gray-500 font-medium">
              {mode === 'login' 
                ? 'Please enter your details to access your account' 
                : 'Create an account to start your financial journey'}
            </p>
          </div>

          {/* Language Selector */}
          <div className="mb-8 p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-xl flex shadow-inner">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                language === 'en'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => handleLanguageChange('en')}
            >
              English
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                language === 'hi'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => handleLanguageChange('hi')}
            >
              हिंदी (Hindi)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' && loginStep === 'credentials' && (
              <motion.div
                key="login-cred"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                    <div className="flex bg-gray-50 border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 rounded-xl overflow-hidden transition-all">
                      <div className="flex items-center justify-center px-4 bg-gray-100 border-r border-gray-200 text-gray-500 font-bold text-sm">
                        +91
                      </div>
                      <input
                        type="tel"
                        className="w-full px-4 py-3.5 bg-transparent border-none focus:ring-0 text-gray-900 font-bold placeholder-gray-400"
                        placeholder="10-digit mobile number"
                        value={phoneE164.replace('+91', '')}
                        onChange={e => handlePhoneChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-gray-900 font-bold placeholder-gray-400 transition-all font-mono tracking-widest"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-primary-500/30 transition-all flex justify-center items-center gap-2 mt-2"
                    onClick={() => loginInitiateMutation.mutate()}
                    disabled={loginInitiateMutation.isPending || password.length < 4 || phoneE164.length < 10}
                  >
                    {loginInitiateMutation.isPending ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Get OTP <ArrowRight size={20} /></>
                    )}
                  </motion.button>
                  
                  {loginInitiateMutation.isError && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold flex items-center gap-2 mt-2 border border-red-100">
                      <AlertCircle size={16} />
                      {(loginInitiateMutation.error as Error).message}
                    </div>
                  )}
                </div>

                <p className="text-center mt-8 text-gray-500 text-sm font-medium">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="text-primary-600 font-bold hover:underline">
                    Join Sarathi
                  </button>
                </p>
              </motion.div>
            )}

            {mode === 'login' && loginStep === 'otp' && (
              <motion.div
                key="login-otp"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-primary-500 shadow-sm">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900">OTP Sent Safely!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We've sent a 6-digit code to <span className="font-bold">{phoneE164}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-gray-900 font-black text-2xl tracking-[0.5em] text-center placeholder-gray-300 transition-all"
                      placeholder="••••••"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-gray-900/20 transition-all flex justify-center items-center gap-2"
                    onClick={() => loginVerifyMutation.mutate()}
                    disabled={loginVerifyMutation.isPending || otp.length !== 6}
                  >
                    {loginVerifyMutation.isPending ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Verify & Secure Login <CheckCircle2 size={20} /></>
                    )}
                  </motion.button>
                  
                  {loginVerifyMutation.isError && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold flex items-center gap-2 mt-2 border border-red-100">
                      <AlertCircle size={16} />
                      {(loginVerifyMutation.error as Error).message}
                    </div>
                  )}
                  
                  <button 
                    className="w-full py-3 text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors"
                    onClick={() => setLoginStep('credentials')}
                  >
                    ← Change Mobile Number
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div
                key="register"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-gray-900 font-bold placeholder-gray-400 transition-all font-mono tracking-widest"
                      placeholder="Your Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                    <div className="flex bg-gray-50 border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 rounded-xl overflow-hidden transition-all">
                      <div className="flex items-center justify-center px-4 bg-gray-100 border-r border-gray-200 text-gray-500 font-bold text-sm">
                        +91
                      </div>
                      <input
                        type="tel"
                        className="w-full px-4 py-3.5 bg-transparent border-none focus:ring-0 text-gray-900 font-bold placeholder-gray-400"
                        placeholder="10-digit mobile number"
                        value={phoneE164.replace('+91', '')}
                        onChange={e => handlePhoneChange(e.target.value)}
                      />
                    </div>
                    {phoneE164.length > 3 && !validatePhoneNumber(phoneE164).valid && (
                       <p className="text-xs text-red-500 mt-1.5 font-medium ml-1">Please enter a valid 10 digit number starting with 6-9</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Create Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-gray-900 font-bold placeholder-gray-400 transition-all font-mono tracking-widest"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                    <input
                      type="password"
                      className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl focus:ring-2 transition-all font-mono tracking-widest ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 text-red-900' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 text-gray-900'} placeholder-gray-400`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm mt-2">
                    <Users className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-blue-800 font-medium leading-relaxed">
                      By registering, you instantly get your portable <span className="font-bold">Sarathi ID</span> and an initial credit score.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-primary-500/30 transition-all flex justify-center items-center gap-2 mt-4"
                    onClick={() => {
                      if (password !== confirmPassword) {
                        alert('Passwords do not match');
                        return;
                      }
                      registerMutation.mutate();
                    }}
                    disabled={registerMutation.isPending || !name || password.length < 4 || password !== confirmPassword || !validatePhoneNumber(phoneE164).valid}
                  >
                    {registerMutation.isPending ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Create Account <CheckCircle2 size={20} /></>
                    )}
                  </motion.button>
                  
                  {registerMutation.isError && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold flex items-center gap-2 mt-2 border border-red-100">
                      <AlertCircle size={16} />
                      {(registerMutation.error as Error).message}
                    </div>
                  )}
                </div>

                <p className="text-center mt-8 text-gray-500 text-sm font-medium">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-primary-600 font-bold hover:underline">
                    Login Here
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
