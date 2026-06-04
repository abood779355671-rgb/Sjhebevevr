'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import type { CanvasElement, InvitationData, ElementType } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';

type HistoryEntry = CanvasElement[];

const ELEMENT_DEFAULTS: Record<ElementType, Partial<CanvasElement>> = {
  text: {
    width: 300,
    height: 60,
    content: 'نص جديد',
    styles: { fontFamily: 'Amiri', fontSize: 24, fontWeight: '400', color: '#2C1810', textAlign: 'center', lineHeight: 1.5 },
  },
  shape: {
    width: 200,
    height: 100,
    shapeType: 'rectangle',
    styles: { backgroundColor: '#C9A84C', borderWidth: 0 },
  },
  image: {
    width: 200,
    height: 200,
    src: '',
    styles: { objectFit: 'cover', borderRadius: 8 },
  },
  ornament: {
    width: 400,
    height: 60,
    ornamentType: 'divider-ornate',
    styles: { color: '#C9A84C' },
  },
  divider: {
    width: 600,
    height: 20,
    styles: { backgroundColor: '#C9A84C', borderWidth: 2 },
  },
  countdown: {
    width: 400,
    height: 100,
    content: 'حتى موعد الزفاف',
    styles: { color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)', fontSize: 28, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 12 },
  },
  qrcode: {
    width: 150,
    height: 150,
    styles: { backgroundColor: '#ffffff' },
  },
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 12);
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { authHeaders } = useAuth();
  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [zoom, setZoom] = useState(0.6);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [backgroundColor, setBackgroundColor] = useState('#FFFDF5');
  const [activePanel, setActivePanel] = useState<'layers' | 'elements'>('layers');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  useEffect(() => {
    setSaveStatus('unsaved');
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      autoSave();
    }, 120000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [elements, backgroundColor]);

  async function loadInvitation() {
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.invitation) {
        setInvitation(data.invitation);
        const els = data.invitation.elements || [];
        setElements(els);
        setBackgroundColor(data.invitation.background_color || '#FFFDF5');
        pushHistory(els);
        setSaveStatus('saved');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function pushHistory(els: CanvasElement[]) {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(JSON.parse(JSON.stringify(els)));
    historyRef.current = newHistory.slice(-50);
    historyIndexRef.current = historyRef.current.length - 1;
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const prev = historyRef.current[historyIndexRef.current];
    setElements(JSON.parse(JSON.stringify(prev)));
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const next = historyRef.current[historyIndexRef.current];
    setElements(JSON.parse(JSON.stringify(next)));
  }

  async function save(showFeedback = true) {
    if (!invitation) return;
    if (showFeedback) setIsSaving(true);
    setSaveStatus('saving');

    await fetch(`/api/invitations/${invitationId}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements, background_color: backgroundColor }),
    });

    await fetch(`/api/invitations/${invitationId}/history`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements }),
    });

    setSaveStatus('saved');
    if (showFeedback) setIsSaving(false);
  }

  async function autoSave() {
    await save(false);
  }

  function updateElement(id: string, updates: Partial<CanvasElement>) {
    setElements((prev) => {
      const next = prev.map((el) => (el.id === id ? { ...el, ...updates } : el));
      return next;
    });
  }

  function updateSelectedElement(updates: Partial<CanvasElement>) {
    if (selectedIds.length !== 1) return;
    updateElement(selectedIds[0], updates);
  }

  const handleUpdateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  }, []);

  function commitChange(newElements: CanvasElement[]) {
    setElements(newElements);
    pushHistory(newElements);
  }

  function addElement(type: ElementType) {
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    const defaults = ELEMENT_DEFAULTS[type];
    const canvasW = invitation?.canvas_width || 800;
    const canvasH = invitation?.canvas_height || 1200;

    const newEl: CanvasElement = {
      id: generateId(),
      type,
      name: getElementDefaultName(type),
      x: Math.round(canvasW / 2 - (defaults.width || 200) / 2),
      y: Math.round(canvasH / 2 - (defaults.height || 100) / 2),
      width: defaults.width || 200,
      height: defaults.height || 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      flipX: false,
      flipY: false,
      zIndex: maxZ + 1,
      ...defaults,
    };

    const next = [...elements, newEl];
    commitChange(next);
    setSelectedIds([newEl.id]);
  }

  function getElementDefaultName(type: ElementType): string {
    const counts = elements.filter((el) => el.type === type).length + 1;
    const names: Record<ElementType, string> = {
      text: `نص ${counts}`,
      shape: `شكل ${counts}`,
      image: `صورة ${counts}`,
      ornament: `زخرفة ${counts}`,
      divider: `فاصل ${counts}`,
      countdown: `عداد ${counts}`,
      qrcode: `QR Code ${counts}`,
    };
    return names[type];
  }

  function deleteElements(ids: string[]) {
    const next = elements.filter((el) => !ids.includes(el.id));
    commitChange(next);
    setSelectedIds([]);
  }

  function duplicateElement(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl: CanvasElement = {
      ...JSON.parse(JSON.stringify(el)),
      id: generateId(),
      x: el.x + 20,
      y: el.y + 20,
      name: `نسخة ${el.name}`,
      zIndex: el.zIndex + 1,
    };
    const next = [...elements, newEl];
    commitChange(next);
    setSelectedIds([newEl.id]);
  }

  function moveElementUp(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const next = elements.map((e) => (e.id === id ? { ...e, zIndex: e.zIndex + 1 } : e));
    commitChange(next);
  }

  function moveElementDown(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const next = elements.map((e) => (e.id === id ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e));
    commitChange(next);
  }

  function toggleVisibility(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const next = elements.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e));
    setElements(next);
  }

  function toggleLock(id: string) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const next = elements.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e));
    setElements(next);
    if (el.locked === false) setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  }

  async function saveAsTemplate() {
    if (!templateName) return;
    await fetch('/api/templates', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName,
        elements,
        canvas_width: invitation?.canvas_width || 800,
        canvas_height: invitation?.canvas_height || 1200,
        is_custom: true,
      }),
    });
    setShowSaveTemplate(false);
    setTemplateName('');
  }

  function copyText() {
    if (selectedIds.length !== 1) return;
    const el = elements.find((e) => e.id === selectedIds[0]);
    if (el && el.type === 'text') {
      const dup = { ...JSON.parse(JSON.stringify(el)), id: generateId() };
      navigator.clipboard.writeText(JSON.stringify(dup));
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 's') { e.preventDefault(); save(); }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [elements, backgroundColor]);

  const selectedElement = selectedIds.length === 1 ? elements.find((e) => e.id === selectedIds[0]) || null : null;
  const canvasW = invitation?.canvas_width || 800;
  const canvasH = invitation?.canvas_height || 1200;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A2E' }}>
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

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${invitation?.slug}` : '';

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#1A1A2E' }} dir="rtl">
      <header
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ background: '#0D1B3E', borderColor: 'rgba(201,168,76,0.2)', height: 52 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/invitations')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-noto transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
            عودة
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-sm font-amiri gold-text font-bold">
            {invitation?.title || 'محرر الدعوة'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="تراجع (Ctrl+Z)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={redo}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="إعادة (Ctrl+Y)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="p-0.5 text-gray-400 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={() => setZoom(0.6)}
              className="text-xs font-noto text-gray-300 min-w-[40px] text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-0.5 text-gray-400 hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-noto cursor-pointer transition-colors"
            style={{ color: snapToGrid ? '#F5D78E' : 'rgba(255,255,255,0.5)', background: snapToGrid ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)' }}>
            <input type="checkbox" className="hidden" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
            شبكة
          </label>

          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-noto transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            معاينة
          </button>

          <button
            onClick={() => setShowSaveTemplate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-noto transition-colors"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#F5D78E' }}
          >
            حفظ كقالب
          </button>

          <button
            onClick={() => save()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-noto font-bold transition-all disabled:opacity-70"
            style={{
              background: saveStatus === 'saved' ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #C9A84C, #F5D78E)',
              color: saveStatus === 'saved' ? '#10B981' : '#0D1B3E',
            }}
          >
            {saveStatus === 'saving' ? 'جارٍ الحفظ...' : saveStatus === 'saved' ? '✓ محفوظ' : 'حفظ'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex-shrink-0 flex flex-col border-l"
          style={{ width: 200, background: '#0D1B3E', borderColor: 'rgba(201,168,76,0.15)' }}
        >
          <div className="flex border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
            <button
              onClick={() => setActivePanel('elements')}
              className="flex-1 py-2.5 text-xs font-noto font-bold transition-colors"
              style={{
                background: activePanel === 'elements' ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: activePanel === 'elements' ? '#F5D78E' : 'rgba(255,255,255,0.4)',
              }}
            >
              عناصر
            </button>
            <button
              onClick={() => setActivePanel('layers')}
              className="flex-1 py-2.5 text-xs font-noto font-bold transition-colors"
              style={{
                background: activePanel === 'layers' ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: activePanel === 'layers' ? '#F5D78E' : 'rgba(255,255,255,0.4)',
              }}
            >
              طبقات
            </button>
          </div>

          {activePanel === 'elements' ? (
            <ElementsPanel onAdd={addElement} backgroundColor={backgroundColor} onBgChange={setBackgroundColor} />
          ) : (
            <div className="flex-1 overflow-hidden bg-white/5">
              <LayersPanel
                elements={elements}
                selectedIds={selectedIds}
                onSelectElement={(id, multi) => {
                  if (multi) {
                    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
                  } else {
                    setSelectedIds([id]);
                  }
                }}
                onToggleVisibility={toggleVisibility}
                onToggleLock={toggleLock}
                onDeleteElement={(id) => deleteElements([id])}
                onMoveUp={moveElementUp}
                onMoveDown={moveElementDown}
                onDuplicateElement={duplicateElement}
              />
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-auto flex items-start justify-center p-8" style={{ background: '#262640' }}>
          <EditorCanvas
            elements={elements}
            selectedIds={selectedIds}
            canvasWidth={canvasW}
            canvasHeight={canvasH}
            backgroundColor={backgroundColor}
            zoom={zoom}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onSelectElements={setSelectedIds}
            onUpdateElement={handleUpdateElement}
            onDeleteElements={deleteElements}
          />
        </main>

        <aside
          className="flex-shrink-0 border-r overflow-hidden"
          style={{ width: 220, background: 'white', borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <PropertiesPanel
            element={selectedElement}
            onUpdateElement={updateSelectedElement}
            invitationId={invitationId}
          />
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 max-h-screen overflow-auto py-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewDevice('mobile')}
                className="px-4 py-2 rounded-xl text-sm font-noto font-bold transition-all"
                style={{
                  background: previewDevice === 'mobile' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.1)',
                  color: previewDevice === 'mobile' ? '#F5D78E' : 'rgba(255,255,255,0.5)',
                }}
              >
                موبايل
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className="px-4 py-2 rounded-xl text-sm font-noto font-bold transition-all"
                style={{
                  background: previewDevice === 'desktop' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.1)',
                  color: previewDevice === 'desktop' ? '#F5D78E' : 'rgba(255,255,255,0.5)',
                }}
              >
                ديسكتوب
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2 rounded-xl text-sm font-noto transition-colors"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#F5D78E' }}
              >
                QR Code
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div
              className="overflow-hidden rounded-3xl shadow-2xl relative"
              style={{
                width: previewDevice === 'mobile' ? 390 : 800,
                maxHeight: previewDevice === 'mobile' ? 760 : 700,
                border: previewDevice === 'mobile' ? '12px solid #1A1A2E' : 'none',
                borderRadius: previewDevice === 'mobile' ? 40 : 8,
              }}
            >
              <div
                className="overflow-auto"
                style={{ maxHeight: previewDevice === 'mobile' ? 736 : 700 }}
              >
                <div
                  style={{
                    width: canvasW,
                    height: canvasH,
                    transform: previewDevice === 'mobile' ? `scale(${366 / canvasW})` : `scale(${800 / canvasW})`,
                    transformOrigin: 'top right',
                    backgroundColor,
                    position: 'relative',
                  }}
                >
                  {[...elements]
                    .filter((el) => el.visible)
                    .sort((a, b) => a.zIndex - b.zIndex)
                    .map((el) => (
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
                          fontFamily: el.styles?.fontFamily || 'Amiri',
                          fontSize: el.styles?.fontSize || 16,
                          fontWeight: el.styles?.fontWeight || '400',
                          color: el.styles?.color || '#000',
                          textAlign: el.styles?.textAlign || 'center',
                          lineHeight: el.styles?.lineHeight || 1.5,
                          backgroundColor: el.styles?.backgroundColor || 'transparent',
                          borderColor: el.styles?.borderColor || 'transparent',
                          borderWidth: el.styles?.borderWidth || 0,
                          borderStyle: el.styles?.borderWidth ? 'solid' : 'none',
                          borderRadius: el.styles?.borderRadius || 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: el.styles?.textAlign === 'right' ? 'flex-end' : el.styles?.textAlign === 'left' ? 'flex-start' : 'center',
                          padding: el.styles?.padding || 4,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                        }}
                      >
                        {el.type === 'text' ? el.content || '' : null}
                        {el.type === 'image' && el.src ? (
                          <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: (el.styles?.objectFit || 'cover') as 'cover' | 'contain' | 'fill' }} />
                        ) : null}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl" dir="rtl">
            <h3 className="font-bold font-amiri text-lg mb-4" style={{ color: '#0D1B3E' }}>حفظ كقالب</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="اسم القالب..."
              className="w-full px-3 py-2 rounded-xl border text-sm font-noto outline-none mb-4"
              style={{ borderColor: 'rgba(201,168,76,0.3)' }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveAsTemplate}
                disabled={!templateName}
                className="flex-1 py-2.5 rounded-xl text-sm font-noto font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
              >
                حفظ
              </button>
              <button
                onClick={() => setShowSaveTemplate(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-noto text-gray-500 hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && inviteUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4" dir="rtl">
            <h3 className="font-bold font-amiri text-xl" style={{ color: '#0D1B3E' }}>QR Code للدعوة</h3>
            <QRCodeSVG value={inviteUrl} size={200} level="H" />
            <p className="text-xs font-noto text-gray-400 text-center max-w-48 break-all">{inviteUrl}</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-noto font-bold"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #F5D78E)', color: '#0D1B3E' }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ElementsPanel({ onAdd, backgroundColor, onBgChange }: {
  onAdd: (type: ElementType) => void;
  backgroundColor: string;
  onBgChange: (c: string) => void;
}) {
  const elements: { type: ElementType; label: string; icon: string }[] = [
    { type: 'text', label: 'نص', icon: 'T' },
    { type: 'shape', label: 'شكل', icon: '▢' },
    { type: 'image', label: 'صورة', icon: '🖼' },
    { type: 'ornament', label: 'زخرفة', icon: '❧' },
    { type: 'divider', label: 'فاصل', icon: '—' },
    { type: 'countdown', label: 'عداد', icon: '⏱' },
    { type: 'qrcode', label: 'QR Code', icon: '⊞' },
  ];

  return (
    <div className="flex-1 overflow-y-auto scroll-hidden p-3" dir="rtl">
      <p className="text-xs font-noto mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        اضغط لإضافة عنصر
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {elements.map((el) => (
          <button
            key={el.type}
            onClick={() => onAdd(el.type)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <span style={{ color: '#C9A84C', fontSize: el.icon.length > 2 ? 14 : 18 }}>{el.icon}</span>
            <span className="text-xs font-noto" style={{ color: 'rgba(255,255,255,0.7)' }}>{el.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t pt-3" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <p className="text-xs font-noto mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>خلفية الكانفاس</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBgChange(e.target.value)}
            className="w-10 h-8 rounded-lg border cursor-pointer"
            style={{ borderColor: 'rgba(201,168,76,0.3)' }}
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => onBgChange(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg border text-xs font-noto outline-none"
            style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(255,255,255,0.08)', color: 'white' }}
          />
        </div>
      </div>
    </div>
  );
}
