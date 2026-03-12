/**
 * Login Page
 *
 * Simple authentication page with static credentials for academic/demo use.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!username.trim() || !password.trim()) {
      setError(t('error_credentials_required'));
      setIsSubmitting(false);
      return;
    }

    const success = login(username.trim(), password.trim());

    if (success) {
      navigate('/companies', { replace: true });
    } else {
      setError(t('error_invalid_credentials'));
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 lg:px-8 py-10"
      dir={dir}
    >
      <div className="relative max-w-5xl w-full">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
        </div>

        <div className="relative grid md:grid-cols-2 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1 text-xs font-semibold tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-sky-100">{t('academic_badge')}</span>
              </div>

              <div>
                <h2 className="text-2xl text-sky-200 sm:text-3xl font-extrabold leading-relaxed flex items-center gap-3 flex-wrap">
                  <span className="text-sky-100">{t('project_title_ar')}</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-sky-200">{t('project_title_en')}</span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed">
                  {t('project_description')}
                  <span className="text-sky-200 font-semibold"> (Intelligent Systems)</span>.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:text-xs">
                <div>
                  <h3 className="text-xs font-semibold text-sky-100 mb-2">{t('developers')}</h3>
                  <ul className="space-y-1.5">
                    <li className="text-white font-medium">Moumni Ahmed Oussama</li>
                    <li className="text-white font-medium">Benhammadi Zohra</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <h3 className="text-xs font-semibold text-sky-100 mb-2">{t('university')}</h3>
                  <p className="text-white font-medium">{t('university_name')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/15 pt-4 text-[11px] sm:text-xs text-blue-100 leading-relaxed">
              {t('footer_disclaimer')}
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 bg-white">
            <div className="flex flex-col h-full justify-center">
              <div className="space-y-5 sm:space-y-6">
                <div className="text-start">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('login_title')}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">{t('login_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
                      <p className="text-sm text-red-800 font-semibold text-center">{error}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="username" className="block text-sm font-bold text-gray-900">
                      {t('username')}
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError('');
                      }}
                      className="input-field bg-blue-50/50 border-blue-100 focus:bg-white"
                      placeholder={t('placeholder_username')}
                      autoComplete="username"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-bold text-gray-900">
                      {t('password')}
                    </label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="bg-blue-50/50 border-blue-100 focus:bg-white"
                      placeholder={t('placeholder_password')}
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-base py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('validating') : t('submit_login')}
                  </button>
                </form>

                <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 text-center leading-relaxed">
                  {t('demo_note')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
