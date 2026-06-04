'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { TemplateData } from '@/lib/types';
import { COLOR_SCHEMES, DESIGN_NAMES } from '@/lib/templates';

export default function NewInvitationPage() {
  const router = useRouter();
  const { authHeaders } = useAuth();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

  const [form, setForm] = useState({
    title: '',
    bride_name: '',
    groom_name: '',
    event_date: '',
    event_time: '',
    venue_name: '',
    venue_address: '',
    password: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch('/api/templates', { headers: authHeaders() });
      const data = await res.json();
      setTemplates(data.templates || []);
    } finally {
      setIsLoading(false);
    }
  }

  async function createInvitation() {
    if (!form.groom_name || !form.bride_name) return;
    setIsCreating(true);

    const scheme = selectedTemplate
      ? COLOR_SCHEMES[selectedTemplate.color_scheme] || COLOR_SCHEMES['gold-white']
      : COLOR_SCHEMES['gold-white'];

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        title: form.title || `زفاف ${form.groom_name} و${form.bride_name}`,
        template_id: selectedTemplate?.id || null,
        elements: selectedTemplate?.elements || [],
        canvas_width: selectedTemplate?.canvas_width || 800,
        canvas_height: selectedTemplate?.canvas_height || 1200,
        background_color: scheme.bg,
        password: form.password || null,
      }),
    });

    const data = await res.json();
    if (data.invitation) {
      router.push(`/editor/${data.invitation.id}`);
    } else {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold font-amiri" style={{ color: '#0D1B3E' }}>
          إنشاء دعوة جديدة
        </h1>
        <p className="text-sm text-gray-500 font-noto mt-1">اتبع الخطوات لإعداد دعوتك</p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold font-amiri transition-all"
              style={{
                background: s <= step ? 'linear-gradient(135deg, #C9A84C, #F5D78E)' : '#E5E7EB',
                color: s <= step ? '#0D1B3E' : '#9CA3AF',
              }}
            >
              {s}
            </div>
            <span className="text-sm font-noto" style={{ color: s === step ? '#0D1B3E' : '#9CA3AF' }}>
              {s === 1 ? 'اختر قالب' : 'تفاصيل الحفل'}
            </span>
            {s < 2 && <div className="w-8 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div
          className="bg-white rounded-2xl p-6 shadow-sm"
          style={{ border: '1px solid rgba(201,168,76,0.15)' }}
        >
          <h2 className="text-lg font-bold font-amiri mb-4" style={{ color: '#0D1B3E' }}>
            اختر قالباً للبداية
          </h2>
          <p className="text-sm text-gray-400 font-noto mb-6">
            يمكنك تعديل أي شيء في المحرر لاحقاً
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
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
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <button
                onClick={() => { setSelectedTemplate(null); setStep(2); }}
                className="group relative rounded-xl overflow-hidden aspect-[3/4] border-2 transition-all"
                style={{
                  borderColor: !selectedTemplate ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                  boxShadow: !selectedTemplate ? '0 0 0 3px rgba(201,168,76,0.2)' : 'none',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-xs font-noto font-bold text-gray-600">بدون قالب</span>
                </div>
              </button>

              {templates.map((tmpl) => {
                const scheme = COLOR_SCHEMES[tmpl.color_scheme] || COLOR_SCHEMES['gold-white'];
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => { setSelectedTemplate(tmpl); setStep(2); }}
                    className="group relative rounded-xl overflow-hidden aspect-[3/4] border-2 transition-all hover:shadow-md"
                    style={{
                      borderColor: isSelected ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                      boxShadow: isSelected ? '0 0 0 3px rgba(201,168,76,0.2)' : 'none',
                    }}
                  >
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
                      style={{ backgroundColor: scheme.bg }}
                    >
                      <div
                        className="w-full h-0.5 mb-2"
                        style={{ backgroundColor: scheme.primary }}
                      />
                      <div
                        className="text-xs font-amiri font-bold text-center leading-tight"
                        style={{ color: scheme.primary, fontSize: '10px' }}
                      >
                        {DESIGN_NAMES[tmpl.design_key]}
                      </div>
                      <div
                        className="text-center font-amiri"
                        style={{ color: scheme.text, fontSize: '9px' }}
                      >
                        العروسان
                      </div>
                      <div
                        className="w-8 h-0.5 mt-1"
                        style={{ backgroundColor: scheme.accent }}
                      />
                      <div style={{ color: scheme.text, fontSize: '8px' }} className="font-noto text-center">
                        {tmpl.font_family}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#C9A84C' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-1.5" style={{ background: 'rgba(255,255,255,0.9)' }}>
                      <div className="text-center font-noto" style={{ fontSize: '9px', color: scheme.primary, fontWeight: '600' }}>
                        {tmpl.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div
          className="bg-white rounded-2xl p-6 shadow-sm"
          style={{ border: '1px solid rgba(201,168,76,0.15)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setStep(1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <h2 className="text-lg font-bold font-amiri" style={{ color: '#0D1B3E' }}>
              تفاصيل الحفل
            </h2>
            {selectedTemplate && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-noto"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#9A7020' }}
              >
                قالب: {selectedTemplate.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              label="اسم العريس"
              required
              placeholder="محمد أحمد"
              value={form.groom_name}
              onChange={(v) => setForm({ ...form, groom_name: v })}
            />
            <FormField
              label="اسم العروسة"
              required
              placeholder="فاطمة علي"
              value={form.bride_name}
              onChange={(v) => setForm({ ...form, bride_name: v })}
            />
            <FormField
              label="عنوان الدعوة"
              placeholder="زفاف محمد وفاطمة"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
            />
            <FormField
              label="تاريخ الحفل"
              type="date"
              value={form.event_date}
              onChange={(v) => setForm({ ...form, event_date: v })}
            />
            <FormField
              label="وقت الحفل"
              placeholder="السابعة مساءً"
              value={form.event_time}
              onChange={(v) => setForm({ ...form, event_time: v })}
            />
            <FormField
              label="اسم القاعة"
              placeholder="قاعة النخيل الفاخرة"
              value={form.venue_name}
              onChange={(v) => setForm({ ...form, venue_name: v })}
            />
            <div className="md:col-span-2">
              <FormField
                label="عنوان المكان"
                placeholder="الرياض - حي العليا"
                value={form.venue_address}
                onChange={(v) => setForm({ ...form, venue_address: v })}
              />
            </div>
            <FormField
              label="كلمة مرور الدعوة (اختياري)"
              type="password"
              placeholder="اتركه فارغاً للدعوة المفتوحة"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={createInvitation}
              disabled={isCreating || !form.groom_name || !form.bride_name}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-noto font-bold text-base disabled:opacity-50 transition-all"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #F5D78E)',
                color: '#0D1B3E',
              }}
            >
              {isCreating ? (
                <>
                  <span className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  إنشاء وفتح المحرر
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  required,
  placeholder,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-noto font-medium mb-1.5" style={{ color: '#374151' }}>
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border text-sm font-noto outline-none transition-all"
        style={{ borderColor: 'rgba(201,168,76,0.3)' }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#C9A84C';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(201,168,76,0.15)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}
