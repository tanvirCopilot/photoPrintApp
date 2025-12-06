import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
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
  } = usePhotoStore();

  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [activePhotoSlotId, setActivePhotoSlotId] = useState<string | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActivePhotoSlotId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePhotoSlotId(null);

    if (over && active.id !== over.id) {
      swapSlots(page.id, active.id as string, over.id as string);
    }
  };

  const getPhoto = (photoId: string | null) => {
    if (!photoId) return null;
    return photos.find((p) => p.id === photoId) || null;
  };

  const activeSlot = page.slots.find((s) => s.id === activePhotoSlotId);
  const activePhoto = activeSlot ? getPhoto(activeSlot.photoId) : null;

  return (
    <div
      className={`
        flex flex-col items-center h-full
        ${isCurrentPage ? '' : 'opacity-70 hover:opacity-100 transition-opacity'}
      `}
      onClick={() => setCurrentPageIndex(pageIndex)}
    >
      {/* A4 Page Container - Large size with proper A4 aspect ratio */}
      <div
        className={`
          bg-white rounded-lg overflow-hidden
          shadow-2xl shadow-black/30
          ring-1 ring-white/10
          transition-all duration-300
          ${isCurrentPage ? 'ring-2 ring-violet-400/50' : ''}
        `}
        style={{
          width: 'auto',
          height: '100%',
          maxHeight: 'calc(100vh - 200px)',
          aspectRatio: '210 / 297', // A4 aspect ratio
        }}
      >
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Grid Layout */}
          <div
            className="w-full h-full grid p-6 box-border"
            style={{
              gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
              gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
              gap: '8px',
            }}
          >
            {page.slots.map((slot) => {
              const photo = getPhoto(slot.photoId);
              return (
                <DraggableSlot
                  key={slot.id}
                  id={slot.id}
                  hasPhoto={!!photo}
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
              );
            })}
          </div>

          <DragOverlay>
            {activePhoto && (
              <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl opacity-90 ring-2 ring-violet-400">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
