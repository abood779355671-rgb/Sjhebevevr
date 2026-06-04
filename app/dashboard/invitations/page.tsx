'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { InvitationData } from '@/lib/types';

export default function InvitationsPage() {
  const { authHeaders } = useAuth();
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    try {
      const res = await fetch('/api/invitations', { headers: authHeaders() });
      const data = await res.json();
      setInvitations(data.invitations || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteInvitation(id: string) {
    if (!confirm('هل تريد حذف هذه الدعوة نهائياً؟')) return;
    setDeleting(id);
    await fetch(`/api/invitations/${id}`, { method: 'DELETE', headers: authHeaders() });
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  }

  async function toggleActive(inv: InvitationData) {
    const res = await fetch(`/api/invitations/${inv.id}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !inv.is_active }),
    });
    const data = await res.json();
    if (data.invitation) {
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? data.invitation : i)));
    }
  }

  async function copyInvitation(inv: InvitationData) {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...inv,
        id: undefined,
        slug: undefined,
        title: `نسخة من: ${inv.title}`,
        views_count: 0,
        created_at: undefined,
        updated_at: undefined,
      }),
    });
    const data = await res.json();
    if (data.invitation) {
      setInvitations((prev) => [data.invitation, ...prev]);
    }
  }

  const filtered = invitations.filter(
    (i) =>
      i.title.includes(search) ||
      i.bride_name.includes(search) ||
      i.groom_name.includes(search)
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-amiri" style={{ color: '#0D1B3E' }}>
            الدعوات
          </h1>
          <p className="text-sm text-gray-500 font-noto mt-0.5">
            {invitations.length} دعوة إجمالاً
          </p>
        </div>
        <Link
          href="/dashboard/invitations/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-noto font-bold shadow-sm transition-all hover:shadow-md"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          دعوة جديدة
        </Link>
      </div>

      <div className="relative">
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن دعوة..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border font-noto text-sm outline-none transition-all"
          style={{ borderColor: 'rgba(201,168,76,0.3)' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A84C')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
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
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">💌</div>
          <h3 className="text-lg font-bold font-amiri text-gray-700 mb-2">
            {search ? 'لا توجد نتائج' : 'لا توجد دعوات بعد'}
          </h3>
          <p className="text-sm text-gray-400 font-noto mb-4">
            {search ? 'جرّب البحث بكلمات مختلفة' : 'ابدأ بإنشاء دعوتك الأولى'}
          </p>
          {!search && (
            <Link
              href="/dashboard/invitations/new"
              className="inline-block px-6 py-3 rounded-xl font-noto font-bold"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
            >
              إنشاء دعوة
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              onDelete={() => deleteInvitation(inv.id)}
              onToggle={() => toggleActive(inv)}
              onCopy={() => copyInvitation(inv)}
              isDeleting={deleting === inv.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationCard({
  invitation: inv,
  onDelete,
  onToggle,
  onCopy,
  isDeleting,
}: {
  invitation: InvitationData;
  onDelete: () => void;
  onToggle: () => void;
  onCopy: () => void;
  isDeleting: boolean;
}) {
  const eventDate = inv.event_date
    ? new Date(inv.event_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inv.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  function shareTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
      style={{
        border: '1px solid rgba(201,168,76,0.15)',
        opacity: isDeleting ? 0.5 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="h-3 w-full"
        style={{ background: 'linear-gradient(to right, #C9A84C, #F5D78E, #C9A84C)' }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold font-amiri text-base truncate" style={{ color: '#0D1B3E' }}>
              {inv.groom_name || '—'} & {inv.bride_name || '—'}
            </h3>
            <p className="text-xs text-gray-400 font-noto mt-0.5 truncate">{inv.title}</p>
          </div>
          <span
            className="flex-shrink-0 mr-2 px-2 py-0.5 rounded-full text-xs font-noto"
            style={{
              background: inv.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)',
              color: inv.is_active ? '#059669' : '#6B7280',
            }}
          >
            {inv.is_active ? 'نشطة' : 'معطلة'}
          </span>
        </div>

        {(eventDate || inv.venue_name) && (
          <div className="space-y-1.5 mb-4">
            {eventDate && (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-noto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {eventDate}
              </div>
            )}
            {inv.venue_name && (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-noto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {inv.venue_name}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 py-3 border-y border-gray-100 mb-4">
          <div className="flex-1 text-center">
            <div className="text-lg font-bold font-amiri" style={{ color: '#C9A84C' }}>
              {inv.views_count.toLocaleString('ar-SA')}
            </div>
            <div className="text-xs text-gray-400 font-noto">مشاهدة</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 font-noto truncate" dir="ltr">
              {inv.slug}
            </div>
            <div className="text-xs text-gray-400 font-noto">الرابط</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <Link
            href={`/editor/${inv.id}`}
            className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-noto font-bold transition-colors"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#9A7020' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            تعديل
          </Link>
          <Link
            href={`/invite/${inv.slug}`}
            target="_blank"
            className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-noto font-bold transition-colors"
            style={{ background: 'rgba(29,78,216,0.08)', color: '#1D4ED8' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            معاينة
          </Link>
          <button
            onClick={onCopy}
            className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-noto font-bold transition-colors"
            style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            نسخ
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={shareWhatsApp} className="p-1.5 rounded-lg transition-colors hover:bg-green-50" style={{ color: '#25D366' }} title="واتساب">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </button>
            <button onClick={shareTelegram} className="p-1.5 rounded-lg transition-colors hover:bg-blue-50" style={{ color: '#0088cc' }} title="تليجرام">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="m9.417 15.181-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931L23.93 3.821l.001-.001c.321-1.496-.541-2.081-1.527-1.714l-21.29 8.151c-1.453.564-1.431 1.374-.247 1.75l5.443 1.693 12.643-7.911c.595-.394 1.136-.176.691.218z" />
              </svg>
            </button>
            <button onClick={copyLink} className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-400" title="نسخ الرابط">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: inv.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                color: inv.is_active ? '#EF4444' : '#10B981',
              }}
              title={inv.is_active ? 'تعطيل' : 'تفعيل'}
            >
              {inv.is_active ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
              style={{ color: '#EF4444' }}
              title="حذف"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
