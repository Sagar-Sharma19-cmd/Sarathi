import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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

  // Mutations
  const registerMutation = useMutation({
    mutationFn: () => api.register(phoneE164, password),
    onSuccess: () => {
      setMode('login');
      setLoginStep('credentials');
    },
  });

  const loginInitiateMutation = useMutation({
    mutationFn: () => api.loginInitiate(phoneE164, password),
    onSuccess: () => {
      setLoginStep('otp');
    },
  });

  const loginVerifyMutation = useMutation({
    mutationFn: () => api.loginVerify(phoneE164, otp),
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.phone')}</label>
                <input
                  type="tel"
                  className="input mb-4"
                  placeholder={t('auth.phonePlaceholder')}
                  value={phoneE164}
                  onChange={e => setPhoneE164(e.target.value)}
                />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.phone')}</label>
            <input
              type="tel"
              className="input mb-4"
              placeholder={t('auth.phonePlaceholder')}
              value={phoneE164}
              onChange={e => setPhoneE164(e.target.value)}
            />
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

