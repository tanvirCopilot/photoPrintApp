export interface Photo {
  id: string;
  file: File;
  url: string;
  name: string;
  width: number;
  height: number;
}

export interface PhotoSlot {
  id: string;
  photoId: string | null;
  // Position and size within the slot (for custom positioning)
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface Page {
  id: string;
  slots: PhotoSlot[];
  layout: LayoutType;
  // Column and row sizes as fractions summing to 1.0
  colSizes: number[];
  rowSizes: number[];
}

export type LayoutType = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export interface LayoutConfig {
  type: LayoutType;
  rows: number;
  cols: number;
  label: string;
}

export const LAYOUT_CONFIGS: Record<LayoutType, LayoutConfig> = {
  1: { type: 1, rows: 1, cols: 1, label: '1 Photo' },
  2: { type: 2, rows: 2, cols: 1, label: '2 Photos' },
  3: { type: 3, rows: 3, cols: 1, label: '3 Photos' },
  4: { type: 4, rows: 2, cols: 2, label: '4 Photos' },
  6: { type: 6, rows: 3, cols: 2, label: '6 Photos' },
  8: { type: 8, rows: 4, cols: 2, label: '8 Photos' },
  12: { type: 12, rows: 4, cols: 3, label: '12 Photos' },
};

// A4 dimensions in mm (portrait)
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Print margins in mm
export const PRINT_MARGIN_MM = 5;
