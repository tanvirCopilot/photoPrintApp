import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface DraggableSlotProps {
  id: string;
  children: React.ReactNode;
  hasPhoto: boolean;
}

export const DraggableSlot: React.FC<DraggableSlotProps> = ({
  id,
  children,
  hasPhoto,
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
  };

  return (
    <div
      ref={setRefs}
      {...listeners}
      {...attributes}
      className={`
        relative rounded-lg overflow-hidden
        transition-all duration-200 ease-out
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${isOver ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-white scale-[1.02]' : ''}
        ${hasPhoto ? 'cursor-grab active:cursor-grabbing shadow-md' : 'cursor-default bg-gray-50'}
      `}
    >
      {children}
      
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-violet-500/20 pointer-events-none rounded-lg" />
      )}
    </div>
  );
};
