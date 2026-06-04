'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { TemplateData } from '@/lib/types';
import { COLOR_SCHEMES, DESIGN_NAMES } from '@/lib/templates';

export default function TemplatesPage() {
  const { authHeaders } = useAuth();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importing, setImporting] = useState(false);

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

  async function deleteTemplate(id: string) {
    if (!confirm('حذف هذا القالب المخصص؟')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE', headers: authHeaders() });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function exportTemplate(tmpl: TemplateData) {
    const data = JSON.stringify(tmpl, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuhfa-template-${tmpl.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      const tmpl = JSON.parse(text);

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tmpl,
          id: undefined,
          is_custom: true,
          name: `(مستورد) ${tmpl.name || 'قالب'}`,
        }),
      });

      const data = await res.json();
      if (data.template) {
        setTemplates((prev) => [...prev, data.template]);
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  const builtin = templates.filter((t) => !t.is_custom);
  const custom = templates.filter((t) => t.is_custom);

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-amiri" style={{ color: '#0D1B3E' }}>
            القوالب
          </h1>
          <p className="text-sm text-gray-500 font-noto mt-0.5">
            {templates.length} قالب متاح
          </p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-noto font-bold cursor-pointer transition-all"
          style={{ border: '2px solid rgba(201,168,76,0.4)', color: '#9A7020' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {importing ? 'جارٍ الاستيراد...' : 'استيراد قالب'}
          <input type="file" accept=".json" className="hidden" onChange={importTemplate} />
        </label>
      </div>

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
        <>
          <section>
            <h2 className="text-lg font-bold font-amiri mb-4" style={{ color: '#0D1B3E' }}>
              القوالب الأساسية ({builtin.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
              {builtin.map((tmpl) => (
                <TemplateCard
                  key={tmpl.id}
                  template={tmpl}
                  onExport={() => exportTemplate(tmpl)}
                />
              ))}
            </div>
          </section>

          {custom.length > 0 && (
            <section>
              <h2 className="text-lg font-bold font-amiri mb-4" style={{ color: '#0D1B3E' }}>
                قوالبي المخصصة ({custom.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
                {custom.map((tmpl) => (
                  <TemplateCard
                    key={tmpl.id}
                    template={tmpl}
                    onExport={() => exportTemplate(tmpl)}
                    onDelete={() => deleteTemplate(tmpl.id)}
                    isCustom
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TemplateCard({
  template: tmpl,
  onExport,
  onDelete,
  isCustom,
}: {
  template: TemplateData;
  onExport: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
  const scheme = COLOR_SCHEMES[tmpl.color_scheme] || COLOR_SCHEMES['gold-white'];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover group"
      style={{ border: '1px solid rgba(201,168,76,0.15)' }}
    >
      <div
        className="relative aspect-[3/4] flex flex-col items-center justify-center p-4 gap-2"
        style={{ backgroundColor: scheme.bg }}
      >
        <div className="w-full h-0.5" style={{ backgroundColor: scheme.primary }} />
        <div
          className="text-xs font-amiri font-bold text-center mt-2"
          style={{ color: scheme.primary, fontSize: '11px' }}
        >
          بسم الله الرحمن الرحيم
        </div>
        <div className="w-6 h-px" style={{ backgroundColor: scheme.accent }} />
        <div className="text-center font-amiri" style={{ color: scheme.text, fontSize: '14px', lineHeight: 1.5 }}>
          <div style={{ color: scheme.primary, fontWeight: 700 }}>محمد</div>
          <div style={{ color: scheme.accent, fontSize: '10px' }}>و</div>
          <div style={{ color: scheme.primary, fontWeight: 700 }}>فاطمة</div>
        </div>
        <div className="w-full h-0.5 mt-2" style={{ backgroundColor: scheme.primary }} />

        {isCustom && (
          <div
            className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-noto"
            style={{ background: scheme.primary, color: 'white', fontSize: '8px' }}
          >
            مخصص
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="font-bold font-amiri text-sm mb-0.5" style={{ color: '#0D1B3E' }}>
          {tmpl.name}
        </div>
        <div className="text-xs text-gray-400 font-noto mb-3 line-clamp-1">{tmpl.description}</div>

        <div className="flex gap-1.5">
          <div
            className="flex-1 h-2 rounded-full"
            style={{ backgroundColor: scheme.primary }}
            title={`ألوان: ${tmpl.color_scheme}`}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: scheme.secondary }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: scheme.accent }}
          />
        </div>

        <div className="flex gap-1.5 mt-3">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-noto transition-colors"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#9A7020' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            تصدير
          </button>
          {isCustom && onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-400"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
