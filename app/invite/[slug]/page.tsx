'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import type { InvitationData, CanvasElement } from '@/lib/types';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdown(eventDate: string | null): CountdownTime {
  if (!eventDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const now = new Date().getTime();
  const target = new Date(eventDate).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export default function PublicInvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showRsvp, setShowRsvp] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    guest_name: '',
    phone: '',
    attendance_status: 'attending',
    companions_count: 0,
    notes: '',
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [slug]);

  useEffect(() => {
    if (!invitation?.event_date) return;
    const timer = setInterval(() => {
      setCountdown(getCountdown(invitation.event_date));
    }, 1000);
    setCountdown(getCountdown(invitation.event_date));
    return () => clearInterval(timer);
  }, [invitation?.event_date]);

  async function loadInvitation() {
    try {
      const res = await fetch(`/api/invite/${slug}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'الدعوة غير متاحة');
        return;
      }

      setInvitation(data.invitation);
      setHasPassword(data.hasPassword);
      if (!data.hasPassword) setUnlocked(true);

      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: data.invitation.id, event_type: 'view' }),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function checkPassword() {
    const res = await fetch(`/api/invite/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput }),
    });

    if (res.ok) {
      setUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError('كلمة المرور غير صحيحة');
    }
  }

  async function submitRsvp() {
    if (!rsvpForm.guest_name || !invitation) return;
    setRsvpLoading(true);

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rsvpForm, invitation_id: invitation.id }),
    });

    if (res.ok) {
      setRsvpSent(true);
      setShowRsvp(false);

      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: invitation.id, event_type: 'rsvp' }),
      });
    }

    setRsvpLoading(false);
  }

  function toggleMusic() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function shareWhatsApp() {
    if (!invitation) return;
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(`دعوة زفاف ${invitation.groom_name} و${invitation.bride_name}\n${url}`)}`, '_blank');
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_id: invitation.id, event_type: 'share' }),
    });
  }

  function shareTelegram() {
    if (!invitation) return;
    const url = window.location.href;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`دعوة زفاف ${invitation.groom_name} و${invitation.bride_name}`)}`, '_blank');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0D1B3E' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl font-amiri gold-shimmer-text">تحفة</div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: '#C9A84C', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0D1B3E' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">💌</div>
          <div className="text-2xl font-amiri font-bold mb-2" style={{ color: '#F5D78E' }}>
            {error}
          </div>
          <p className="text-sm font-noto" style={{ color: 'rgba(245,215,142,0.5)' }}>
            هذه الدعوة غير متاحة حالياً
          </p>
        </div>
      </div>
    );
  }

  if (hasPassword && !unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0D1B3E' }}>
        <div
          className="w-full max-w-sm rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-xl font-amiri font-bold" style={{ color: '#F5D78E' }}>
              دعوة خاصة
            </div>
            <p className="text-sm font-noto mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              أدخل كلمة المرور للوصول
            </p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
            placeholder="كلمة المرور"
            className="w-full px-4 py-3 rounded-xl font-noto text-white outline-none mb-3"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}
          />
          {passwordError && (
            <p className="text-xs font-noto text-red-400 mb-3 text-center">{passwordError}</p>
          )}
          <button
            onClick={checkPassword}
            className="w-full py-3 rounded-xl font-noto font-bold"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const canvasW = invitation.canvas_width || 800;
  const canvasH = invitation.canvas_height || 1200;
  const elements: CanvasElement[] = invitation.elements || [];
  const inviteUrl = typeof window !== 'undefined' ? window.location.href : '';

  const eventDate = invitation.event_date
    ? new Date(invitation.event_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const viewportWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 480) : 480;
  const scale = viewportWidth / canvasW;

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#0D1B3E' }} dir="rtl">
      {invitation.music_url && (
        <audio ref={audioRef} src={invitation.music_url} loop />
      )}

      <div
        className="fixed top-4 left-4 z-50 flex gap-2"
      >
        {invitation.music_url && (
          <button
            onClick={toggleMusic}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
            style={{ background: 'rgba(201,168,76,0.9)', color: '#0D1B3E' }}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="w-full max-w-lg mx-auto">
        <div
          className="relative overflow-hidden"
          style={{
            width: '100%',
            height: canvasH * scale,
          }}
        >
          <div
            style={{
              width: canvasW,
              height: canvasH,
              transform: `scale(${scale})`,
              transformOrigin: 'top right',
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: invitation.background_color || '#FFFDF5',
            }}
          >
            {[...elements]
              .filter((el) => el.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => {
                const s = el.styles || {};
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      transform: `rotate(${el.rotation}deg) ${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}`.trim(),
                      transformOrigin: 'center center',
                      opacity: el.opacity,
                    }}
                  >
                    {el.type === 'text' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          fontFamily: s.fontFamily || 'Amiri',
                          fontSize: s.fontSize || 16,
                          fontWeight: s.fontWeight || '400',
                          fontStyle: s.fontStyle || 'normal',
                          color: s.color || '#000',
                          textAlign: s.textAlign || 'center',
                          lineHeight: s.lineHeight || 1.5,
                          letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : 'normal',
                          backgroundColor: s.backgroundColor || 'transparent',
                          padding: s.padding ? `${s.padding}px` : '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: s.textAlign === 'right' ? 'flex-end' : s.textAlign === 'left' ? 'flex-start' : 'center',
                          overflow: 'hidden',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          textShadow: s.shadowBlur ? `${s.shadowOffsetX || 0}px ${s.shadowOffsetY || 0}px ${s.shadowBlur}px ${s.shadowColor || '#000'}` : 'none',
                          textDecoration: s.textDecoration || 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: (el.content || '').replace(/\n/g, '<br/>') }}
                      />
                    )}
                    {el.type === 'shape' && el.shapeType !== 'line' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: s.backgroundColor || 'transparent',
                          border: `${s.borderWidth || 0}px ${s.borderStyle || 'solid'} ${s.borderColor || 'transparent'}`,
                          borderRadius: el.shapeType === 'circle' ? '50%' : s.borderRadius ? `${s.borderRadius}px` : 0,
                          boxShadow: s.shadowBlur ? `${s.shadowOffsetX || 0}px ${s.shadowOffsetY || 0}px ${s.shadowBlur}px ${s.shadowColor || 'rgba(0,0,0,0.2)'}` : 'none',
                        }}
                      />
                    )}
                    {el.type === 'shape' && el.shapeType === 'line' && (
                      <div style={{ width: '100%', height: s.borderWidth || 2, backgroundColor: s.backgroundColor || s.borderColor || '#C9A84C', marginTop: el.height / 2 - (s.borderWidth || 2) / 2 }} />
                    )}
                    {el.type === 'image' && el.src && (
                      <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: (s.objectFit || 'cover') as 'cover' | 'contain' | 'fill', borderRadius: s.borderRadius ? `${s.borderRadius}px` : 0 }} />
                    )}
                    {el.type === 'ornament' && (
                      <svg width={el.width} height={el.height} viewBox={`0 0 ${el.width} ${el.height}`}>
                        {el.ornamentType === 'divider-ornate' ? (
                          <>
                            <line x1={0} y1={el.height / 2} x2={el.width} y2={el.height / 2} stroke={s.color || '#C9A84C'} strokeWidth={1} />
                            <circle cx={el.width / 2} cy={el.height / 2} r={5} fill={s.color || '#C9A84C'} />
                            <circle cx={el.width / 2 - 20} cy={el.height / 2} r={3} fill="none" stroke={s.color || '#C9A84C'} strokeWidth={1} />
                            <circle cx={el.width / 2 + 20} cy={el.height / 2} r={3} fill="none" stroke={s.color || '#C9A84C'} strokeWidth={1} />
                          </>
                        ) : (
                          <>
                            <line x1={0} y1={el.height / 2} x2={el.width * 0.35} y2={el.height / 2} stroke={s.color || '#C9A84C'} strokeWidth={1} />
                            <text x={el.width / 2} y={el.height / 2 + 5} textAnchor="middle" fill={s.color || '#C9A84C'} fontSize={16} fontFamily="Amiri">✦</text>
                            <line x1={el.width * 0.65} y1={el.height / 2} x2={el.width} y2={el.height / 2} stroke={s.color || '#C9A84C'} strokeWidth={1} />
                          </>
                        )}
                      </svg>
                    )}
                    {el.type === 'divider' && (
                      <div style={{ width: '100%', height: s.borderWidth || 1, backgroundColor: s.backgroundColor || '#C9A84C', marginTop: el.height / 2 - (s.borderWidth || 1) / 2 }} />
                    )}
                    {el.type === 'countdown' && invitation.event_date && (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: s.backgroundColor || 'rgba(201,168,76,0.1)',
                        borderRadius: s.borderRadius ? `${s.borderRadius}px` : 8,
                        border: `${s.borderWidth || 1}px solid ${s.borderColor || 'rgba(201,168,76,0.3)'}`,
                        fontFamily: s.fontFamily || 'Amiri',
                        color: s.color || '#C9A84C',
                        gap: 4,
                      }}>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>العد التنازلي</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[
                            { value: countdown.days, label: 'يوم' },
                            { value: countdown.hours, label: 'ساعة' },
                            { value: countdown.minutes, label: 'دقيقة' },
                            { value: countdown.seconds, label: 'ثانية' },
                          ].map(({ value, label }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: s.fontSize || 28, fontWeight: 700, lineHeight: 1 }}>
                                {String(value).padStart(2, '0')}
                              </div>
                              <div style={{ fontSize: 9, opacity: 0.7 }}>{label}</div>
                            </div>
                          ))}
                        </div>
                        {el.content && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{el.content}</div>}
                      </div>
                    )}
                    {el.type === 'qrcode' && (
                      <div style={{ width: '100%', height: '100%', backgroundColor: s.backgroundColor || 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                        <QRCodeSVG value={inviteUrl} size={Math.min(el.width, el.height) - 20} level="H" />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div
        className="w-full max-w-lg mx-auto px-4 py-8 space-y-6"
        style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}
      >
        {invitation.event_date && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <h3 className="text-xs font-noto font-bold mb-3" style={{ color: 'rgba(245,215,142,0.6)' }}>
              موعد الحفل
            </h3>
            <div className="text-base font-amiri" style={{ color: '#F5D78E' }}>{eventDate}</div>
            {invitation.event_time && (
              <div className="text-sm font-noto mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {invitation.event_time}
              </div>
            )}
            {invitation.venue_name && (
              <div className="flex items-center gap-2 mt-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <div className="text-sm font-amiri font-bold" style={{ color: '#F5D78E' }}>{invitation.venue_name}</div>
                  {invitation.venue_address && (
                    <div className="text-xs font-noto" style={{ color: 'rgba(255,255,255,0.5)' }}>{invitation.venue_address}</div>
                  )}
                </div>
              </div>
            )}
            {invitation.venue_lat && invitation.venue_lng && (
              <a
                href={`https://www.google.com/maps?q=${invitation.venue_lat},${invitation.venue_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-xs font-noto font-bold transition-all"
                style={{ background: 'rgba(29,78,216,0.2)', color: '#93C5FD' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                افتح في الخريطة
              </a>
            )}
          </div>
        )}

        {!rsvpSent ? (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <h3 className="text-sm font-amiri font-bold mb-4" style={{ color: '#F5D78E' }}>
              تأكيد الحضور
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: 'attending', label: 'سأحضر', color: '#10B981' },
                { value: 'not_attending', label: 'اعتذر', color: '#EF4444' },
                { value: 'maybe', label: 'ربما', color: '#F59E0B' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRsvpForm({ ...rsvpForm, attendance_status: opt.value })}
                  className="py-2.5 rounded-xl text-xs font-noto font-bold transition-all"
                  style={{
                    background: rsvpForm.attendance_status === opt.value ? `${opt.color}20` : 'rgba(255,255,255,0.06)',
                    color: rsvpForm.attendance_status === opt.value ? opt.color : 'rgba(255,255,255,0.5)',
                    border: `1.5px solid ${rsvpForm.attendance_status === opt.value ? opt.color : 'transparent'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="اسمك *"
                value={rsvpForm.guest_name}
                onChange={(e) => setRsvpForm({ ...rsvpForm, guest_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-noto outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: 'white' }}
              />
              <input
                type="tel"
                placeholder="رقم الهاتف (اختياري)"
                value={rsvpForm.phone}
                onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-noto outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: 'white' }}
                dir="ltr"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-noto" style={{ color: 'rgba(255,255,255,0.6)' }}>عدد المرافقين:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRsvpForm({ ...rsvpForm, companions_count: Math.max(0, rsvpForm.companions_count - 1) })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    −
                  </button>
                  <span className="text-white font-bold w-8 text-center">{rsvpForm.companions_count}</span>
                  <button
                    onClick={() => setRsvpForm({ ...rsvpForm, companions_count: rsvpForm.companions_count + 1 })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    +
                  </button>
                </div>
              </div>
              <textarea
                placeholder="ملاحظة (اختياري)"
                value={rsvpForm.notes}
                onChange={(e) => setRsvpForm({ ...rsvpForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-noto outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: 'white' }}
              />
            </div>

            <button
              onClick={submitRsvp}
              disabled={rsvpLoading || !rsvpForm.guest_name}
              className="w-full mt-4 py-3 rounded-xl font-noto font-bold text-sm disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
            >
              {rsvpLoading ? 'جارٍ الإرسال...' : 'إرسال الرد'}
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-base font-amiri font-bold" style={{ color: '#6EE7B7' }}>
              تم إرسال ردك بنجاح!
            </div>
            <p className="text-xs font-noto mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              شكراً لاستجابتك
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-noto font-bold transition-all"
            style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            واتساب
          </button>
          <button
            onClick={shareTelegram}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-noto font-bold transition-all"
            style={{ background: 'rgba(0,136,204,0.15)', color: '#0088cc', border: '1px solid rgba(0,136,204,0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="m9.417 15.181-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931L23.93 3.821l.001-.001c.321-1.496-.541-2.081-1.527-1.714l-21.29 8.151c-1.453.564-1.431 1.374-.247 1.75l5.443 1.693 12.643-7.911c.595-.394 1.136-.176.691.218z" />
            </svg>
            تليجرام
          </button>
        </div>

        <div
          className="flex flex-col items-center py-6"
          style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}
        >
          <div className="text-xs font-noto mb-3" style={{ color: 'rgba(245,215,142,0.4)' }}>مسح للوصول للدعوة</div>
          <div className="bg-white p-3 rounded-2xl">
            <QRCodeSVG value={inviteUrl} size={120} level="H" />
          </div>
        </div>

        <div className="text-center pb-4">
          <div className="text-xs font-noto" style={{ color: 'rgba(245,215,142,0.3)' }}>
            تم التصميم بـ <span className="font-amiri" style={{ color: 'rgba(201,168,76,0.5)' }}>تحفة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
