import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface DraggableSlotProps {
  id: string;
  children: React.ReactNode;
  hasPhoto: boolean;
  isActive?: boolean;
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
      {/* Pass draggable listeners/attributes into child so all top controls can live together */}
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { dragHandleProps: { ...listeners, ...attributes } }) : children}
      
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-violet-500/20 pointer-events-none rounded-lg" />
      )}
    </div>
  );
};
