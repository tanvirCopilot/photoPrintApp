import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { usePhotoStore } from '../store/photoStore';
import { LAYOUT_CONFIGS, A4_WIDTH_MM, A4_HEIGHT_MM, PRINT_MARGIN_MM } from '../types';

export const PDFExporter: React.FC = () => {
  const { pages, photos } = usePhotoStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (pages.length === 0) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const printableWidth = A4_WIDTH_MM - 2 * PRINT_MARGIN_MM;
      const printableHeight = A4_HEIGHT_MM - 2 * PRINT_MARGIN_MM;

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const layout = LAYOUT_CONFIGS[page.layout];

        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Compute column widths and row heights (respect flexible page sizes if present)
        const colWidths: number[] = page.colSizes && page.colSizes.length === layout.cols
          ? page.colSizes.map((f) => f * printableWidth)
          : Array.from({ length: layout.cols }, () => printableWidth / layout.cols);
        const rowHeights: number[] = page.rowSizes && page.rowSizes.length === layout.rows
          ? page.rowSizes.map((f) => f * printableHeight)
          : Array.from({ length: layout.rows }, () => printableHeight / layout.rows);

        // Padding inside each slot (in mm) so images don't touch the grid borders
        const slotPaddingMM = 2; // ~5px equivalent at print resolution

        for (let slotIndex = 0; slotIndex < page.slots.length; slotIndex++) {
          const slot = page.slots[slotIndex];
          if (!slot.photoId) continue;

          const photo = photos.find((p) => p.id === slot.photoId);
          if (!photo) continue;

          // Use slot's grid placement properties (1-based) for proper span support
          const colStart = (slot.colStart ?? 1) - 1; // convert to 0-based
          const rowStart = (slot.rowStart ?? 1) - 1; // convert to 0-based
          const colSpan = slot.colSpan ?? 1;
          const rowSpan = slot.rowSpan ?? 1;

          // compute x/y using the slot's actual grid position
          const x = PRINT_MARGIN_MM + colWidths.slice(0, colStart).reduce((a, b) => a + b, 0);
          const y = PRINT_MARGIN_MM + rowHeights.slice(0, rowStart).reduce((a, b) => a + b, 0);
          
          // compute slot size by summing widths/heights for the span
          const slotWidth = colWidths.slice(colStart, colStart + colSpan).reduce((a, b) => a + b, 0);
          const slotHeight = rowHeights.slice(rowStart, rowStart + rowSpan).reduce((a, b) => a + b, 0);

          // Determine rotation and whether dimensions should be swapped
          const rot = (slot.rotation || 0) % 360;
          const isRotated90or270 = rot === 90 || rot === 270;

          // Calculate available area inside slot after padding
          const availableWidth = slotWidth - 2 * slotPaddingMM;
          const availableHeight = slotHeight - 2 * slotPaddingMM;

          // Calculate image dimensions while ALWAYS maintaining aspect ratio
          // When rotated 90 or 270 degrees, the effective aspect ratio is inverted
          const effectivePhotoWidth = isRotated90or270 ? photo.height : photo.width;
          const effectivePhotoHeight = isRotated90or270 ? photo.width : photo.height;
          const photoAspect = effectivePhotoWidth / effectivePhotoHeight;
          const slotAspect = availableWidth / availableHeight;

          // Base size: fit image inside slot (scale=1 means image fits entirely in slot)
          let baseWidth: number;
          let baseHeight: number;

          if (photoAspect > slotAspect) {
            // photo is wider -> width fills available width at scale=1
            baseWidth = availableWidth;
            baseHeight = availableWidth / photoAspect;
          } else {
            // photo is taller -> height fills available height at scale=1
            baseHeight = availableHeight;
            baseWidth = availableHeight * photoAspect;
          }

          // Apply user scale - ALWAYS maintain aspect ratio, no clamping
          // Scale > 1 means zoom in (image larger than slot, will be clipped by slot bounds)
          // Scale < 1 means zoom out (image smaller than slot)
          const userScale = slot.scale ?? 1;
          const drawWidth = baseWidth * userScale;
          const drawHeight = baseHeight * userScale;

          // Center the scaled image in the slot
          let imgX = x + slotPaddingMM + (availableWidth - drawWidth) / 2;
          let imgY = y + slotPaddingMM + (availableHeight - drawHeight) / 2;

          // Convert user pan offsets (pixels in UI) to mm for PDF positioning
          try {
            const el = document.querySelector(`[data-slot-id="${slot.id}"]`) as HTMLElement | null;
            if (el && (slot.offsetX || slot.offsetY)) {
              // Calculate px per mm based on the UI slot size vs print slot size
              const pxPerMMx = el.clientWidth / slotWidth;
              const pxPerMMy = el.clientHeight / slotHeight;

              if (pxPerMMx > 0 && pxPerMMy > 0) {
                const offsetXmm = (slot.offsetX || 0) / pxPerMMx;
                const offsetYmm = (slot.offsetY || 0) / pxPerMMy;

                // Apply pan offsets
                imgX += offsetXmm;
                imgY += offsetYmm;
              }
            }
          } catch (err) {
            console.warn('Could not compute slot DOM size for offset conversion', err);
          }

          try {
            // Convert photo to base64
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = photo.url;
            });

            // Create canvas for the final cropped/clipped image
            // We'll draw the image at the correct scale and position, then crop to slot bounds
            
            // First, handle rotation if needed
            let rotatedCanvas: HTMLCanvasElement;
            if (rot === 0) {
              rotatedCanvas = document.createElement('canvas');
              rotatedCanvas.width = img.width;
              rotatedCanvas.height = img.height;
              const rctx = rotatedCanvas.getContext('2d');
              rctx?.drawImage(img, 0, 0);
            } else {
              const radians = (rot * Math.PI) / 180;
              rotatedCanvas = document.createElement('canvas');
              if (isRotated90or270) {
                rotatedCanvas.width = img.height;
                rotatedCanvas.height = img.width;
              } else {
                rotatedCanvas.width = img.width;
                rotatedCanvas.height = img.height;
              }
              const rctx = rotatedCanvas.getContext('2d');
              if (rctx) {
                rctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                rctx.rotate(radians);
                rctx.drawImage(img, -img.width / 2, -img.height / 2);
              }
            }

            // Now create the final output canvas that represents the slot area
            // We will ensure the exported image never crops: if the user's zoom would crop
            // we reduce the effective scale so the full image fits inside the slot.
            const DPI = 300; // high quality for print
            const outputWidthPx = Math.round(availableWidth * DPI / 25.4);
            const outputHeightPx = Math.round(availableHeight * DPI / 25.4);

            // Calculate maximum scale that still fits the image entirely inside the slot
            const maxScaleX = availableWidth / baseWidth;
            const maxScaleY = availableHeight / baseHeight;
            const maxScale = Math.min(maxScaleX, maxScaleY, Number.POSITIVE_INFINITY);

            const userScale = slot.scale ?? 1;
            const finalScale = Math.min(userScale, maxScale);

            const finalDrawWidth = Math.round(baseWidth * finalScale);
            const finalDrawHeight = Math.round(baseHeight * finalScale);

            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = outputWidthPx;
            outputCanvas.height = outputHeightPx;
            const outCtx = outputCanvas.getContext('2d');

            if (outCtx) {
              // Fill with white background
              outCtx.fillStyle = '#ffffff';
              outCtx.fillRect(0, 0, outputWidthPx, outputHeightPx);

              // Image position relative to slot (imgX/imgY are absolute, convert to relative mm)
              let relImgXmm = imgX - (x + slotPaddingMM);
              let relImgYmm = imgY - (y + slotPaddingMM);

              // Clamp relative position so the image does not leave visible area (no cropping)
              const minRelX = 0;
              const minRelY = 0;
              const maxRelX = Math.max(0, availableWidth - finalDrawWidth);
              const maxRelY = Math.max(0, availableHeight - finalDrawHeight);

              relImgXmm = Math.min(maxRelX, Math.max(minRelX, relImgXmm));
              relImgYmm = Math.min(maxRelY, Math.max(minRelY, relImgYmm));

              // Convert mm positions to pixels relative to slot origin
              const drawWidthPx = Math.round((finalDrawWidth) * DPI / 25.4);
              const drawHeightPx = Math.round((finalDrawHeight) * DPI / 25.4);
              const drawXPx = Math.round(relImgXmm * DPI / 25.4);
              const drawYPx = Math.round(relImgYmm * DPI / 25.4);

              // Draw the rotated image scaled and positioned
              outCtx.drawImage(rotatedCanvas, drawXPx, drawYPx, drawWidthPx, drawHeightPx);
            }

            const imgData = outputCanvas.toDataURL('image/jpeg', 0.95);

            // Add the pre-rendered (and guaranteed non-cropped) image to PDF at the slot position
            const finalX = x + slotPaddingMM;
            const finalY = y + slotPaddingMM;
            pdf.addImage(imgData, 'JPEG', finalX, finalY, availableWidth, availableHeight);
          } catch (error) {
            console.error('Error adding image to PDF:', error);
          }
        }

        // Draw slot borders (respecting spans) for visual reference (light gray)
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);

        // Use an occupancy grid to ensure we draw one rect per logical slot (respecting colSpan/rowSpan)
        const cols = layout.cols;
        const rows = layout.rows;
        const handled: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

        for (const slot of page.slots) {
          const colStart = (slot.colStart ?? 1) - 1;
          const rowStart = (slot.rowStart ?? 1) - 1;
          const colSpan = slot.colSpan ?? 1;
          const rowSpan = slot.rowSpan ?? 1;

          // if this slot's top-left cell is already handled (part of a previous span), skip drawing
          if (rowStart < 0 || colStart < 0 || rowStart >= rows || colStart >= cols) continue;
          if (handled[rowStart][colStart]) continue;

          // mark occupied cells
          for (let r = rowStart; r < Math.min(rows, rowStart + rowSpan); r++) {
            for (let c = colStart; c < Math.min(cols, colStart + colSpan); c++) {
              handled[r][c] = true;
            }
          }

          // compute rect for this slot span
          const rectX = PRINT_MARGIN_MM + colWidths.slice(0, colStart).reduce((a, b) => a + b, 0);
          const rectY = PRINT_MARGIN_MM + rowHeights.slice(0, rowStart).reduce((a, b) => a + b, 0);
          const rectW = colWidths.slice(colStart, colStart + colSpan).reduce((a, b) => a + b, 0);
          const rectH = rowHeights.slice(rowStart, rowStart + rowSpan).reduce((a, b) => a + b, 0);

          // Draw rounded rectangle? jsPDF has only rect; use rect for a clean border.
          pdf.rect(rectX, rectY, rectW, rectH, 'S');
        }

        setProgress(((pageIndex + 1) / pages.length) * 100);
      }

      // Download PDF
      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`photo-layout-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const hasContent = pages.length > 0 && pages.some((page) =>
    page.slots.some((slot) => slot.photoId)
  );

  return (
    <>
      <button
        onClick={generatePDF}
        disabled={!hasContent || isGenerating}
        aria-label="Export PDF"
        style={{marginRight: "5px", padding: "2px 5px"}}
        className={`
          py-2.5 px-5 rounded-sm font-medium transition-all duration-300
          flex items-center gap-1 text-sm focus:outline-none
          ${
            hasContent && !isGenerating
              ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 focus:ring-2 focus:ring-violet-300'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {Math.round(progress)}%
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export PDF
          </>
        )}
      </button>

      {/* Hidden preview container for html2canvas (if needed) */}
      <div ref={previewRef} className="hidden" />
    </>
  );
};
