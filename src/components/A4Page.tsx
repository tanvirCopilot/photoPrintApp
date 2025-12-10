import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { usePhotoStore } from '../store/photoStore';
import type { Page } from '../types';
import { LAYOUT_CONFIGS } from '../types';
import { DraggableSlot } from './DraggableSlot';
import { PhotoSlotItem } from './PhotoSlotItem';

interface A4PageProps {
  page: Page;
  pageIndex: number;
  isCurrentPage: boolean;
}

export const A4Page: React.FC<A4PageProps> = ({ page, pageIndex, isCurrentPage }) => {
  const {
    photos,
    swapSlots,
    updateSlotPosition,
    setCurrentPageIndex,
    activeSlotId,
    setActiveSlotId,
  } = usePhotoStore();

  const [activePhotoSlotId, setActivePhotoSlotId] = useState<string | null>(null);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null);
  const overlayMoveRef = useRef<((e: PointerEvent) => void) | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const layout = LAYOUT_CONFIGS[page.layout];
  const updatePageGridSizes = usePhotoStore((s) => s.updatePageGridSizes);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef<{
    type: 'col' | 'row' | null;
    index: number;
    startPos: number;
    startSizes: number[];
  } | null>(null);

  const MIN_FRACTION = 0.05;
  const GAP = 8; // px, matches the style gap used in the grid

  // pixel sizes for columns/rows (computed from page.colSizes/page.rowSizes fractions)
  const [colPx, setColPx] = useState<number[]>([]);
  const [rowPx, setRowPx] = useState<number[]>([]);

  // recompute pixel sizes when layout, fractions or available size changes
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cols = layout.cols;
    const rows = layout.rows;

    // Fractions: prefer page.colSizes/page.rowSizes, fall back to equal distribution
    const colFracs = page.colSizes && page.colSizes.length === cols ? page.colSizes : Array.from({ length: cols }, () => 1 / cols);
    const rowFracs = page.rowSizes && page.rowSizes.length === rows ? page.rowSizes : Array.from({ length: rows }, () => 1 / rows);

    const availableWidth = Math.max(0, rect.width - (Math.max(0, cols - 1) * GAP));
    const availableHeight = Math.max(0, rect.height - (Math.max(0, rows - 1) * GAP));

    const newColPx = colFracs.map((f) => Math.max(1, Math.round(f * availableWidth)));
    const newRowPx = rowFracs.map((f) => Math.max(1, Math.round(f * availableHeight)));

    // Ensure rounding doesn't break total - adjust last item
    const sumCol = newColPx.reduce((a, b) => a + b, 0);
    if (sumCol !== Math.round(availableWidth)) {
      const diff = Math.round(availableWidth) - sumCol;
      newColPx[newColPx.length - 1] = Math.max(1, newColPx[newColPx.length - 1] + diff);
    }
    const sumRow = newRowPx.reduce((a, b) => a + b, 0);
    if (sumRow !== Math.round(availableHeight)) {
      const diffR = Math.round(availableHeight) - sumRow;
      newRowPx[newRowPx.length - 1] = Math.max(1, newRowPx[newRowPx.length - 1] + diffR);
    }

    setColPx(newColPx);
    setRowPx(newRowPx);
  }, [gridRef.current, page.colSizes, page.rowSizes, layout.cols, layout.rows, GAP]);

  // Recompute on window resize
  useEffect(() => {
    const onResize = () => {
      const ev = new Event('resize-grid');
      window.dispatchEvent(ev);
    };
    window.addEventListener('resize', onResize);
    const onResizeGrid = () => {
      // trigger the useLayoutEffect by touching gridRef current (no-op)
      if (gridRef.current) {
        // simply call getBoundingClientRect to ensure layout effect sees updated size
        gridRef.current.getBoundingClientRect();
        // force a state update by reusing existing sizes; useLayoutEffect depends on gridRef.current
        // we can call setColPx/setRowPx after a short microtask to trigger recompute
        setTimeout(() => {
          if (gridRef.current) {
            const ev2 = new Event('resize-grid-inner');
            window.dispatchEvent(ev2);
          }
        }, 0);
      }
    };
    window.addEventListener('resize-grid', onResizeGrid);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('resize-grid', onResizeGrid);
    };
  }, []);

  const startResize = (type: 'col' | 'row', index: number, clientX: number, clientY: number) => {
    const el = gridRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startPos = type === 'col' ? clientX : clientY;
    const startSizes = (type === 'col' ? page.colSizes : page.rowSizes) || [];
    resizingRef.current = { type, index, startPos, startSizes: [...startSizes] };
    const onMove = (e: PointerEvent) => {
      if (!resizingRef.current) return;
      const deltaPx = type === 'col' ? e.clientX - resizingRef.current.startPos : e.clientY - resizingRef.current.startPos;
      const cols = layout.cols;
      const rows = layout.rows;
      // available pixels excludes the gaps between tracks
      const totalPx = type === 'col' ? (rect.width - (Math.max(0, cols - 1) * GAP)) : (rect.height - (Math.max(0, rows - 1) * GAP));
      if (!totalPx) return;
      const deltaFrac = deltaPx / totalPx;

      const sizes = [...resizingRef.current.startSizes];
      const i = resizingRef.current.index;
      // adjust neighboring columns/rows i-1 and i
      const newA = Math.max(MIN_FRACTION, sizes[i - 1] + deltaFrac);
      const newB = Math.max(MIN_FRACTION, sizes[i] - deltaFrac);

      sizes[i - 1] = newA;
      sizes[i] = newB;

      // Normalize full array to sum to 1
      const total = sizes.reduce((acc, v) => acc + v, 0);
      const normalized = sizes.map((v) => v / total);
      if (type === 'col') updatePageGridSizes(page.id, normalized, undefined);
      else updatePageGridSizes(page.id, undefined, normalized);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      resizingRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const slotId = event.active.id as string;
    setActivePhotoSlotId(slotId);
    // Start following the pointer so overlay matches cursor exactly
    const start = (event.activatorEvent as PointerEvent | undefined) || undefined;
    if (start) {
      setOverlayPos({ x: start.clientX, y: start.clientY });
    }

    const onPointerMove = (e: PointerEvent) => {
      setOverlayPos({ x: e.clientX, y: e.clientY });
    };
    overlayMoveRef.current = onPointerMove;
    window.addEventListener('pointermove', onPointerMove);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePhotoSlotId(null);

    // stop pointer following
    if (overlayMoveRef.current) {
      window.removeEventListener('pointermove', overlayMoveRef.current);
      overlayMoveRef.current = null;
    }
    setOverlayPos(null);

    if (over && active.id !== over.id) {
      swapSlots(page.id, active.id as string, over.id as string);
    }
  };

  const getPhoto = (photoId: string | null) => {
    if (!photoId) return null;
    return photos.find((p) => p.id === photoId) || null;
  };

  const calculateExtraGap = (index: number) => {
    const padding = 5.5; // px, half of GAP
    switch (index) {
      case 1:
        return padding + index * GAP/2;
      case 2:
        return padding + GAP + GAP/2;
      case 3:
        return padding + GAP + GAP + GAP/2;
      default:
        return 0;
    }
  }

  const activeSlot = page.slots.find((s) => s.id === activePhotoSlotId);
  const activePhoto = activeSlot ? getPhoto(activeSlot.photoId) : null;

  const overlaySize = 96; // or any value

  return (
    <div
      className={`
        flex flex-col items-center w-full h-full
        ${isCurrentPage ? '' : 'opacity-70 hover:opacity-100 transition-opacity'}
      `}
      onClick={() => setCurrentPageIndex(pageIndex)}
    >
      {/* A4 Page Container - Full width on mobile, height-based on larger screens */}
      <div
        className={`
          bg-white rounded-lg overflow-hidden
          shadow-2xl shadow-black/30
          ring-1 ring-white/10
          transition-all duration-300
          w-full sm:w-auto sm:h-full
          ${isCurrentPage ? 'ring-2 ring-violet-400/50' : ''}
        `}
        style={{
          aspectRatio: '210 / 297', // A4 aspect ratio
          padding: '10px',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 180px)',
        }}
      >
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Grid Layout */}
          <div
            ref={gridRef}
            className="w-full h-full relative box-border"
          >
            {/* actual grid */}
            <div
              className="w-full h-full grid"
              style={{
                gridTemplateRows: rowPx && rowPx.length > 0 ? rowPx.map((r) => `${r}px`).join(' ') : `repeat(${layout.rows}, 1fr)`,
                gridTemplateColumns: colPx && colPx.length > 0 ? colPx.map((c) => `${c}px`).join(' ') : `repeat(${layout.cols}, 1fr)`,
                gap: `${GAP}px`,
                width: '100%',
                height: '100%',
              }}
            >
            {page.slots.map((slot, slotIndex) => {
              const photo = getPhoto(slot.photoId);
              // Fallbacks for older data that may not have colStart/rowStart/colSpan/rowSpan
              const cols = layout.cols;
              const colStart = slot.colStart ?? ((slotIndex % cols) + 1);
              const rowStart = slot.rowStart ?? (Math.floor(slotIndex / cols) + 1);
              const colSpan = slot.colSpan ?? 1;
              const rowSpan = slot.rowSpan ?? 1;

              const gridStyle: React.CSSProperties = {
                gridColumn: `${colStart} / span ${colSpan}`,
                gridRow: `${rowStart} / span ${rowSpan}`,
                position: 'relative',
                width: '100%',
                height: '100%',
              };

              return (
                <div key={slot.id} style={gridStyle}>
                  <DraggableSlot
                    id={slot.id}
                    hasPhoto={!!photo}
                    isActive={activeSlotId === slot.id}
                  >
                      <PhotoSlotItem
                        slot={slot}
                        photo={photo}
                        isActive={activeSlotId === slot.id}
                        onActivate={() => setActiveSlotId(slot.id)}
                        onPositionChange={(offsetX, offsetY, scale, rotation) =>
                          updateSlotPosition(page.id, slot.id, offsetX, offsetY, scale, rotation)
                        }
                      />
                  </DraggableSlot>
                </div>
              );
            })}
            </div>

            {/* Vertical resizers between columns */}
            {((page.colSizes && page.colSizes.length > 1) || colPx.length > 1) && (
              (colPx.length > 1 ? colPx.slice(0, -1) : page.colSizes!.slice(0, -1)).map((_, i) => {
                // boundary after first i+1 columns
                const boundary = colPx.slice(0, i + 1).reduce((a, b) => a + b, 0) + calculateExtraGap(i+1);
                return (
                  <div
                    key={`col-resizer-${i}`}
                    onPointerDown={(e) => startResize('col', i + 1, e.clientX, e.clientY)}
                    style={{
                      position: 'absolute',
                      top: `8px`,
                      bottom: `8px`,
                      left: `${boundary}px`,
                      width: '12px',
                      transform: 'translateX(-50%)',
                      cursor: 'col-resize',
                      zIndex: 50,
                    }}
                  >
                    <div className="w-[2px] h-full bg-white/0 hover:bg-violet-400/60 mx-auto" />
                  </div>
                );
              })
            )}

            {/* Horizontal resizers between rows */}
            {((page.rowSizes && page.rowSizes.length > 1) || rowPx.length > 1) && (
              (rowPx.length > 1 ? rowPx.slice(0, -1) : page.rowSizes!.slice(0, -1)).map((_, i) => {
                const boundary = rowPx.slice(0, i + 1).reduce((a, b) => a + b, 0) + calculateExtraGap(i+1);
                return (
                  <div
                    key={`row-resizer-${i}`}
                    onPointerDown={(e) => startResize('row', i + 1, e.clientX, e.clientY)}
                    style={{
                      position: 'absolute',
                      left: `8px`,
                      right: `8px`,
                      top: `${boundary}px`,
                      height: '12px',
                      transform: 'translateY(-50%)',
                      cursor: 'row-resize',
                      zIndex: 50,
                    }}
                  >
                    <div className="h-[2px] w-full bg-white/0 hover:bg-violet-400/60" />
                  </div>
                );
              })
            )}

          </div>

          {/* Custom floating overlay that follows the pointer exactly while dragging */}
          {overlayPos && activePhoto && createPortal(
            <div
              style={{
                position: 'fixed',
                left: overlayPos.x - overlaySize / 2,
                top: overlayPos.y - overlaySize / 2,
                width: overlaySize,
                height: overlaySize,
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            >
              <div className="rounded-xl overflow-hidden shadow-2xl ring-2 ring-violet-400 bg-white opacity-90 h-full w-full">
                <img src={activePhoto.url} alt={activePhoto.name} className="w-full h-full object-cover" />
              </div>
            </div>,
            document.body
          )}
        </DndContext>
      </div>
    </div>
  );
};
