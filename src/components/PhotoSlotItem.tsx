import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Photo, PhotoSlot } from '../types';

interface PhotoSlotItemProps {
  slot: PhotoSlot;
  photo: Photo | null;
  onPositionChange: (offsetX: number, offsetY: number, scale: number, rotation: number) => void;
  isActive: boolean;
  onActivate: () => void;
}

export const PhotoSlotItem: React.FC<PhotoSlotItemProps> = ({
  slot,
  photo,
  onPositionChange,
  isActive,
  onActivate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });
  const [startScale, setStartScale] = useState(1);
  const [startDistance, setStartDistance] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
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
        className={`
          w-full h-full overflow-hidden relative cursor-move rounded-lg bg-gray-100 p-2 box-border
          ${isActive ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-white' : ''}
        `}
        onClick={onActivate}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
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
            }}
            draggable={false}
          />
        </div>

        {/* Hover controls */}
        {(isHovered || isActive) && (
          <div className="absolute top-2 right-2 flex gap-1.5 z-10">
            {/* Rotate button */}
            <button
              onClick={handleRotate}
              className="w-8 h-8 bg-black/60 backdrop-blur text-white rounded-lg hover:bg-black/80 transition-all flex items-center justify-center"
              title="Rotate 90°"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* Fullscreen button */}
            <button
              onClick={handleFullscreen}
              className="w-8 h-8 bg-black/60 backdrop-blur text-white rounded-lg hover:bg-black/80 transition-all flex items-center justify-center"
              title="View full photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom controls when active */}
        {isActive && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-10">
            <div className="px-2 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-md">
              {Math.round(localScale * 100)}%
            </div>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-md hover:bg-black/80 transition-colors"
            >
              Reset
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
