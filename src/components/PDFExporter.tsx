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

          const row = Math.floor(slotIndex / layout.cols);
          const col = slotIndex % layout.cols;

          // compute x/y and slot sizes using flexible widths/heights
          const x = PRINT_MARGIN_MM + colWidths.slice(0, col).reduce((a, b) => a + b, 0);
          const y = PRINT_MARGIN_MM + rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
          const slotWidth = colWidths[col];
          const slotHeight = rowHeights[row];

          // Determine rotation and whether dimensions should be swapped
          const rot = (slot.rotation || 0) % 360;
          const isRotated90or270 = rot === 90 || rot === 270;

          // Calculate available area inside slot after padding
          const availableWidth = slotWidth - 2 * slotPaddingMM;
          const availableHeight = slotHeight - 2 * slotPaddingMM;

          // Calculate image dimensions to fit slot while maintaining aspect ratio (contain)
          // When rotated 90 or 270 degrees, the effective aspect ratio is inverted
          const effectivePhotoWidth = isRotated90or270 ? photo.height : photo.width;
          const effectivePhotoHeight = isRotated90or270 ? photo.width : photo.height;
          const photoAspect = effectivePhotoWidth / effectivePhotoHeight;
          const slotAspect = availableWidth / availableHeight;

          // base (contained) size inside slot using effective (post-rotation) dimensions
          let baseWidth: number;
          let baseHeight: number;

          if (photoAspect > slotAspect) {
            // photo is wider -> width fills available width
            baseWidth = availableWidth;
            baseHeight = availableWidth / photoAspect;
          } else {
            // photo is taller -> height fills available height
            baseHeight = availableHeight;
            baseWidth = availableHeight * photoAspect;
          }

          // apply user scale (scale 1 = fit-to-slot)
          const imgWidth = baseWidth * (slot.scale ?? 1);
          const imgHeight = baseHeight * (slot.scale ?? 1);

          // Clamp to available area (respecting padding)
          const drawWidth = Math.min(availableWidth, imgWidth);
          const drawHeight = Math.min(availableHeight, imgHeight);

          // Center the image in the slot (account for padding)
          const imgX = x + slotPaddingMM + (availableWidth - drawWidth) / 2;
          const imgY = y + slotPaddingMM + (availableHeight - drawHeight) / 2;

          try {
            // Convert photo to base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
              img.onload = () => {
                try {
                  // Prepare a canvas that will contain the rotated image
                  // We draw the original image into an offscreen canvas and then export it.
                  // If rotation is 90 or 270, swap width/height when drawing into rotated canvas.

                  if (rot === 0) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    ctx?.drawImage(img, 0, 0);
                  } else {
                    const radians = (rot * Math.PI) / 180;
                    // create temp canvas to draw rotated image
                    const temp = document.createElement('canvas');
                    if (isRotated90or270) {
                      temp.width = img.height;
                      temp.height = img.width;
                    } else {
                      temp.width = img.width;
                      temp.height = img.height;
                    }
                    const tctx = temp.getContext('2d');
                    if (tctx) {
                      tctx.translate(temp.width / 2, temp.height / 2);
                      tctx.rotate(radians);
                      tctx.drawImage(img, -img.width / 2, -img.height / 2);
                    }
                    // copy rotated to main canvas
                    canvas.width = temp.width;
                    canvas.height = temp.height;
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    ctx?.drawImage(temp, 0, 0);
                  }

                  resolve();
                } catch (err) {
                  reject(err);
                }
              };
              img.onerror = reject;
              img.src = photo.url;
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Add image into PDF at calculated mm dimensions
            pdf.addImage(imgData, 'JPEG', imgX, imgY, drawWidth, drawHeight);
          } catch (error) {
            console.error('Error adding image to PDF:', error);
          }
        }

        // Draw grid lines for visual reference (optional, light gray)
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);

        // Draw horizontal grid lines using rowHeights
        let accY = PRINT_MARGIN_MM;
        pdf.line(PRINT_MARGIN_MM, accY, PRINT_MARGIN_MM + printableWidth, accY);
        for (let r = 0; r < rowHeights.length; r++) {
          accY += rowHeights[r];
          pdf.line(PRINT_MARGIN_MM, accY, PRINT_MARGIN_MM + printableWidth, accY);
        }

        // Draw vertical grid lines using colWidths
        let accX = PRINT_MARGIN_MM;
        pdf.line(accX, PRINT_MARGIN_MM, accX, PRINT_MARGIN_MM + printableHeight);
        for (let c = 0; c < colWidths.length; c++) {
          accX += colWidths[c];
          pdf.line(accX, PRINT_MARGIN_MM, accX, PRINT_MARGIN_MM + printableHeight);
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
        className={`
          py-2.5 px-5 rounded-xl font-medium transition-all duration-300
          flex items-center gap-2 text-sm
          ${
            hasContent && !isGenerating
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
