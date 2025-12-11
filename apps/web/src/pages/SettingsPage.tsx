import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { INDIAN_STATES } from '@sarathi/shared';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
  });

  const updateStateMutation = useMutation({
    mutationFn: (stateCode: string) => api.updateState(stateCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const updateLanguageMutation = useMutation({
    mutationFn: (lang: string) => api.updateLanguage(lang),
    onSuccess: (_, lang) => {
      i18n.changeLanguage(lang);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return (
    <Layout title={t('settings.title')} showBack>
      <div className="space-y-4">
        {/* Language */}
        <div className="card">
          <h3 className="font-bold mb-3">{t('settings.language')}</h3>
          <div className="flex gap-3">
            <button
              className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                i18n.language === 'en'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300'
              }`}
              onClick={() => updateLanguageMutation.mutate('en')}
            >
              {t('auth.english')}
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                i18n.language === 'hi'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300'
              }`}
              onClick={() => updateLanguageMutation.mutate('hi')}
            >
              {t('auth.hindi')}
            </button>
          </div>
        </div>

        {/* State */}
        <div className="card">
          <h3 className="font-bold mb-3">{t('settings.state')}</h3>
          <p className="text-sm text-gray-600 mb-3">{t('settings.selectState')}</p>
          <select
            className="input"
            value={data?.user.stateCode}
            onChange={e => updateStateMutation.mutate(e.target.value)}
          >
            {Object.entries(INDIAN_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Logout */}
        <div className="card">
          <button className="btn btn-secondary w-full" onClick={logout}>
            {t('settings.logout')}
          </button>
        </div>
      </div>
    </Layout>
  );
}

