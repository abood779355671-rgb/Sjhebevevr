'use client';

import React from 'react';
import type { CanvasElement } from '@/lib/types';

interface Props {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelectElement: (id: string, multi?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicateElement: (id: string) => void;
}

export function LayersPanel({
  elements,
  selectedIds,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onDeleteElement,
  onMoveUp,
  onMoveDown,
  onDuplicateElement,
}: Props) {
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const typeIcons: Record<string, string> = {
    text: 'T',
    shape: '▢',
    image: '🖼',
    ornament: '❧',
    divider: '—',
    countdown: '⏱',
    qrcode: '⊞',
  };

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <div
        className="px-3 py-2.5 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(201,168,76,0.15)', background: 'rgba(201,168,76,0.03)' }}
      >
        <span className="text-xs font-noto font-bold" style={{ color: '#0D1B3E' }}>
          الطبقات ({elements.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 font-noto">
            لا توجد عناصر
          </div>
        ) : (
          sorted.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                className="flex items-center gap-1.5 px-2 py-2 cursor-pointer group transition-colors border-b"
                style={{
                  borderColor: 'rgba(0,0,0,0.04)',
                  background: isSelected
                    ? 'linear-gradient(to left, rgba(201,168,76,0.15), rgba(201,168,76,0.05))'
                    : 'transparent',
                }}
                onClick={(e) => onSelectElement(el.id, e.shiftKey)}
              >
                <span
                  className="flex-shrink-0 text-xs w-5 text-center"
                  style={{ color: '#C9A84C', opacity: 0.8 }}
                >
                  {typeIcons[el.type] || '?'}
                </span>

                <span
                  className="flex-1 text-xs font-noto truncate"
                  style={{
                    color: isSelected ? '#0D1B3E' : '#374151',
                    fontWeight: isSelected ? 600 : 400,
                    textDecoration: !el.visible ? 'line-through' : 'none',
                    opacity: !el.visible ? 0.5 : 1,
                  }}
                >
                  {el.name}
                </span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveUp(el.id); }}
                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="تقديم"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveDown(el.id); }}
                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="تأخير"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicateElement(el.id); }}
                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="تكرار"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(el.id); }}
                  className="flex-shrink-0 p-0.5 rounded transition-colors"
                  style={{ color: el.visible ? '#9CA3AF' : '#D1D5DB' }}
                  title={el.visible ? 'إخفاء' : 'إظهار'}
                >
                  {el.visible ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
                  className="flex-shrink-0 p-0.5 rounded transition-colors"
                  style={{ color: el.locked ? '#C9A84C' : '#D1D5DB' }}
                  title={el.locked ? 'فتح' : 'قفل'}
                >
                  {el.locked ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  )}
                </button>

                {!el.locked && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                    className="flex-shrink-0 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500"
                    title="حذف"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
