import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Photo, PhotoSlot } from '../types';
import { usePhotoStore } from '../store/photoStore';

interface PhotoSlotItemProps {
  slot: PhotoSlot;
  photo: Photo | null;
  onPositionChange: (offsetX: number, offsetY: number, scale: number, rotation: number) => void;
  isActive: boolean;
  onActivate: () => void;
  // injected by DraggableSlot: listeners/attributes for the drag handle
  dragHandleProps?: any;
}

export const PhotoSlotItem: React.FC<PhotoSlotItemProps> = ({
  slot,
  photo,
  onPositionChange,
  isActive,
  onActivate,
  dragHandleProps,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });
  const [startScale, setStartScale] = useState(1);
  const [startDistance, setStartDistance] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Local state for smooth dragging
  const [localOffset, setLocalOffset] = useState({ x: slot.offsetX, y: slot.offsetY });
  const [localScale, setLocalScale] = useState(slot.scale);
  const [localRotation, setLocalRotation] = useState(slot.rotation || 0);

  // Sync with slot changes (including photoId to reset state on swap)
  useEffect(() => {
    setLocalOffset({ x: slot.offsetX, y: slot.offsetY });
    setLocalScale(slot.scale);
    setLocalRotation(slot.rotation || 0);
  }, [slot.photoId, slot.offsetX, slot.offsetY, slot.scale, slot.rotation]);

  // Keyboard support: nudge scale when this slot is active.
  useEffect(() => {
    if (!isActive || !photo) return;

    const handleKey = (e: KeyboardEvent) => {
      const increaseKeys = ['+', '=', 'ArrowUp'];
      const decreaseKeys = ['-', '_', 'ArrowDown'];

      if (!increaseKeys.includes(e.key) && !decreaseKeys.includes(e.key)) return;

      e.preventDefault();

      const step = e.shiftKey ? 0.1 : e.altKey ? 0.01 : 0.05;
      let newScale = localScale;

      if (increaseKeys.includes(e.key)) {
        newScale = Math.min(3, +(localScale + step).toFixed(3));
      } else if (decreaseKeys.includes(e.key)) {
        newScale = Math.max(0.3, +(localScale - step).toFixed(3));
      }

      if (newScale !== localScale) {
        setLocalScale(newScale);
        onPositionChange(localOffset.x, localOffset.y, newScale, localRotation);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, photo, localScale, localOffset, localRotation, onPositionChange]);

  const getTouchDistance = (touches: React.TouchList | TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!photo) return;
      e.preventDefault();
      e.stopPropagation();
      onActivate();
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartOffset({ x: localOffset.x, y: localOffset.y });
    },
    [photo, localOffset, onActivate]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!photo) return;
      onActivate();

      if (e.touches.length === 2) {
        setIsPinching(true);
        setStartDistance(getTouchDistance(e.touches));
        setStartScale(localScale);
      } else if (e.touches.length === 1) {
        setIsDragging(true);
        setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        setStartOffset({ x: localOffset.x, y: localOffset.y });
      }
    },
    [photo, localOffset, localScale, onActivate]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;

      setLocalOffset({
        x: startOffset.x + dx,
        y: startOffset.y + dy,
      });
    },
    [isDragging, startPos, startOffset]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        const distance = getTouchDistance(e.touches);
        const scaleDelta = distance / startDistance;
        const newScale = Math.max(0.5, Math.min(3, startScale * scaleDelta));
        setLocalScale(newScale);
      } else if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startPos.x;
        const dy = e.touches[0].clientY - startPos.y;

        setLocalOffset({
          x: startOffset.x + dx,
          y: startOffset.y + dy,
        });
      }
    },
    [isDragging, isPinching, startPos, startOffset, startDistance, startScale]
  );

  const handleEnd = useCallback(() => {
    if (isDragging || isPinching) {
      onPositionChange(localOffset.x, localOffset.y, localScale, localRotation);
    }
    setIsDragging(false);
    setIsPinching(false);
  }, [isDragging, isPinching, localOffset, localScale, localRotation, onPositionChange]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!photo || !isActive) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.max(0.3, Math.min(3, localScale * delta));
      setLocalScale(newScale);
      onPositionChange(localOffset.x, localOffset.y, newScale, localRotation);
    },
    [photo, isActive, localScale, localOffset, localRotation, onPositionChange]
  );

  useEffect(() => {
    if (isDragging || isPinching) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, isPinching, handleMouseMove, handleTouchMove, handleEnd]);

  // Close layer menu when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showLayerMenu) return;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLayerMenu(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showLayerMenu]);

  // Close layer menu when this slot is no longer active
  useEffect(() => {
    if (!isActive) {
      setShowLayerMenu(false);
    }
  }, [isActive]);

  // Attach wheel listener with passive: false so we can call preventDefault without warnings
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const wheelHandler = (e: WheelEvent) => {
      if (!photo || !isActive) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.max(0.3, Math.min(3, localScale * delta));
      setLocalScale(newScale);
      onPositionChange(localOffset.x, localOffset.y, newScale, localRotation);
    };

    el.addEventListener('wheel', wheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', wheelHandler);
  }, [containerRef, photo, isActive, localScale, localOffset, localRotation, onPositionChange]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalOffset({ x: 0, y: 0 });
    setLocalScale(1);
    setLocalRotation(0);
    onPositionChange(0, 0, 1, 0);
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRotation = (localRotation + 90) % 360;
    setLocalRotation(newRotation);
    onPositionChange(localOffset.x, localOffset.y, localScale, newRotation);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullscreen(true);
  };

  if (!photo) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onActivate(); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 box-border
          ${isActive ? 'border-2 border-indigo-400 shadow-lg bg-white' : ''}
        `}
      >
        <div className="text-gray-400 text-center p-4">
          <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-xs font-medium">Empty</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden relative rounded-lg bg-gray-100 p-2 box-border
          ${isActive ? 'border-2 border-indigo-400 shadow-lg bg-white' : 'border-transparent'}
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onClick={onActivate}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        // wheel is attached manually with passive: false to allow preventDefault
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Photo with transform */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${localOffset.x}px, ${localOffset.y}px)`,
          }}
        >
          {!imgError ? (
            <img
              src={photo.url}
              alt={photo.name}
              className="pointer-events-none select-none"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${localScale}) rotate(${localRotation}deg)`,
                transformOrigin: 'center',
                padding: '5px',
                display: imgLoaded ? 'block' : 'none',
              }}
              draggable={false}
              onLoad={() => { setImgLoaded(true); setImgError(false); }}
              onError={() => { setImgError(true); console.warn('PhotoSlotItem: failed to load', slot.id, photo.url); }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-sm text-gray-500 p-4">
              Image failed to load
            </div>
          )}
        </div>

        {/* Unified top-left control row: drag, fullscreen, rotate, layer */}
        <div className="absolute top-1 left-1 right-1 z-40 p-0.5">
          <div className="flex items-center justify-between gap-2">
            {/* Left group: drag, fullscreen, rotate (wrap if needed) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Drag handle - injected props from DraggableSlot */}
              <button
                {...(dragHandleProps || {})}
                aria-label="Drag slot"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 cursor-grab active:cursor-grabbing"
                role="button"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 6h.01M6 6h.01M14 6h.01M18 6h.01M10 12h.01M6 12h.01M14 12h.01M18 12h.01M10 18h.01M6 18h.01M14 18h.01M18 18h.01" />
                </svg>
              </button>

              {/* Fullscreen - always visible */}
              <button
                onClick={(e) => { e.stopPropagation(); handleFullscreen(e); }}
                className="w-6 h-6 sm:w-7 sm:h-7 bg-white/90 border border-gray-200 text-gray-600 rounded shadow-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-transform"
                title="View full photo"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              {/* Rotate - visible when active */}
              {isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRotate(e); }}
                  className="w-6 h-6 sm:w-7 sm:h-7 bg-white/90 border border-gray-200 text-gray-600 rounded shadow-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-transform"
                  title="Rotate 90°"
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* Right group: layer toggle - stays rightmost */}
            <div className="flex-shrink-0 relative">
              {isActive && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowLayerMenu((s) => !s); }}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-white/90 border border-gray-200 text-gray-700 rounded shadow-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-transform"
                    title="Show controls"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4-8 4-8-4 8-4zM4 10l8 4 8-4M4 18l8 4 8-4" />
                    </svg>
                  </button>

                  {/* Animated menu items positioned under the layer button */}
                  <div className="absolute top-full right-0 mt-2 flex flex-col items-end">
                    {[
                      { key: 'incW', render: (
                        <button
                          key="incW"
                          onClick={(e) => { e.stopPropagation(); const pages = usePhotoStore.getState().pages; const page = pages.find((p) => p.slots.some((s) => s.id === slot.id)); if (!page) return; const curCol = slot.colSpan ?? 1; usePhotoStore.getState().setSlotSpan(page.id, slot.id, curCol + 1, slot.rowSpan ?? 1); setShowLayerMenu(false); }}
                          className="w-6 h-6 sm:w-7 sm:h-7 mb-1 bg-black/60 text-white rounded flex items-center justify-center hover:bg-black/80"
                          title="Increase width"
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15v-6M9 12h6" />
                          </svg>
                        </button>
                      ) },
                      { key: 'decW', render: (
                        <button
                          key="decW"
                          onClick={(e) => { e.stopPropagation(); const pages = usePhotoStore.getState().pages; const page = pages.find((p) => p.slots.some((s) => s.id === slot.id)); if (!page) return; const curCol = slot.colSpan ?? 1; usePhotoStore.getState().setSlotSpan(page.id, slot.id, Math.max(1, curCol - 1), slot.rowSpan ?? 1); setShowLayerMenu(false); }}
                          className="w-6 h-6 sm:w-7 sm:h-3.7 mb-1 bg-black/60 text-white rounded flex items-center justify-center hover:bg-black/80"
                          title="Decrease width"
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12H9" />
                          </svg>
                        </button>
                      ) },
                      { key: 'incH', render: (
                        <button
                          key="incH"
                          onClick={(e) => { e.stopPropagation(); const pages = usePhotoStore.getState().pages; const page = pages.find((p) => p.slots.some((s) => s.id === slot.id)); if (!page) return; const curRow = slot.rowSpan ?? 1; usePhotoStore.getState().setSlotSpan(page.id, slot.id, slot.colSpan ?? 1, curRow + 1); setShowLayerMenu(false); }}
                          className="w-6 h-6 sm:w-7 sm:h-3.7 mb-1 bg-black/60 text-white rounded flex items-center justify-center hover:bg-black/80"
                          title="Increase height"
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
                          </svg>
                        </button>
                      ) },
                      { key: 'decH', render: (
                        <button
                          key="decH"
                          onClick={(e) => { e.stopPropagation(); const pages = usePhotoStore.getState().pages; const page = pages.find((p) => p.slots.some((s) => s.id === slot.id)); if (!page) return; const curRow = slot.rowSpan ?? 1; usePhotoStore.getState().setSlotSpan(page.id, slot.id, slot.colSpan ?? 1, Math.max(1, curRow - 1)); setShowLayerMenu(false); }}
                          className="w-6 h-6 sm:w-7 sm:h-3.7 mb-1 bg-black/60 text-white rounded flex items-center justify-center hover:bg-black/80"
                          title="Decrease height"
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v6" />
                          </svg>
                        </button>
                      ) },
                    ].map((it, i) => (
                      <div
                        key={it.key}
                        style={{
                          transform: showLayerMenu ? 'translateY(0)' : 'translateY(-8px)',
                          opacity: showLayerMenu ? 1 : 0,
                          transition: `all 180ms ease ${i * 40}ms`,
                          pointerEvents: showLayerMenu ? 'auto' : 'none',
                        }}
                      >
                        {it.render}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom controls when active - modern pill indicator + rounded reset button */}
        {isActive && (
          <div className="absolute bottom-1 left-3 right-3 flex justify-between items-center z-10">
            <div style={{padding: "2px"}} className="flex items-center gap-2 bg-white/85 backdrop-blur-sm px-3 py-1 rounded-sm shadow-sm border border-gray-200">
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <span className="text-sm font-semibold text-gray-800 select-none">{Math.round(localScale * 100)}%</span>
            </div>

            <button
              onClick={handleReset}
              aria-label="Reset photo transform"
              style={{padding: "2px 5px"}}
              className="flex items-center gap-2 px-3 py-1 bg-violet-600 text-white text-sm font-semibold rounded-sm shadow hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10a9 9 0 111.4 4.7L3 21l6.3-1.4A9 9 0 013 10z" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7v5l4-2" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={photo.url}
              alt={photo.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              style={{ transform: `rotate(${localRotation}deg)` }}
            />
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {photo.name}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
