import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Photo, Page, PhotoSlot, LayoutType } from '../types';
import { LAYOUT_CONFIGS } from '../types';

interface PhotoStore {
  // Photos
  photos: Photo[];
  addPhotos: (files: File[]) => Promise<void>;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  // Pages
  pages: Page[];
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  addPage: (layout?: LayoutType) => void;
  removePage: (id: string) => void;
  duplicatePage: (id: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // Layout
  defaultLayout: LayoutType;
  setDefaultLayout: (layout: LayoutType) => void;
  setPageLayout: (pageId: string, layout: LayoutType) => void;

  // Slots
  assignPhotoToSlot: (pageId: string, slotId: string, photoId: string | null) => void;
  updateSlotPosition: (pageId: string, slotId: string, offsetX: number, offsetY: number, scale: number, rotation: number) => void;
  swapSlots: (pageId: string, fromSlotId: string, toSlotId: string) => void;
  movePhotoBetweenPages: (fromPageId: string, fromSlotId: string, toPageId: string, toSlotId: string) => void;

  // Auto-arrangement
  autoArrangeEnabled: boolean;
  setAutoArrangeEnabled: (enabled: boolean) => void;
  autoArrangePhotos: () => void;

  // Utility
  getUnassignedPhotos: () => Photo[];
}

const createEmptySlots = (layout: LayoutType): PhotoSlot[] => {
  const config = LAYOUT_CONFIGS[layout];
  const count = config.rows * config.cols;
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    photoId: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0,
  }));
};

const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  pages: [],
  currentPageIndex: 0,
  defaultLayout: 4,
  autoArrangeEnabled: true,

  addPhotos: async (files: File[]) => {
    const validFiles = files.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    );

    const newPhotos: Photo[] = await Promise.all(
      validFiles.map(async (file) => {
        const dimensions = await loadImageDimensions(file);
        return {
          id: uuidv4(),
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          width: dimensions.width,
          height: dimensions.height,
        };
      })
    );

    set((state) => ({
      photos: [...state.photos, ...newPhotos],
    }));

    // Auto-arrange if enabled
    if (get().autoArrangeEnabled) {
      get().autoArrangePhotos();
    }
  },

  removePhoto: (id: string) => {
    const photo = get().photos.find((p) => p.id === id);
    if (photo) {
      URL.revokeObjectURL(photo.url);
    }

    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      pages: state.pages.map((page) => ({
        ...page,
        slots: page.slots.map((slot) =>
          slot.photoId === id ? { ...slot, photoId: null } : slot
        ),
      })),
    }));

    if (get().autoArrangeEnabled) {
      get().autoArrangePhotos();
    }
  },

  clearPhotos: () => {
    get().photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    set({ photos: [], pages: [], currentPageIndex: 0 });
  },

  setCurrentPageIndex: (index: number) => {
    set({ currentPageIndex: index });
  },

  addPage: (layout?: LayoutType) => {
    const pageLayout = layout ?? get().defaultLayout;
    const newPage: Page = {
      id: uuidv4(),
      slots: createEmptySlots(pageLayout),
      layout: pageLayout,
    };

    set((state) => ({
      pages: [...state.pages, newPage],
      currentPageIndex: state.pages.length,
    }));
  },

  removePage: (id: string) => {
    set((state) => {
      const newPages = state.pages.filter((p) => p.id !== id);
      const newIndex = Math.min(state.currentPageIndex, Math.max(0, newPages.length - 1));
      return {
        pages: newPages,
        currentPageIndex: newIndex,
      };
    });

    if (get().autoArrangeEnabled) {
      get().autoArrangePhotos();
    }
  },

  duplicatePage: (id: string) => {
    const page = get().pages.find((p) => p.id === id);
    if (!page) return;

    const duplicatedPage: Page = {
      id: uuidv4(),
      layout: page.layout,
      slots: page.slots.map((slot) => ({
        ...slot,
        id: uuidv4(),
      })),
    };

    set((state) => {
      const index = state.pages.findIndex((p) => p.id === id);
      const newPages = [...state.pages];
      newPages.splice(index + 1, 0, duplicatedPage);
      return {
        pages: newPages,
        currentPageIndex: index + 1,
      };
    });
  },

  reorderPages: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newPages = [...state.pages];
      const [removed] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, removed);
      return { pages: newPages };
    });
  },

  setDefaultLayout: (layout: LayoutType) => {
    set({ defaultLayout: layout });
  },

  setPageLayout: (pageId: string, layout: LayoutType) => {
    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;

        const currentPhotos = page.slots
          .filter((s) => s.photoId)
          .map((s) => s.photoId);

        const newSlots = createEmptySlots(layout);

        // Preserve existing photos in new slots
        currentPhotos.forEach((photoId, index) => {
          if (index < newSlots.length && photoId) {
            newSlots[index].photoId = photoId;
          }
        });

        return {
          ...page,
          layout,
          slots: newSlots,
        };
      }),
    }));

    if (get().autoArrangeEnabled) {
      get().autoArrangePhotos();
    }
  },

  assignPhotoToSlot: (pageId: string, slotId: string, photoId: string | null) => {
    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          slots: page.slots.map((slot) =>
            slot.id === slotId
              ? { ...slot, photoId, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
              : slot
          ),
        };
      }),
    }));
  },

  updateSlotPosition: (pageId: string, slotId: string, offsetX: number, offsetY: number, scale: number, rotation: number) => {
    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          slots: page.slots.map((slot) =>
            slot.id === slotId ? { ...slot, offsetX, offsetY, scale, rotation } : slot
          ),
        };
      }),
    }));
  },

  swapSlots: (pageId: string, fromSlotId: string, toSlotId: string) => {
    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;

        const fromSlot = page.slots.find((s) => s.id === fromSlotId);
        const toSlot = page.slots.find((s) => s.id === toSlotId);

        if (!fromSlot || !toSlot) return page;

        return {
          ...page,
          slots: page.slots.map((slot) => {
            if (slot.id === fromSlotId) {
              return { ...slot, photoId: toSlot.photoId, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
            }
            if (slot.id === toSlotId) {
              return { ...slot, photoId: fromSlot.photoId, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
            }
            return slot;
          }),
        };
      }),
    }));
  },

  movePhotoBetweenPages: (fromPageId: string, fromSlotId: string, toPageId: string, toSlotId: string) => {
    const state = get();
    const fromPage = state.pages.find((p) => p.id === fromPageId);
    const toPage = state.pages.find((p) => p.id === toPageId);

    if (!fromPage || !toPage) return;

    const fromSlot = fromPage.slots.find((s) => s.id === fromSlotId);
    const toSlot = toPage.slots.find((s) => s.id === toSlotId);

    if (!fromSlot || !toSlot) return;

    const photoId = fromSlot.photoId;
    const existingPhotoId = toSlot.photoId;

    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id === fromPageId) {
          return {
            ...page,
            slots: page.slots.map((slot) =>
              slot.id === fromSlotId
                ? { ...slot, photoId: existingPhotoId, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
                : slot
            ),
          };
        }
        if (page.id === toPageId) {
          return {
            ...page,
            slots: page.slots.map((slot) =>
              slot.id === toSlotId
                ? { ...slot, photoId, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
                : slot
            ),
          };
        }
        return page;
      }),
    }));
  },

  setAutoArrangeEnabled: (enabled: boolean) => {
    set({ autoArrangeEnabled: enabled });
    if (enabled) {
      get().autoArrangePhotos();
    }
  },

  autoArrangePhotos: () => {
    const state = get();

    // Rebalance all photos across pages so earlier pages are filled first.
    const allPhotoIds = state.photos.map((p) => p.id);
    let idx = 0;

    const newPages: Page[] = state.pages.map((page) => {
      const slots = page.slots.map((slot) => {
        if (idx < allPhotoIds.length) {
          const photoId = allPhotoIds[idx++];
          return { ...slot, photoId, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
        }
        return { ...slot, photoId: null, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
      });
      return { ...page, slots };
    });

    // If there are remaining photos, create additional pages and fill them
    while (idx < allPhotoIds.length) {
      const newSlots = createEmptySlots(state.defaultLayout);
      newSlots.forEach((slot) => {
        if (idx < allPhotoIds.length) {
          slot.photoId = allPhotoIds[idx++];
          slot.offsetX = 0;
          slot.offsetY = 0;
          slot.scale = 1;
          slot.rotation = 0;
        }
      });

      newPages.push({ id: uuidv4(), layout: state.defaultLayout, slots: newSlots });
    }

    set({ pages: newPages });
  },

  getUnassignedPhotos: () => {
    const state = get();
    const assignedPhotoIds = new Set(
      state.pages.flatMap((page) =>
        page.slots.filter((slot) => slot.photoId).map((slot) => slot.photoId)
      )
    );

    return state.photos.filter((photo) => !assignedPhotoIds.has(photo.id));
  },
}));
