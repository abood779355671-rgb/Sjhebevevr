'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimOut(true);
    }, 2500);

    const timer2 = setTimeout(() => {
      setSplashDone(true);
      const token = localStorage.getItem('tuhfa_auth_token');
      if (token) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [router]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${
        animOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#0D1B3E' }}
    >
      <div className="flex flex-col items-center gap-6 splash-animate-in">
        <div className="relative">
          <div
            className="text-7xl font-amiri font-bold gold-shimmer-text select-none"
            style={{ letterSpacing: '0.05em' }}
          >
            تحفة
          </div>
          <div
            className="absolute -inset-4 rounded-full opacity-20 blur-2xl"
            style={{ background: 'radial-gradient(circle, #C9A84C, transparent)' }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
          <div className="text-sm font-noto tracking-widest" style={{ color: '#F5D78E' }}>
            دعوات أعراس بلمسة فاخرة
          </div>
          <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
        </div>

        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: '#C9A84C',
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
