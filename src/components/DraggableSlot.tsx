import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface DraggableSlotProps {
  id: string;
  children: React.ReactNode;
  hasPhoto: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  refCallback?: (el: HTMLDivElement | null) => void;
}

export const DraggableSlot: React.FC<DraggableSlotProps> = ({
  id,
  children,
  hasPhoto,
  onPointerDown,
  refCallback,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id,
    disabled: !hasPhoto,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
  });

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    setDraggableRef(element);
    setDroppableRef(element);
    if (typeof refCallback === 'function') refCallback(element);
  };

  return (
    <div
      ref={setRefs}
      onPointerDown={onPointerDown}
      className={`
        w-full h-full relative rounded-lg overflow-hidden
        transition-all duration-200 ease-out
        ${isDragging ? 'invisible scale-95' : ''}
        ${isOver ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-white scale-[1.02]' : ''}
        ${hasPhoto ? 'shadow-md' : 'cursor-default bg-gray-50'}
      `}
    >
      {/* Drag handle: visible grab affordance; listeners/attributes live here */}
      {hasPhoto && (
        <div
          {...listeners}
          {...attributes}
          className="absolute top-2 left-2 z-30 w-8 h-8 rounded-md bg-white/80 border border-gray-200 shadow-sm flex items-center justify-center text-gray-600
            hover:bg-white hover:scale-105 transition-transform duration-150
            cursor-grab active:cursor-grabbing"
          aria-label="Drag slot"
          role="button"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 6h.01M6 6h.01M14 6h.01M18 6h.01M10 12h.01M6 12h.01M14 12h.01M18 12h.01M10 18h.01M6 18h.01M14 18h.01M18 18h.01" />
          </svg>
        </div>
      )}

      {children}
      
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-violet-500/20 pointer-events-none rounded-lg" />
      )}
    </div>
  );
};
