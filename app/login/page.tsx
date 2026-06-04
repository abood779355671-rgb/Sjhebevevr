'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'فشل تسجيل الدخول');
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0D1B3E' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#C9A84C' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#F5D78E' }}
        />
      </div>

      <div
        className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201, 168, 76, 0.3)',
        }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl font-amiri font-bold gold-shimmer-text mb-2">تحفة</div>
          <div className="text-sm font-noto" style={{ color: '#C9A84C' }}>
            لوحة تحكم المالك
          </div>
          <div className="mt-3 h-px w-32 mx-auto" style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-noto mb-2" style={{ color: '#F5D78E' }}>
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              className="w-full px-4 py-3 rounded-xl font-noto text-white placeholder-gray-500 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C9A84C';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(201,168,76,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-noto mb-2" style={{ color: '#F5D78E' }}>
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full px-4 py-3 rounded-xl font-noto text-white placeholder-gray-500 outline-none transition-all pr-12"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C9A84C';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(201,168,76,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-noto"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-noto font-bold text-white text-base transition-all duration-300 disabled:opacity-70"
            style={{
              background: isLoading
                ? 'rgba(201,168,76,0.5)'
                : 'linear-gradient(135deg, #C9A84C 0%, #F5D78E 50%, #C9A84C 100%)',
              color: '#0D1B3E',
              backgroundSize: '200% 200%',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
                جارٍ تسجيل الدخول...
              </span>
            ) : (
              'دخول'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs font-noto" style={{ color: 'rgba(245,215,142,0.4)' }}>
            هذه الأداة للاستخدام الشخصي فقط
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
