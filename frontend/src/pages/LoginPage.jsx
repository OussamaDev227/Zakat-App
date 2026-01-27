/**
 * Login Page
 * 
 * Simple authentication page with static credentials for academic/demo use.
 * Displays academic project information in Arabic (RTL).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simple validation
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      setIsSubmitting(false);
      return;
    }

    // Attempt login with static credentials
    const success = login(username.trim(), password.trim());
    
    if (success) {
      // Redirect to dashboard (companies page)
      navigate('/companies', { replace: true });
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 lg:px-8 py-10"
      dir="rtl"
    >
      <div className="relative max-w-5xl w-full">
        {/* subtle background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
        </div>

        <div className="relative grid md:grid-cols-2 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
          {/* Academic info side */}
          <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white px-8 py-10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1 text-xs font-semibold tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className='text-sky-100'>مشروع تخرج ماستر - الأنظمة الذكية</span>
              </div>

              <div>
                <h2 className="text-2xl text-sky-200 sm:text-3xl font-extrabold leading-relaxed flex items-center gap-3 flex-wrap">
                  <span className='text-sky-100'>نظام دعم القرار لحساب زكاة الشركات</span>
                 
                  <span className="text-2xl sm:text-3xl font-extrabold text-sky-200">Decision Support System for Corporate Zakat Calculation</span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed">
                  هذا التطبيق مشروع تخرج لنيل شهادة الماستر في الإعلام الآلي،
                  ضمن تخصص الأنظمة الذكية
                  <span className="text-sky-200 font-semibold"> (Intelligent Systems)</span>.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:text-xs">
                <div>
                  <h3 className="text-xs font-semibold text-sky-100 mb-2">الطلاب المطورون</h3>
                  <ul className="space-y-1.5">
                    <li className="text-white font-medium">Moumni Ahmed Oussama</li>
                    <li className="text-white font-medium">Benhammadi Zohra</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <h3 className="text-xs font-semibold text-sky-100 mb-2">الجامعة</h3>
                  <p className="text-white font-medium">جامعة أحمد دراية – أدرار</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/15 pt-4 text-[11px] sm:text-xs text-blue-100 leading-relaxed">
              تم تطوير هذا التطبيق لأغراض أكاديمية وبحثية، ولا يمثل استشارة شرعية أو مهنية
              نهائية، بل أداة مساعدة لتوثيق منهجية حساب زكاة الشركات.
            </div>
          </div>

          {/* Login side */}
          <div className="px-8 py-10 bg-white">
            <div className="flex flex-col h-full justify-center">
              <div className="space-y-6">
                <div className="text-right">
                  <h3 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    يرجى إدخال بيانات الاعتماد للوصول إلى واجهة حساب زكاة الشركات.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
                      <p className="text-sm text-red-800 font-semibold text-center">{error}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="username" className="block text-sm font-bold text-gray-900">
                      اسم المستخدم
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
                      placeholder="اكتب اسم المستخدم (مثال: admin)"
                      autoComplete="username"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-bold text-gray-900">
                      كلمة المرور
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="input-field bg-blue-50/50 border-blue-100 focus:bg-white"
                      placeholder="اكتب كلمة المرور (مثال: admin123)"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-base py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري التحقق من البيانات...' : 'دخول إلى النظام'}
                  </button>
                </form>

                <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 text-center leading-relaxed">
                  هذا النظام مخصص لأغراض أكاديمية وبحثية، ويتم استخدام بيانات اعتماد ثابتة
                  لأغراض العرض التوضيحي فقط (بدون إدارة مستخدمين حقيقية).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
