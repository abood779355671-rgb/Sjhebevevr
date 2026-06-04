'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { GuestData, RsvpData, InvitationData } from '@/lib/types';

export default function GuestsPage() {
  const { authHeaders } = useAuth();
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [rsvp, setRsvp] = useState<RsvpData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'guests' | 'rsvp'>('rsvp');
  const [selectedInvitation, setSelectedInvitation] = useState<string>('all');
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '', group_name: '', invitation_id: '' });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [invRes, guestRes, rsvpRes] = await Promise.all([
        fetch('/api/invitations', { headers: authHeaders() }),
        fetch('/api/guests', { headers: authHeaders() }),
        fetch('/api/rsvp', { headers: authHeaders() }),
      ]);
      const [invData, guestData, rsvpData] = await Promise.all([
        invRes.json(), guestRes.json(), rsvpRes.json(),
      ]);
      setInvitations(invData.invitations || []);
      setGuests(guestData.guests || []);
      setRsvp(rsvpData.responses || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function addGuest() {
    if (!newGuest.name || !newGuest.invitation_id) return;
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(newGuest),
    });
    const data = await res.json();
    if (data.guest) {
      setGuests((prev) => [data.guest, ...prev]);
      setNewGuest({ name: '', phone: '', email: '', group_name: '', invitation_id: '' });
      setShowAddGuest(false);
    }
  }

  async function deleteGuest(id: string) {
    await fetch(`/api/guests/${id}`, { method: 'DELETE', headers: authHeaders() });
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  async function deleteRsvp(id: string) {
    await fetch(`/api/rsvp`, { method: 'DELETE', headers: authHeaders() });
    setRsvp((prev) => prev.filter((r) => r.id !== id));
  }

  const filteredGuests = selectedInvitation === 'all'
    ? guests
    : guests.filter((g) => g.invitation_id === selectedInvitation);

  const filteredRsvp = selectedInvitation === 'all'
    ? rsvp
    : rsvp.filter((r) => r.invitation_id === selectedInvitation);

  function getInvName(id: string) {
    const inv = invitations.find((i) => i.id === id);
    return inv ? `${inv.groom_name} & ${inv.bride_name}` : id.slice(0, 8);
  }

  const statusMap = {
    attending: { label: 'سيحضر', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    not_attending: { label: 'اعتذر', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    maybe: { label: 'ربما', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-amiri" style={{ color: '#0D1B3E' }}>
            إدارة الضيوف
          </h1>
          <p className="text-sm text-gray-500 font-noto mt-0.5">
            {guests.length} ضيف مسجل، {rsvp.length} رد على الحضور
          </p>
        </div>
        {activeTab === 'guests' && (
          <button
            onClick={() => setShowAddGuest(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-noto font-bold"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            إضافة ضيف
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('rsvp')}
          className="px-4 py-2 rounded-xl text-sm font-noto font-bold transition-all"
          style={{
            background: activeTab === 'rsvp' ? 'linear-gradient(135deg, #0D1B3E, #1E3A6E)' : 'white',
            color: activeTab === 'rsvp' ? 'white' : '#6B7280',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          ردود الحضور ({rsvp.length})
        </button>
        <button
          onClick={() => setActiveTab('guests')}
          className="px-4 py-2 rounded-xl text-sm font-noto font-bold transition-all"
          style={{
            background: activeTab === 'guests' ? 'linear-gradient(135deg, #0D1B3E, #1E3A6E)' : 'white',
            color: activeTab === 'guests' ? 'white' : '#6B7280',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          قائمة الضيوف ({guests.length})
        </button>
      </div>

      {invitations.length > 0 && (
        <select
          value={selectedInvitation}
          onChange={(e) => setSelectedInvitation(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm font-noto outline-none"
          style={{ borderColor: 'rgba(201,168,76,0.3)' }}
        >
          <option value="all">جميع الدعوات</option>
          {invitations.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.groom_name} & {inv.bride_name}
            </option>
          ))}
        </select>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 rounded-full animate-bounce"
                style={{ backgroundColor: '#C9A84C', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl overflow-hidden shadow-sm"
          style={{ border: '1px solid rgba(201,168,76,0.15)' }}
        >
          {activeTab === 'rsvp' ? (
            <>
              {!filteredRsvp.length ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-400 font-noto">لا توجد ردود حتى الآن</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                        {['الاسم', 'الهاتف', 'الحضور', 'المرافقون', 'الدعوة', 'التاريخ'].map((h) => (
                          <th key={h} className="text-right py-3 px-4 text-xs font-noto font-bold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRsvp.map((r) => {
                        const st = statusMap[r.attendance_status];
                        return (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                            <td className="py-3 px-4 text-sm font-noto font-bold" style={{ color: '#0D1B3E' }}>{r.guest_name}</td>
                            <td className="py-3 px-4 text-sm font-noto text-gray-500" dir="ltr">{r.phone || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-noto font-bold"
                                style={{ background: st.bg, color: st.color }}>
                                {st.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-noto text-gray-500">{r.companions_count}</td>
                            <td className="py-3 px-4 text-xs font-noto text-gray-400">{getInvName(r.invitation_id)}</td>
                            <td className="py-3 px-4 text-xs font-noto text-gray-400">
                              {new Date(r.created_at).toLocaleDateString('ar-SA')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {showAddGuest && (
                <div className="p-4 border-b" style={{ borderColor: 'rgba(201,168,76,0.15)', background: 'rgba(201,168,76,0.03)' }}>
                  <h3 className="font-bold font-amiri mb-3 text-sm" style={{ color: '#0D1B3E' }}>إضافة ضيف جديد</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <input
                      placeholder="الاسم *"
                      value={newGuest.name}
                      onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                      className="px-3 py-2 rounded-lg border text-sm font-noto outline-none"
                      style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                    />
                    <input
                      placeholder="رقم الهاتف"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      className="px-3 py-2 rounded-lg border text-sm font-noto outline-none"
                      style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                    />
                    <input
                      placeholder="المجموعة"
                      value={newGuest.group_name}
                      onChange={(e) => setNewGuest({ ...newGuest, group_name: e.target.value })}
                      className="px-3 py-2 rounded-lg border text-sm font-noto outline-none"
                      style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                    />
                    <select
                      value={newGuest.invitation_id}
                      onChange={(e) => setNewGuest({ ...newGuest, invitation_id: e.target.value })}
                      className="px-3 py-2 rounded-lg border text-sm font-noto outline-none col-span-2 md:col-span-1"
                      style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                    >
                      <option value="">اختر الدعوة *</option>
                      {invitations.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.groom_name} & {inv.bride_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addGuest}
                      disabled={!newGuest.name || !newGuest.invitation_id}
                      className="px-4 py-2 rounded-lg text-sm font-noto font-bold disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
                    >
                      إضافة
                    </button>
                    <button
                      onClick={() => setShowAddGuest(false)}
                      className="px-4 py-2 rounded-lg text-sm font-noto text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {!filteredGuests.length ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-400 font-noto">لا يوجد ضيوف مسجلون</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                        {['الاسم', 'الهاتف', 'المجموعة', 'الدعوة', ''].map((h) => (
                          <th key={h} className="text-right py-3 px-4 text-xs font-noto font-bold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuests.map((g) => (
                        <tr key={g.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4 text-sm font-noto font-bold" style={{ color: '#0D1B3E' }}>{g.name}</td>
                          <td className="py-3 px-4 text-sm font-noto text-gray-500" dir="ltr">{g.phone || '—'}</td>
                          <td className="py-3 px-4 text-xs font-noto text-gray-400">{g.group_name || '—'}</td>
                          <td className="py-3 px-4 text-xs font-noto text-gray-400">{getInvName(g.invitation_id)}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => deleteGuest(g.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
