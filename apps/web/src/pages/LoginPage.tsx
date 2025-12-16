import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
        error: 'Phone number must start with 6, 7, 8, or 9 after +91',
        normalized
      };
    }
    return {
      valid: false,
      error: 'Invalid phone number format. Expected: +919876543210',
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
  const [phoneE164, setPhoneE164] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [language, setLanguage] = useState(i18n.language);

  // Handle phone number input with auto-formatting
  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '').trim();
    
    // If already starts with +91, limit to 13 characters
    if (cleaned.startsWith('+91')) {
      const digitsAfter91 = cleaned.substring(3);
      if (digitsAfter91.length > 10) {
        cleaned = '+91' + digitsAfter91.substring(0, 10);
      }
      setPhoneE164(cleaned);
      return;
    }
    
    // Auto-add +91 if user starts typing digits
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        // If starts with 0, replace with +91
        const digitsAfter0 = cleaned.substring(1);
        if (digitsAfter0.length > 10) {
          cleaned = '+91' + digitsAfter0.substring(0, 10);
        } else {
          cleaned = '+91' + digitsAfter0;
        }
      } else if (cleaned.startsWith('91') && cleaned.length > 2) {
        // If starts with 91, add + and handle length
        const digitsAfter91 = cleaned.substring(2);
        if (digitsAfter91.length > 10) {
          cleaned = '+91' + digitsAfter91.substring(0, 10);
        } else {
          cleaned = '+91' + digitsAfter91;
        }
      } else {
        // Otherwise add +91 prefix and limit to 10 digits
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
      // Normalize and validate phone number
      const phoneValidation = validatePhoneNumber(phoneE164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number');
      }
      
      const normalized = phoneValidation.normalized!;
      console.log('Registering with:', {
        original: phoneE164,
        normalized: normalized,
        length: normalized.length,
        patternMatch: /^\+91[6-9]\d{9}$/.test(normalized),
        digitsAfter91: normalized.replace(/^\+91/, ''),
        digitsCount: normalized.replace(/^\+91/, '').length
      });
      
      return api.register(normalized, password);
    },
    onSuccess: () => {
      setMode('login');
      setLoginStep('credentials');
    },
  });

  const loginInitiateMutation = useMutation({
    mutationFn: () => {
      // Normalize and validate phone number
      const phoneValidation = validatePhoneNumber(phoneE164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number');
      }
      
      const normalized = phoneValidation.normalized!;
      console.log('Logging in with:', {
        original: phoneE164,
        normalized: normalized,
        length: normalized.length,
        patternMatch: /^\+91[6-9]\d{9}$/.test(normalized)
      });
      
      return api.loginInitiate(normalized, password);
    },
    onSuccess: () => {
      setLoginStep('otp');
    },
  });

  const loginVerifyMutation = useMutation({
    mutationFn: () => {
      // Normalize and validate phone number
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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/login-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="card max-w-md w-full bg-white/98 backdrop-blur-sm shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">{t('app.name')}</h1>
          <p className="text-gray-600 mt-2">{t('app.tagline')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            className={`py-2 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setMode('login')}
          >
            {t('auth.login')}
          </button>
          <button
            className={`py-2 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setMode('register')}
          >
            {t('auth.register')}
          </button>
        </div>

        {/* Language Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.selectLanguage')}
          </label>
          <div className="flex gap-3">
            <button
              className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                language === 'en'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white'
              }`}
              onClick={() => handleLanguageChange('en')}
            >
              {t('auth.english')}
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                language === 'hi'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white'
              }`}
              onClick={() => handleLanguageChange('hi')}
            >
              {t('auth.hindi')}
            </button>
          </div>
        </div>

        {mode === 'login' && (
          <>
            {loginStep === 'credentials' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.phone')}
                  <span className="text-xs text-gray-500 ml-2">(Format: +919876543210)</span>
                </label>
                <input
                  type="tel"
                  className="input mb-4"
                  placeholder="+919876543210"
                  value={phoneE164}
                  onChange={e => handlePhoneChange(e.target.value)}
                  onBlur={() => {
                    // Normalize on blur to ensure correct format
                    if (phoneE164 && !phoneE164.startsWith('+91')) {
                      const normalized = normalizePhoneNumber(phoneE164);
                      setPhoneE164(normalized);
                    }
                  }}
                />
                {/* Show validation feedback */}
                {phoneE164 && phoneE164.length > 0 && (
                  <div className="mb-2">
                    {validatePhoneNumber(phoneE164).valid ? (
                      <p className="text-xs text-green-600">✓ Valid phone number</p>
                    ) : (
                      <p className="text-xs text-red-600">
                        {validatePhoneNumber(phoneE164).error || 'Invalid format'}
                      </p>
                    )}
                  </div>
                )}
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password') || 'Password'}</label>
                <input
                  type="password"
                  className="input mb-4"
                  placeholder={t('auth.password') || 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => loginInitiateMutation.mutate()}
                  disabled={loginInitiateMutation.isPending}
                >
                  {loginInitiateMutation.isPending ? t('common.loading') : (t('auth.sendOTP') || 'Send OTP')}
                </button>
                {loginInitiateMutation.isError && (
                  <p className="text-red-600 text-sm mt-2">{(loginInitiateMutation.error as Error).message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.verifyOTP')}</label>
                <input
                  type="text"
                  className="input mb-4"
                  placeholder={t('auth.otpPlaceholder')}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                />
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => loginVerifyMutation.mutate()}
                  disabled={loginVerifyMutation.isPending}
                >
                  {loginVerifyMutation.isPending ? t('common.loading') : t('auth.verifyOTP')}
                </button>
                {loginVerifyMutation.isError && (
                  <p className="text-red-600 text-sm mt-2">{(loginVerifyMutation.error as Error).message}</p>
                )}
                <button className="btn btn-secondary w-full mt-3" onClick={() => setLoginStep('credentials')}>
                  {t('common.back')}
                </button>
              </div>
            )}
          </>
        )}

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.phone')}
              <span className="text-xs text-gray-500 ml-2">(Format: +919876543210)</span>
            </label>
            <input
              type="tel"
              className="input mb-4"
              placeholder="+919876543210"
              value={phoneE164}
              onChange={e => handlePhoneChange(e.target.value)}
              onBlur={() => {
                // Normalize on blur to ensure correct format
                if (phoneE164 && !phoneE164.startsWith('+91')) {
                  const normalized = normalizePhoneNumber(phoneE164);
                  setPhoneE164(normalized);
                }
              }}
            />
            {/* Show validation feedback */}
            {phoneE164 && phoneE164.length > 0 && (
              <div className="mb-2">
                {validatePhoneNumber(phoneE164).valid ? (
                  <p className="text-xs text-green-600">✓ Valid phone number</p>
                ) : (
                  <p className="text-xs text-red-600">
                    {validatePhoneNumber(phoneE164).error || 'Invalid format'}
                  </p>
                )}
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password') || 'Password'}</label>
            <input
              type="password"
              className="input mb-4"
              placeholder={t('auth.password') || 'Password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.confirmPassword') || 'Confirm Password'}</label>
            <input
              type="password"
              className="input mb-4"
              placeholder={t('auth.confirmPassword') || 'Confirm Password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={() => {
                if (password !== confirmPassword) {
                  alert('Passwords do not match');
                  return;
                }
                registerMutation.mutate();
              }}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? t('common.loading') : (t('auth.register') || 'Register')}
            </button>
            {registerMutation.isError && (
              <p className="text-red-600 text-sm mt-2">{(registerMutation.error as Error).message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
