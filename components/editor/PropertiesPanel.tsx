'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { CanvasElement, ElementStyles } from '@/lib/types';

interface Props {
  element: CanvasElement | null;
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
  invitationId: string;
}

const FONTS = [
  'Amiri', 'Noto Naskh Arabic', 'Scheherazade New',
  'Arial', 'Georgia', 'Times New Roman',
];

const FONT_WEIGHTS = [
  { value: '400', label: 'عادي' },
  { value: '500', label: 'متوسط' },
  { value: '600', label: 'شبه عريض' },
  { value: '700', label: 'عريض' },
];

export function PropertiesPanel({ element, onUpdateElement, invitationId }: Props) {
  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  if (!element) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-xs text-gray-400 font-noto">
          <div className="text-3xl mb-2 opacity-40">☝️</div>
          انقر على عنصر لتعديل خصائصه
        </div>
      </div>
    );
  }

  function updateStyle(updates: Partial<ElementStyles>) {
    onUpdateElement({ styles: { ...element!.styles, ...updates } });
  }

  const s = element.styles || {};

  return (
    <div className="h-full overflow-y-auto scroll-hidden" dir="rtl">
      <div
        className="px-3 py-2.5 border-b sticky top-0 z-10"
        style={{ borderColor: 'rgba(201,168,76,0.15)', background: 'rgba(201,168,76,0.03)' }}
      >
        <div className="text-xs font-noto font-bold" style={{ color: '#0D1B3E' }}>
          خصائص: {element.name}
        </div>
      </div>

      <div className="p-3 space-y-4">
        <Section title="الموضع والحجم">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={element.x} onChange={(v) => onUpdateElement({ x: v })} />
            <NumberInput label="Y" value={element.y} onChange={(v) => onUpdateElement({ y: v })} />
            <NumberInput label="العرض" value={element.width} onChange={(v) => onUpdateElement({ width: Math.max(10, v) })} />
            <NumberInput label="الارتفاع" value={element.height} onChange={(v) => onUpdateElement({ height: Math.max(10, v) })} />
            <NumberInput label="التدوير" value={element.rotation} onChange={(v) => onUpdateElement({ rotation: ((v % 360) + 360) % 360 })} unit="°" />
            <NumberInput label="الشفافية" value={Math.round(element.opacity * 100)} onChange={(v) => onUpdateElement({ opacity: Math.min(1, Math.max(0, v / 100)) })} unit="%" />
          </div>
          <div className="flex gap-3 mt-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={element.flipX}
                onChange={(e) => onUpdateElement({ flipX: e.target.checked })}
                className="w-3 h-3 accent-gold-500"
              />
              <span className="text-xs font-noto text-gray-600">عكس أفقي</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={element.flipY}
                onChange={(e) => onUpdateElement({ flipY: e.target.checked })}
                className="w-3 h-3 accent-gold-500"
              />
              <span className="text-xs font-noto text-gray-600">عكس رأسي</span>
            </label>
          </div>
        </Section>

        {element.type === 'text' && (
          <Section title="النص">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">المحتوى</label>
                <textarea
                  value={element.content || ''}
                  onChange={(e) => onUpdateElement({ content: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 rounded-lg border text-sm font-noto outline-none resize-none"
                  style={{ borderColor: 'rgba(201,168,76,0.3)', direction: 'rtl' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">الخط</label>
                <select
                  value={s.fontFamily || 'Amiri'}
                  onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                >
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="الحجم" value={s.fontSize || 16} onChange={(v) => updateStyle({ fontSize: v })} unit="px" />
                <div>
                  <label className="text-xs text-gray-500 font-noto block mb-1">السماكة</label>
                  <select
                    value={s.fontWeight || '400'}
                    onChange={(e) => updateStyle({ fontWeight: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                    style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                  >
                    {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">المحاذاة</label>
                <div className="flex gap-1">
                  {[
                    { value: 'right', label: '←' },
                    { value: 'center', label: '↔' },
                    { value: 'left', label: '→' },
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() => updateStyle({ textAlign: align.value as 'right' | 'center' | 'left' })}
                      className="flex-1 py-1.5 rounded-lg text-sm border transition-colors"
                      style={{
                        borderColor: s.textAlign === align.value ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                        background: s.textAlign === align.value ? 'rgba(201,168,76,0.15)' : 'transparent',
                        color: s.textAlign === align.value ? '#9A7020' : '#6B7280',
                      }}
                    >
                      {align.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="ارتفاع السطر" value={s.lineHeight || 1.5} step={0.1} onChange={(v) => updateStyle({ lineHeight: v })} />
                <NumberInput label="تباعد الحروف" value={s.letterSpacing || 0} onChange={(v) => updateStyle({ letterSpacing: v })} unit="px" />
              </div>
              <ColorField
                label="لون النص"
                value={s.color || '#000000'}
                isOpen={colorTarget === 'color'}
                onToggle={() => setColorTarget(colorTarget === 'color' ? null : 'color')}
                onChange={(c) => updateStyle({ color: c })}
              />
              <ColorField
                label="خلفية النص"
                value={s.backgroundColor || 'transparent'}
                isOpen={colorTarget === 'textBg'}
                onToggle={() => setColorTarget(colorTarget === 'textBg' ? null : 'textBg')}
                onChange={(c) => updateStyle({ backgroundColor: c })}
                allowTransparent
              />
            </div>
          </Section>
        )}

        {element.type === 'shape' && (
          <Section title="الشكل">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">نوع الشكل</label>
                <select
                  value={element.shapeType || 'rectangle'}
                  onChange={(e) => onUpdateElement({ shapeType: e.target.value as 'rectangle' | 'circle' | 'line' | 'diamond' })}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                >
                  <option value="rectangle">مستطيل</option>
                  <option value="circle">دائرة</option>
                  <option value="line">خط</option>
                  <option value="diamond">معين</option>
                </select>
              </div>
              <ColorField
                label="لون الخلفية"
                value={s.backgroundColor || 'transparent'}
                isOpen={colorTarget === 'shapeBg'}
                onToggle={() => setColorTarget(colorTarget === 'shapeBg' ? null : 'shapeBg')}
                onChange={(c) => updateStyle({ backgroundColor: c })}
                allowTransparent
              />
              <ColorField
                label="لون الحدود"
                value={s.borderColor || '#C9A84C'}
                isOpen={colorTarget === 'borderColor'}
                onToggle={() => setColorTarget(colorTarget === 'borderColor' ? null : 'borderColor')}
                onChange={(c) => updateStyle({ borderColor: c })}
              />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="سماكة الحدود" value={s.borderWidth || 0} onChange={(v) => updateStyle({ borderWidth: v })} unit="px" />
                <NumberInput label="استدارة الزوايا" value={s.borderRadius || 0} onChange={(v) => updateStyle({ borderRadius: v })} unit="px" />
              </div>
            </div>
          </Section>
        )}

        {element.type === 'image' && (
          <Section title="الصورة">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">رابط الصورة</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={imageUrl || element.src || ''}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                    style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                  />
                  <button
                    onClick={() => { onUpdateElement({ src: imageUrl }); setImageUrl(''); }}
                    className="px-2 py-1.5 rounded-lg text-xs font-noto"
                    style={{ background: 'rgba(201,168,76,0.2)', color: '#9A7020' }}
                  >
                    تطبيق
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">ملاءمة الصورة</label>
                <select
                  value={s.objectFit || 'cover'}
                  onChange={(e) => updateStyle({ objectFit: e.target.value as 'cover' | 'contain' | 'fill' })}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                >
                  <option value="cover">تغطية</option>
                  <option value="contain">احتواء</option>
                  <option value="fill">تمديد</option>
                </select>
              </div>
              <NumberInput label="استدارة الزوايا" value={s.borderRadius || 0} onChange={(v) => updateStyle({ borderRadius: v })} unit="px" />
            </div>
          </Section>
        )}

        {element.type === 'ornament' && (
          <Section title="الزخرفة">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">نوع الزخرفة</label>
                <select
                  value={element.ornamentType || 'divider-ornate'}
                  onChange={(e) => onUpdateElement({ ornamentType: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                >
                  <option value="divider-ornate">فاصل منقوش</option>
                  <option value="divider-simple">فاصل بسيط</option>
                  <option value="divider-line">خط بسيط</option>
                </select>
              </div>
              <ColorField
                label="اللون"
                value={s.color || '#C9A84C'}
                isOpen={colorTarget === 'ornamentColor'}
                onToggle={() => setColorTarget(colorTarget === 'ornamentColor' ? null : 'ornamentColor')}
                onChange={(c) => updateStyle({ color: c })}
              />
            </div>
          </Section>
        )}

        {element.type === 'countdown' && (
          <Section title="العداد التنازلي">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-noto block mb-1">نص تحت العداد</label>
                <input
                  type="text"
                  value={element.content || ''}
                  onChange={(e) => onUpdateElement({ content: e.target.value })}
                  placeholder="حتى موعد الزفاف..."
                  className="w-full px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                />
              </div>
              <NumberInput label="حجم الأرقام" value={s.fontSize || 24} onChange={(v) => updateStyle({ fontSize: v })} unit="px" />
              <ColorField
                label="لون الأرقام"
                value={s.color || '#C9A84C'}
                isOpen={colorTarget === 'countdownColor'}
                onToggle={() => setColorTarget(colorTarget === 'countdownColor' ? null : 'countdownColor')}
                onChange={(c) => updateStyle({ color: c })}
              />
              <ColorField
                label="لون الخلفية"
                value={s.backgroundColor || 'rgba(201,168,76,0.1)'}
                isOpen={colorTarget === 'countdownBg'}
                onToggle={() => setColorTarget(colorTarget === 'countdownBg' ? null : 'countdownBg')}
                onChange={(c) => updateStyle({ backgroundColor: c })}
                allowTransparent
              />
            </div>
          </Section>
        )}

        {['shape', 'text', 'image'].includes(element.type) && (
          <Section title="الظل">
            <div className="space-y-2">
              <NumberInput label="ضبابية الظل" value={s.shadowBlur || 0} onChange={(v) => updateStyle({ shadowBlur: v })} unit="px" />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="إزاحة X" value={s.shadowOffsetX || 0} onChange={(v) => updateStyle({ shadowOffsetX: v })} unit="px" />
                <NumberInput label="إزاحة Y" value={s.shadowOffsetY || 0} onChange={(v) => updateStyle({ shadowOffsetY: v })} unit="px" />
              </div>
              <ColorField
                label="لون الظل"
                value={s.shadowColor || 'rgba(0,0,0,0.2)'}
                isOpen={colorTarget === 'shadow'}
                onToggle={() => setColorTarget(colorTarget === 'shadow' ? null : 'shadow')}
                onChange={(c) => updateStyle({ shadowColor: c })}
              />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-xs font-noto font-bold" style={{ color: '#374151' }}>{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  unit,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-noto block mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 px-2 py-1.5 rounded-lg border text-xs font-noto outline-none text-center"
          style={{ borderColor: 'rgba(201,168,76,0.3)' }}
        />
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  isOpen,
  onToggle,
  onChange,
  allowTransparent,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (c: string) => void;
  allowTransparent?: boolean;
}) {
  const isTransparent = value === 'transparent' || value === '';
  const displayColor = isTransparent ? '#ffffff' : value;

  return (
    <div>
      <label className="text-xs text-gray-500 font-noto block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="w-8 h-7 rounded-lg border-2 transition-all"
          style={{
            backgroundColor: isTransparent ? 'transparent' : value,
            borderColor: isOpen ? '#C9A84C' : 'rgba(201,168,76,0.3)',
            background: isTransparent
              ? 'repeating-linear-gradient(45deg, #eee, #eee 3px, white 3px, white 6px)'
              : value,
          }}
        />
        <input
          type="text"
          value={isTransparent ? 'transparent' : value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
          style={{ borderColor: 'rgba(201,168,76,0.3)' }}
        />
        {allowTransparent && (
          <button
            onClick={() => onChange('transparent')}
            className="text-xs font-noto px-1.5 py-1 rounded-lg transition-colors"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#9A7020' }}
          >
            شفاف
          </button>
        )}
      </div>
      {isOpen && !isTransparent && (
        <div className="mt-2 rounded-lg overflow-hidden shadow-lg z-50">
          <HexColorPicker color={displayColor} onChange={onChange} />
          <div className="p-2 bg-white flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-2 py-1 rounded-lg border text-xs font-noto outline-none"
              style={{ borderColor: 'rgba(201,168,76,0.3)' }}
              placeholder="#C9A84C"
            />
          </div>
        </div>
      )}
    </div>
  );
}
