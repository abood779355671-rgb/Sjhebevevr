'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasElement, ElementStyles } from '@/lib/types';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Props {
  elements: CanvasElement[];
  selectedIds: string[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  onSelectElements: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
}

const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 24;
const MIN_SIZE = 20;

type DragMode = 'move' | 'resize' | 'rotate' | 'select-box' | null;
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function EditorCanvas({
  elements,
  selectedIds,
  canvasWidth,
  canvasHeight,
  backgroundColor,
  zoom,
  snapToGrid,
  gridSize,
  onSelectElements,
  onUpdateElement,
  onDeleteElements,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartState, setElementStartState] = useState<Record<string, { x: number; y: number; width: number; height: number; rotation: number }>>({});
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [showGuides, setShowGuides] = useState<{ x?: number; y?: number }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const snap = useCallback((v: number) => {
    if (!snapToGrid) return v;
    return Math.round(v / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  function getCanvasPoint(e: React.MouseEvent): { x: number; y: number } {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }

  function getSortedElements(): CanvasElement[] {
    return [...elements].sort((a, b) => a.zIndex - b.zIndex);
  }

  function onCanvasMouseDown(e: React.MouseEvent) {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'bg') {
      const pt = getCanvasPoint(e);
      if (e.shiftKey) {
        setSelectionBox({ startX: pt.x, startY: pt.y, endX: pt.x, endY: pt.y });
        setDragMode('select-box');
      } else {
        onSelectElements([]);
        setSelectionBox({ startX: pt.x, startY: pt.y, endX: pt.x, endY: pt.y });
        setDragMode('select-box');
      }
    }
  }

  function onElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    if (el.locked) return;
    e.stopPropagation();

    if (e.detail === 2) {
      if (el.type === 'text') {
        setEditingId(el.id);
        return;
      }
    }

    const pt = getCanvasPoint(e);
    const isSelected = selectedIds.includes(el.id);

    if (e.shiftKey) {
      onSelectElements(isSelected ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id]);
    } else if (!isSelected) {
      onSelectElements([el.id]);
    }

    const startState: Record<string, { x: number; y: number; width: number; height: number; rotation: number }> = {};
    const idsToMove = e.shiftKey
      ? isSelected ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id]
      : isSelected ? selectedIds : [el.id];

    for (const id of idsToMove) {
      const found = elements.find((elem) => elem.id === id);
      if (found) {
        startState[id] = { x: found.x, y: found.y, width: found.width, height: found.height, rotation: found.rotation };
      }
    }

    setElementStartState(startState);
    setDragStart(pt);
    setDragMode('move');
  }

  function onResizeHandleMouseDown(e: React.MouseEvent, el: CanvasElement, handle: ResizeHandle) {
    if (el.locked) return;
    e.stopPropagation();
    const pt = getCanvasPoint(e);
    setDragStart(pt);
    setElementStartState({
      [el.id]: { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation },
    });
    setResizeHandle(handle);
    setDragMode('resize');
    if (!selectedIds.includes(el.id)) onSelectElements([el.id]);
  }

  function onRotateHandleMouseDown(e: React.MouseEvent, el: CanvasElement) {
    if (el.locked) return;
    e.stopPropagation();
    setDragMode('rotate');
    setElementStartState({
      [el.id]: { x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation },
    });
    if (!selectedIds.includes(el.id)) onSelectElements([el.id]);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragMode) return;
    const pt = getCanvasPoint(e);
    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;

    if (dragMode === 'select-box' && selectionBox) {
      setSelectionBox({ ...selectionBox, endX: pt.x, endY: pt.y });

      const minX = Math.min(selectionBox.startX, pt.x);
      const maxX = Math.max(selectionBox.startX, pt.x);
      const minY = Math.min(selectionBox.startY, pt.y);
      const maxY = Math.max(selectionBox.startY, pt.y);

      const intersecting = elements
        .filter((el) => !el.locked)
        .filter((el) => el.x < maxX && el.x + el.width > minX && el.y < maxY && el.y + el.height > minY)
        .map((el) => el.id);

      onSelectElements(intersecting);
      return;
    }

    if (dragMode === 'move') {
      const guides: { x?: number; y?: number } = {};
      for (const id of Object.keys(elementStartState)) {
        const start = elementStartState[id];
        let newX = snap(start.x + dx);
        let newY = snap(start.y + dy);

        if (Math.abs(newX) < 8) { newX = 0; guides.x = 0; }
        if (Math.abs(newX + elementStartState[id].width - canvasWidth) < 8) { newX = canvasWidth - elementStartState[id].width; guides.x = canvasWidth; }
        if (Math.abs(newX + elementStartState[id].width / 2 - canvasWidth / 2) < 8) { newX = canvasWidth / 2 - elementStartState[id].width / 2; guides.x = canvasWidth / 2; }
        if (Math.abs(newY) < 8) { newY = 0; guides.y = 0; }
        if (Math.abs(newY + elementStartState[id].height - canvasHeight) < 8) { newY = canvasHeight - elementStartState[id].height; guides.y = canvasHeight; }
        if (Math.abs(newY + elementStartState[id].height / 2 - canvasHeight / 2) < 8) { newY = canvasHeight / 2 - elementStartState[id].height / 2; guides.y = canvasHeight / 2; }

        onUpdateElement(id, { x: newX, y: newY });
      }
      setShowGuides(guides);
      return;
    }

    if (dragMode === 'resize' && resizeHandle) {
      const elId = selectedIds[0];
      const start = elementStartState[elId];
      if (!start) return;

      let newX = start.x;
      let newY = start.y;
      let newW = start.width;
      let newH = start.height;

      if (resizeHandle.includes('e')) newW = Math.max(MIN_SIZE, snap(start.width + dx));
      if (resizeHandle.includes('s')) newH = Math.max(MIN_SIZE, snap(start.height + dy));
      if (resizeHandle.includes('w')) {
        newW = Math.max(MIN_SIZE, snap(start.width - dx));
        newX = snap(start.x + start.width - newW);
      }
      if (resizeHandle.includes('n')) {
        newH = Math.max(MIN_SIZE, snap(start.height - dy));
        newY = snap(start.y + start.height - newH);
      }

      onUpdateElement(elId, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    if (dragMode === 'rotate') {
      const elId = selectedIds[0];
      const el = elements.find((elem) => elem.id === elId);
      if (!el) return;

      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const angle = Math.atan2(pt.y - cy, pt.x - cx) * (180 / Math.PI) + 90;
      const snapped = snap(Math.round(angle));
      onUpdateElement(elId, { rotation: ((snapped % 360) + 360) % 360 });
    }
  }

  function onMouseUp() {
    setDragMode(null);
    setResizeHandle(null);
    setSelectionBox(null);
    setShowGuides({});
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (editingId) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) {
        const locked = elements.filter((el) => selectedIds.includes(el.id) && el.locked);
        if (locked.length === 0) {
          onDeleteElements(selectedIds);
        }
      }

      const STEP = e.shiftKey ? 10 : 1;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length) {
        e.preventDefault();
        for (const id of selectedIds) {
          const el = elements.find((elem) => elem.id === id);
          if (!el || el.locked) continue;
          const updates: Partial<CanvasElement> = {};
          if (e.key === 'ArrowUp') updates.y = el.y - STEP;
          if (e.key === 'ArrowDown') updates.y = el.y + STEP;
          if (e.key === 'ArrowLeft') updates.x = el.x + STEP;
          if (e.key === 'ArrowRight') updates.x = el.x - STEP;
          onUpdateElement(id, updates);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, editingId, onDeleteElements, onUpdateElement]);

  const sortedElements = getSortedElements();

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: canvasWidth * zoom,
        height: canvasHeight * zoom,
        transform: `scale(1)`,
        transformOrigin: 'top right',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        ref={canvasRef}
        className="relative editor-canvas"
        data-canvas="bg"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor,
          transform: `scale(${zoom})`,
          transformOrigin: 'top right',
          userSelect: 'none',
        }}
        onMouseDown={onCanvasMouseDown}
      >
        {snapToGrid && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasWidth}
            height={canvasHeight}
            style={{ opacity: 0.1 }}
          >
            <defs>
              <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#C9A84C" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {showGuides.x !== undefined && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-50"
            style={{ left: showGuides.x, width: 1, background: '#C9A84C', opacity: 0.8 }}
          />
        )}
        {showGuides.y !== undefined && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-50"
            style={{ top: showGuides.y, height: 1, background: '#C9A84C', opacity: 0.8 }}
          />
        )}

        {sortedElements.filter((el) => el.visible).map((el) => (
          <ElementRenderer
            key={el.id}
            element={el}
            isSelected={selectedIds.includes(el.id)}
            isEditing={editingId === el.id}
            zoom={zoom}
            onMouseDown={(e) => onElementMouseDown(e, el)}
            onResizeHandle={(e, h) => onResizeHandleMouseDown(e, el, h)}
            onRotateHandle={(e) => onRotateHandleMouseDown(e, el)}
            onTextEdit={(text) => { onUpdateElement(el.id, { content: text }); }}
            onEndEdit={() => setEditingId(null)}
          />
        ))}

        {selectionBox && dragMode === 'select-box' && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
              border: '1.5px dashed #C9A84C',
              background: 'rgba(201,168,76,0.05)',
            }}
          />
        )}
      </div>
    </div>
  );
}

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeHandle: (e: React.MouseEvent, h: ResizeHandle) => void;
  onRotateHandle: (e: React.MouseEvent) => void;
  onTextEdit: (text: string) => void;
  onEndEdit: () => void;
}

function ElementRenderer({
  element: el,
  isSelected,
  isEditing,
  zoom,
  onMouseDown,
  onResizeHandle,
  onRotateHandle,
  onTextEdit,
  onEndEdit,
}: ElementRendererProps) {
  const s = el.styles || {};
  const transform = `rotate(${el.rotation}deg) ${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}`.trim();

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    transform,
    transformOrigin: 'center center',
    opacity: el.opacity,
    cursor: el.locked ? 'default' : 'move',
    outline: isSelected ? '2px solid #C9A84C' : '2px solid transparent',
    outlineOffset: '1px',
    boxSizing: 'border-box',
  };

  function renderContent() {
    switch (el.type) {
      case 'text':
        return (
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
              textDecoration: s.textDecoration || 'none',
              backgroundColor: s.backgroundColor || 'transparent',
              padding: s.padding ? `${s.padding}px` : '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: s.textAlign === 'right' ? 'flex-end' : s.textAlign === 'left' ? 'flex-start' : 'center',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textShadow: s.shadowBlur ? `${s.shadowOffsetX || 0}px ${s.shadowOffsetY || 0}px ${s.shadowBlur}px ${s.shadowColor || '#000'}` : 'none',
            }}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => { onTextEdit(e.currentTarget.textContent || ''); onEndEdit(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { onEndEdit(); } }}
            dangerouslySetInnerHTML={!isEditing ? { __html: (el.content || '').replace(/\n/g, '<br/>') } : undefined}
          >
            {isEditing ? el.content : undefined}
          </div>
        );

      case 'shape':
        if (el.shapeType === 'circle') {
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: s.backgroundColor || '#C9A84C',
                border: `${s.borderWidth || 0}px ${s.borderStyle || 'solid'} ${s.borderColor || 'transparent'}`,
              }}
            />
          );
        }
        if (el.shapeType === 'diamond') {
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotate(45deg)',
                backgroundColor: s.backgroundColor || '#C9A84C',
                border: `${s.borderWidth || 0}px ${s.borderStyle || 'solid'} ${s.borderColor || 'transparent'}`,
              }}
            />
          );
        }
        if (el.shapeType === 'line') {
          return (
            <div
              style={{
                width: '100%',
                height: s.borderWidth || 2,
                backgroundColor: s.backgroundColor || s.borderColor || '#C9A84C',
                marginTop: el.height / 2 - (s.borderWidth || 2) / 2,
              }}
            />
          );
        }
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: s.backgroundColor || 'transparent',
              border: `${s.borderWidth || 0}px ${s.borderStyle || 'solid'} ${s.borderColor || 'transparent'}`,
              borderRadius: s.borderRadius ? `${s.borderRadius}px` : 0,
              boxShadow: s.shadowBlur ? `${s.shadowOffsetX || 0}px ${s.shadowOffsetY || 0}px ${s.shadowBlur}px ${s.shadowColor || 'rgba(0,0,0,0.2)'}` : 'none',
            }}
          />
        );

      case 'ornament':
        return <OrnamentRenderer type={el.ornamentType || 'divider-ornate'} styles={s} width={el.width} height={el.height} />;

      case 'image':
        return el.src ? (
          <img
            src={el.src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: (s.objectFit as 'cover' | 'contain' | 'fill') || 'cover',
              borderRadius: s.borderRadius ? `${s.borderRadius}px` : 0,
              border: `${s.borderWidth || 0}px ${s.borderStyle || 'solid'} ${s.borderColor || 'transparent'}`,
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '2px dashed rgba(201,168,76,0.3)',
              borderRadius: 8,
            }}
          >
            <span style={{ color: '#C9A84C', fontSize: 12 }}>صورة</span>
          </div>
        );

      case 'divider':
        return (
          <div className="w-full flex items-center" style={{ height: '100%' }}>
            <div
              className="flex-1"
              style={{
                height: s.borderWidth || 1,
                backgroundColor: s.backgroundColor || s.borderColor || '#C9A84C',
              }}
            />
          </div>
        );

      case 'countdown':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundColor: s.backgroundColor || 'rgba(201,168,76,0.1)',
              borderRadius: s.borderRadius ? `${s.borderRadius}px` : 8,
              border: `${s.borderWidth || 1}px solid ${s.borderColor || 'rgba(201,168,76,0.3)'}`,
              fontFamily: s.fontFamily || 'Amiri',
              color: s.color || '#C9A84C',
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 4 }}>العد التنازلي</div>
            <div className="flex gap-3">
              {['أيام', 'ساعات', 'دقائق'].map((label) => (
                <div key={label} className="text-center">
                  <div style={{ fontSize: s.fontSize || 24, fontWeight: 700 }}>00</div>
                  <div style={{ fontSize: 9, opacity: 0.7 }}>{label}</div>
                </div>
              ))}
            </div>
            {el.content && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{el.content}</div>}
          </div>
        );

      case 'qrcode':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: s.backgroundColor || 'white',
              padding: 8,
            }}
          >
            <div
              style={{
                width: el.width - 24,
                height: el.height - 40,
                background: 'repeating-linear-gradient(0deg, #000 0px, #000 4px, transparent 4px, transparent 8px), repeating-linear-gradient(90deg, #000 0px, #000 4px, transparent 4px, transparent 8px)',
                opacity: 0.1,
              }}
            />
            <div style={{ fontSize: 10, marginTop: 4, color: s.color || '#666' }}>QR Code</div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div
      style={baseStyle}
      onMouseDown={onMouseDown}
    >
      {renderContent()}

      {isSelected && !el.locked && (
        <>
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-crosshair z-10"
            style={{ background: '#C9A84C', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            onMouseDown={onRotateHandle}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>

          {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandle[]).map((handle) => {
            const positions: Record<ResizeHandle, { top?: number | string; bottom?: number | string; left?: number | string; right?: number | string; cursor: string }> = {
              nw: { top: -4, right: -4, cursor: 'nwse-resize' },
              n: { top: -4, left: '50%', cursor: 'ns-resize' },
              ne: { top: -4, left: -4, cursor: 'nesw-resize' },
              e: { top: '50%', left: -4, cursor: 'ew-resize' },
              se: { bottom: -4, left: -4, cursor: 'nwse-resize' },
              s: { bottom: -4, left: '50%', cursor: 'ns-resize' },
              sw: { bottom: -4, right: -4, cursor: 'nesw-resize' },
              w: { top: '50%', right: -4, cursor: 'ew-resize' },
            };
            const pos = positions[handle];
            return (
              <div
                key={handle}
                className="absolute z-10"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  background: 'white',
                  border: '1.5px solid #C9A84C',
                  borderRadius: 2,
                  transform: 'translate(-50%, -50%)',
                  ...pos,
                }}
                onMouseDown={(e) => onResizeHandle(e, handle)}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

function OrnamentRenderer({ type, styles, width, height }: { type: string; styles: ElementStyles; width: number; height: number }) {
  const color = styles.color || '#C9A84C';

  if (type === 'divider-ornate') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} />
        <circle cx={width / 2} cy={height / 2} r={5} fill={color} />
        <circle cx={width / 2 - 20} cy={height / 2} r={3} fill="none" stroke={color} strokeWidth={1} />
        <circle cx={width / 2 + 20} cy={height / 2} r={3} fill="none" stroke={color} strokeWidth={1} />
        <polygon points={`${width / 2 - 45},${height / 2} ${width / 2 - 55},${height / 2 - 6} ${width / 2 - 55},${height / 2 + 6}`} fill={color} />
        <polygon points={`${width / 2 + 45},${height / 2} ${width / 2 + 55},${height / 2 - 6} ${width / 2 + 55},${height / 2 + 6}`} fill={color} />
        <line x1={0} y1={height / 2 - 3} x2={width / 2 - 60} y2={height / 2 - 3} stroke={color} strokeWidth={0.5} opacity={0.5} />
        <line x1={0} y1={height / 2 + 3} x2={width / 2 - 60} y2={height / 2 + 3} stroke={color} strokeWidth={0.5} opacity={0.5} />
        <line x1={width / 2 + 60} y1={height / 2 - 3} x2={width} y2={height / 2 - 3} stroke={color} strokeWidth={0.5} opacity={0.5} />
        <line x1={width / 2 + 60} y1={height / 2 + 3} x2={width} y2={height / 2 + 3} stroke={color} strokeWidth={0.5} opacity={0.5} />
      </svg>
    );
  }

  if (type === 'divider-simple') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <line x1={0} y1={height / 2} x2={width * 0.35} y2={height / 2} stroke={color} strokeWidth={1} />
        <text x={width / 2} y={height / 2 + 5} textAnchor="middle" fill={color} fontSize={16} fontFamily="Amiri">✦</text>
        <line x1={width * 0.65} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} />
    </svg>
  );
}
