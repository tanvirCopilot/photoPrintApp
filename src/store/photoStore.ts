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
  updatePageGridSizes: (pageId: string, colSizes?: number[], rowSizes?: number[]) => void;

  // Slots
  assignPhotoToSlot: (pageId: string, slotId: string, photoId: string | null) => void;
  updateSlotPosition: (pageId: string, slotId: string, offsetX: number, offsetY: number, scale: number, rotation: number) => void;
  swapSlots: (pageId: string, fromSlotId: string, toSlotId: string) => void;
  movePhotoBetweenPages: (fromPageId: string, fromSlotId: string, toPageId: string, toSlotId: string) => void;

  // Auto-arrangement
  autoArrangeEnabled: boolean;
  setAutoArrangeEnabled: (enabled: boolean) => void;
  autoArrangePhotos: () => void;

  // Set span for a slot (colSpan, rowSpan)
  setSlotSpan: (pageId: string, slotId: string, colSpan: number, rowSpan: number) => void;

  // Utility
  getUnassignedPhotos: () => Photo[];
  
  // UI selection
  activeSlotId: string | null;
  setActiveSlotId: (id: string | null) => void;
}

const createEmptySlots = (layout: LayoutType): PhotoSlot[] => {
  const config = LAYOUT_CONFIGS[layout];
  const slots: PhotoSlot[] = [];

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      slots.push({
        id: uuidv4(),
        photoId: null,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
        colStart: c + 1,
        rowStart: r + 1,
        colSpan: 1,
        rowSpan: 1,
      });
    }
  }

  return slots;
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
  activeSlotId: null,
  
  setActiveSlotId: (id: string | null) => {
    set({ activeSlotId: id });
  },

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
    const config = LAYOUT_CONFIGS[pageLayout];
    const defaultColSizes = Array.from({ length: config.cols }, () => 1 / config.cols);
    const defaultRowSizes = Array.from({ length: config.rows }, () => 1 / config.rows);

    const newPage: Page = {
      id: uuidv4(),
      slots: createEmptySlots(pageLayout),
      layout: pageLayout,
      colSizes: defaultColSizes,
      rowSizes: defaultRowSizes,
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
      colSizes: [...page.colSizes],
      rowSizes: [...page.rowSizes],
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

        const config = LAYOUT_CONFIGS[layout];
        const defaultColSizes = Array.from({ length: config.cols }, () => 1 / config.cols);
        const defaultRowSizes = Array.from({ length: config.rows }, () => 1 / config.rows);

        return {
          ...page,
          layout,
          slots: newSlots,
          colSizes: defaultColSizes,
          rowSizes: defaultRowSizes,
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
    set((state) => {
      // First, update the slots by swapping photoIds
      const newPages = state.pages.map((page) => {
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
      });

      // Now reorder the photos array to match the visual order across all pages.
      // Collect photoIds in visual order (page by page, slot by slot)
      const visualOrder: string[] = [];
      for (const page of newPages) {
        for (const slot of page.slots) {
          if (slot.photoId && !visualOrder.includes(slot.photoId)) {
            visualOrder.push(slot.photoId);
          }
        }
      }

      // Add any photos not currently in slots (unassigned) at the end, preserving their relative order
      const unassignedPhotos = state.photos.filter((p) => !visualOrder.includes(p.id));
      const finalOrder = [...visualOrder, ...unassignedPhotos.map((p) => p.id)];

      // Reorder the photos array to match the final order
      const photoMap = new Map(state.photos.map((p) => [p.id, p]));
      const reorderedPhotos = finalOrder.map((id) => photoMap.get(id)).filter(Boolean) as Photo[];

      return { pages: newPages, photos: reorderedPhotos };
    });
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

    set((state) => {
      const newPages = state.pages.map((page) => {
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
      });

      // Reorder the photos array to match the visual order across all pages.
      const visualOrder: string[] = [];
      for (const page of newPages) {
        for (const slot of page.slots) {
          if (slot.photoId && !visualOrder.includes(slot.photoId)) {
            visualOrder.push(slot.photoId);
          }
        }
      }

      // Add any photos not currently in slots (unassigned) at the end
      const unassignedPhotos = state.photos.filter((p) => !visualOrder.includes(p.id));
      const finalOrder = [...visualOrder, ...unassignedPhotos.map((p) => p.id)];

      const photoMap = new Map(state.photos.map((p) => [p.id, p]));
      const reorderedPhotos = finalOrder.map((id) => photoMap.get(id)).filter(Boolean) as Photo[];

      return { pages: newPages, photos: reorderedPhotos };
    });
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

      // initialize default col/row sizes for the created page
      const cfg = LAYOUT_CONFIGS[state.defaultLayout];
      const defaultColSizes = Array.from({ length: cfg.cols }, () => 1 / cfg.cols);
      const defaultRowSizes = Array.from({ length: cfg.rows }, () => 1 / cfg.rows);

      newPages.push({
        id: uuidv4(),
        layout: state.defaultLayout,
        slots: newSlots,
        colSizes: defaultColSizes,
        rowSizes: defaultRowSizes,
      });
    }

    set({ pages: newPages });
  },

  updatePageGridSizes: (pageId: string, colSizes?: number[], rowSizes?: number[]) => {
    set((state) => ({
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          colSizes: colSizes ? [...colSizes] : page.colSizes,
          rowSizes: rowSizes ? [...rowSizes] : page.rowSizes,
        };
      }),
    }));
  },

  // Set span (colSpan / rowSpan) for a specific slot.
  // Uses serial-based photo tracking: photos maintain their upload order across all operations.
  // When span changes, photos are redistributed in serial order - displaced photos go to later
  // pages, and on decrease, photos return from later pages to fill freed slots in serial order.
  setSlotSpan: (pageId: string, slotId: string, colSpan: number, rowSpan: number) => {
    const state = get();
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return;

    const cfg = LAYOUT_CONFIGS[page.layout];
    const targetSlot = page.slots.find((s) => s.id === slotId);
    if (!targetSlot) return;

    // Clamp span to grid bounds
    const startCol = targetSlot.colStart ?? 1;
    const startRow = targetSlot.rowStart ?? 1;
    const maxColSpan = Math.max(1, cfg.cols - (startCol - 1));
    const maxRowSpan = Math.max(1, cfg.rows - (startRow - 1));
    const newColSpan = Math.max(1, Math.min(maxColSpan, Math.floor(colSpan)));
    const newRowSpan = Math.max(1, Math.min(maxRowSpan, Math.floor(rowSpan)));

    // Collect ALL photos across ALL pages in their serial order (upload order from state.photos)
    const photoSerialOrder = state.photos.map((p) => p.id);

    // Get all assigned photoIds across all pages
    const allAssignedPhotoIds: string[] = [];
    for (const pg of state.pages) {
      for (const slot of pg.slots) {
        if (slot.photoId && !allAssignedPhotoIds.includes(slot.photoId)) {
          allAssignedPhotoIds.push(slot.photoId);
        }
      }
    }

    // Sort by serial order
    allAssignedPhotoIds.sort((a, b) => photoSerialOrder.indexOf(a) - photoSerialOrder.indexOf(b));

    // Now redistribute photos across pages, starting with page 1
    // The target slot gets its new span, all other slots are 1x1

    // Helper to create occupancy grid and place slots
    const redistributePhotos = () => {
      const resultPages: Page[] = [];
      let photoIdx = 0;

      // Build a map of existing photo transforms so we can preserve them
      const existingTransforms = new Map<string, { offsetX: number; offsetY: number; scale: number; rotation: number }>();
      for (const pg of state.pages) {
        for (const s of pg.slots) {
          if (s.photoId) {
            existingTransforms.set(s.photoId, {
              offsetX: s.offsetX ?? 0,
              offsetY: s.offsetY ?? 0,
              scale: s.scale ?? 1,
              rotation: s.rotation ?? 0,
            });
          }
        }
      }

      // Process each existing page
      for (let pIdx = 0; pIdx < state.pages.length; pIdx++) {
        const currentPage = state.pages[pIdx];
        const pageCfg = LAYOUT_CONFIGS[currentPage.layout];
        const pageCols = pageCfg.cols;
        const pageRows = pageCfg.rows;

        // Create occupancy grid for this page
        const occ: boolean[][] = Array.from({ length: pageRows }, () =>
          Array.from({ length: pageCols }, () => false)
        );

        const newSlots: PhotoSlot[] = [];

        // If this is the edited page, place the target slot first with its new span
        if (currentPage.id === pageId) {
          const tStartCol = targetSlot.colStart ?? 1;
          const tStartRow = targetSlot.rowStart ?? 1;

          // Mark occupancy for target slot
          for (let r = tStartRow; r < tStartRow + newRowSpan && r <= pageRows; r++) {
            for (let c = tStartCol; c < tStartCol + newColSpan && c <= pageCols; c++) {
              occ[r - 1][c - 1] = true;
            }
          }

          // Add target slot with its photo (if any) - it keeps its position
          const targetPhotoId = targetSlot.photoId;
          newSlots.push({
            id: targetSlot.id,
            photoId: targetPhotoId,
            offsetX: targetSlot.offsetX,
            offsetY: targetSlot.offsetY,
            scale: targetSlot.scale,
            rotation: targetSlot.rotation,
            colStart: tStartCol,
            rowStart: tStartRow,
            colSpan: newColSpan,
            rowSpan: newRowSpan,
          });

          // Remove target's photo from the serial list (it's already placed)
          if (targetPhotoId) {
            const idx = allAssignedPhotoIds.indexOf(targetPhotoId);
            if (idx !== -1) allAssignedPhotoIds.splice(idx, 1);
          }
        }

        // Fill remaining cells with photos in serial order
        for (let r = 1; r <= pageRows; r++) {
          for (let c = 1; c <= pageCols; c++) {
            if (occ[r - 1][c - 1]) continue; // already occupied

            occ[r - 1][c - 1] = true;

            // Get next photo in serial order
            const nextPhotoId = photoIdx < allAssignedPhotoIds.length ? allAssignedPhotoIds[photoIdx] : null;
            if (nextPhotoId) photoIdx++;

            const transformed = nextPhotoId ? existingTransforms.get(nextPhotoId) : undefined;
            newSlots.push({
              id: uuidv4(),
              photoId: nextPhotoId,
              offsetX: transformed ? transformed.offsetX : 0,
              offsetY: transformed ? transformed.offsetY : 0,
              scale: transformed ? transformed.scale : 1,
              rotation: transformed ? transformed.rotation : 0,
              colStart: c,
              rowStart: r,
              colSpan: 1,
              rowSpan: 1,
            });
          }
        }

        resultPages.push({
          ...currentPage,
          slots: newSlots,
        });
      }

      // If there are remaining photos, create new pages
      while (photoIdx < allAssignedPhotoIds.length) {
        const defLayout = page.layout;
        const defCfg = LAYOUT_CONFIGS[defLayout];
        const defCols = defCfg.cols;
        const defRows = defCfg.rows;

        const newSlots: PhotoSlot[] = [];
        for (let r = 1; r <= defRows; r++) {
          for (let c = 1; c <= defCols; c++) {
            const nextPhotoId = photoIdx < allAssignedPhotoIds.length ? allAssignedPhotoIds[photoIdx] : null;
            if (nextPhotoId) photoIdx++;

            const transformed = nextPhotoId ? existingTransforms.get(nextPhotoId) : undefined;
            newSlots.push({
              id: uuidv4(),
              photoId: nextPhotoId,
              offsetX: transformed ? transformed.offsetX : 0,
              offsetY: transformed ? transformed.offsetY : 0,
              scale: transformed ? transformed.scale : 1,
              rotation: transformed ? transformed.rotation : 0,
              colStart: c,
              rowStart: r,
              colSpan: 1,
              rowSpan: 1,
            });
          }
        }

        resultPages.push({
          id: uuidv4(),
          layout: defLayout,
          slots: newSlots,
          colSizes: Array.from({ length: defCols }, () => 1 / defCols),
          rowSizes: Array.from({ length: defRows }, () => 1 / defRows),
        });
      }

      return resultPages;
    };

    let newPages = redistributePhotos();

    // Remove blank pages (no photos). Keep at least one page.
    let finalPages = newPages.filter((p) => p.slots.some((s) => s.photoId));
    if (finalPages.length === 0) finalPages = [newPages[0]];

    // Adjust currentPageIndex to stay valid
    const oldCurrentPageId = state.pages[state.currentPageIndex]?.id;
    let newCurrentPageIndex = finalPages.findIndex((p) => p.id === oldCurrentPageId);
    if (newCurrentPageIndex === -1) {
      newCurrentPageIndex = finalPages.findIndex((p) => p.id === page.id);
    }
    if (newCurrentPageIndex === -1) {
      newCurrentPageIndex = Math.max(0, Math.min(state.currentPageIndex, finalPages.length - 1));
    }

    set({ pages: finalPages, currentPageIndex: newCurrentPageIndex });
  },

  // Update grid sizing (colSizes/rowSizes) for a page
  // Both arrays should be fractions that sum approximately to 1
  // Caller can pass undefined for one of them to only update the other
  // NOTE: add this method via a type assertion below (we'll extend PhotoStore interface if needed)

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
