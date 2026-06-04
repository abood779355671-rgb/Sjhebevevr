'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalInvitations: number;
  activeInvitations: number;
  totalViews: number;
  totalGuests: number;
  totalRsvp: number;
  attending: number;
  notAttending: number;
  recentInvitations: InviteSummary[];
}

interface InviteSummary {
  id: string;
  title: string;
  bride_name: string;
  groom_name: string;
  event_date: string | null;
  views_count: number;
  is_active: boolean;
  slug: string;
  created_at: string;
}

export default function DashboardPage() {
  const { authHeaders } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [invRes, guestRes, rsvpRes] = await Promise.all([
        fetch('/api/invitations', { headers: authHeaders() }),
        fetch('/api/guests', { headers: authHeaders() }),
        fetch('/api/rsvp', { headers: authHeaders() }),
      ]);

      const [invData, guestData, rsvpData] = await Promise.all([
        invRes.json(),
        guestRes.json(),
        rsvpRes.json(),
      ]);

      const invitations: InviteSummary[] = invData.invitations || [];
      const guests = guestData.guests || [];
      const rsvp = rsvpData.responses || [];

      setStats({
        totalInvitations: invitations.length,
        activeInvitations: invitations.filter((i) => i.is_active).length,
        totalViews: invitations.reduce((sum, i) => sum + (i.views_count || 0), 0),
        totalGuests: guests.length,
        totalRsvp: rsvp.length,
        attending: rsvp.filter((r: { attendance_status: string }) => r.attendance_status === 'attending').length,
        notAttending: rsvp.filter((r: { attendance_status: string }) => r.attendance_status === 'not_attending').length,
        recentInvitations: invitations.slice(0, 5),
      });
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-bounce"
              style={{ backgroundColor: '#C9A84C', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'إجمالي الدعوات', value: stats?.totalInvitations || 0, icon: '💌', color: '#1D4ED8' },
    { label: 'الدعوات النشطة', value: stats?.activeInvitations || 0, icon: '✅', color: '#059669' },
    { label: 'إجمالي المشاهدات', value: stats?.totalViews || 0, icon: '👁️', color: '#D97706' },
    { label: 'الضيوف المسجلون', value: stats?.totalGuests || 0, icon: '👥', color: '#7C3AED' },
    { label: 'ردود الحضور', value: stats?.totalRsvp || 0, icon: '📝', color: '#C9A84C' },
    { label: 'سيحضرون', value: stats?.attending || 0, icon: '🎉', color: '#10B981' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-amiri font-bold" style={{ color: '#0D1B3E' }}>
          مرحباً بك في <span className="gold-text">تحفة</span>
        </h1>
        <p className="text-gray-500 font-noto mt-1">إدارة دعوات أعراسك بكل سهولة وأناقة</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 shadow-sm card-hover"
            style={{ border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-3xl font-bold font-amiri" style={{ color: card.color }}>
              {card.value.toLocaleString('ar-SA')}
            </div>
            <div className="text-xs text-gray-500 font-noto mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-2xl p-6 shadow-sm"
          style={{ border: '1px solid rgba(201,168,76,0.15)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold font-amiri" style={{ color: '#0D1B3E' }}>
              آخر الدعوات
            </h2>
            <Link
              href="/dashboard/invitations"
              className="text-sm font-noto transition-colors"
              style={{ color: '#C9A84C' }}
            >
              عرض الكل ←
            </Link>
          </div>

          {!stats?.recentInvitations?.length ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💌</div>
              <p className="text-gray-500 font-noto text-sm">لا توجد دعوات حتى الآن</p>
              <Link
                href="/dashboard/invitations/new"
                className="mt-3 inline-block px-4 py-2 rounded-xl text-sm font-noto font-bold"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
              >
                أنشئ أول دعوة
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-amber-50"
                  style={{ border: '1px solid rgba(201,168,76,0.1)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold font-amiri text-sm truncate" style={{ color: '#0D1B3E' }}>
                      {inv.groom_name} & {inv.bride_name}
                    </div>
                    <div className="text-xs text-gray-400 font-noto mt-0.5">{inv.title}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400 font-noto flex items-center gap-1">
                      <span>👁</span>
                      {inv.views_count}
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-noto"
                      style={{
                        background: inv.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)',
                        color: inv.is_active ? '#059669' : '#6B7280',
                      }}
                    >
                      {inv.is_active ? 'نشطة' : 'معطلة'}
                    </span>
                    <div className="flex gap-1">
                      <Link
                        href={`/editor/${inv.id}`}
                        className="p-1.5 rounded-lg hover:bg-gold-100 transition-colors"
                        style={{ color: '#C9A84C' }}
                        title="تعديل"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/invite/${inv.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-blue-400"
                        title="معاينة"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="bg-white rounded-2xl p-6 shadow-sm"
          style={{ border: '1px solid rgba(201,168,76,0.15)' }}
        >
          <h2 className="text-lg font-bold font-amiri mb-5" style={{ color: '#0D1B3E' }}>
            إحصائيات الحضور
          </h2>

          <div className="space-y-4">
            <AttendanceBar
              label="سيحضرون"
              count={stats?.attending || 0}
              total={stats?.totalRsvp || 1}
              color="#10B981"
            />
            <AttendanceBar
              label="اعتذروا"
              count={stats?.notAttending || 0}
              total={stats?.totalRsvp || 1}
              color="#EF4444"
            />
            <AttendanceBar
              label="ربما"
              count={(stats?.totalRsvp || 0) - (stats?.attending || 0) - (stats?.notAttending || 0)}
              total={stats?.totalRsvp || 1}
              color="#F59E0B"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold font-amiri" style={{ color: '#10B981' }}>
                  {stats?.attending || 0}
                </div>
                <div className="text-xs text-gray-400 font-noto">حضور</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-amiri text-red-500">
                  {stats?.notAttending || 0}
                </div>
                <div className="text-xs text-gray-400 font-noto">اعتذار</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-amiri text-amber-500">
                  {(stats?.totalRsvp || 0) - (stats?.attending || 0) - (stats?.notAttending || 0)}
                </div>
                <div className="text-xs text-gray-400 font-noto">ربما</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1E3A6E 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-amiri font-bold mb-1">
              ابدأ تصميم دعوتك الآن
            </h3>
            <p className="text-sm font-noto opacity-70">
              اختر من بين 10 تصاميم فاخرة و1000 تركيبة مختلفة
            </p>
          </div>
          <Link
            href="/dashboard/invitations/new"
            className="flex-shrink-0 px-6 py-3 rounded-xl font-noto font-bold text-navy-900 transition-all hover:shadow-lg hover:shadow-gold-400/30"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
          >
            إنشاء دعوة
          </Link>
        </div>
      </div>
    </div>
  );
}

function AttendanceBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm font-noto mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold" style={{ color }}>
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
