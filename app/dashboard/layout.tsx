'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', icon: HomeIcon },
  { href: '/dashboard/invitations', label: 'الدعوات', icon: InviteIcon },
  { href: '/dashboard/templates', label: 'القوالب', icon: TemplateIcon },
  { href: '/dashboard/guests', label: 'الضيوف', icon: GuestsIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0D1B3E' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-amiri gold-shimmer-text">تحفة</div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: '#C9A84C', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F4EE' }} dir="rtl">
      <aside
        className="fixed top-0 right-0 h-full z-40 flex flex-col transition-all duration-300"
        style={{
          width: sidebarOpen ? '260px' : '72px',
          background: '#0D1B3E',
          borderLeft: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gold-500/10">
          {sidebarOpen && (
            <div className="text-2xl font-amiri gold-shimmer-text font-bold">تحفة</div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors hover:bg-white/10 text-gold-300"
          >
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(245,215,142,0.1))'
                    : 'transparent',
                  color: isActive ? '#F5D78E' : 'rgba(255,255,255,0.6)',
                  borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent',
                }}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-noto text-sm font-medium truncate">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gold-500/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors hover:bg-red-500/10 group"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <LogoutIcon size={20} className="flex-shrink-0 group-hover:text-red-400" />
            {sidebarOpen && (
              <span className="font-noto text-sm group-hover:text-red-400">تسجيل الخروج</span>
            )}
          </button>
        </div>
      </aside>

      <main
        className="flex-1 min-h-screen transition-all duration-300"
        style={{ marginRight: sidebarOpen ? '260px' : '72px' }}
      >
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: 'rgba(247,244,238,0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(201,168,76,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <BreadcrumbNav pathname={pathname} />
          </div>
          <Link
            href="/dashboard/invitations/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-noto font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #F5D78E)',
              color: '#0D1B3E',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            دعوة جديدة
          </Link>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function BreadcrumbNav({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  const labels: Record<string, string> = {
    dashboard: 'الرئيسية',
    invitations: 'الدعوات',
    templates: 'القوالب',
    guests: 'الضيوف',
    new: 'إنشاء جديد',
    edit: 'تعديل',
  };

  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push({ label: labels[seg] || seg, href: path });
  }

  return (
    <nav className="flex items-center gap-2 text-sm font-noto">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-2">
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="m15 18-6-6 6-6" />
            </svg>
          )}
          {i === crumbs.length - 1 ? (
            <span style={{ color: '#0D1B3E' }} className="font-bold">{c.label}</span>
          ) : (
            <Link href={c.href} style={{ color: '#9CA3AF' }} className="hover:text-gold-600 transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function HomeIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function InviteIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function TemplateIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function GuestsIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogoutIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
